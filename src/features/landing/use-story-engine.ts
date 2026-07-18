"use client";

import { type RefObject, useEffect } from "react";

import { DB_CLUSTERS, type ClusterIndex } from "./story-cards";

interface CardRef {
  el: HTMLDivElement;
  cl: ClusterIndex;
  seed: number;
  hx: number;
  hy: number;
}

interface StoryEngineRefs {
  storyRef: RefObject<HTMLElement | null>;
  canvasRef: RefObject<HTMLCanvasElement | null>;
  cardRefs: RefObject<(HTMLDivElement | null)[]>;
  cardCls: ClusterIndex[];
  statementRefs: RefObject<(HTMLDivElement | null)[]>;
  typedRef: RefObject<HTMLSpanElement | null>;
  bigNumRef: RefObject<HTMLSpanElement | null>;
  cueRef: RefObject<HTMLDivElement | null>;
}

const QUESTIONS = [
  "Which regions are at highest renewal risk?",
  "¿Qué clientes tienen mayor riesgo de churn?",
  "解約リスクが最も高い地域はどこですか？",
  "Quels sont nos 5 plus gros clients ?",
  "Welche Region wächst am schnellsten?",
  "哪个地区的续约风险最高？",
  "ما هي أكثر المناطق عرضة للخطر؟",
  "Quais produtos venderam mais este trimestre?",
  "이번 분기 최고 매출 고객은 누구인가요?",
];

// Fraction of each quarter-of-storyT (chaos→connect, connect→ask, ask→answer,
// answer→private) that holds the *previous* shape static before morphing into
// the next one over the remainder. This is what actually gives each formation
// (the connect hub, the ask bubbles, the chart grid, the shield) a real dwell
// where nothing is moving — see the `u` calculation in draw() below.
const QUARTER_HOLD_FRAC = 0.65;

// Statement visibility windows over story progress t ∈ [0,1], hand-aligned to
// the *held* (static) portion of the matching particle formation computed
// above: quarter k's hold spans [k/4, k/4 + QUARTER_HOLD_FRAC/4], e.g. the
// connect hub holds from 0.25 to 0.4125. Text fades in just before its shape
// finishes settling and fades out just before that shape starts breaking up
// again, so the headline is never shown crossfading over still-moving dots.
const WINS: [number, number][] = [
  [0.0, 0.16],
  [0.21, 0.41],
  [0.46, 0.66],
  [0.71, 0.91],
  [0.92, 1.17],
];

// Reserve this fraction of the section's scrollable range as a dead-scroll
// pause once the story fully resolves, so the transition into the next page
// section never happens right as the last statement is still settling. Kept
// short — the shield + "05 · Private" text both stay fully visible for the
// whole pause (WINS[4]'s upper bound is comfortably past 1 so the clamped
// t=1 sits inside its plateau, not its fade-out — see trap()).
const END_PAUSE_VH_MULTIPLE = 0.5;

// Fixed clearance below the fixed nav bar (~64px tall, see landing.module.css
// .navFixed) so procedurally positioned dot formations never render
// underneath/behind it, regardless of viewport height.
const NAV_CLEARANCE_PX = 96;

// Must match `.stmt`'s CSS padding-bottom (5vh) in story-scroll.module.css —
// every phase's bottom-anchored text block starts this far above the true
// viewport bottom, regardless of viewport size.
const STMT_BOTTOM_GAP_VH = 0.05;
// Minimum breathing room between a formation's lowest point and the actual
// (measured) top of its statement text block. Ask/chart-grid/shield
// formations stay above `measured text top - this gap`, computed per-phase
// from each statement's real rendered height (see textTopFor in layout())
// rather than a guessed fraction of viewport height — so formations can
// never crowd or overlap the copy below them, at any viewport size or font.
const FORMATION_TEXT_GAP_PX = 28;

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const rnd = (a: number, b: number) => a + Math.random() * (b - a);
const ease = (u: number) => (u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2);
// The shield (S4) formation's vertical center, kept high enough to clear the
// bottom-anchored "05 Private" text below it (zoneBottom, measured in
// layout() from the actual text block height). Pure function so both the
// dot-cloud layout and the canvas outline draw agree on the same center.
const shieldCenterY = (H: number, zoneBottom: number): number => {
  const outlineH = Math.min(330, H * 0.42) + 44;
  const naturalCy = H / 2 - H * 0.06;
  const maxCy = zoneBottom - outlineH / 2;
  return Math.min(naturalCy, maxCy);
};
const trap = (t: number, a: number, b: number) => {
  const f = 0.05;
  if (t < a || t > b) return 0;
  if (t < a + f) return a <= 0 ? 1 : (t - a) / f;
  if (t > b - f) return (b - t) / f;
  return 1;
};
const hexA = (hex: string, a: number) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
};

/**
 * Ports the chaos→order canvas particle story from the design prototype.
 * Runs as a single imperative rAF loop writing directly to canvas + card
 * transform/opacity — matching the source's direct-DOM-write approach
 * rather than driving 900 particles through React state.
 */
export function useStoryEngine(refs: StoryEngineRefs, accent: string, motion: "cinematic" | "subtle") {
  useEffect(() => {
    const story = refs.storyRef.current;
    const cvs = refs.canvasRef.current;
    if (!story || !cvs) return;
    const ctx = cvs.getContext("2d");
    if (!ctx) return;

    const N = motion === "subtle" ? 400 : 900;
    let W = 0;
    let H = 0;
    let dpr = 1;

    const targets: [number, number][][] = [[], [], [], [], []];
    let clusters: { n: string; c: string; x: number; y: number }[] = [];
    let hub = { x: 0, y: 0 };
    let chartCells: { x: number; y: number; w: number; h: number; label: string }[] = [];
    // Shield's text-clearance boundary, recomputed in layout() and read by
    // draw() (which calls shieldCenterY every frame) — see textTopFor below.
    let shieldZoneBottom = 0;

    const cardEls = (refs.cardRefs.current || []).filter((el): el is HTMLDivElement => el != null);
    const cards: CardRef[] = cardEls.map((el, i) => ({
      el,
      cl: refs.cardCls[i] ?? 0,
      seed: Math.random() * 10,
      hx: 0,
      hy: 0,
    }));

    interface Particle {
      seed: number;
      size: number;
      rot: number;
      fw: number;
      err: boolean;
      dash: boolean;
      cl: number;
      b2?: boolean;
    }
    const P: Particle[] = [];
    for (let i = 0; i < N; i++) {
      P.push({
        seed: Math.random() * 1000,
        size: 9 + Math.random() * 4.5,
        rot: (Math.random() - 0.5) * 0.5,
        fw: Math.random() < 0.3 ? 500 : 400,
        err: Math.random() < 0.09,
        dash: Math.random() < 0.14,
        cl: -1,
      });
    }

    const layout = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = cvs.clientWidth;
      H = cvs.clientHeight;
      cvs.width = W * dpr;
      cvs.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const cx = W / 2;
      const cy = H / 2;

      // Real top edge of statement `idx`'s text block (its `.stmtInner`
      // child, measured live so it tracks the current viewport's font
      // clamps), independent of the element's current opacity/visibility.
      const textTopFor = (idx: number): number => {
        const el = (refs.statementRefs.current || [])[idx];
        const inner = el?.firstElementChild as HTMLElement | null;
        const h = inner ? inner.getBoundingClientRect().height : 0;
        return H - H * STMT_BOTTOM_GAP_VH - h;
      };

      // 0 chaos — everywhere
      for (let i = 0; i < N; i++) targets[0][i] = [rnd(0, W), rnd(0, H)];

      // 1 connect — labeled database clusters plugging into a central hub
      const scy1 = cy - H * 0.06;
      const CR = Math.min(W, H) * 0.3;
      clusters = DB_CLUSTERS.map((d, b) => {
        const a = -Math.PI / 2 + b * ((Math.PI * 2) / 5);
        return { n: d.name, c: d.color, x: cx + Math.cos(a) * CR * 1.25, y: scy1 + Math.sin(a) * CR * 0.62 };
      });
      hub = { x: cx, y: scy1 };
      for (let i = 0; i < N; i++) {
        const p = P[i];
        p.cl = i % 5;
        const cl = clusters[p.cl];
        const a = rnd(0, Math.PI * 2);
        const r = 44 * Math.sqrt(Math.random());
        targets[1][i] = [cl.x + Math.cos(a) * r, cl.y + Math.sin(a) * r];
      }

      // 2 ask — a conversation: question bubble + answer bubble, drawn in dots.
      // bh1 and the vertical center are derived from the clear band between the
      // fixed nav and the "03 Ask" statement text below (not a fixed H
      // fraction), so the answer bubble never renders underneath that text.
      const askZoneH = Math.max(0, textTopFor(2) - FORMATION_TEXT_GAP_PX - NAV_CLEARANCE_PX);
      const bw1 = Math.min(520, W * 0.5);
      const bh1 = Math.min(200, askZoneH / 1.97);
      // The two bubbles span ~1.97·bh1 vertically (top edge at scy2 − 1.12·bh1,
      // bottom edge at scy2 + 0.85·bh1). Center that block in the ask zone the
      // same way the chart grid centers itself, so on tall viewports the
      // formation sits in the middle instead of clinging under the nav. On short
      // viewports (bh1 capped by the zone) the offset collapses to 0.
      const askFormationH = bh1 * 1.97;
      const scy2 = NAV_CLEARANCE_PX + Math.max(0, (askZoneH - askFormationH) / 2) + bh1 * 1.12;
      const b1x = cx - Math.min(80, W * 0.07);
      const b1y = scy2 - bh1 * 0.62;
      const bw2 = bw1 * 0.66;
      const bh2 = bh1 * 0.6;
      const b2x = cx + Math.min(140, W * 0.13);
      const b2y = scy2 + bh1 * 0.55;
      const bubble = (
        frac: number,
        bx: number,
        by: number,
        w: number,
        h: number,
        lines: number,
        tail: number
      ): [number, number] => {
        if (frac < 0.52) {
          const t = (frac / 0.52) % 1;
          const pp = t * 2 * (w + h);
          let dx: number;
          let dy: number;
          if (pp < w) {
            dx = pp - w / 2;
            dy = -h / 2;
          } else if (pp < w + h) {
            dx = w / 2;
            dy = pp - w - h / 2;
          } else if (pp < 2 * w + h) {
            dx = w / 2 - (pp - w - h);
            dy = h / 2;
          } else {
            dx = -w / 2;
            dy = h / 2 - (pp - 2 * w - h);
          }
          return [bx + dx, by + dy];
        }
        if (frac < 0.58) {
          const tt = (frac - 0.52) / 0.06;
          const sx = tail > 0 ? bx + w / 2 - 46 + tt * 26 : bx - w / 2 + 46 - tt * 26;
          return [sx + rnd(-2, 2), by + h / 2 + tt * 24];
        }
        const li = Math.floor(((frac - 0.58) / 0.42) * lines);
        const lw = (li === lines - 1 ? 0.55 : 0.86) * (w - 56);
        return [bx - w / 2 + 28 + rnd(0, lw), by - h / 2 + (h / (lines + 1)) * (li + 1) + rnd(-1.5, 1.5)];
      };
      for (let i = 0; i < N; i++) {
        const p = P[i];
        p.b2 = i % 7 < 3;
        const fr = (i * 0.618033988) % 1;
        targets[2][i] = p.b2 ? bubble(fr, b2x, b2y, bw2, bh2, 2, 1) : bubble(fr, b1x, b1y, bw1, bh1, 3, 0);
      }

      // 3 charts — a grid of chart types built from dots.
      // Sized to the clear band between the fixed nav and the "04 Answer"
      // statement text below, so the grid's top row never renders underneath
      // the nav and its bottom row never crowds the headline below it.
      const gW = Math.min(920, W * 0.86);
      const chartZoneBottom = textTopFor(3) - FORMATION_TEXT_GAP_PX;
      const gH = Math.max(200, Math.min(480, chartZoneBottom - NAV_CLEARANCE_PX));
      const gx0 = cx - gW / 2;
      const gy0 = NAV_CLEARANCE_PX + Math.max(0, chartZoneBottom - NAV_CLEARANCE_PX - gH) / 2;
      chartCells = [];
      const kinds = ["bar", "line", "area", "donut", "scatter", "violin"];
      const CHART_COLS = 4;
      const CHART_ROWS = 4;
      const CHART_N = CHART_COLS * CHART_ROWS; // 16 small chart tiles, cycling through 6 chart kinds
      const cw4 = gW / CHART_COLS;
      const ch4 = gH / CHART_ROWS;
      for (let b = 0; b < CHART_N; b++) {
        chartCells.push({
          x: gx0 + (b % CHART_COLS) * cw4 + 6,
          y: gy0 + Math.floor(b / CHART_COLS) * ch4 + 6,
          w: cw4 - 12,
          h: ch4 - 12,
          label: kinds[b % kinds.length],
        });
      }
      const chartPt = (b: number): [number, number] => {
        const c = chartCells[b];
        const kind = b % kinds.length;
        const px = c.x + 10;
        const pw = c.w - 20;
        const pb = c.y + c.h - 16;
        const ph = c.h - 32;
        if (kind === 0) {
          const k = Math.floor(rnd(0, 4));
          const hh = [0.45, 0.7, 0.55, 0.95][k];
          return [px + (k + 0.18 + rnd(0, 0.64)) * (pw / 4), pb - rnd(0, hh * ph)];
        }
        if (kind === 1) {
          const t = Math.random();
          return [px + t * pw, pb - ph * (0.25 + 0.3 * t + 0.22 * Math.sin(t * 6.5)) + rnd(-2.5, 2.5)];
        }
        if (kind === 2) {
          const t = Math.random();
          const top = ph * (0.3 + 0.42 * t + 0.16 * Math.sin(t * 5));
          return [px + t * pw, pb - rnd(0, top)];
        }
        if (kind === 3) {
          const a = rnd(0, Math.PI * 2);
          const R = Math.min(pw, ph) * 0.42;
          const rr = R * (0.62 + rnd(0, 0.34));
          return [c.x + c.w / 2 + Math.cos(a) * rr, c.y + c.h / 2 - 4 + Math.sin(a) * rr * 0.92];
        }
        if (kind === 4) {
          const t = Math.random();
          const yy = Math.max(0.04, Math.min(0.95, 0.15 + 0.55 * t + rnd(-0.16, 0.16)));
          return [px + t * pw, pb - yy * ph];
        }
        const yy = Math.random();
        const wv =
          Math.exp(-Math.pow(yy - 0.32, 2) / 0.03) + 0.75 * Math.exp(-Math.pow(yy - 0.74, 2) / 0.022);
        return [c.x + c.w / 2 + rnd(-1, 1) * wv * pw * 0.22, pb - yy * ph];
      };
      for (let i = 0; i < N; i++) targets[3][i] = chartPt(i % CHART_N);

      // 4 shield — double rounded-rect perimeter + sparse interior grid
      shieldZoneBottom = textTopFor(4) - FORMATION_TEXT_GAP_PX;
      const sw = Math.min(560, W * 0.6);
      const sh = Math.min(330, H * 0.42);
      const perim = 2 * (sw + sh);
      void perim;
      const nPer = Math.floor(N * 0.62);
      const onRect = (t: number, w: number, h: number): [number, number] => {
        const p = t * 2 * (w + h);
        if (p < w) return [p - w / 2, -h / 2];
        if (p < w + h) return [w / 2, p - w - h / 2];
        if (p < 2 * w + h) return [w / 2 - (p - w - h), h / 2];
        return [-w / 2, h / 2 - (p - 2 * w - h)];
      };
      for (let i = 0; i < N; i++) {
        const scy = shieldCenterY(H, shieldZoneBottom);
        if (i < nPer) {
          const ring = i % 2;
          const [dx, dy] = onRect((i / nPer + ring * 0.011) % 1, sw + ring * 22, sh + ring * 22);
          targets[4][i] = [cx + dx, scy + dy];
        } else {
          const k = i - nPer;
          const cols2 = 16;
          const rows2 = Math.ceil((N - nPer) / cols2);
          const c = k % cols2;
          const r = Math.floor(k / cols2);
          targets[4][i] = [
            cx - sw / 2 + 40 + (c + 0.5) * ((sw - 80) / cols2),
            scy - sh / 2 + 34 + (r + 0.5) * ((sh - 68) / rows2),
          ];
        }
      }

      cards.forEach((c) => {
        c.hx = c.el.offsetLeft + c.el.offsetWidth / 2;
        c.hy = c.el.offsetTop + c.el.offsetHeight / 2;
      });
    };
    layout();

    // mouse repulsion (chaos phases only)
    let mx = -9999;
    let my = -9999;
    const onMove = (e: MouseEvent) => {
      const r = cvs.getBoundingClientRect();
      mx = e.clientX - r.left;
      my = e.clientY - r.top;
    };
    window.addEventListener("mousemove", onMove, { passive: true });

    const stmts = (refs.statementRefs.current || []).filter((el): el is HTMLDivElement => el != null);
    const cue = refs.cueRef.current;
    const typedEl = refs.typedRef.current;
    const bigEl = refs.bigNumRef.current;

    let storyT = 0;
    let inView = true;
    let time = 0;
    const readScroll = () => {
      const r = story.getBoundingClientRect();
      const vh = window.innerHeight;
      inView = r.top < vh && r.bottom > 0;
      const totalScroll = story.offsetHeight - vh;
      // Map t=1 to before the end of the scrollable range, leaving a real
      // dead-scroll pause (holding the fully-resolved final frame) before the
      // sticky stage releases into the next page section.
      const activeScroll = Math.max(totalScroll - vh * END_PAUSE_VH_MULTIPLE, 1);
      storyT = clamp(-r.top / activeScroll, 0, 1);
    };

    let rafId = 0;
    let alive = true;
    const draw = () => {
      if (!alive) return;
      rafId = requestAnimationFrame(draw);
      if (!inView) return;
      time += 0.016;
      ctx.clearRect(0, 0, W, H);

      const seg = clamp(storyT * 4, 0, 3.999);
      const k = Math.floor(seg);
      // Each quarter holds its starting shape static for the first
      // QUARTER_HOLD_FRAC of its span, then morphs into the next shape over
      // the remainder — instead of continuously morphing the whole quarter —
      // so every settled formation (connect hub, ask bubbles, chart grid,
      // shield) gets a real dwell where nothing is moving, not just an
      // instant at the exact quarter boundary.
      const localSeg = seg - k;
      const u = localSeg < QUARTER_HOLD_FRAC ? 0 : ease((localSeg - QUARTER_HOLD_FRAC) / (1 - QUARTER_HOLD_FRAC));
      const order = seg / 4;
      const jitterAmp = (1 - order) * (motion === "subtle" ? 5 : 18) + 0.6;
      const acc = accent;
      // Overlay "presence" for the network-hub (w1), ask-bubble accenting (w2),
      // and chart-grid (w3) decorations. Reuses trap()'s rise/plateau/fall
      // shape so these track the *hold* windows above (rise as the previous
      // quarter's transition finishes, hold through this shape's dwell, fall
      // as the next quarter's transition begins) instead of the old smooth
      // seg-centered bump, which used to fade decorations in/out mid-hold —
      // e.g. chart-grid boxes appearing while dots were still visually the
      // static ask-bubble formation.
      const w1 = trap(storyT, 0.18, 0.47);
      const w2 = trap(storyT, 0.43, 0.72);
      const w3 = trap(storyT, 0.68, 0.97);
      // Clears space behind the hero headline while chaos is held, then
      // releases as chaos starts morphing into the connect hub.
      const exF = 1 - clamp((storyT - QUARTER_HOLD_FRAC * 0.25) / (0.25 - QUARTER_HOLD_FRAC * 0.25), 0, 1);
      const exRx = Math.min(W * 0.37, 660);
      const exRy = Math.min(H * 0.34, 380);
      const exX = W / 2;
      const exY = H / 2;

      for (let i = 0; i < N; i++) {
        const p = P[i];
        const A = targets[k][i];
        const B = targets[k + 1][i];
        let x = A[0] + (B[0] - A[0]) * u;
        let y = A[1] + (B[1] - A[1]) * u;
        x += Math.sin(time * 0.7 + p.seed) * jitterAmp;
        y += Math.cos(time * 0.9 + p.seed * 1.7) * jitterAmp;
        if (exF > 0) {
          const ddx = (x - exX) / exRx;
          const ddy = (y - exY) / exRy;
          const q = ddx * ddx + ddy * ddy;
          if (q < 1) {
            const s2 = q > 0.0004 ? 1 / Math.sqrt(q) : 50;
            x += (exX + (x - exX) * s2 - x) * exF;
            y += (exY + (y - exY) * s2 - y) * exF;
          }
        }
        if (seg < 1.4) {
          const dx = x - mx;
          const dy = y - my;
          const d2 = dx * dx + dy * dy;
          if (d2 < 16900 && d2 > 1) {
            const d = Math.sqrt(d2);
            const f = ((130 - d) / 130) * 34 * (1.4 - seg);
            x += (dx / d) * f;
            y += (dy / d) * f;
          }
        }
        const mix = clamp(order * 1.3 + (p.seed % 1) * 0.15 - 0.07, 0, 1);
        const alpha = 0.35 + mix * 0.5;
        if (p.dash && order < 0.35) {
          ctx.fillStyle = hexA("#9fb2c8", 0.55 * (1 - order / 0.35));
          ctx.fillRect(x - 4, y - 0.75, 8, 1.5);
          continue;
        }
        if (w1 > 0.35 && p.cl >= 0) {
          ctx.fillStyle = hexA(clusters[p.cl].c, 0.35 + 0.55 * w1);
        } else if (w2 > 0.4 && p.b2) {
          ctx.fillStyle = hexA(acc, 0.35 + 0.55 * w2);
        } else if (p.err && seg < 1.2) {
          ctx.fillStyle = hexA("#b91c1c", 0.4 * (1.2 - seg));
        } else {
          ctx.fillStyle = mix > 0.55 ? hexA(acc, alpha) : hexA("#73849a", alpha);
        }
        const s = 1.6 + mix * 1.2;
        ctx.fillRect(x - s / 2, y - s / 2, s, s);
      }

      // hero file/chart cards fly into their database clusters
      const ct = ease(clamp(seg / 0.95, 0, 1));
      const cRx = exRx * 1.28;
      const cRy = exRy * 1.52;
      cards.forEach((c) => {
        const cl = clusters[c.cl] || hub;
        const bob = (1 - ct) * Math.sin(time * 0.8 + c.seed) * 6;
        const op = clamp(1 - (ct - 0.55) / 0.35, 0, 1);
        let px2 = 0;
        let py2 = 0;
        if (exF > 0) {
          const ddx = (c.hx - exX) / cRx;
          const ddy = (c.hy - exY) / cRy;
          const q = Math.sqrt(ddx * ddx + ddy * ddy);
          if (q < 1 && q > 0.001) {
            const s2 = Math.max(q, 0.25);
            px2 = ((c.hx - exX) / s2 - (c.hx - exX)) * exF * (1 - ct);
            py2 = ((c.hy - exY) / s2 - (c.hy - exY)) * exF * (1 - ct);
          }
        }
        c.el.style.transform = `translate(${(cl.x - c.hx) * ct + px2}px,${(cl.y - c.hy) * ct + py2 + bob}px) scale(${1 - 0.94 * ct})`;
        c.el.style.opacity = String(op);
        c.el.style.visibility = op > 0.01 ? "visible" : "hidden";
        c.el.style.pointerEvents = ct < 0.05 ? "auto" : "none";
      });

      if (w3 > 0.03 && chartCells.length) {
        ctx.lineWidth = 1;
        chartCells.forEach((cell) => {
          ctx.strokeStyle = hexA("#c5d0de", 0.85 * w3);
          ctx.beginPath();
          if (ctx.roundRect) ctx.roundRect(cell.x, cell.y, cell.w, cell.h, 12);
          else ctx.rect(cell.x, cell.y, cell.w, cell.h);
          ctx.stroke();
          ctx.font = '10.5px "IBM Plex Mono", monospace';
          ctx.fillStyle = hexA("#73849a", 0.95 * w3);
          ctx.fillText(cell.label, cell.x + 12, cell.y + 18);
        });
      }

      if (w1 > 0.02 && clusters.length) {
        ctx.textAlign = "center";
        clusters.forEach((cl) => {
          ctx.strokeStyle = hexA(cl.c, 0.55 * w1);
          ctx.lineWidth = 1.5;
          ctx.setLineDash([6, 6]);
          ctx.lineDashOffset = -time * 34;
          ctx.beginPath();
          ctx.moveTo(cl.x, cl.y);
          ctx.lineTo(hub.x, hub.y);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.beginPath();
          ctx.arc(cl.x, cl.y, 4, 0, 7);
          ctx.fillStyle = hexA(cl.c, w1);
          ctx.fill();
          ctx.font = '500 12px "IBM Plex Mono", monospace';
          ctx.fillStyle = hexA("#334155", 0.95 * w1);
          ctx.fillText(cl.n, cl.x, cl.y + 62);
        });
        ctx.beginPath();
        ctx.arc(hub.x, hub.y, 58, 0, 7);
        ctx.fillStyle = hexA("#f4f7fb", 0.94 * w1);
        ctx.fill();
        ctx.strokeStyle = hexA(acc, 0.9 * w1);
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.font = '500 14px "IBM Plex Mono", monospace';
        ctx.fillStyle = hexA("#0c1a2b", w1);
        ctx.fillText("Dataverse", hub.x, hub.y + 5);
        ctx.textAlign = "left";
      }

      // Shield outline only starts drawing once the shield actually begins
      // forming (the transition portion of the last quarter), not merely
      // once storyT passes an arbitrary threshold — otherwise it appears
      // while the chart grid is still being held, well before the dots
      // start moving toward it.
      const shieldStart = 3 / 4 + QUARTER_HOLD_FRAC / 4;
      if (storyT > shieldStart) {
        const a = clamp((storyT - shieldStart) / (1 - shieldStart), 0, 1);
        const cx = W / 2;
        const cy = shieldCenterY(H, shieldZoneBottom);
        const sw = Math.min(560, W * 0.6) + 44;
        const sh = Math.min(330, H * 0.42) + 44;
        ctx.strokeStyle = hexA(acc, 0.55 * a);
        ctx.lineWidth = 1.5;
        ctx.setLineDash([7, 7]);
        ctx.lineDashOffset = -time * 24;
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(cx - sw / 2, cy - sh / 2, sw, sh, 26);
        else ctx.rect(cx - sw / 2, cy - sh / 2, sw, sh);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      stmts.forEach((el, i) => {
        const o = trap(storyT, WINS[i][0], WINS[i][1]);
        el.style.opacity = String(o);
        el.style.visibility = o > 0.01 ? "visible" : "hidden";
      });
      if (cue) cue.style.opacity = storyT < 0.03 && H >= 640 ? "1" : "0";
      if (typedEl) {
        const vis2 = trap(storyT, WINS[2][0], WINS[2][1]) > 0.05;
        if (vis2) {
          const cyc = 3.8;
          const q = QUESTIONS[Math.floor(time / cyc) % QUESTIONS.length];
          const nch = Math.round(clamp(((time % cyc) / cyc) * 1.7, 0, 1) * q.length);
          const s = q.slice(0, nch);
          if (typedEl.textContent !== s) typedEl.textContent = s;
        }
      }
      if (bigEl) {
        const bt = clamp((storyT - 0.63) / 0.1, 0, 1);
        const v = (2.41 * (1 - Math.pow(1 - bt, 3))).toFixed(2);
        if (bigEl.textContent !== v) bigEl.textContent = v;
      }
    };

    const onScroll = () => readScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    const onResize = () => {
      layout();
      readScroll();
    };
    window.addEventListener("resize", onResize);
    readScroll();
    draw();

    return () => {
      alive = false;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(rafId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
