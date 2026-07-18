"use client";

import { type RefObject, useEffect } from "react";
import * as THREE from "three";

import { buildFormations, formationState, JITTER, MORPH_WINDOWS, type FormationSet } from "./galaxy-formations";

export type BeatKey = "chaos" | "connect" | "learn" | "skills" | "ask" | "answer" | "private";

// Beat dwell windows over story progress p ∈ [0,1]. Every beat gets a long
// enough plateau that dense copy isn't a blink between fade-in and fade-out
// on a slight wheel tick. Learn + answer are slightly longer (more UI).
//
// "chaos" — the pain-point beat — was inserted ahead of "01 · Connect" by
// uniformly shifting every window below by +416vh (a 380vh beat + two 36vh
// gaps) against the original 1800vh track, then re-expressing every
// fraction against the new 2216vh total (see .story height in
// galaxy-story.module.css). That shift is affine (new = old*0.81225 +
// 0.18773), so every window keeps its original relative width, gap, and
// (for "private") its intentional past-1 overhang.
const BEAT_WINDOWS: Record<BeatKey, [number, number]> = {
  // Chaos opens as soon as the story pins (no long empty starfield after hero).
  chaos: [0, 0.18773],
  connect: [0.20397, 0.31363],
  learn: [0.32986, 0.45171],
  skills: [0.46796, 0.57761],
  ask: [0.59386, 0.70758],
  answer: [0.72382, 0.86192],
  private: [0.87816, 1.00812],
};

const TYPED_QUESTIONS = [
  "Which regions are at highest renewal risk?",
  "¿Qué regiones tienen mayor riesgo de renovación?",
  "更新リスクが最も高い地域は？",
  "Quelles régions sont les plus à risque ?",
];
// Stretch the typewriter across the ask window so each language question is
// readable before the next replaces it. Shifted by the same affine remap as
// BEAT_WINDOWS above.
const TYPED_SEGMENTS: [number, number][] = [
  [0.60198, 0.62635],
  [0.63041, 0.65477],
  [0.65884, 0.6832],
  [0.68726, 0.70595],
];

// ── "chaos" beat internal choreography ──────────────────────────────────
// Three overlapping phases share the beat's outer window: the headline
// dissolves in word-by-word, then the pain-point cards rise in (staggered),
// then the closing line turns the story toward the answer.
//
// Headline starts near p=0 so "Getting answers shouldn't be this hard."
// appears right as the hero scrolls away (no long empty pin).
const CHAOS_HEADLINE_WIN: [number, number, number] = [0.004, 0.09025, 0.016];
const CHAOS_HEADLINE_STAGGER = 8 / 2216; // ~8vh per word
const CHAOS_CARD_WINDOWS: [number, number, number][] = [
  [0.08348, 0.15569, 0.02031],
  [0.09251, 0.15569, 0.02031],
  [0.10154, 0.15569, 0.02031],
];
// Closing line: slightly longer dwell than the original blink, still fully
// inside the chaos outer window so Connect timing is unchanged.
// [start, end, fade] — full opacity ≈ end−start−2·fade.
const CHAOS_CLOSE_WIN: [number, number, number] = [0.142, 0.1865, 0.014];
const CHAOS_GHOST_WIN: [number, number] = [0, 0.18773];

// The generic beat loop below fades each beat container in/out with a fixed
// 0.045 margin, which is fine for beats with one static content block. The
// "chaos" beat is much wider (three internal phases share it), so its outer
// container needs a much tighter margin — otherwise the outer fade-out would
// start clipping the closing line before it ever reaches full opacity.
const BEAT_FADE_MARGIN: Partial<Record<BeatKey, number>> = { chaos: 0.012 };

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
  chaosWordRefs: RefObject<(HTMLSpanElement | null)[]>;
  chaosCardRefs: RefObject<(HTMLDivElement | null)[]>;
  chaosCloseRef: RefObject<HTMLParagraphElement | null>;
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
    if (window.innerWidth < 700) N = Math.min(N, 3200);

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 200);
    // Camera distance is aspect-dependent (see resize) — the 55° FOV is
    // vertical, so portrait phones see only ~±7 world units of width while
    // formations span ±15 (lattice) to ±22 (chaos).
    const BASE_CAM_Z = 30;
    const BASE_POINT_SIZE = 0.42;
    // Widest recognizable formation half-extent (lattice ±15 + jitter).
    const FIT_HALF_WIDTH = 16.5;
    let camZ = BASE_CAM_Z;
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
      const halfWidth = Math.tan((camera.fov * Math.PI) / 360) * (camZ - 3.5) * aspect;
      const fit = Math.min(1, halfWidth / FIT_HALF_WIDTH);
      group.scale.setScalar(fit);
      // sizeAttenuation shrinks points as the camera retreats — compensate.
      mat.size = BASE_POINT_SIZE * (camZ / BASE_CAM_Z);
    };
    resize();
    window.addEventListener("resize", resize);

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
      // legible while particles remain faintly visible. private beat ≈ 0.878–1.0.
      const postDim = clamp01((rawP - 0.92) / 0.5); // 0 at late private → 1 into post-story
      const starOpacity = 1 - postDim * 0.68; // floor ~0.32
      mat.opacity = 0.95 * starOpacity;
      canvas.style.opacity = starOpacity.toFixed(3);
      document.documentElement.style.setProperty("--starfield-post-opacity", starOpacity.toFixed(3));

      const [a, b, t] = formationState(p);
      const A = formations[a];
      const B = formations[b];
      const jAmp = (JITTER[a] + (JITTER[b] - JITTER[a]) * t) * (options.calm ? 0.25 : 1);
      const parr = geo.attributes.position.array as Float32Array;
      const carr = geo.attributes.color.array as Float32Array;
      for (let i = 0; i < N; i++) {
        const i3 = i * 3;
        const ph = i * 0.37;
        parr[i3] = A.pos[i3] + (B.pos[i3] - A.pos[i3]) * t + Math.sin(time * 0.9 + ph) * jAmp * 0.5;
        parr[i3 + 1] = A.pos[i3 + 1] + (B.pos[i3 + 1] - A.pos[i3 + 1]) * t + Math.sin(time * 1.15 + ph * 1.7) * jAmp * 0.4;
        parr[i3 + 2] = A.pos[i3 + 2] + (B.pos[i3 + 2] - A.pos[i3 + 2]) * t + Math.cos(time * 0.8 + ph * 2.3) * jAmp * 0.4;
        carr[i3] = A.col[i3] + (B.col[i3] - A.col[i3]) * t;
        carr[i3 + 1] = A.col[i3 + 1] + (B.col[i3 + 1] - A.col[i3 + 1]) * t;
        carr[i3 + 2] = A.col[i3 + 2] + (B.col[i3 + 2] - A.col[i3 + 2]) * t;
      }
      geo.attributes.position.needsUpdate = true;
      geo.attributes.color.needsUpdate = true;

      mx += (tmx - mx) * 0.04;
      my += (tmy - my) * 0.04;
      const spin = options.calm ? 0.008 : 0.03;
      const extraSpin = a === 4 || b === 4 ? fadeWin(p, MORPH_WINDOWS[3][0], MORPH_WINDOWS[4][1], 0.1) * 0.25 : 0;
      group.rotation.y = time * (spin + extraSpin) + p * 1.2;
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
        const visible = op > 0.001;
        el.style.visibility = visible ? "visible" : "hidden";
        if (isMobileLayout) {
          // Dense beats (learn/answer) can scroll internally on short phones.
          // Chaos must stay overflow:hidden — its giant watermark would
          // otherwise create nested H+V scrollbars.
          if (key === "chaos") {
            el.style.overflow = "hidden";
          } else {
            // Keep overflow hidden until a beat is fully faded in, otherwise
            // wheel/touch ticks get eaten by nested scroll during fade-in.
            el.style.overflowY = op > 0.97 ? "auto" : "hidden";
            el.style.overflowX = "hidden";
          }
          if (!visible) el.scrollTop = 0;
        }
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
        const v = 2.41 * smooth((p - 0.74006) / 0.0812);
        bigEl.textContent = v.toFixed(2);
      }

      const sqlEl = refs.sqlCardRef.current;
      if (sqlEl) {
        // Reveal the analysis cards shortly after the answer headline, and
        // keep them up through the full answer window.
        const op = fadeWin(p, 0.75225, 0.8619, 0.0325);
        sqlEl.style.opacity = String(op);
        sqlEl.style.transform = `translateY(${(1 - op) * 30}px)`;
      }

      // ── chaos beat: ghost word drift, word-by-word headline, staggered
      // pain cards, closing line — all layered inside the shared "chaos"
      // beat container above, whose own fade/visibility already came from
      // the generic beat loop.
      const ghostEl = refs.chaosGhostRef.current;
      if (ghostEl) {
        const [ga, gb] = CHAOS_GHOST_WIN;
        const t = clamp01((p - ga) / (gb - ga));
        const driftPct = 6 - t * 44;
        const op = fadeWin(p, ga, gb, 0.02) * 0.07;
        ghostEl.style.transform = `translate(${driftPct}%, -50%)`;
        ghostEl.style.opacity = op.toFixed(3);
      }

      const words = refs.chaosWordRefs.current || [];
      for (let i = 0; i < words.length; i++) {
        const el = words[i];
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

      const closeEl = refs.chaosCloseRef.current;
      if (closeEl) {
        const [xa, xb, xf] = CHAOS_CLOSE_WIN;
        const op = fadeWin(p, xa, xb, xf);
        closeEl.style.opacity = String(op);
        closeEl.style.transform = `translateY(${(1 - op) * 30}px)`;
      }
    };
    frame();

    return () => {
      alive = false;
      window.removeEventListener("resize", resize);
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
