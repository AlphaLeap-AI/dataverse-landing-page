"use client";

import { type RefObject, useEffect } from "react";
import * as THREE from "three";

import { buildFormations, formationState, JITTER, type FormationSet } from "./galaxy-formations";

export type BeatKey = "chaos" | "connect" | "learn" | "skills" | "ask" | "answer" | "private";

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
// appears right as the hero scrolls away (no long empty pin). Windows are
// sized so the LAST staggered line still has a long full-opacity plateau
// (~145vh headline, ~184vh close) — those two phrases are the emotional
// peaks and must not be a blink between fade-in and fade-out.
// [start, end, fade] — full opacity ≈ end−start−2·fade (minus stagger).
const CHAOS_HEADLINE_WIN: [number, number, number] = [0.004, 0.125, 0.014];
const CHAOS_HEADLINE_STAGGER = 0.009; // per display line (5 lines)
const CHAOS_CARD_WINDOWS: [number, number, number][] = [
  [0.11, 0.195, 0.018],
  [0.118, 0.195, 0.018],
  [0.126, 0.195, 0.018],
];
const CHAOS_CLOSE_WIN: [number, number, number] = [0.175, 0.288, 0.012];
const CHAOS_CLOSE_STAGGER = 0.0055; // per display line (4 lines)
const CHAOS_GHOST_WIN: [number, number] = [0, 0.29022];

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

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobileLayout ? 1.5 : 2));
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 200);
    // Camera distance is aspect-dependent (see resize) — the 55° FOV is
    // vertical, so portrait phones see only ~±7 world units of width while
    // formations span ±15 (lattice) to ±22 (chaos).
    const BASE_CAM_Z = 30;
    const BASE_POINT_SIZE = 0.42;
    // Widest / tallest recognizable formation half-extents (lattice ±15 +
    // jitter horizontally; chart + magnifier / lock dome vertically).
    const FIT_HALF_WIDTH = 16.5;
    const FIT_HALF_HEIGHT = 11.5;
    // Bottom fraction of a phone viewport reserved for bottom-anchored
    // chapter copy (eyebrow + headline + cards). Top fraction reserved for
    // the fixed glass nav so tall icons (lightbulb rays, lock dome) don't
    // tuck under the bar. The free band between them is where the particle
    // illustration should sit.
    //
    // Copy band is intentionally a bit under the true block height: the
    // beatInner gradient scrim can overlap the lower particles, and a
    // smaller reserve pulls icons down so short formations (ask bubble)
    // don't float in a large empty strip above "0N · TITLE".
    const PORTRAIT_COPY_BAND = 0.34;
    const PORTRAIT_NAV_BAND = 0.1;
    // 0 = free-band top (under nav), 1 = free-band bottom (above copy).
    // Bias toward the title so mid-height icons sit next to the copy
    // rather than dead-center in a tall empty free band.
    const PORTRAIT_FREE_BIAS = 0.72;
    let camZ = BASE_CAM_Z;
    let portraitView = false;
    camera.position.z = camZ;

    const formations: FormationSet = buildFormations(N);
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
      const halfHeight = Math.tan((camera.fov * Math.PI) / 360) * (camZ - 3.5);
      const halfWidth = halfHeight * aspect;
      // Portrait: middle-align the formation in the free band above the
      // bottom-anchored chapter copy, and scale it to fill that band.
      // Previously y ≈ halfHeight*0.5 top-aligned the field and left a
      // large empty strip between the particles and the "0N · TITLE" block.
      const portrait = aspect < 1;
      portraitView = portrait;
      if (portrait) {
        // Free band: below the fixed nav → top of bottom-anchored copy.
        // Without the nav reserve, tall icons (esp. 03 · Teach lightbulb
        // rays) hide behind the glass bar on phones.
        const freeBandFrac = 1 - PORTRAIT_COPY_BAND - PORTRAIT_NAV_BAND;
        const freeBandHeight = 2 * halfHeight * freeBandFrac;
        // Screen y: +halfHeight at top, −halfHeight at bottom.
        const freeTopY = halfHeight * (1 - 2 * PORTRAIT_NAV_BAND);
        const freeBottomY = halfHeight * (2 * PORTRAIT_COPY_BAND - 1);
        const freeCenterY = freeTopY + (freeBottomY - freeTopY) * PORTRAIT_FREE_BIAS;
        // Mild overflow on both axes so icons stay bold (÷0.72 / ÷0.9).
        // Vertical fit allows a little bleed into the copy scrim so the
        // formation can sit close to the title without going under the nav.
        const fitW = halfWidth / (FIT_HALF_WIDTH * 0.72);
        const fitH = freeBandHeight / (2 * FIT_HALF_HEIGHT * 0.9);
        // Cap slightly above 1 so short formations (ask bubble) can still
        // grow into the free band without dwarfing wider ones (connect).
        const fit = Math.min(1.18, fitW, fitH);
        group.scale.setScalar(fit);
        group.position.y = freeCenterY;
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
        const a = CHAOS_HEADLINE_WIN[0] + i * CHAOS_HEADLINE_STAGGER;
        const b = CHAOS_HEADLINE_WIN[1];
        const f = CHAOS_HEADLINE_WIN[2];
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
        const [xa, xb, xf] = CHAOS_CLOSE_WIN;
        const op = fadeWin(p, xa, xb, xf);
        closeEl.style.opacity = String(op);
        closeEl.style.transform = `translateY(${(1 - op) * 30}px)`;
      }
      const closeLines = refs.chaosCloseLineRefs.current || [];
      for (let i = 0; i < closeLines.length; i++) {
        const el = closeLines[i];
        if (!el) continue;
        const a = CHAOS_CLOSE_WIN[0] + i * CHAOS_CLOSE_STAGGER;
        const op = fadeWin(p, a, CHAOS_CLOSE_WIN[1], CHAOS_CLOSE_WIN[2]);
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
