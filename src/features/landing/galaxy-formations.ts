import * as THREE from "three";

/**
 * Particle formation math for the scroll-driven galaxy background.
 *
 * Each of the six numbered chapters gets a literal particle "icon" so the
 * shape alone tells the chapter's story before the copy is read:
 *   01 Connect    — satellite database cylinders wired into one glowing hub
 *   02 Understand — an open book with lines of documentation
 *   03 Teach      — a lightbulb with a burning filament (knowledge taught)
 *   04 Ask        — a speech bubble with a big question mark
 *   05 Answer     — a bar chart under a magnifying glass
 *   06 Private    — a padlock sealed inside a protective dome
 *
 * Kept free of DOM/canvas access so it can be unit-reasoned about
 * independently of the render loop in use-galaxy.ts.
 */

// Connector palette — one per satellite database in the 01 formation and the
// chip row (PostgreSQL, MongoDB, DynamoDB, Snowflake, BigQuery,
// Elasticsearch, Redis, Kafka).
export const DB_COLORS = [
  "#6aa6dd",
  "#13c25b",
  "#8b9aff",
  "#7fd4ff",
  "#5f9bff",
  "#ffd24d",
  "#ff9a8a",
  "#c9a6ff",
];
export const ACCENT = "#3d82ff";

const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);
const smooth = (t: number): number => {
  const c = clamp01(t);
  return c * c * (3 - 2 * c);
};
const gauss = (): number => (Math.random() + Math.random() + Math.random() - 1.5) * 0.85;
const jit = (s: number): number => (Math.random() - 0.5) * s;

export interface Formation {
  pos: Float32Array;
  col: Float32Array;
}

/** The seven particle shapes the galaxy morphs between as the story scrolls. */
export type FormationSet = [Formation, Formation, Formation, Formation, Formation, Formation, Formation];

/** Question-mark glyph polyline for the 04 · Ask bubble (x, y pairs). */
const QM_PATH: [number, number][] = [
  [-2.1, 2.9],
  [-1.6, 4.4],
  [-0.1, 5.15],
  [1.5, 4.7],
  [2.15, 3.3],
  [1.65, 1.95],
  [0.5, 1.15],
  [0.15, 0.35],
  [0.15, -0.5],
];

export function buildFormations(N: number): FormationSet {
  const mk = (): Formation => ({ pos: new Float32Array(N * 3), col: new Float32Array(N * 3) });
  const chaos = mk();
  const connect = mk();
  const learn = mk();
  const skills = mk();
  const ask = mk();
  const answer = mk();
  const priv = mk();

  const cAccent = new THREE.Color(ACCENT);
  const cSoft = new THREE.Color("#7fb0ff");
  const cDim = new THREE.Color("#33415e");
  const cWhite = new THREE.Color("#dfe9ff");
  const cGreen = new THREE.Color("#7ee0a3");
  const cGold = new THREE.Color("#ffd24d");
  const cSlate = new THREE.Color("#93a3c2");
  const dbCols = DB_COLORS.map((h) => new THREE.Color(h));
  const tmp = new THREE.Color();

  const put = (f: Formation, i3: number, x: number, y: number, z: number) => {
    f.pos[i3] = x;
    f.pos[i3 + 1] = y;
    f.pos[i3 + 2] = z;
    f.col[i3] = tmp.r;
    f.col[i3 + 1] = tmp.g;
    f.col[i3 + 2] = tmp.b;
  };

  // ── 01 Connect: satellite ring geometry ─────────────────────────────
  const SAT = 8;
  const satPos: [number, number, number][] = [];
  for (let k = 0; k < SAT; k++) {
    const a = (k / SAT) * Math.PI * 2 + 0.42;
    satPos.push([Math.cos(a) * 11.2, Math.sin(a) * 6.1, Math.sin(a * 2) * 1.6]);
  }

  // ── 02 Understand: open book geometry ───────────────────────────────
  const PAGE_W = 10.4; // inner margin → outer edge
  const PAGE_TOP = 4.4;
  const PAGE_BOT = -4.0;
  const pageDrop = (px: number) => -Math.pow(px / PAGE_W, 2) * 1.0; // outer edge dips
  const pageZ = (px: number) => -(px / PAGE_W) * 2.8; // pages recede
  // Ragged right edge per text row (fraction of full line width).
  const ROW_LEN = [0.95, 0.72, 0.9, 0.62, 0.93, 0.78, 0.5];

  // ── 04 Ask: question-mark arc-length table ──────────────────────────
  const qmCum: number[] = [0];
  for (let s = 1; s < QM_PATH.length; s++) {
    const dx = QM_PATH[s][0] - QM_PATH[s - 1][0];
    const dy = QM_PATH[s][1] - QM_PATH[s - 1][1];
    qmCum.push(qmCum[s - 1] + Math.hypot(dx, dy));
  }
  const qmTotal = qmCum[qmCum.length - 1];
  const sampleQM = (): [number, number] => {
    const d = Math.random() * qmTotal;
    let s = 1;
    while (s < qmCum.length - 1 && qmCum[s] < d) s++;
    const t = (d - qmCum[s - 1]) / (qmCum[s] - qmCum[s - 1]);
    return [
      QM_PATH[s - 1][0] + (QM_PATH[s][0] - QM_PATH[s - 1][0]) * t,
      QM_PATH[s - 1][1] + (QM_PATH[s][1] - QM_PATH[s - 1][1]) * t,
    ];
  };
  // Rounded-rect (superellipse) bubble outline.
  const bubblePoint = (hw: number, hh: number): [number, number] => {
    const a = Math.random() * Math.PI * 2;
    const co = Math.cos(a);
    const si = Math.sin(a);
    const n = 2 / 4; // superellipse exponent 4 → rounded rectangle
    return [hw * Math.sign(co) * Math.pow(Math.abs(co), n), hh * Math.sign(si) * Math.pow(Math.abs(si), n)];
  };

  // ── 05 Answer: bar chart spec (EMEA / NA / APAC / LATAM) ────────────
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
  const BAR_BASE = -7;
  const barH = (b: number) => (barVals[b] / barVals[0]) * 11.5;
  const MAG_CX = -9.4; // magnifier ring over the tallest bar
  const MAG_CY = 5.4;
  const MAG_R = 3.1;

  for (let i = 0; i < N; i++) {
    const i3 = i * 3;
    const u = i / N;

    // ── chaos: wide scattered ellipsoid (opening pain-point beat) ──
    chaos.pos[i3] = gauss() * 22;
    chaos.pos[i3 + 1] = gauss() * 12;
    chaos.pos[i3 + 2] = gauss() * 9;
    {
      const r = Math.random();
      if (r > 0.94) tmp.copy(cAccent).multiplyScalar(0.9);
      else if (r > 0.86) tmp.copy(cWhite).multiplyScalar(0.55);
      else tmp.copy(cDim).multiplyScalar(0.55 + Math.random() * 0.6);
      chaos.col[i3] = tmp.r;
      chaos.col[i3 + 1] = tmp.g;
      chaos.col[i3 + 2] = tmp.b;
    }

    // ── 01 Connect: db cylinders around a hub, wired in ──
    if (u < 0.15) {
      // glowing hub core
      const th = Math.random() * Math.PI * 2;
      const ph = Math.acos(2 * Math.random() - 1);
      const r = Math.pow(Math.random(), 0.6) * 2.1;
      tmp.copy(cWhite).lerp(cAccent, Math.random() * 0.65).multiplyScalar(0.75 + Math.random() * 0.5);
      put(connect, i3, Math.sin(ph) * Math.cos(th) * r, Math.cos(ph) * r * 0.85, Math.sin(ph) * Math.sin(th) * r);
    } else if (u < 0.62) {
      // satellite database cylinders: three stacked discs, rim-biased
      const k = i % SAT;
      const [cx, cy, cz] = satPos[k];
      const band = Math.floor(Math.random() * 3) - 1; // -1 | 0 | 1
      const ang = Math.random() * Math.PI * 2;
      const rim = Math.random() < 0.6 ? 1.55 : 1.55 * Math.sqrt(Math.random());
      tmp.copy(dbCols[k]).multiplyScalar(0.6 + Math.random() * 0.6);
      put(connect, i3, cx + Math.cos(ang) * rim, cy + band * 0.95 + jit(0.28), cz + Math.sin(ang) * rim * 0.5);
    } else {
      // connection lines: satellite → hub, with bright "packets" in flight
      const k = i % SAT;
      const [cx, cy, cz] = satPos[k];
      const t = Math.random();
      const sx = cx * 0.82;
      const sy = cy * 0.82;
      const sz = cz * 0.82;
      const packet = Math.random() > 0.88;
      tmp.copy(dbCols[k]).lerp(cWhite, t * 0.7).multiplyScalar(packet ? 1.1 : 0.22 + t * 0.35);
      put(connect, i3, sx * (1 - t) + jit(0.14), sy * (1 - t) + jit(0.14), sz * (1 - t) + jit(0.14));
    }

    // ── 02 Understand: open book with documented lines ──
    if (u < 0.2) {
      // page outlines (both pages)
      const side = Math.random() < 0.5 ? -1 : 1;
      const per = 2 * (PAGE_W - 0.5) + 2 * (PAGE_TOP - PAGE_BOT);
      let d = Math.random() * per;
      let px: number;
      let py: number;
      const wSeg = PAGE_W - 0.5;
      const hSeg = PAGE_TOP - PAGE_BOT;
      if (d < wSeg) {
        px = 0.5 + d;
        py = PAGE_TOP;
      } else if ((d -= wSeg) < hSeg) {
        px = PAGE_W;
        py = PAGE_TOP - d;
      } else if ((d -= hSeg) < wSeg) {
        px = PAGE_W - d;
        py = PAGE_BOT;
      } else {
        px = 0.5;
        py = PAGE_TOP - (d - wSeg);
      }
      tmp.copy(cWhite).multiplyScalar(0.5 + Math.random() * 0.25);
      put(learn, i3, side * px + jit(0.1), py + pageDrop(px) + jit(0.1), pageZ(px) + jit(0.15));
    } else if (u < 0.72) {
      // text lines — the documentation writing itself
      const side = Math.random() < 0.5 ? -1 : 1;
      const row = i % ROW_LEN.length;
      const len = (PAGE_W - 1.6) * ROW_LEN[row];
      const px = 1.3 + Math.random() * len;
      const py = 3.3 - row * 1.22;
      const green = row % 3 === 1;
      tmp.copy(green ? cGreen : cSoft).multiplyScalar(green ? 0.75 : 0.5 + Math.random() * 0.45);
      put(learn, i3, side * px + jit(0.08), py + pageDrop(px) + jit(0.09), pageZ(px) + jit(0.12));
    } else if (u < 0.82) {
      // bright spine
      const py = PAGE_BOT - 0.2 + Math.random() * (PAGE_TOP - PAGE_BOT + 0.6);
      tmp.copy(cWhite).multiplyScalar(0.8 + Math.random() * 0.4);
      put(learn, i3, jit(0.22), py, 0.35 + jit(0.2));
    } else if (u < 0.88) {
      // sparse knowledge motes drifting up off the pages
      tmp.copy(cGold).multiplyScalar(0.12 + Math.random() * 0.3);
      put(learn, i3, jit(19), 5 + Math.random() * 4.5, jit(5) - 1);
    } else {
      // extra pass over the text lines so the writing stays the focus
      const side = Math.random() < 0.5 ? -1 : 1;
      const row = i % ROW_LEN.length;
      const len = (PAGE_W - 1.6) * ROW_LEN[row];
      const px = 1.3 + Math.random() * len;
      const py = 3.3 - row * 1.22;
      tmp.copy(cSoft).multiplyScalar(0.5 + Math.random() * 0.4);
      put(learn, i3, side * px + jit(0.08), py + pageDrop(px) + jit(0.09), pageZ(px) + jit(0.12));
    }

    // ── 03 Teach: lightbulb, filament burning ──
    if (u < 0.3) {
      // glass envelope
      const th = Math.random() * Math.PI * 2;
      const ph = Math.acos(2 * Math.random() - 1);
      tmp.copy(cSoft).lerp(cWhite, Math.random() * 0.4).multiplyScalar(0.28 + Math.random() * 0.2);
      put(skills, i3, Math.sin(ph) * Math.cos(th) * 4.4, 2.4 + Math.cos(ph) * 4.4, Math.sin(ph) * Math.sin(th) * 4.4);
    } else if (u < 0.6) {
      // filament coil + leads
      if (i % 5 === 0) {
        const side = i % 10 === 0 ? -1 : 1;
        const t = Math.random();
        tmp.copy(cGold).multiplyScalar(0.65 + Math.random() * 0.35);
        put(skills, i3, side * (1.5 - t * 0.6) + jit(0.08), 0.9 - t * 3.4 + jit(0.08), jit(0.1));
      } else {
        const t = Math.random();
        const coil = t * Math.PI * 6;
        tmp.copy(cGold).lerp(cWhite, Math.random() * 0.35).multiplyScalar(0.95 + Math.random() * 0.45);
        put(skills, i3, (t - 0.5) * 3.0 + jit(0.07), 1.15 + Math.sin(coil) * 0.75 + jit(0.07), Math.cos(coil) * 0.35);
      }
    } else if (u < 0.82) {
      // screw base: three stacked rings
      const band = i % 3;
      const r = 1.75 - band * 0.14;
      const ang = Math.random() * Math.PI * 2;
      tmp.copy(cSlate).multiplyScalar(0.4 + Math.random() * 0.3);
      put(skills, i3, Math.cos(ang) * r + jit(0.1), -2.85 - band * 0.72 + jit(0.2), Math.sin(ang) * r * 0.6);
    } else {
      // light rays
      const k = i % 12;
      const ang = (k / 12) * Math.PI * 2 + 0.26;
      const t = Math.random();
      const r = 5.2 + t * 1.7;
      tmp.copy(cGold).multiplyScalar((1 - t) * 0.6 + 0.1);
      put(skills, i3, Math.cos(ang) * r + jit(0.1), 2.4 + Math.sin(ang) * r + jit(0.1), jit(0.4));
    }

    // ── 04 Ask: speech bubble + question mark ──
    if (u < 0.3) {
      // bubble outline
      const [bx, by] = bubblePoint(8.2, 4.6);
      tmp.copy(cSoft).multiplyScalar(0.55 + Math.random() * 0.35);
      put(ask, i3, bx + jit(0.2), 1.6 + by + jit(0.2), jit(0.3));
    } else if (u < 0.37) {
      // tail toward the asker
      const t = Math.random();
      const w = (1 - t) * 1.4;
      tmp.copy(cSoft).multiplyScalar(0.5 + Math.random() * 0.3);
      put(ask, i3, -3.4 - t * 2.3 + jit(w), -2.95 - t * 2.4 + jit(w * 0.5), jit(0.3));
    } else if (u < 0.78) {
      // the question mark — brightest element on screen
      if (Math.random() < 0.18) {
        // dot
        const ang = Math.random() * Math.PI * 2;
        const r = 0.45 * Math.sqrt(Math.random());
        tmp.copy(cWhite).lerp(cGold, Math.random() * 0.5).multiplyScalar(1.05 + Math.random() * 0.35);
        put(ask, i3, 0.15 + Math.cos(ang) * r, -1.95 + Math.sin(ang) * r * 1.1, jit(0.2));
      } else {
        const [qx, qy] = sampleQM();
        tmp.copy(cWhite).lerp(cGold, Math.random() * 0.5).multiplyScalar(1.0 + Math.random() * 0.4);
        put(ask, i3, qx + jit(0.3), qy + jit(0.3), jit(0.25));
      }
    } else {
      // two smaller bubbles trailing off — the conversation continues
      const minor = Math.random() < 0.6;
      const r = minor ? 1.15 : 0.7;
      const cx = minor ? 10.3 : 12.4;
      const cy = minor ? 6.3 : 8.1;
      const ang = Math.random() * Math.PI * 2;
      tmp.copy(cSoft).multiplyScalar(0.35 + Math.random() * 0.25);
      put(ask, i3, cx + Math.cos(ang) * r, cy + Math.sin(ang) * r, jit(0.3));
    }

    // ── 05 Answer: bar chart under a magnifying glass ──
    if (u < 0.64) {
      // crisp bars
      let b = 0;
      const uu = u / 0.64;
      while (b < 3 && uu > barCum[b]) b++;
      const h = barH(b);
      const py = BAR_BASE + Math.random() * h;
      const cap = py > BAR_BASE + h - 0.7;
      tmp.copy(barCols[b]).multiplyScalar((cap ? 1.15 : 0.5) + Math.random() * 0.55);
      put(answer, i3, barX[b] + jit(2.9), py, jit(1.6));
    } else if (u < 0.72) {
      // axis lines
      if (Math.random() < 0.72) {
        tmp.copy(cWhite).multiplyScalar(0.3 + Math.random() * 0.15);
        put(answer, i3, -12 + Math.random() * 24, BAR_BASE - 0.35 + jit(0.12), jit(0.3));
      } else {
        tmp.copy(cWhite).multiplyScalar(0.25 + Math.random() * 0.15);
        put(answer, i3, -12 + jit(0.12), BAR_BASE - 0.35 + Math.random() * 12.5, jit(0.3));
      }
    } else if (u < 0.9) {
      // magnifying glass ring over the tallest bar — "digs for the why"
      const ang = Math.random() * Math.PI * 2;
      tmp.copy(cGold).multiplyScalar(0.8 + Math.random() * 0.5);
      put(answer, i3, MAG_CX + Math.cos(ang) * MAG_R + jit(0.22), MAG_CY + Math.sin(ang) * MAG_R + jit(0.22), 0.8 + jit(0.3));
    } else {
      // magnifier handle
      const t = Math.random();
      tmp.copy(cGold).multiplyScalar(0.7 + Math.random() * 0.4);
      put(
        answer,
        i3,
        MAG_CX + Math.cos(-0.62) * (MAG_R + t * 3.6) + jit(0.2),
        MAG_CY + Math.sin(-0.62) * (MAG_R + t * 3.6) + jit(0.2),
        0.8 + jit(0.3)
      );
    }

    // ── 06 Private: padlock sealed inside a protective dome ──
    if (u < 0.38) {
      // dome shell with a faint wireframe hint
      const th = Math.random() * Math.PI * 2;
      const ph = Math.acos(2 * Math.random() - 1);
      const wire = Math.abs(Math.sin(ph * 6)) > 0.94 || Math.abs(Math.sin(th * 4)) > 0.965;
      tmp.copy(cAccent).lerp(cWhite, Math.random() * 0.3).multiplyScalar(wire ? 0.75 : 0.22 + Math.random() * 0.18);
      put(priv, i3, Math.sin(ph) * Math.cos(th) * 12.0, Math.cos(ph) * 8.9, Math.sin(ph) * Math.sin(th) * 9.5);
    } else if (u < 0.6) {
      // lock body (filled rounded square)
      const [bx, by] = bubblePoint(3.2, 2.4);
      const fill = Math.sqrt(Math.random());
      tmp.copy(cAccent).lerp(cSoft, Math.random() * 0.6).multiplyScalar(0.55 + Math.random() * 0.5);
      put(priv, i3, bx * fill + jit(0.1), -1.9 + by * fill + jit(0.1), jit(0.5));
    } else if (u < 0.78) {
      // shackle arc
      const ang = Math.random() * Math.PI;
      tmp.copy(cWhite).lerp(cSoft, Math.random() * 0.5).multiplyScalar(0.85 + Math.random() * 0.4);
      put(priv, i3, Math.cos(ang) * 2.1 + jit(0.3), 0.6 + Math.sin(ang) * 2.4 + jit(0.3), jit(0.4));
    } else if (u < 0.88) {
      // gold keyhole: circle + slot
      if (Math.random() < 0.55) {
        const ang = Math.random() * Math.PI * 2;
        const r = 0.55 * Math.sqrt(Math.random());
        tmp.copy(cGold).multiplyScalar(1.0 + Math.random() * 0.4);
        put(priv, i3, Math.cos(ang) * r, -1.35 + Math.sin(ang) * r, 0.6 + jit(0.2));
      } else {
        const t = Math.random();
        tmp.copy(cGold).multiplyScalar(1.0 + Math.random() * 0.4);
        put(priv, i3, jit(0.5 - t * 0.3), -1.75 - t * 1.15, 0.6 + jit(0.2));
      }
    } else {
      // grounding rings under the dome (reference: vault sits on halo rings)
      const ring = i % 3;
      const r = 8.2 + ring * 1.7;
      const ang = Math.random() * Math.PI * 2;
      tmp.copy(cAccent).multiplyScalar(0.3 + Math.random() * 0.2);
      put(priv, i3, Math.cos(ang) * r, -8.6 + ring * 0.12 + jit(0.1), Math.sin(ang) * r * 0.35);
    }
  }

  return [chaos, connect, learn, skills, ask, answer, priv];
}

/**
 * Morph windows over story progress p ∈ [0,1] — one transition per story step
 * after the chaos pain-point beat (formations: chaos → connect → book →
 * bulb → bubble → chart → lock-in-dome).
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
  [0.220, 0.258], // 01 Connect — hub + satellites assemble
  [0.318, 0.355], // 02 Learn  — the book opens
  [0.458, 0.495], // 03 Skills — the bulb lights
  [0.580, 0.620], // 04 Ask    — the question forms
  [0.710, 0.755], // 05 Answer — the chart draws itself
  [0.865, 0.910], // 06 Private — the lock seals inside the dome
];

// Per-formation ambient jitter — icons stay crisp (low), chaos breathes.
export const JITTER = [1.0, 0.1, 0.05, 0.07, 0.06, 0.09, 0.1];

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
