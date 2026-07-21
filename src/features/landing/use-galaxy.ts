"use client";

import { type RefObject, useEffect } from "react";
import * as THREE from "three";

import {
  buildFormations,
  computeFormationBounds,
  type FormationBounds,
  formationState,
  JITTER,
  type FormationSet,
} from "./galaxy-formations";

export type BeatKey = "chaos" | "connect" | "learn" | "skills" | "ask" | "answer" | "private";

// Formation index (into the FormationSet built in galaxy-formations.ts:
// chaos, connect, book, bulb, bubble, chart, lock) → the beat whose copy
// that shape backs. Beats and formations share one ordering, so this is the
// inverse of that ordering. The portrait framer uses it to look up a
// formation's owning beat (for its measured copy top) while gliding the
// on-screen framing in lockstep with the particle morph.
const FORMATION_BEAT: BeatKey[] = ["chaos", "connect", "learn", "skills", "ask", "answer", "private"];

// Beat dwell windows over story progress p ∈ [0,1]. Every beat gets a long
// enough plateau that dense copy isn't a blink between fade-in and fade-out
// on a slight wheel tick. Learn + answer are slightly longer (more UI).
//
// Track history (see .story height in galaxy-story.module.css):
//   1800vh — original 01–06 beats
//   2216vh — +416vh for the "chaos" pain-point beat (+ gaps)
//   2536vh — +320vh more chaos dwell so the two emotional peaks
//            ("Getting answers shouldn't be this hard." / "Meanwhile,
//            your data already knows.") stay fully readable on a normal
//            wheel tick instead of flashing past mid-stagger.
// Post-chaos windows keep their original relative widths via affine remap
// (new = (old·2216 + 320) / 2536). "private" keeps its past-1 overhang.
const BEAT_WINDOWS: Record<BeatKey, [number, number]> = {
  // Chaos opens as soon as the story pins (no long empty starfield after hero).
  chaos: [0, 0.29022],
  connect: [0.30442, 0.40024],
  learn: [0.41442, 0.52089],
  skills: [0.53509, 0.64838],
  ask: [0.64511, 0.74448],
  answer: [0.75867, 0.87934],
  private: [0.89353, 1.0071],
};

// One line each, always — a wrapped question breaks the bubble layout on
// phones. Short but consequential.
const TYPED_QUESTIONS = [
  "Which customers might churn?",
  "¿Qué clientes están en riesgo?",
  "解約しそうな顧客は？",
  "Quels clients sont à risque ?",
];
// Stretch the typewriter across the ask window so each language question is
// readable before the next replaces it. Shifted by the same affine remap as
// BEAT_WINDOWS above.
const TYPED_SEGMENTS: [number, number][] = [
  [0.6522, 0.6735],
  [0.67705, 0.69833],
  [0.70189, 0.72317],
  [0.72672, 0.74305],
];

// ── "chaos" beat internal choreography ──────────────────────────────────
// Three overlapping phases share the beat's outer window: the headline
// dissolves in line-by-line, then the pain-point cards rise in (staggered),
// then the closing lines turn the story toward the answer.
//
// Headline starts near p=0 so "Getting answers shouldn't be this hard."
// appears right as the hero scrolls away (no long empty pin). A tighter
// fade + smaller per-line stagger snaps it in faster, and both emotional
// peaks now dwell for a shorter plateau (~120vh headline, ~108vh close) —
// still comfortably readable on a normal wheel tick, just less lingering.
// [start, end, fade] — full opacity ≈ end−start−2·fade (minus stagger).
const CHAOS_HEADLINE_WIN: [number, number, number] = [0.004, 0.102, 0.010];
const CHAOS_HEADLINE_STAGGER = 0.006; // per display line (5 lines)
const CHAOS_CARD_WINDOWS: [number, number, number][] = [
  [0.11, 0.195, 0.018],
  [0.118, 0.195, 0.018],
  [0.126, 0.195, 0.018],
];
const CHAOS_CLOSE_WIN: [number, number, number] = [0.205, 0.288, 0.012];
const CHAOS_CLOSE_STAGGER = 0.0055; // per display line (4 lines)
const CHAOS_GHOST_WIN: [number, number] = [0, 0.29022];

// Phones tighten the two emotional-peak plateaus. A thumb flick covers less
// ground than a wheel tick, so the desktop plateaus made the headline and the
// close each sit fully-visible for ~1.5 screens of scroll before releasing —
// the reader kept flicking and the line wouldn't leave. These trim the
// plateau (headline releases sooner; the close appears later and hugs the
// morph into 01) so a normal scroll walks past each line, while the chaos
// particle field + drifting ghost fill the short holds between phases.
const CHAOS_HEADLINE_WIN_MOBILE: [number, number, number] = [0.004, 0.078, 0.010];
const CHAOS_CLOSE_WIN_MOBILE: [number, number, number] = [0.222, 0.288, 0.012];

// ── mobile horizontal card tracks (02 · Understand, 05 · Answer) ────────
// On phones the dense card grids ride a horizontal track driven by vertical
// page scroll: while p crosses these windows the track translates left, so
// the reader never lifts a thumb sideways — scrolling down walks the cards,
// then continues into the next chapter. Windows sit inside each beat's
// fully-visible plateau (learn 0.414–0.521, answer 0.759–0.879).
// Starting later than the beat's fade-in matters: the first card must sit
// parked long enough to be read before the deck starts walking.
const LEARN_TRACK_WIN: [number, number] = [0.4626, 0.4967];
const ANSWER_TRACK_WIN: [number, number] = [0.806, 0.8532];

// The generic beat loop below fades each beat container in/out with a fixed
// 0.045 margin, which is fine for beats with one static content block. The
// "chaos" beat is much wider (three internal phases share it), so its outer
// container needs a much tighter margin — otherwise the outer fade-out would
// start clipping the closing line before it ever reaches full opacity.
// learn/answer get tighter margins too: their horizontal card tracks need a
// long fully-visible plateau so the last card parks before fade-out begins.
const BEAT_FADE_MARGIN: Partial<Record<BeatKey, number>> = { chaos: 0.012, learn: 0.022, skills: 0.022, answer: 0.022 };

const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);
const fadeWin = (p: number, a: number, b: number, f = 0.045): number => {
  if (p < a || p > b) return 0;
  const smooth = (t: number) => {
    const c = clamp01(t);
    return c * c * (3 - 2 * c);
  };
  return Math.min(smooth((p - a) / f), smooth((b - p) / f));
};

function makeSprite(): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const g = c.getContext("2d");
  if (g) {
    const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, "rgba(255,255,255,1)");
    grad.addColorStop(0.35, "rgba(255,255,255,.75)");
    grad.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = grad;
    g.fillRect(0, 0, 64, 64);
  }
  return new THREE.CanvasTexture(c);
}

interface GalaxyRefs {
  canvasRef: RefObject<HTMLCanvasElement | null>;
  storyRef: RefObject<HTMLElement | null>;
  beatRefs: RefObject<Partial<Record<BeatKey, HTMLDivElement | null>>>;
  dimRef: RefObject<HTMLDivElement | null>;
  typedRef: RefObject<HTMLSpanElement | null>;
  bigNumRef: RefObject<HTMLSpanElement | null>;
  sqlCardRef: RefObject<HTMLDivElement | null>;
  chaosGhostRef: RefObject<HTMLDivElement | null>;
  chaosLineRefs: RefObject<(HTMLSpanElement | null)[]>;
  chaosCardRefs: RefObject<(HTMLDivElement | null)[]>;
  chaosCloseRef: RefObject<HTMLParagraphElement | null>;
  chaosCloseLineRefs: RefObject<(HTMLSpanElement | null)[]>;
  learnTrackRef: RefObject<HTMLDivElement | null>;
}

interface GalaxyOptions {
  density: "low" | "medium" | "high";
  calm: boolean;
}

/**
 * Ports the scroll-driven galaxy particle background from the design
 * prototype (galaxy.js) into a React effect. Runs a single imperative rAF
 * loop writing directly to the Three.js buffer + DOM opacity/text, matching
 * the source's direct-write approach rather than driving thousands of
 * particles through React state.
 */
export function useGalaxy(refs: GalaxyRefs, options: GalaxyOptions): void {
  useEffect(() => {
    const canvas = refs.canvasRef.current;
    const story = refs.storyRef.current;
    if (!canvas || !story) return;

    const densities = { low: 2600, medium: 5200, high: 8500 };
    let N = densities[options.density];
    const isMobileLayout = window.innerWidth <= 720;
    // Phones: fewer, larger particles + capped DPR — the formation stays a
    // bold illustration while each frame costs far less.
    if (isMobileLayout) N = Math.min(N, 2600);

    // Tighter headline/close plateaus on phones (see the *_MOBILE constants).
    const chaosHeadlineWin = isMobileLayout ? CHAOS_HEADLINE_WIN_MOBILE : CHAOS_HEADLINE_WIN;
    const chaosCloseWin = isMobileLayout ? CHAOS_CLOSE_WIN_MOBILE : CHAOS_CLOSE_WIN;

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobileLayout ? 1.5 : 2));
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 200);
    // Camera distance is aspect-dependent (see resize) — the 55° FOV is
    // vertical, so portrait phones see only ~±7 world units of width while
    // formations span ±15 (lattice) to ±22 (chaos).
    const BASE_CAM_Z = 30;
    const BASE_POINT_SIZE = 0.42;
    // Widest recognizable formation half-extent (chaos scatter ±22, connect
    // satellites ±12); used for the desktop fit and the chaos scatter framing.
    const FIT_HALF_WIDTH = 16.5;
    // Top fraction of a phone viewport reserved for the fixed glass nav, so
    // tall icons (lightbulb rays, lock dome) don't tuck under the bar. The
    // free band between the nav and the copy is where the particle
    // illustration should sit.
    const PORTRAIT_NAV_BAND = 0.1;
    // Fallback bottom-of-free-band fraction, only used before the first DOM
    // measurement lands (or for the "chaos" beat, whose full-bleed layered
    // copy isn't the bottom-anchored .beatInner card the other beats use).
    const PORTRAIT_COPY_BAND_FALLBACK = 0.34;
    // Leave a little breathing room so a fitted icon never kisses the nav /
    // copy edge (height) or the screen sides (width).
    const PORTRAIT_FIT_MARGIN_H = 0.86;
    const PORTRAIT_FIT_MARGIN_W = 0.9;
    // Cap upscaling: points don't grow with the group, so a small icon blown
    // up to fill a tall band reads as a sparse scatter. Better to leave it a
    // touch smaller and crisp, centered in its band.
    const PORTRAIT_MAX_SCALE = 1.15;
    let camZ = BASE_CAM_Z;
    let halfHeight = 0;
    let portraitView = false;
    camera.position.z = camZ;
    // Per-beat measured top of the bottom-anchored copy card, as a fraction
    // of the beat's own box height (0 = box top, 1 = box bottom). Each
    // chapter's copy is a different length (a two-tag chip row vs. a
    // four-card grid), so a single guessed fraction under- or over-shoots
    // depending on the beat — the formation then either floats too high or
    // bleeds down behind the text. Measuring the real DOM box fixes that for
    // every beat.
    //
    // Measured relative to the beat element's own rect, not the viewport:
    // .beat's ancestor (.stage) is position:sticky, so at measurement time
    // (mount, before the story section has scrolled into view and "stuck")
    // its viewport-relative position is wherever it happens to sit in
    // normal document flow — nowhere near the eventual pinned frame. The
    // beat box itself is always exactly 100dvh tall regardless of sticky
    // state, so measuring the copy's offset within that box is scroll-
    // position-independent.
    let copyTopFrac: Partial<Record<BeatKey, number>> = {};
    const measureCopyFractions = () => {
      const beats = refs.beatRefs.current || {};
      const out: Partial<Record<BeatKey, number>> = {};
      (Object.keys(beats) as BeatKey[]).forEach((key) => {
        // "chaos" uses a full-bleed layered layout (headline/cards/close),
        // not the bottom-anchored .beatInner card the numbered beats share.
        if (key === "chaos") return;
        const el = beats[key];
        const inner = el?.firstElementChild as HTMLElement | null;
        if (el && inner) {
          const boxRect = el.getBoundingClientRect();
          const innerRect = inner.getBoundingClientRect();
          if (boxRect.height > 0) out[key] = (innerRect.top - boxRect.top) / boxRect.height;
        }
      });
      copyTopFrac = out;
    };

    const formations: FormationSet = buildFormations(N);
    // Per-formation framing boxes (see computeFormationBounds) so each chapter's
    // icon is centered and scaled by its own real extent, not a global guess.
    const formationBounds: FormationBounds[] = formations.map((f) => computeFormationBounds(f));
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(formations[0].pos);
    const col = new Float32Array(formations[0].col);
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
    const mat = new THREE.PointsMaterial({
      size: 0.42,
      map: makeSprite(),
      vertexColors: true,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      opacity: 0.95,
    });
    const points = new THREE.Points(geo, mat);
    const group = new THREE.Group();
    group.add(points);
    scene.add(group);

    const resize = () => {
      renderer.setSize(window.innerWidth, window.innerHeight);
      const aspect = window.innerWidth / window.innerHeight;
      camera.aspect = aspect;
      camera.updateProjectionMatrix();
      // Portrait framing: retreat the camera, then uniformly scale the field
      // for whatever width is still missing so every formation (clusters,
      // lattice, chart, shell) stays inside the visible frustum.
      camZ = aspect < 1 ? Math.min(46, BASE_CAM_Z / Math.max(0.62, aspect)) : BASE_CAM_Z;
      halfHeight = Math.tan((camera.fov * Math.PI) / 360) * (camZ - 3.5);
      const halfWidth = halfHeight * aspect;
      // Portrait: middle-align the formation in the free band above the
      // bottom-anchored chapter copy, and scale it to fill that band. The
      // exact position/scale (which depends on each beat's copy height) is
      // resolved every frame in frame() via copyTopFrac — here we only need
      // the shared camera-derived numbers and a fresh DOM measurement.
      const portrait = aspect < 1;
      portraitView = portrait;
      if (portrait) {
        measureCopyFractions();
      } else {
        const fit = Math.min(1, halfWidth / FIT_HALF_WIDTH);
        group.scale.setScalar(fit);
        group.position.y = 0;
      }
      // sizeAttenuation shrinks points as the camera retreats — compensate,
      // plus a boost on portrait so sparse mobile fields still read bold.
      mat.size = BASE_POINT_SIZE * (camZ / BASE_CAM_Z) * (portrait ? 1.3 : 1);
    };
    resize();
    // Debounced: mobile URL-bar show/hide fires resize mid-scroll, and an
    // immediate renderer.setSize each time causes a visible hitch.
    let resizeTimer = 0;
    const onResize = () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(resize, 150);
    };
    window.addEventListener("resize", onResize);

    let mx = 0;
    let my = 0;
    let tmx = 0;
    let tmy = 0;
    const onMove = (e: PointerEvent) => {
      tmx = (e.clientX / window.innerWidth - 0.5) * 2;
      tmy = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("pointermove", onMove, { passive: true });

    let time = 0;
    let alive = true;
    let rafId = 0;
    // Frame-loop caches: skip redundant style writes / buffer uploads.
    let lastStarOpacity = -1;
    let colorSettledFor = -1;

    const frame = () => {
      if (!alive) return;
      rafId = requestAnimationFrame(frame);
      time += options.calm ? 0.004 : 0.016;

      // The canvas is fixed full-viewport, so it's always on screen — render
      // regardless of where #story has scrolled to. Past p=1 the formation
      // holds at "shell" as an ambient backdrop for Platform/Proof/Demo.
      const rect = story.getBoundingClientRect();
      const vh = window.innerHeight;
      const storyTravel = Math.max(1, rect.height - vh);
      // Unclamped: 0…1 through the sticky story, >1 once Platform scrolls in.
      const rawP = -rect.top / storyTravel;
      const p = clamp01(rawP);

      // Portrait: resolve the formation's on-screen position/scale for
      // whichever beat is currently most visible, using its DOM-measured
      // copy top (see copyTopFrac). Beats vary a lot in copy length (a
      // two-chip row vs. a four-card grid), so this must be re-derived per
      // beat rather than fixed once — a single guessed fraction either
      // strands the icon in empty space or lets it bleed down behind text.
      if (portraitView) {
        // Glide the framing continuously as the field morphs, rather than
        // snapping to whichever beat's copy is momentarily most visible.
        // Every formation has its own on-screen home: chaos fills the screen
        // centered, while each numbered icon sits in the free band above its
        // bottom-anchored copy. Blending those homes with the SAME [a,b,t]
        // that morphs the particle shape means the cloud drifts into its new
        // position exactly as it takes its new shape — no sudden top-jump on
        // the first morph into 01, and no snap back to center in the gap
        // between one chapter and the next.
        const halfWidth = halfHeight * camera.aspect;
        const freeTopY = halfHeight * (1 - 2 * PORTRAIT_NAV_BAND);

        // A formation's (scale, y) home in the current portrait frustum.
        const framingFor = (idx: number): [number, number] => {
          // chaos (index 0) is a full-bleed scatter behind full-width copy —
          // fill the screen, centered, instead of tucking into a band.
          if (idx === 0) return [Math.min(1, halfWidth / FIT_HALF_WIDTH), 0];
          // Free band = the gap between the nav and the top of this shape's
          // owning-beat copy. Center THIS formation (by its own measured
          // extent) in that band and scale it to fill the band — bounded by
          // the screen width so wide icons (the connect star) never clip.
          const bnd = formationBounds[idx];
          const bandFrac = clamp01(copyTopFrac[FORMATION_BEAT[idx]] ?? 1 - PORTRAIT_COPY_BAND_FALLBACK);
          const freeBottomY = halfHeight * (1 - 2 * bandFrac);
          const freeBandHeight = Math.max(2, freeTopY - freeBottomY);
          const freeCenterY = (freeTopY + freeBottomY) / 2;
          const fitH = (freeBandHeight * PORTRAIT_FIT_MARGIN_H) / (2 * bnd.halfH);
          const fitW = (halfWidth * PORTRAIT_FIT_MARGIN_W) / bnd.halfW;
          const fit = Math.min(PORTRAIT_MAX_SCALE, fitH, fitW);
          // Land the formation's own vertical center on the band center: local
          // cy scales to cy*fit inside the group, so offset to cancel it.
          // Icons biased off-center (bulb, book motes) sit true this way.
          return [fit, freeCenterY - bnd.cy * fit];
        };

        // Same morph state that shapes the particles this frame — so framing
        // and shape move together through every transition and hold.
        const [fa, fb, ft] = formationState(p);
        const [scaleA, yA] = framingFor(fa);
        const [scaleB, yB] = framingFor(fb);
        group.scale.setScalar(scaleA + (scaleB - scaleA) * ft);
        group.position.y = yA + (yB - yA) * ft;
      }

      // After 06 · Private, gradually dim the starfield so post-story copy stays
      // legible while particles remain faintly visible. private beat ≈ 0.894–1.0.
      const postDim = clamp01((rawP - 0.9301) / 0.5); // 0 at late private → 1 into post-story
      const starOpacity = 1 - postDim * 0.68; // floor ~0.32
      // Only touch styles when the value actually moved — writing an opacity
      // with a CSS transition attached every frame restarts the transition
      // and forces extra style work.
      if (Math.abs(starOpacity - lastStarOpacity) > 0.003) {
        lastStarOpacity = starOpacity;
        mat.opacity = 0.95 * starOpacity;
        canvas.style.opacity = starOpacity.toFixed(3);
        document.documentElement.style.setProperty("--starfield-post-opacity", starOpacity.toFixed(3));
      }

      const [a, b, t] = formationState(p);
      const A = formations[a];
      const B = formations[b];
      const jAmp = (JITTER[a] + (JITTER[b] - JITTER[a]) * t) * (options.calm ? 0.25 : 1);
      const parr = geo.attributes.position.array as Float32Array;
      for (let i = 0; i < N; i++) {
        const i3 = i * 3;
        const ph = i * 0.37;
        parr[i3] = A.pos[i3] + (B.pos[i3] - A.pos[i3]) * t + Math.sin(time * 0.9 + ph) * jAmp * 0.5;
        parr[i3 + 1] = A.pos[i3 + 1] + (B.pos[i3 + 1] - A.pos[i3 + 1]) * t + Math.sin(time * 1.15 + ph * 1.7) * jAmp * 0.4;
        parr[i3 + 2] = A.pos[i3 + 2] + (B.pos[i3 + 2] - A.pos[i3 + 2]) * t + Math.cos(time * 0.8 + ph * 2.3) * jAmp * 0.4;
      }
      geo.attributes.position.needsUpdate = true;
      // Colors only change while morphing between two formations — outside a
      // morph window they're static, so skip the lerp + GPU upload entirely
      // (roughly halves per-frame buffer traffic during the long holds).
      if (a !== b || colorSettledFor !== a) {
        const carr = geo.attributes.color.array as Float32Array;
        for (let i = 0; i < N; i++) {
          const i3 = i * 3;
          carr[i3] = A.col[i3] + (B.col[i3] - A.col[i3]) * t;
          carr[i3 + 1] = A.col[i3 + 1] + (B.col[i3 + 1] - A.col[i3 + 1]) * t;
          carr[i3 + 2] = A.col[i3 + 2] + (B.col[i3 + 2] - A.col[i3 + 2]) * t;
        }
        geo.attributes.color.needsUpdate = true;
        colorSettledFor = a === b ? a : -1;
      }

      mx += (tmx - mx) * 0.04;
      my += (tmy - my) * 0.04;
      // The formations are literal icons (book, bulb, lock…) — they must stay
      // near face-on to read. A gentle yaw oscillation + pointer parallax
      // keeps them alive without ever turning them edge-on; the old monotonic
      // time/scroll spin is gone on purpose.
      const sway = options.calm ? 0.02 : 0.11;
      group.rotation.y = Math.sin(time * 0.2) * sway + p * (portraitView ? 0.05 : 0.16) + mx * 0.14;
      group.rotation.x = 0.12 + my * 0.06;
      camera.position.x = mx * 1.8;
      camera.position.y = -my * 1.2;
      camera.position.z = camZ - p * 3.5;
      camera.lookAt(0, 0, 0);
      renderer.render(scene, camera);

      let maxOp = 0;
      const beats = refs.beatRefs.current || {};
      (Object.keys(BEAT_WINDOWS) as BeatKey[]).forEach((key) => {
        const el = beats[key];
        if (!el) return;
        const [wa, wb] = BEAT_WINDOWS[key];
        const op = fadeWin(p, wa, wb, BEAT_FADE_MARGIN[key] ?? 0.045);
        if (op > maxOp) maxOp = op;
        el.style.opacity = String(op);
        const inner = el.firstElementChild as HTMLElement | null;
        if (inner) inner.style.transform = `translateY(${(1 - op) * 26}px)`;
        el.style.visibility = op > 0.001 ? "visible" : "hidden";
        // Defensive: translated card decks overflow their beat, and any
        // phantom native scroll on the chain would open a chapter mid-deck.
        if (el.scrollLeft !== 0) el.scrollLeft = 0;
        if (el.scrollTop !== 0) el.scrollTop = 0;
      });
      if (refs.dimRef.current) refs.dimRef.current.style.opacity = (maxOp * 0.8).toFixed(3);

      const typedEl = refs.typedRef.current;
      if (typedEl) {
        let txt = "";
        for (let s = 0; s < TYPED_SEGMENTS.length; s++) {
          if (p >= TYPED_SEGMENTS[s][0]) {
            const tt = clamp01((p - TYPED_SEGMENTS[s][0]) / (TYPED_SEGMENTS[s][1] - TYPED_SEGMENTS[s][0]));
            txt = TYPED_QUESTIONS[s].slice(0, Math.round(TYPED_QUESTIONS[s].length * tt));
          }
        }
        if (typedEl.textContent !== txt) typedEl.textContent = txt;
      }

      const bigEl = refs.bigNumRef.current;
      if (bigEl) {
        const smooth = (u: number) => {
          const c = clamp01(u);
          return c * c * (3 - 2 * c);
        };
        // Count up early in the answer beat so the $ figure is visible for
        // most of the dwell, not only in the final third.
        const v = 2.41 * smooth((p - 0.77286) / 0.071);
        bigEl.textContent = v.toFixed(2);
      }

      // Mobile: vertical scroll walks the 02/05 card decks sideways. The
      // shift is how far the track's content overflows the viewport, so the
      // last card always parks fully in frame before the beat fades out.
      const trackShift = (el: HTMLElement, wa: number, wb: number): number => {
        const tt = clamp01((p - wa) / (wb - wa));
        const eased = tt * tt * (3 - 2 * tt);
        return -eased * Math.max(0, el.scrollWidth - el.clientWidth);
      };

      const sqlEl = refs.sqlCardRef.current;
      if (sqlEl) {
        // Reveal the analysis cards shortly after the answer headline, and
        // keep them up through the full answer window.
        const op = fadeWin(p, 0.78351, 0.87933, 0.0284);
        sqlEl.style.opacity = String(op);
        const tx = isMobileLayout ? trackShift(sqlEl, ANSWER_TRACK_WIN[0], ANSWER_TRACK_WIN[1]) : 0;
        sqlEl.style.transform = `translate3d(${tx.toFixed(1)}px, ${((1 - op) * 30).toFixed(1)}px, 0)`;
      }

      const learnEl = refs.learnTrackRef.current;
      if (learnEl && isMobileLayout) {
        const tx = trackShift(learnEl, LEARN_TRACK_WIN[0], LEARN_TRACK_WIN[1]);
        learnEl.style.transform = `translate3d(${tx.toFixed(1)}px, 0, 0)`;
      }

      // ── chaos beat: ghost word drift, line-by-line headline, staggered
      // pain cards, line-by-line closing — all layered inside the shared
      // "chaos" beat container above, whose own fade/visibility already came
      // from the generic beat loop.
      const ghostEl = refs.chaosGhostRef.current;
      if (ghostEl) {
        const [ga, gb] = CHAOS_GHOST_WIN;
        const t = clamp01((p - ga) / (gb - ga));
        const driftPct = 6 - t * 44;
        const op = fadeWin(p, ga, gb, 0.02) * 0.07;
        ghostEl.style.transform = `translate(${driftPct}%, -50%)`;
        ghostEl.style.opacity = op.toFixed(3);
      }

      const lines = refs.chaosLineRefs.current || [];
      for (let i = 0; i < lines.length; i++) {
        const el = lines[i];
        if (!el) continue;
        const a = chaosHeadlineWin[0] + i * CHAOS_HEADLINE_STAGGER;
        const b = chaosHeadlineWin[1];
        const f = chaosHeadlineWin[2];
        const op = fadeWin(p, a, b, f);
        el.style.opacity = String(op);
        el.style.filter = `blur(${(1 - op) * 8}px)`;
        el.style.transform = `translateY(${(1 - op) * 24}px)`;
      }

      const cards = refs.chaosCardRefs.current || [];
      for (let i = 0; i < cards.length; i++) {
        const el = cards[i];
        if (!el) continue;
        const [ca, cb, cf] = CHAOS_CARD_WINDOWS[i] || CHAOS_CARD_WINDOWS[0];
        const op = fadeWin(p, ca, cb, cf);
        const rotate = i === 1 ? 0 : i === 0 ? -4 + op * 2.5 : 4 - op * 2.5;
        el.style.opacity = String(op);
        el.style.transform = `translateY(${(1 - op) * 60}px) rotate(${rotate}deg)`;
      }

      // The closing container fades as one unit (its scrim), while each line
      // inside staggers in — the same treatment as the opening headline.
      const closeEl = refs.chaosCloseRef.current;
      if (closeEl) {
        const [xa, xb, xf] = chaosCloseWin;
        const op = fadeWin(p, xa, xb, xf);
        closeEl.style.opacity = String(op);
        closeEl.style.transform = `translateY(${(1 - op) * 30}px)`;
      }
      const closeLines = refs.chaosCloseLineRefs.current || [];
      for (let i = 0; i < closeLines.length; i++) {
        const el = closeLines[i];
        if (!el) continue;
        const a = chaosCloseWin[0] + i * CHAOS_CLOSE_STAGGER;
        const op = fadeWin(p, a, chaosCloseWin[1], chaosCloseWin[2]);
        el.style.opacity = String(op);
        el.style.filter = `blur(${(1 - op) * 8}px)`;
        el.style.transform = `translateY(${(1 - op) * 20}px)`;
      }
    };
    frame();

    return () => {
      alive = false;
      window.clearTimeout(resizeTimer);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(rafId);
      canvas.style.opacity = "";
      document.documentElement.style.removeProperty("--starfield-post-opacity");
      geo.dispose();
      mat.map?.dispose();
      mat.dispose();
      renderer.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options.density, options.calm]);
}
