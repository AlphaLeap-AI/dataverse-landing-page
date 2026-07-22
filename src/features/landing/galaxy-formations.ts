import * as THREE from "three";

/**
 * Particle formation math for the scroll-driven galaxy background.
 *
 * Visual language — "solid emblems": every chapter is a bold, instantly
 * readable icon built from FILLED masses (solid silhouettes with bright
 * structural rims and one hot focal element), not sparse wireframe
 * outlines. Masses stay monochrome-blue; a single warm accent per chapter
 * marks the focal point. Benchmarked against the 06 reference: dome +
 * beam + keep + columns + steps inside a bold containment ring.
 *
 *   01 Connect    — a hot solid hub; every satellite DB beamed into it
 *   02 Understand — an open book: filled pages, bright self-writing lines
 *   03 Teach      — a solid glowing bulb: hot filament, bold base, rays
 *   04 Ask        — a solid speech bubble with a thick bright "?"
 *   05 Answer     — a solid Pareto chart under a bold magnifying glass
 *   06 Private    — a walled treasury: dome, vault keep, colonnade and
 *                   stepped base sealed inside the containment ring
 *
 * Brightness floors (hard-won): at the 2600-particle phone budget a fill
 * under ~0.3 luminance reads as dust, not mass. Fills live at 0.3–0.55,
 * structural rims/edges at 0.75–1.1, focal points at 1.0–1.5.
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
const TAU = Math.PI * 2;

export interface Formation {
  pos: Float32Array;
  col: Float32Array;
}

/** The seven particle shapes the galaxy morphs between as the story scrolls. */
export type FormationSet = [Formation, Formation, Formation, Formation, Formation, Formation, Formation];

/** Question-mark glyph polyline for the 04 · Ask bubble (x, y pairs). */
const QM_PATH: [number, number][] = [
  [-1.51, 2.09],
  [-1.15, 3.17],
  [-0.07, 3.71],
  [1.08, 3.38],
  [1.55, 2.38],
  [1.19, 1.4],
  [0.36, 0.83],
  [0.11, 0.25],
  [0.11, -0.36],
];

// ── solid-emblem primitives ──────────────────────────────────────────────
// Coordinate samplers for FILLED masses. Each returns [x, y] (or [x, y, z]
// where depth matters); the caller sets the color and writes via `put`.

/** Uniform fill of a disc. */
const disc = (cx: number, cy: number, r: number): [number, number] => {
  const a = Math.random() * TAU;
  const rr = r * Math.sqrt(Math.random());
  return [cx + Math.cos(a) * rr, cy + Math.sin(a) * rr];
};

/** Points ON a circle of radius r (± wobble), for rims/rings. */
const ring = (cx: number, cy: number, r: number, wobble = 0.2): [number, number] => {
  const a = Math.random() * TAU;
  const rr = r + jit(wobble);
  return [cx + Math.cos(a) * rr, cy + Math.sin(a) * rr];
};

/** Uniform fill of an axis-aligned rect. */
const rect = (x0: number, x1: number, y0: number, y1: number): [number, number] => [
  x0 + Math.random() * (x1 - x0),
  y0 + Math.random() * (y1 - y0),
];

/** Uniform point along a segment, with perpendicular thickness w. */
const seg = (x0: number, y0: number, x1: number, y1: number, w: number): [number, number] => {
  const t = Math.random();
  const dx = x1 - x0;
  const dy = y1 - y0;
  const len = Math.hypot(dx, dy) || 1;
  const off = jit(w);
  return [x0 + dx * t + (-dy / len) * off, y0 + dy * t + (dx / len) * off];
};

/** Superellipse (rounded-rect) outline point, exponent p=4. */
const superellipse = (hw: number, hh: number): [number, number] => {
  const a = Math.random() * TAU;
  const co = Math.cos(a);
  const si = Math.sin(a);
  return [hw * Math.sign(co) * Math.pow(Math.abs(co), 0.5), hh * Math.sign(si) * Math.pow(Math.abs(si), 0.5)];
};

/** Filled superellipse (rounded-rect slab). */
const superellipseFill = (hw: number, hh: number): [number, number] => {
  const [x, y] = superellipse(hw, hh);
  const rr = Math.sqrt(Math.random());
  return [x * rr, y * rr];
};

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
    const a = (k / SAT) * TAU + 0.42;
    satPos.push([Math.cos(a) * 10.0, Math.sin(a) * 5.5, Math.sin(a * 2) * 1.6]);
  }

  // ── 02 Understand: open book geometry ───────────────────────────────
  const PAGE_W = 8.2; // inner margin → outer edge
  const PAGE_TOP = 3.6;
  const PAGE_BOT = -3.3;
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

  // ── 05 Answer: Pareto chart geometry (descending bars — matches the
  // answer card's ranked regions) + magnifier over the tallest bar. ─────
  const barVals = [2.41, 1.82, 1.03, 0.41];
  const barX = [-4.8, -1.6, 1.6, 4.8];
  const total = barVals.reduce((a, b) => a + b, 0);
  const barCum: number[] = [];
  let acc = 0;
  for (const v of barVals) {
    acc += v / total;
    barCum.push(acc);
  }
  const barCols = [cAccent, new THREE.Color("#5f9bff"), new THREE.Color("#8db8ff"), new THREE.Color("#b9d2f5")];
  const BAR_BASE = -6.0;
  const barH = (b: number) => (barVals[b] / barVals[0]) * 11.0;
  // Trend-line y at each bar — an ASCENDING cumulative series crossing the
  // descending caps, so the two read as distinct layers (classic Pareto).
  const lineY = (b: number) => -0.8 + b * 1.9;
  const sampleTrend = (): [number, number] => {
    const segI = Math.random() * (barX.length - 1);
    const s = Math.min(barX.length - 2, Math.floor(segI));
    const t = segI - s;
    const sm = t * t * (3 - 2 * t);
    const x = barX[s] + (barX[s + 1] - barX[s]) * sm;
    const y = lineY(s) + (lineY(s + 1) - lineY(s)) * sm + Math.sin(t * Math.PI) * 0.55;
    return [x, y];
  };
  const MAG_CX = -4.4; // magnifier ring over the tallest bar
  const MAG_CY = 4.6;
  const MAG_R = 2.3;

  // ── 06 Private: the walled treasury ──────────────────────────────────
  // A domed stronghold sealed inside the containment ring ("your walls"):
  // solid dome roof on a bright entablature beam, a massive vault keep on
  // the left with a glowing lock dial, a colonnade on the right, stepped
  // foundation at the bottom, and the data stream flowing in from the
  // lower-left. Monochrome blue — the dial is the hot focal point.
  const RING_R = 11.2;
  const RING_CY = 0.2;
  const DOME_CY = 2.9; // dome base sits on the beam (top y ≈ 2.9)
  const DOME_R = 4.0;
  const KEEP = { x0: -3.9, x1: -0.6, y0: -4.9, y1: 1.6 }; // vault hall (left)
  const DIAL = { x: -2.25, y: -1.25 };
  const COLS_X = [0.65, 2.1, 3.55]; // colonnade (right)
  const STEPS = [
    { hw: 4.6, y0: -5.7, y1: -5.0 },
    { hw: 5.3, y0: -6.4, y1: -5.8 },
    { hw: 6.0, y0: -7.1, y1: -6.5 },
  ];
  const STREAM_STRANDS = 9;

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

    // ── 01 Connect: one hot hub, every source beamed in ──
    if (u < 0.16) {
      // hub core — the brightest solid mass on screen
      const th = Math.random() * TAU;
      const ph = Math.acos(2 * Math.random() - 1);
      const r = Math.pow(Math.random(), 0.45) * 2.4;
      tmp.copy(cWhite).lerp(cAccent, Math.random() * 0.5).multiplyScalar(0.95 + Math.random() * 0.5);
      put(connect, i3, Math.sin(ph) * Math.cos(th) * r, Math.cos(ph) * r * 0.85, Math.sin(ph) * Math.sin(th) * r);
    } else if (u < 0.2) {
      // hub halo ring — gives the core a crisp edge to orbit
      const [hx, hy] = ring(0, 0, 3.2, 0.3);
      tmp.copy(cAccent).lerp(cWhite, Math.random() * 0.4).multiplyScalar(0.5 + Math.random() * 0.3);
      put(connect, i3, hx, hy * 0.85, jit(0.4));
    } else if (u < 0.64) {
      // satellite database cylinders — SOLID stacked discs (filled, with
      // dark groove lines so the disc stack reads)
      const k = i % SAT;
      const [cx, cy, cz] = satPos[k];
      const ang = Math.random() * TAU;
      const rr = 1.5 * (0.4 + 0.6 * Math.sqrt(Math.random()));
      const band = Math.floor(Math.random() * 3) - 1; // -1 | 0 | 1
      const y = band * 0.95 + jit(0.66);
      const groove = Math.abs(Math.abs(y) - 0.48) < 0.14; // dark seams between discs
      const cap = band === 1 && y > 0.62; // top cap catches the light
      tmp
        .copy(dbCols[k])
        .multiplyScalar(groove ? 0.22 : cap ? 0.95 + Math.random() * 0.35 : 0.55 + Math.random() * 0.4);
      put(connect, i3, cx + Math.cos(ang) * rr, cy + y, cz + Math.sin(ang) * rr * 0.5);
    } else if (u < 0.97) {
      // beams — THICK bands from each satellite into the hub, brightening
      // as they arrive, with hot packets in flight
      const k = i % SAT;
      const [cx, cy, cz] = satPos[k];
      const t = Math.random();
      const sx = cx * 0.84;
      const sy = cy * 0.84;
      const sz = cz * 0.84;
      // land on the hub rim, not the center, so the core stays readable
      const ex = (cx / 11.2) * 2.6;
      const ey = (cy / 6.1) * 2.2;
      const w = 0.55 * (1 - t * 0.55);
      const packet = Math.random() > 0.9;
      tmp
        .copy(dbCols[k])
        .lerp(cWhite, t * 0.75)
        .multiplyScalar(packet ? 1.25 : 0.38 + t * 0.65);
      put(
        connect,
        i3,
        sx + (ex - sx) * t + jit(w),
        sy + (ey - sy) * t + jit(w),
        sz * (1 - t) + jit(w * 0.7)
      );
    } else {
      // faint orbit ellipse threading the satellites — structural rhyme
      const a = Math.random() * TAU;
      tmp.copy(cSoft).multiplyScalar(0.16 + Math.random() * 0.14);
      put(connect, i3, Math.cos(a) * 10.0, Math.sin(a) * 5.5, Math.sin(a * 2) * 1.6 + jit(0.2));
    }

    // ── 02 Understand: the book that writes itself ──
    if (u < 0.4) {
      // SOLID page slabs — filled dim masses so the book reads as an object
      const side = Math.random() < 0.5 ? -1 : 1;
      const px = 0.55 + Math.random() * (PAGE_W - 0.8);
      const py = PAGE_BOT + Math.random() * (PAGE_TOP - PAGE_BOT);
      const edge = px > PAGE_W - 0.75 || py > PAGE_TOP - 0.4 || py < PAGE_BOT + 0.4;
      tmp.copy(cSoft).multiplyScalar(edge ? 0.6 + Math.random() * 0.25 : 0.3 + Math.random() * 0.15);
      put(learn, i3, side * px, py + pageDrop(px), pageZ(px) + jit(0.22));
    } else if (u < 0.72) {
      // text lines — the documentation writing itself, bright on the slab
      const side = Math.random() < 0.5 ? -1 : 1;
      const row = i % ROW_LEN.length;
      const len = (PAGE_W - 1.6) * ROW_LEN[row];
      const px = 1.3 + Math.random() * len;
      const py = 2.8 - row * 0.95;
      if (row === 0) {
        // first line on each page = the heading, white-hot
        tmp.copy(cWhite).multiplyScalar(0.95 + Math.random() * 0.4);
      } else {
        const green = row % 3 === 1;
        tmp.copy(green ? cGreen : cSoft).multiplyScalar(green ? 0.7 + Math.random() * 0.3 : 0.6 + Math.random() * 0.4);
      }
      put(learn, i3, side * px + jit(0.1), py + pageDrop(px) + jit(0.12), pageZ(px) + 0.25 + jit(0.14));
    } else if (u < 0.84) {
      // page rims — crisp outline over the slab edges
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
      tmp.copy(cWhite).multiplyScalar(0.75 + Math.random() * 0.35);
      put(learn, i3, side * px + jit(0.1), py + pageDrop(px) + jit(0.1), pageZ(px) + jit(0.15));
    } else if (u < 0.92) {
      // bright spine — the focal fold of the book
      const py = PAGE_BOT - 0.2 + Math.random() * (PAGE_TOP - PAGE_BOT + 0.6);
      tmp.copy(cWhite).multiplyScalar(0.85 + Math.random() * 0.45);
      put(learn, i3, jit(0.26), py, 0.4 + jit(0.22));
    } else {
      // sparse knowledge motes drifting up off the pages
      tmp.copy(cGold).multiplyScalar(0.3 + Math.random() * 0.4);
      put(learn, i3, jit(14), 4.2 + Math.random() * 2.6, jit(4.5) - 1);
    }

    // ── 03 Teach: the bulb, lit from within ──
    // Scaled to match other chapter icons (book/chart/connect span ~±10–12).
    const BULB = 1.3;
    const BULB_CY = 2.4 * BULB;
    const GLASS_R = 4.4 * BULB;
    if (u < 0.22) {
      // SOLID glass envelope — filled orb, brighter toward the rim so the
      // silhouette reads even at phone density
      const th = Math.random() * TAU;
      const ph = Math.acos(2 * Math.random() - 1);
      const rr = GLASS_R * (0.55 + 0.45 * Math.cbrt(Math.random()));
      const rim = rr > GLASS_R * 0.88;
      tmp
        .copy(cSoft)
        .lerp(cWhite, Math.random() * 0.3)
        .multiplyScalar(rim ? 0.7 + Math.random() * 0.3 : 0.32 + Math.random() * 0.16);
      put(
        skills,
        i3,
        Math.sin(ph) * Math.cos(th) * rr,
        BULB_CY + Math.cos(ph) * rr,
        Math.sin(ph) * Math.sin(th) * rr
      );
    } else if (u < 0.4) {
      // crisp rim ring — the bulb's silhouette edge
      const th = Math.random() * TAU;
      tmp.copy(cSoft).lerp(cWhite, Math.random() * 0.4).multiplyScalar(0.8 + Math.random() * 0.4);
      put(skills, i3, Math.cos(th) * GLASS_R, BULB_CY + Math.sin(th) * GLASS_R, jit(1.2));
    } else if (u < 0.6) {
      // filament coil + leads — the hot focal point (knowledge, lit)
      if (i % 5 === 0) {
        const side = i % 10 === 0 ? -1 : 1;
        const t = Math.random();
        tmp.copy(cGold).multiplyScalar(0.7 + Math.random() * 0.35);
        put(
          skills,
          i3,
          side * (1.5 - t * 0.6) * BULB + jit(0.1),
          (0.9 - t * 3.4) * BULB + jit(0.1),
          jit(0.12)
        );
      } else {
        const t = Math.random();
        const coil = t * Math.PI * 6;
        tmp.copy(cGold).lerp(cWhite, Math.random() * 0.45).multiplyScalar(1.05 + Math.random() * 0.5);
        put(
          skills,
          i3,
          ((t - 0.5) * 3.0) * BULB + jit(0.12),
          (1.15 + Math.sin(coil) * 0.75) * BULB + jit(0.12),
          Math.cos(coil) * 0.4 * BULB
        );
      }
    } else if (u < 0.62) {
      // white-hot glow core around the filament
      const [gx, gy] = disc(0, 1.1 * BULB, 1.0 * BULB);
      tmp.copy(cWhite).multiplyScalar(1.1 + Math.random() * 0.4);
      put(skills, i3, gx, gy, jit(0.6));
    } else if (u < 0.66) {
      // neck — the solid collar joining the glass to the screw base
      const [nx, ny] = rect(-1.05 * BULB, 1.05 * BULB, -2.85 * BULB, -1.95 * BULB);
      tmp.copy(cSlate).multiplyScalar(0.5 + Math.random() * 0.3);
      put(skills, i3, nx, ny, jit(0.5));
    } else if (u < 0.86) {
      // SOLID screw base — three filled bands with bright top edges
      const band = i % 3;
      const r = (1.8 - band * 0.16) * BULB;
      const ang = Math.random() * TAU;
      const rr = r * (0.45 + 0.55 * Math.sqrt(Math.random()));
      const y = (-2.75 - band * 0.78) * BULB + jit(0.56);
      const topEdge = y > (-2.75 - band * 0.78 + 0.18) * BULB;
      tmp.copy(cSlate).multiplyScalar(topEdge ? 0.95 + Math.random() * 0.35 : 0.55 + Math.random() * 0.3);
      put(skills, i3, Math.cos(ang) * rr, y, Math.sin(ang) * rr * 0.6);
    } else {
      // bold light rays — 12 spokes, hot near the glass, fading outward
      const k = i % 12;
      const ang = (k / 12) * TAU + 0.26;
      const t = Math.random();
      const r = GLASS_R * 1.08 + t * 1.3 * BULB;
      tmp.copy(cGold).multiplyScalar((1 - t) * 0.6 + 0.12);
      put(skills, i3, Math.cos(ang) * r + jit(0.3), BULB_CY + Math.sin(ang) * r + jit(0.3), jit(0.5));
    }

    // ── 04 Ask: the question, said out loud ──
    const BUB_HW = 5.6;
    const BUB_HH = 3.1;
    const BUB_CY = 1.4;
    if (u < 0.3) {
      // SOLID bubble slab — filled rounded-rect mass
      const [bx, by] = superellipseFill(BUB_HW, BUB_HH);
      tmp.copy(cSoft).multiplyScalar(0.3 + Math.random() * 0.15);
      put(ask, i3, bx, BUB_CY + by, jit(0.35));
    } else if (u < 0.42) {
      // bright bubble rim
      const [bx, by] = superellipse(BUB_HW, BUB_HH);
      tmp.copy(cSoft).multiplyScalar(0.85 + Math.random() * 0.35);
      put(ask, i3, bx + jit(0.24), BUB_CY + by + jit(0.24), jit(0.3));
    } else if (u < 0.48) {
      // solid tail toward the asker
      const t = Math.random();
      const w = (1 - t) * 1.2;
      tmp.copy(cSoft).multiplyScalar(0.55 + Math.random() * 0.3);
      put(ask, i3, -2.6 - t * 2.4 + jit(w), BUB_CY - 3.05 - t * 1.8 + jit(w * 0.55), jit(0.3));
    } else if (u < 0.82) {
      // the question mark — THICK, white-hot, the loudest glyph on screen
      if (Math.random() < 0.16) {
        // dot — solid, heavy
        const [dx, dy] = disc(0.11, -1.4, 0.5);
        tmp.copy(cWhite).lerp(cGold, Math.random() * 0.4).multiplyScalar(1.1 + Math.random() * 0.4);
        put(ask, i3, dx, dy, jit(0.2));
      } else {
        const [qx, qy] = sampleQM();
        tmp.copy(cWhite).lerp(cGold, Math.random() * 0.45).multiplyScalar(1.0 + Math.random() * 0.45);
        put(ask, i3, qx + jit(0.52), qy + jit(0.52), jit(0.28));
      }
    } else {
      // two smaller bubbles trailing off — filled, the conversation continues
      const minor = Math.random() < 0.6;
      const r = minor ? 1.0 : 0.65;
      const cx = minor ? 8.2 : 9.6;
      const cy = minor ? 4.9 : 6.3;
      if (Math.random() < 0.45) {
        const [mx2, my2] = ring(cx, cy, r, 0.16);
        tmp.copy(cSoft).multiplyScalar(0.65 + Math.random() * 0.3);
        put(ask, i3, mx2, my2, jit(0.3));
      } else {
        const [mx2, my2] = disc(cx, cy, r);
        tmp.copy(cSoft).multiplyScalar(0.3 + Math.random() * 0.2);
        put(ask, i3, mx2, my2, jit(0.3));
      }
    }

    // ── 05 Answer: the ranked truth, magnified ──
    if (u < 0.51) {
      // SOLID Pareto bars — crisp uniform fills, hot caps, bright side rims
      let b = 0;
      const uu = u / 0.51;
      while (b < 3 && uu > barCum[b]) b++;
      const h = barH(b);
      const py = BAR_BASE + Math.random() * h;
      const cap = py > BAR_BASE + h - 0.7;
      const ex = (Math.random() * 2 - 1) * 0.85;
      const edge = Math.abs(ex) > 0.68;
      tmp
        .copy(barCols[b])
        .multiplyScalar(cap ? 1.1 + Math.random() * 0.35 : edge ? 0.95 : 0.5 + Math.random() * 0.3);
      put(answer, i3, barX[b] + ex, py, jit(1.0));
    } else if (u < 0.64) {
      // trend line over the bars — bright, with hot vertex nodes
      if (Math.random() < 0.24) {
        const b = i % barX.length;
        const [vx, vy] = disc(barX[b], lineY(b), 0.4);
        tmp.copy(cGold).lerp(cWhite, Math.random() * 0.4).multiplyScalar(1.05 + Math.random() * 0.4);
        put(answer, i3, vx, vy, 0.55 + jit(0.25));
      } else {
        const [lx, ly] = sampleTrend();
        tmp.copy(cGold).lerp(cWhite, Math.random() * 0.45).multiplyScalar(0.9 + Math.random() * 0.5);
        put(answer, i3, lx + jit(0.24), ly + jit(0.22), 0.5 + jit(0.3));
      }
    } else if (u < 0.84) {
      // the magnifier — bold double ring + solid handle, digging for the why
      if (Math.random() < 0.68) {
        const rr = MAG_R + (Math.random() < 0.5 ? -0.14 : 0.14);
        const [mx2, my2] = ring(MAG_CX, MAG_CY, rr, 0.26);
        tmp.copy(cGold).multiplyScalar(0.95 + Math.random() * 0.5);
        put(answer, i3, mx2, my2, 0.85 + jit(0.3));
      } else {
        const [hx, hy] = seg(
          MAG_CX + Math.cos(-0.55) * (MAG_R + 0.2),
          MAG_CY + Math.sin(-0.55) * (MAG_R + 0.2),
          MAG_CX + Math.cos(-0.55) * (MAG_R + 3.4),
          MAG_CY + Math.sin(-0.55) * (MAG_R + 3.4),
          0.66
        );
        tmp.copy(cGold).multiplyScalar(0.85 + Math.random() * 0.45);
        put(answer, i3, hx, hy, 0.85 + jit(0.3));
      }
    } else if (u < 0.93) {
      // axis lines — span only the chart width so phones don't clip
      if (Math.random() < 0.72) {
        tmp.copy(cWhite).multiplyScalar(0.45 + Math.random() * 0.2);
        put(answer, i3, -6.4 + Math.random() * 12.8, BAR_BASE - 0.35 + jit(0.14), jit(0.3));
      } else {
        tmp.copy(cWhite).multiplyScalar(0.38 + Math.random() * 0.18);
        put(answer, i3, -6.4 + jit(0.14), BAR_BASE - 0.35 + Math.random() * 11.8, jit(0.3));
      }
    } else {
      // faint horizontal gridlines behind the bars — chart furniture
      const g = i % 3;
      const gy = BAR_BASE + 11.0 * (0.25 + g * 0.25);
      tmp.copy(cWhite).multiplyScalar(0.16 + Math.random() * 0.12);
      put(answer, i3, -6.4 + Math.random() * 12.8, gy + jit(0.1), -0.4 + jit(0.2));
    }

    // ── 06 Private: the walled treasury (benchmark composition) ──
    if (u < 0.13) {
      // containment ring — the walls themselves, bold and bright
      const [rx, ry] = ring(0, RING_CY, RING_R, 0.5);
      const node = Math.random() > 0.92;
      tmp
        .copy(node ? cWhite : cAccent)
        .lerp(cSoft, Math.random() * 0.45)
        .multiplyScalar(node ? 1.1 : 0.8 + Math.random() * 0.35);
      put(priv, i3, rx, ry, jit(0.5));
    } else if (u < 0.3) {
      // SOLID dome roof — a filled half-disc, brighter toward its rim,
      // bulging slightly toward the camera so it reads as a cupola
      const a = Math.random() * Math.PI; // upper half
      const rr = DOME_R * Math.sqrt(Math.random());
      const x = Math.cos(a) * rr;
      const y = DOME_CY + Math.sin(a) * rr;
      const rimT = rr / DOME_R;
      tmp
        .copy(cSoft)
        .lerp(cWhite, Math.random() * 0.25)
        .multiplyScalar(0.38 + rimT * 0.55 + Math.random() * 0.15);
      put(priv, i3, x, y, (1 - rimT) * 1.3 + jit(0.6));
    } else if (u < 0.31) {
      // finial — the bright bead crowning the dome
      const [fx, fy] = disc(0, DOME_CY + DOME_R + 0.35, 0.42);
      tmp.copy(cWhite).multiplyScalar(1.0 + Math.random() * 0.4);
      put(priv, i3, fx, fy, 0.6 + jit(0.3));
    } else if (u < 0.39) {
      // entablature beam — the solid horizontal bar the dome rests on
      const [bx, by] = rect(-4.3, 4.3, 2.1, 2.9);
      const top = by > 2.68;
      tmp.copy(cSoft).multiplyScalar(top ? 1.0 + Math.random() * 0.3 : 0.55 + Math.random() * 0.3);
      put(priv, i3, bx, by, jit(0.6));
    } else if (u < 0.55) {
      // vault keep — the massive solid block on the left, bright left rim
      const [kx, ky] = rect(KEEP.x0, KEEP.x1, KEEP.y0, KEEP.y1);
      const leftRim = kx < KEEP.x0 + 0.35;
      const topRim = ky > KEEP.y1 - 0.32;
      tmp
        .copy(cAccent)
        .lerp(cSoft, Math.random() * 0.5)
        .multiplyScalar(leftRim ? 1.05 + Math.random() * 0.25 : topRim ? 0.8 + Math.random() * 0.2 : 0.35 + Math.random() * 0.15);
      put(priv, i3, kx, ky, 0.35 + jit(0.5));
    } else if (u < 0.62) {
      // lock dial on the keep face — concentric rings + spokes + hot hub
      const r = Math.random();
      if (r < 0.42) {
        const [dx2, dy2] = ring(DIAL.x, DIAL.y, 0.85, 0.14);
        tmp.copy(cWhite).multiplyScalar(0.9 + Math.random() * 0.4);
        put(priv, i3, dx2, dy2, 1.0 + jit(0.2));
      } else if (r < 0.68) {
        const [dx2, dy2] = ring(DIAL.x, DIAL.y, 0.5, 0.11);
        tmp.copy(cSoft).lerp(cWhite, Math.random() * 0.5).multiplyScalar(0.7 + Math.random() * 0.4);
        put(priv, i3, dx2, dy2, 1.0 + jit(0.2));
      } else if (r < 0.86) {
        const a = ((i % 8) / 8) * TAU + 0.2;
        const t = 0.18 + Math.random() * 0.62;
        tmp.copy(cSoft).multiplyScalar(0.65 + Math.random() * 0.4);
        put(priv, i3, DIAL.x + Math.cos(a) * t, DIAL.y + Math.sin(a) * t, 1.05 + jit(0.15));
      } else {
        const [dx2, dy2] = disc(DIAL.x, DIAL.y, 0.26);
        tmp.copy(cWhite).multiplyScalar(1.15 + Math.random() * 0.4);
        put(priv, i3, dx2, dy2, 1.1 + jit(0.15));
      }
    } else if (u < 0.78) {
      // colonnade — three solid columns on the right, bright caps + bases
      const cxp = COLS_X[i % COLS_X.length];
      const py = KEEP.y0 + Math.random() * (KEEP.y1 - KEEP.y0);
      const capOrBase = py > KEEP.y1 - 0.36 || py < KEEP.y0 + 0.36;
      tmp.copy(cSoft).multiplyScalar(capOrBase ? 1.0 + Math.random() * 0.25 : 0.55 + Math.random() * 0.3);
      put(priv, i3, cxp + jit(0.8), py, jit(0.55));
    } else if (u < 0.87) {
      // stepped foundation — three solid slabs, widest at the bottom
      const s = STEPS[i % STEPS.length];
      const [sx2, sy2] = rect(-s.hw, s.hw, s.y0, s.y1);
      const topEdge = sy2 > s.y1 - 0.28;
      tmp.copy(cSoft).multiplyScalar(topEdge ? 0.9 + Math.random() * 0.3 : 0.5 + Math.random() * 0.25);
      put(priv, i3, sx2, sy2, jit(0.6));
    } else if (u < 0.97) {
      // the data stream — strands flowing in from the lower-left,
      // converging into the keep, hot packets riding them
      const k = i % STREAM_STRANDS;
      const t = Math.random();
      const startX = -11 - (k % 3) * 1.2;
      const startY = -6.2 + (k - STREAM_STRANDS / 2) * 0.85;
      const ex = t * t;
      const ey = t * t * (3 - 2 * t);
      const x = startX + (KEEP.x0 - 0.2 - startX) * ex;
      const y = startY + (-2.1 - startY) * ey + Math.sin(t * Math.PI * 2 + k) * (1 - t) * 0.7;
      const packet = Math.random() > 0.9;
      tmp
        .copy(cSoft)
        .lerp(cWhite, t * 0.7)
        .multiplyScalar(packet ? 1.3 : 0.4 + t * 0.65);
      put(priv, i3, x + jit(0.16), y + jit(0.16), 0.5 + t * 0.6 + jit(0.35));
    } else {
      // interior stars + bright glints on the ring — the night inside the walls
      if (Math.random() < 0.7) {
        const [sx2, sy2] = disc(0, RING_CY, RING_R - 1.0);
        tmp.copy(cWhite).lerp(cSoft, Math.random() * 0.6).multiplyScalar(0.35 + Math.random() * 0.35);
        put(priv, i3, sx2, sy2, jit(1.5));
      } else {
        const [gx2, gy2] = ring(0, RING_CY, RING_R, 0.3);
        tmp.copy(cWhite).multiplyScalar(0.95 + Math.random() * 0.4);
        put(priv, i3, gx2, gy2, jit(0.4));
      }
    }
  }

  return [chaos, connect, learn, skills, ask, answer, priv];
}

/** Axis-aligned framing box for one formation, in world units (pre-scale). */
export interface FormationBounds {
  /** Center of the trimmed extent (formations aren't all centered at y=0). */
  cx: number;
  cy: number;
  /** Half-width / half-height of the trimmed extent. */
  halfW: number;
  halfH: number;
}

/**
 * Robust bounding box for a formation, used by the portrait framer to center
 * and scale each chapter's icon inside the free band above its copy.
 *
 * Absolute min/max would be dominated by the sparse decorative particles every
 * icon carries (drifting knowledge motes, light rays, in-flight packets,
 * trailing chat bubbles), scaling the whole shape down to nothing to fit a few
 * stray dots. A trimmed extent — the box containing all but the outer `trim`
 * fraction of points on each axis — tracks the icon's readable mass instead.
 */
export function computeFormationBounds(f: Formation, trim = 0.015): FormationBounds {
  const n = f.pos.length / 3;
  if (n === 0) return { cx: 0, cy: 0, halfW: 1, halfH: 1 };
  const xs = new Float32Array(n);
  const ys = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    xs[i] = f.pos[i * 3];
    ys[i] = f.pos[i * 3 + 1];
  }
  // TypedArray.sort is numeric by default.
  xs.sort();
  ys.sort();
  const lo = Math.min(n - 1, Math.floor(n * trim));
  const hi = Math.max(0, Math.ceil(n * (1 - trim)) - 1);
  const xMin = xs[lo];
  const xMax = xs[hi];
  const yMin = ys[lo];
  const yMax = ys[hi];
  return {
    cx: (xMin + xMax) / 2,
    cy: (yMin + yMax) / 2,
    halfW: Math.max(0.5, (xMax - xMin) / 2),
    halfH: Math.max(0.5, (yMax - yMin) / 2),
  };
}

/**
 * Morph windows over story progress p ∈ [0,1] — one transition per story step
 * after the chaos pain-point beat (formations: chaos → connect → book →
 * bulb → bubble → chart → treasury-in-ring).
 *
 * Aligned to BEAT_WINDOWS in use-galaxy.ts (2536vh chaos-dwell track):
 *   chaos   [0, 0.290]      — hold scattered chaos (no morph)
 *   connect [0.304, 0.400]  — first morph late in the beat
 *   learn   [0.414, 0.521]
 *   skills  [0.535, 0.648]
 *   ask     [0.645, 0.744]
 *   answer  [0.759, 0.879]
 *   private [0.894, 1.007]
 *
 * Each window lands while its beat copy is fully visible, then holds the new
 * shape until the next step.
 */
export const MORPH_WINDOWS: [number, number][] = [
  // Morph early–mid in each numbered step, then HOLD the settled shape for the
  // rest of that beat (and the gap before the next morph).
  [0.31842, 0.35163], // 01 Connect — hub + satellites assemble
  [0.40406, 0.43639], // 02 Learn  — the book opens
  [0.52639, 0.55872], // 03 Skills — the bulb lights
  [0.633, 0.66795], // 04 Ask    — the question forms
  [0.74659, 0.78591], // 05 Answer — the chart draws itself
  [0.88203, 0.92136], // 06 Private — the treasury seals inside the ring
];

// Per-formation ambient jitter — icons stay crisp (low), chaos breathes.
export const JITTER = [1.0, 0.08, 0.05, 0.06, 0.05, 0.07, 0.08];

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
