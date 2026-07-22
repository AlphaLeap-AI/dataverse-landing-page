"use client";

/**
 * Mutable scroll state shared between the DOM overlay and the WebGL scene.
 * Written by scroll listeners in journey.tsx, read every frame by the canvas.
 * Kept outside React so 60fps updates never trigger re-renders.
 */
export const scrollState = {
  /** 0→1 as the hero scrolls out and the story pins. */
  heroExit: 0,
  /** 0→1 across the pinned chapter track (chaos → vault). */
  journey: 0,
  /** 0→1 across the finale reveal (vault → open universe). */
  finale: 0,
  /** 0→1 whole-document progress (nav bar, floating CTA). */
  doc: 0,
};

/**
 * Hero "ask" interaction pulse — the particle universe converges and
 * brightens while the simulated query runs. Written by ask-experience,
 * damped toward in the canvas frame loop.
 */
export const askState = { pulse: 0 };

export type ChapterKey = "chaos" | "connect" | "lattice" | "answer" | "vault";

export const CHAPTERS: { key: ChapterKey; window: [number, number] }[] = [
  { key: "chaos", window: [0.0, 0.22] },
  { key: "connect", window: [0.22, 0.42] },
  { key: "lattice", window: [0.42, 0.6] },
  { key: "answer", window: [0.6, 0.8] },
  { key: "vault", window: [0.8, 1.0] },
];

const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);

/** Local 0..1 progress of a chapter within its window (clamped). */
export function chapterLocal(journey: number, key: ChapterKey): number {
  const ch = CHAPTERS.find((c) => c.key === key);
  if (!ch) return 0;
  return clamp01((journey - ch.window[0]) / (ch.window[1] - ch.window[0]));
}

/**
 * Visibility envelope for overlays and scene groups: fades in across
 * [a-f, a+f], holds, fades out across [b-f, b+f]. Clamped to [0,1].
 */
export function envelope(p: number, a: number, b: number, f = 0.045): number {
  if (p < a - f || p > b + f) return 0;
  const fadeIn = f > 0 ? clamp01((p - (a - f)) / (2 * f)) : 1;
  const fadeOut = f > 0 ? clamp01(((b + f) - p) / (2 * f)) : 1;
  return Math.min(fadeIn, fadeOut);
}

/**
 * The single morph axis (0..6) driving the particle field:
 *   0 hero scatter · 1 chaos storm · 2 connect clusters · 3 lattice ·
 *   4 answer bars · 5 vault shell · 6 open universe (finale)
 */
export function morphTarget(s: typeof scrollState): number {
  if (s.finale > 0) {
    const t = s.finale;
    return 5 + (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
  }
  if (s.journey > 0) return 1 + s.journey * 4;
  return s.heroExit;
}
