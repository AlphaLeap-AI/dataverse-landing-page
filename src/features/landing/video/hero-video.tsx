"use client";

import { Play, VolumeX, X } from "lucide-react";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type MouseEvent,
  type ReactNode,
} from "react";

import { heroVideo } from "@/lib/video";

import styles from "./video.module.css";

type Mode = "docked" | "opening" | "open" | "closing";

const OPEN_MS = 560;
const CLOSE_MS = 420;
const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";

/**
 * FLIP between the docked panel and the fullscreen player.
 *
 * The frame is scaled from its docked box to its final box while the media
 * layer is counter-scaled by the inverse, so the picture itself never
 * stretches — the window around it opens instead. Both use a `0 0` origin
 * (set in CSS) to keep the arithmetic to a translate plus a scale.
 */
function flip(
  frame: HTMLElement,
  media: HTMLElement,
  docked: DOMRect,
  full: DOMRect,
  reverse: boolean
): Animation {
  const sx = docked.width / full.width;
  const sy = docked.height / full.height;
  const inverted = `translate(${docked.left - full.left}px, ${docked.top - full.top}px) scale(${sx}, ${sy})`;
  const counter = `scale(${1 / sx}, ${1 / sy})`;

  const options: KeyframeAnimationOptions = {
    duration: reverse ? CLOSE_MS : OPEN_MS,
    easing: EASE,
    fill: "both",
  };
  const pair = <T,>(a: T, b: T) => (reverse ? [b, a] : [a, b]);

  media.animate(pair({ transform: counter }, { transform: "none" }), options);
  return frame.animate(pair({ transform: inverted }, { transform: "none" }), options);
}

/**
 * Settle the mode even if the animation never reports finishing. A tab that
 * is backgrounded mid-transition has its animations throttled, and being
 * stuck in `opening` means the player never gets its controls.
 */
function settleAfter(animation: Animation, ms: number, done: () => void): () => void {
  let fired = false;
  const once = () => {
    if (fired) return;
    fired = true;
    done();
  };
  const timer = window.setTimeout(once, ms + 200);
  animation.finished.then(once).catch(once);
  return () => {
    fired = true;
    window.clearTimeout(timer);
  };
}

/** Fade audio in instead of slamming it on at full volume. */
function rampVolume(el: HTMLVideoElement, to: number, ms: number): () => void {
  const from = el.volume;
  const t0 = performance.now();
  let raf = 0;
  const step = (now: number) => {
    const t = Math.min(1, (now - t0) / ms);
    el.volume = from + (to - from) * t;
    if (t < 1) raf = requestAnimationFrame(step);
  };
  raf = requestAnimationFrame(step);
  return () => cancelAnimationFrame(raf);
}

interface HeroVideoProps {
  /** Hero copy, overlaid on the video and faded out while the player opens. */
  children: ReactNode;
  /** prefers-reduced-motion: no autoplaying preview, no FLIP. */
  reducedMotion?: boolean;
  /** Ref for the copy block, so the page's scroll loop can parallax it. */
  overlayRef?: React.Ref<HTMLDivElement>;
}

/**
 * The front-page hero: a full-bleed panel whose background is a silent,
 * looping preview of the product demo. The corner pill expands that same
 * panel into a fullscreen player with sound — no modal appearing out of
 * nowhere, the thing you were already watching just takes over the screen.
 */
export function HeroVideo({ children, reducedMotion = false, overlayRef }: HeroVideoProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const mediaRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLVideoElement>(null);
  const fullRef = useRef<HTMLVideoElement>(null);
  const pillRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  const dockedRect = useRef<DOMRect | null>(null);
  const prefetched = useRef(false);
  const stopRamp = useRef<(() => void) | null>(null);
  /** Bumped on every open, so stale playback promises can bail out. */
  const openSession = useRef(0);

  const [mode, setMode] = useState<Mode>("docked");
  const [fullFailed, setFullFailed] = useState(false);
  const [fullPlaying, setFullPlaying] = useState(false);
  const [buffering, setBuffering] = useState(false);
  const [muted, setMuted] = useState(false);

  const expanded = mode === "opening" || mode === "open";

  /* React drops the `muted` attribute during hydration, which is exactly the
     attribute autoplay policies key on — set the property directly. */
  useEffect(() => {
    if (previewRef.current) previewRef.current.muted = true;
  }, []);

  /* Autoplay the preview, and accept a refusal quietly: the element stays
     parked on its poster, which is a perfectly good hero, and the pill
     still works. */
  useEffect(() => {
    const el = previewRef.current;
    if (!el || reducedMotion) return;
    el.play().catch(() => {});
  }, [reducedMotion]);

  /* Don't decode video for a hero nobody is looking at. */
  useEffect(() => {
    const stage = stageRef.current;
    const el = previewRef.current;
    if (!stage || !el || reducedMotion) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) el.play().catch(() => {});
        else el.pause();
      },
      { threshold: 0.01 }
    );
    io.observe(stage);
    return () => io.disconnect();
  }, [reducedMotion]);

  /* The full cut isn't fetched until the visitor signals intent, so the pill
     is warm by the time it's clicked but costs a cold visitor nothing. */
  const prefetchFull = useCallback(() => {
    const el = fullRef.current;
    if (!el || prefetched.current) return;
    prefetched.current = true;
    el.preload = "auto";
    el.load();
  }, []);

  const open = useCallback(() => {
    if (mode !== "docked" || fullFailed) return;
    const stage = stageRef.current;
    if (!stage) return;

    dockedRect.current = stage.getBoundingClientRect();
    prefetchFull();
    setMode("opening");
  }, [mode, fullFailed, prefetchFull]);

  const close = useCallback(() => {
    if (mode !== "open" && mode !== "opening") return;
    setMode("closing");
  }, [mode]);

  /* Scroll lock, plus the page-level flag the hero section and the nav key
     off. Compensating for the scrollbar keeps the docked rect we measured
     valid, so the FLIP lands exactly where the panel actually is. */
  useEffect(() => {
    if (!expanded && mode !== "closing") return;
    const { body, documentElement: html } = document;
    const gap = window.innerWidth - html.clientWidth;
    const prevOverflow = body.style.overflow;
    const prevPad = body.style.paddingRight;
    body.style.overflow = "hidden";
    if (gap > 0) body.style.paddingRight = `${gap}px`;
    html.dataset.videoOpen = "";
    return () => {
      body.style.overflow = prevOverflow;
      body.style.paddingRight = prevPad;
      delete html.dataset.videoOpen;
    };
  }, [expanded, mode]);

  /* Run the expansion once React has committed the fixed geometry, so the
     final rect we measure is the real one. */
  useLayoutEffect(() => {
    if (mode !== "opening") return;
    const frame = frameRef.current;
    const media = mediaRef.current;
    const docked = dockedRect.current;
    if (!frame || !media) return;

    let stop: (() => void) | undefined;
    if (reducedMotion || !docked || typeof frame.animate !== "function") {
      setMode("open");
    } else {
      const anim = flip(frame, media, docked, frame.getBoundingClientRect(), false);
      stop = settleAfter(anim, OPEN_MS, () => setMode("open"));
    }

    const full = fullRef.current;
    if (full) {
      // play() settles a turn later at best, and on a slow connection much
      // later than that — by which time the visitor may already have closed
      // the player. Every continuation below has to check it still owns the
      // session, or it resumes a video nobody is watching.
      const session = ++openSession.current;
      const current = () => openSession.current === session;

      full.currentTime = 0;
      full.muted = false;
      full.volume = 0;
      setMuted(false);
      full
        .play()
        .then(() => {
          if (!current()) return;
          stopRamp.current?.();
          stopRamp.current = rampVolume(full, 1, 420);
        })
        .catch(() => {
          if (!current()) return;
          // Unmuted playback refused (rare under a real click, but iOS Low
          // Power Mode does it) — play silently and offer an unmute control.
          full.muted = true;
          setMuted(true);
          full.play().catch(() => {
            if (current()) setFullFailed(true);
          });
        });
    }

    return () => stop?.();
  }, [mode, reducedMotion]);

  /* Collapse back, then hand the frame to CSS again. */
  useLayoutEffect(() => {
    if (mode !== "closing") return;
    const frame = frameRef.current;
    const media = mediaRef.current;
    const docked = dockedRect.current;

    openSession.current++;

    const done = () => {
      frame?.getAnimations().forEach((a) => a.cancel());
      media?.getAnimations().forEach((a) => a.cancel());
      setMode("docked");
      setFullPlaying(false);
      setBuffering(false);
      const full = fullRef.current;
      if (full) {
        stopRamp.current?.();
        full.pause();
        full.currentTime = 0;
      }
      if (!reducedMotion) previewRef.current?.play().catch(() => {});
      pillRef.current?.focus();
    };

    if (reducedMotion || !frame || !media || !docked || typeof frame.animate !== "function") {
      done();
      return;
    }
    const anim = flip(frame, media, docked, frame.getBoundingClientRect(), true);
    return settleAfter(anim, CLOSE_MS, done);
  }, [mode, reducedMotion]);

  /* Esc to close; keep Tab inside the player while it owns the screen. */
  useEffect(() => {
    if (!expanded) return;
    closeRef.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
        return;
      }
      if (e.key !== "Tab") return;
      const frame = frameRef.current;
      if (!frame) return;
      const focusable = frame.querySelectorAll<HTMLElement>(
        'button:not([disabled]), video[controls], a[href], [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [expanded, close]);

  useEffect(() => () => stopRamp.current?.(), []);

  const unmute = useCallback(() => {
    const full = fullRef.current;
    if (!full) return;
    stopRamp.current?.();
    full.muted = false;
    full.volume = 0;
    stopRamp.current = rampVolume(full, 1, 260);
    setMuted(false);
  }, []);

  /* Clicking the panel plays — except on the copy's own links and buttons. */
  const onFrameClick = (e: MouseEvent<HTMLDivElement>) => {
    if (expanded || mode === "closing") return;
    if ((e.target as HTMLElement).closest("a, button")) return;
    open();
  };

  return (
    <div className={styles.stage} ref={stageRef} data-expanded={expanded || mode === "closing"}>
      <div
        className={`${styles.backdrop} ${expanded ? styles.backdropOn : ""}`}
        onClick={close}
        aria-hidden="true"
      />

      <div
        ref={frameRef}
        className={styles.frame}
        data-mode={mode}
        onClick={onFrameClick}
        onPointerEnter={prefetchFull}
        {...(expanded ? { role: "dialog", "aria-modal": true, "aria-label": heroVideo.title } : {})}
      >
        <div ref={mediaRef} className={styles.media}>
          <video
            ref={previewRef}
            className={`${styles.video} ${styles.previewVideo}`}
            poster={heroVideo.poster}
            muted
            loop
            playsInline
            autoPlay={!reducedMotion}
            preload="auto"
            tabIndex={-1}
            aria-hidden="true"
            /* Left visible from the first paint on purpose — the poster is
               painted by this element, so hiding it until frames decode
               would hide the very thing that covers the gap. */
            style={{ opacity: fullPlaying ? 0 : 1 }}
          >
            {heroVideo.preview.map((s) => (
              <source key={s.src} src={s.src} type={s.type} />
            ))}
          </video>

          <video
            ref={fullRef}
            className={`${styles.video} ${styles.fullVideo}`}
            poster={heroVideo.poster}
            playsInline
            preload="none"
            controls={mode === "open"}
            controlsList="nodownload"
            tabIndex={expanded ? 0 : -1}
            aria-hidden={!expanded}
            style={{ opacity: fullPlaying ? 1 : 0 }}
            onPlaying={() => {
              setFullPlaying(true);
              setBuffering(false);
            }}
            onWaiting={() => setBuffering(true)}
            onCanPlay={() => setBuffering(false)}
            onEnded={close}
            onError={() => {
              setFullFailed(true);
              setBuffering(false);
            }}
          >
            {heroVideo.full.map((s) => (
              <source key={s.src} src={s.src} type={s.type} />
            ))}
          </video>
        </div>

        {/* Legibility for the overlaid copy — gone once the player takes over. */}
        <div className={`${styles.scrim} ${expanded ? styles.scrimOff : ""}`} aria-hidden="true" />

        <div className={`${styles.overlay} ${expanded ? styles.overlayOff : ""}`}>
          <div ref={overlayRef} className={styles.copy}>
            {children}
          </div>

          {!fullFailed ? (
            <button
              ref={pillRef}
              type="button"
              className={styles.pill}
              onClick={open}
              onFocus={prefetchFull}
              tabIndex={expanded ? -1 : 0}
            >
              <span className={styles.pillGlyph} aria-hidden="true">
                <Play size={16} strokeWidth={0} fill="currentColor" />
              </span>
              <span className={styles.pillText}>
                See Dataverse in action
                {heroVideo.durationLabel ? (
                  <em className={styles.pillMeta}>{heroVideo.durationLabel} · watch the demo</em>
                ) : null}
              </span>
            </button>
          ) : null}
        </div>

        {buffering ? <span className={styles.spinner} aria-label="Loading video" /> : null}

        <div className={`${styles.chrome} ${expanded ? styles.chromeOn : ""}`}>
          {/* Only shown when unmuted playback was refused — the native
              controls already carry a mute toggle for the normal case. */}
          {muted ? (
            <button type="button" className={styles.chromeBtn} onClick={unmute} tabIndex={expanded ? 0 : -1}>
              <VolumeX size={15} strokeWidth={2.2} aria-hidden="true" />
              Tap for sound
            </button>
          ) : null}
          <button
            ref={closeRef}
            type="button"
            className={`${styles.chromeBtn} ${styles.chromeClose}`}
            onClick={close}
            aria-label="Close video"
            tabIndex={expanded ? 0 : -1}
          >
            <X size={16} strokeWidth={2.4} aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}
