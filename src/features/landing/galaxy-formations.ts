import * as THREE from "three";

/**
 * Particle formation math for the scroll-driven galaxy background, ported
 * from the Claude Design "Dataverse Landing" prototype (galaxy.js). Kept
 * free of DOM/canvas access so it can be unit-reasoned about independently
 * of the render loop in use-galaxy.ts.
 */

export const DB_COLORS = ["#6aa6dd", "#13c25b", "#8b9aff", "#6fe0b2", "#ffd24d"];
export const ACCENT = "#3d82ff";

const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);
const smooth = (t: number): number => {
  const c = clamp01(t);
  return c * c * (3 - 2 * c);
};
const gauss = (): number => (Math.random() + Math.random() + Math.random() - 1.5) * 0.85;

export interface Formation {
  pos: Float32Array;
  col: Float32Array;
}

/** The seven particle shapes the galaxy morphs between as the story scrolls. */
export type FormationSet = [Formation, Formation, Formation, Formation, Formation, Formation, Formation];

export function buildFormations(N: number): FormationSet {
  const mk = (): Formation => ({ pos: new Float32Array(N * 3), col: new Float32Array(N * 3) });
  const chaos = mk();
  const clusters = mk();
  const lattice = mk();
  const constel = mk();
  const stream = mk();
  const chart = mk();
  const shell = mk();

  const cAccent = new THREE.Color(ACCENT);
  const cDim = new THREE.Color("#33415e");
  const cWhite = new THREE.Color("#dfe9ff");
  const dbCols = DB_COLORS.map((h) => new THREE.Color(h));

  // cluster centers on a tilted ring
  const centers: [number, number, number][] = [];
  for (let k = 0; k < 5; k++) {
    const a = (k / 5) * Math.PI * 2 - Math.PI / 2;
    centers.push([Math.cos(a) * 13.5, Math.sin(a) * 6.5, Math.sin(a * 2) * 3]);
  }

  // bar chart spec: EMEA / NA / APAC / LATAM
  const barVals = [2.41, 1.82, 1.03, 0.41];
  const barX = [-9.6, -3.2, 3.2, 9.6];
  const total = barVals.reduce((a, b) => a + b, 0);
  const barCum: number[] = [];
  let acc = 0;
  for (const v of barVals) {
    acc += v / total;
    barCum.push(acc);
  }
  const barCols = [cAccent, new THREE.Color("#5f9bff"), new THREE.Color("#8db8ff"), new THREE.Color("#b9d2f5")];
  const cGreen = new THREE.Color("#7ee0a3");
  const cGold = new THREE.Color("#ffd24d");

  // constellation nodes (shared skills network)
  const K = 42;
  const nodes: [number, number, number][] = [];
  for (let k = 0; k < K; k++) nodes.push([gauss() * 11, gauss() * 6.5, gauss() * 5]);

  for (let i = 0; i < N; i++) {
    const i3 = i * 3;

    // chaos: wide scattered ellipsoid
    chaos.pos[i3] = gauss() * 22;
    chaos.pos[i3 + 1] = gauss() * 12;
    chaos.pos[i3 + 2] = gauss() * 9;
    let cc = cDim.clone();
    const r = Math.random();
    if (r > 0.94) cc = cAccent.clone().multiplyScalar(0.9);
    else if (r > 0.86) cc = cWhite.clone().multiplyScalar(0.55);
    else cc.multiplyScalar(0.55 + Math.random() * 0.6);
    chaos.col[i3] = cc.r;
    chaos.col[i3 + 1] = cc.g;
    chaos.col[i3 + 2] = cc.b;

    // clusters: 5 galaxies by db
    const k = i % 5;
    clusters.pos[i3] = centers[k][0] + gauss() * 2.6;
    clusters.pos[i3 + 1] = centers[k][1] + gauss() * 1.9;
    clusters.pos[i3 + 2] = centers[k][2] + gauss() * 1.9;
    const kc = dbCols[k].clone().multiplyScalar(0.55 + Math.random() * 0.65);
    clusters.col[i3] = kc.r;
    clusters.col[i3 + 1] = kc.g;
    clusters.col[i3 + 2] = kc.b;

    // lattice: structured schema grid (auto-documented tables)
    const cell = i % 800;
    const cx = cell % 40;
    const cy = Math.floor(cell / 40);
    lattice.pos[i3] = (cx / 39) * 30 - 15 + (Math.random() - 0.5) * 0.22;
    lattice.pos[i3 + 1] = (cy / 19) * 14 - 7 + (Math.random() - 0.5) * 0.22;
    lattice.pos[i3 + 2] = Math.sin(cx * 0.45) * 1.1 + (Math.random() - 0.5) * 0.3;
    let lc: THREE.Color;
    if (cy === 19 || cy === 9) lc = cWhite.clone().multiplyScalar(0.55);
    else if ((cx + cy * 3) % 7 === 0) lc = cGreen.clone().multiplyScalar(0.7);
    else lc = cAccent.clone().multiplyScalar(0.3 + Math.random() * 0.35);
    lattice.col[i3] = lc.r;
    lattice.col[i3 + 1] = lc.g;
    lattice.col[i3 + 2] = lc.b;

    // constellation: skills & rules shared across the team
    const rr = Math.random();
    let nc: THREE.Color;
    if (rr < 0.68) {
      const n = i % K;
      constel.pos[i3] = nodes[n][0] + gauss() * 0.8;
      constel.pos[i3 + 1] = nodes[n][1] + gauss() * 0.7;
      constel.pos[i3 + 2] = nodes[n][2] + gauss() * 0.7;
      nc = (n % 3 === 0 ? cGold : cAccent).clone().multiplyScalar(0.55 + Math.random() * 0.6);
    } else {
      const n1 = nodes[i % K];
      const n2 = nodes[(i * 7 + 3) % K];
      const et = Math.random();
      constel.pos[i3] = n1[0] + (n2[0] - n1[0]) * et + gauss() * 0.18;
      constel.pos[i3 + 1] = n1[1] + (n2[1] - n1[1]) * et + gauss() * 0.18;
      constel.pos[i3 + 2] = n1[2] + (n2[2] - n1[2]) * et + gauss() * 0.18;
      nc = cWhite.clone().multiplyScalar(0.16 + Math.random() * 0.18);
    }
    constel.col[i3] = nc.r;
    constel.col[i3 + 1] = nc.g;
    constel.col[i3 + 2] = nc.b;

    // stream: converging helix (question pulling everything in)
    const t = i / N;
    const ang = t * Math.PI * 14 + (i % 7) * 0.13;
    const rad = 16 * (1 - t) + 0.6 + gauss() * 0.5;
    stream.pos[i3] = Math.cos(ang) * rad;
    stream.pos[i3 + 1] = (t - 0.5) * 13 + gauss() * 0.5;
    stream.pos[i3 + 2] = Math.sin(ang) * rad * 0.65;
    const sc = cWhite.clone().lerp(cAccent, 1 - t).multiplyScalar(0.35 + t * 0.85);
    stream.col[i3] = sc.r;
    stream.col[i3 + 1] = sc.g;
    stream.col[i3 + 2] = sc.b;

    // chart: 4 bars
    const u = i / N;
    let b = 0;
    while (b < 3 && u > barCum[b]) b++;
    const h = (barVals[b] / barVals[0]) * 12.5;
    chart.pos[i3] = barX[b] + (Math.random() - 0.5) * 3.4;
    chart.pos[i3 + 1] = -6.8 + Math.random() * h;
    chart.pos[i3 + 2] = (Math.random() - 0.5) * 2.2;
    const bc = barCols[b].clone().multiplyScalar(0.5 + Math.random() * 0.7);
    chart.col[i3] = bc.r;
    chart.col[i3 + 1] = bc.g;
    chart.col[i3 + 2] = bc.b;

    // shell: protective sphere (your walls)
    const th = Math.random() * Math.PI * 2;
    const ph = Math.acos(2 * Math.random() - 1);
    const sr = 11 + gauss() * 0.35;
    shell.pos[i3] = Math.sin(ph) * Math.cos(th) * sr * 1.25;
    shell.pos[i3 + 1] = Math.cos(ph) * sr * 0.8;
    shell.pos[i3 + 2] = Math.sin(ph) * Math.sin(th) * sr;
    const shc = cAccent.clone().lerp(cWhite, Math.random() * 0.35).multiplyScalar(0.45 + Math.random() * 0.6);
    shell.col[i3] = shc.r;
    shell.col[i3 + 1] = shc.g;
    shell.col[i3 + 2] = shc.b;
  }

  return [chaos, clusters, lattice, constel, stream, chart, shell];
}

/**
 * Morph windows over story progress p ∈ [0,1] — one transition per story step
 * after the chaos pain-point beat (formations: chaos → clusters → lattice →
 * constel → stream → chart → shell).
 *
 * Aligned to BEAT_WINDOWS in use-galaxy.ts (chaos-shifted track):
 *   chaos   [0.016, 0.188]  — hold scattered chaos (no morph)
 *   connect [0.204, 0.314]  — first morph late in the beat
 *   learn   [0.330, 0.452]
 *   skills  [0.468, 0.578]
 *   ask     [0.594, 0.708]
 *   answer  [0.724, 0.862]
 *   private [0.878, 1.008]
 *
 * Each window lands while its beat copy is fully visible, then holds the new
 * shape until the next step.
 */
export const MORPH_WINDOWS: [number, number][] = [
  // Morph early–mid in each numbered step, then HOLD the settled shape for the
  // rest of that beat (and the gap before the next morph).
  // Nudged earlier (~0.02–0.025) after feedback that holds felt too delayed.
  [0.220, 0.258], // 01 Connect — gather into clusters (after chaos hold)
  [0.318, 0.355], // 02 Learn  — clusters → lattice, hold
  [0.458, 0.495], // 03 Skills — lattice → constellation, hold
  [0.580, 0.620], // 04 Ask    — constellation → stream, hold
  [0.710, 0.755], // 05 Answer — stream → chart, hold
  [0.865, 0.910], // 06 Private — chart → shell, hold
];

export const JITTER = [1.0, 0.28, 0.06, 0.16, 0.18, 0.14, 0.2];

/** Returns [formationIndexA, formationIndexB, blendT] for story progress p. */
export function formationState(p: number): [number, number, number] {
  let idx = 0;
  for (let i = 0; i < MORPH_WINDOWS.length; i++) {
    const [a, b] = MORPH_WINDOWS[i];
    if (p >= b) idx = i + 1;
    else if (p > a) return [i, i + 1, smooth((p - a) / (b - a))];
  }
  return [idx, idx, 0];
}
