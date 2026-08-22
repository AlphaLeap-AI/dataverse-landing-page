"use client";

import { useEffect, useRef, useState } from "react";

import styles from "./intro.module.css";

/* ============================================================
   DATAVERSE INTRO — "Streams converge, then the mark docks"
   A spark at the hub sends emissaries along four streams, the
   data dots light up, the data flows home, the body of the mark
   is drawn and ignites, the word lands — the piece holds a beat,
   then the mark shrinks away to its seat in the top-left nav and
   the page fades in around it.

   Every animated value is a pure function of one master clock,
   so skip / reduced-motion / freeze-frames share one code path.
   Click, Esc, Space or Enter skips to the handoff at any time.
   ============================================================ */

/* ---------- geometry (viewBox 460×460, traced from the mark) ---------- */
const BODY_D = "M201.2 150 A112 112 0 1 1 201.2 294 L252 222 Z";
const BODY_C = { x: 287, y: 222 };
const EYE = { cx: 337, cy: 197, r: 9 };
const HEART = { x: 218, y: 222 };           /* the spark inside the intake */

const STREAMS = [
  { d: "M220 212 C 190 168 152 126 122 112", dot: 0 },
  { d: "M218 218 C 190 206 164 196 141 188", dot: 2 },
  { d: "M216 228 C 175 234 132 231 97 227", dot: 3 },
  { d: "M220 234 C 190 278 154 312 121 336", dot: 6 },
];

/* cx, cy, r, and which stream (if any) lands on this dot */
const DOTS = [
  { cx: 122, cy: 112, r: 13, stream: 0 },
  { cx: 86, cy: 163, r: 8, stream: -1 },
  { cx: 141, cy: 188, r: 10, stream: 1 },
  { cx: 97, cy: 227, r: 15, stream: 2 },
  { cx: 135, cy: 272, r: 9, stream: -1 },
  { cx: 87, cy: 291, r: 7, stream: -1 },
  { cx: 121, cy: 336, r: 13, stream: 3 },
  { cx: 48, cy: 219, r: 5, stream: -1 },
  { cx: 62, cy: 262, r: 3.5, stream: -1 },
  { cx: 54, cy: 180, r: 3, stream: -1 },
];

const WORD = "Dataverse";
const CAPTION = "ENTERPRISE DATA AGENT";

/* ---------- the score — every beat in one table (seconds) ---------- */
const T = {
  burst: 0.24,            /* the heart lets go                     */
  stagger: 0.06,          /* between emissary launches             */
  ingest0: 1.0,           /* data starts flowing home              */
  ingestStagger: 0.07,
  ingestDur: 0.48,
  bodyT0: 1.18, bodyDur: 0.5,   /* the outline sweep           */
  fillT0: 1.34, fillDur: 0.4,   /* the blue washes in          */
  eyeT: 1.56,                   /* the eye opens               */
  ign: 1.66,                    /* ignition: flash + ring      */
  wordT0: 1.5, wordStagger: 0.032,
  capT0: 1.9,
  /* ---- the hold, then the docking ---- */
  holdEnd: 2.85,          /* the finished mark rests on screen     */
  wordOut0: 2.85, wordOutDur: 0.3,  /* the word bows out       */
  flight0: 3.05, flightDur: 0.75,   /* the flight to the nav   */
  bgFade0: 3.1, bgFadeDur: 0.55,    /* the page comes up under it */
  navIn: 3.6,             /* the nav bar fades in around the mark  */
  handoff0: 3.6, handoffDur: 0.2,   /* cross-fade to the nav's own logo */
  gone: 3.9,              /* unmount                               */
};

/* ---------- easing ---------- */
const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const lerp = (a: number, b: number, m: number) => a + (b - a) * m;
const smooth = (v: number) => {
  v = clamp01(v);
  return v * v * (3 - 2 * v);
};
const outCubic = (v: number) => {
  v = clamp01(v);
  const u = 1 - v;
  return 1 - u * u * u;
};
const inOutCubic = (v: number) => {
  v = clamp01(v);
  return v < 0.5 ? 4 * v * v * v : 1 - Math.pow(-2 * v + 2, 3) / 2;
};
const inCubic = (v: number) => {
  v = clamp01(v);
  return v * v * v;
};
const outExpo = (v: number) => {
  v = clamp01(v);
  return v >= 1 ? 1 : 1 - Math.pow(2, -10 * v);
};
const outBack = (v: number) => {
  v = clamp01(v);
  const c1 = 1.5;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(v - 1, 3) + c1 * Math.pow(v - 1, 2);
};
const gauss = (x: number, s: number) => Math.exp(-(x * x) / (2 * s * s));
const h1 = (n: number) => {
  const s = Math.sin(n * 127.1) * 43758.5453;
  return s - Math.floor(s);
};

/* faint starfield, hand-scattered */
const STARS: { x: number; y: number; s: number; d: number }[] = [
  { x: 8, y: 14, s: 2, d: 0.0 }, { x: 16, y: 72, s: 1.6, d: 0.7 },
  { x: 24, y: 34, s: 1.2, d: 1.9 }, { x: 33, y: 88, s: 2.2, d: 1.1 },
  { x: 44, y: 10, s: 1.4, d: 2.6 }, { x: 58, y: 84, s: 1.8, d: 0.4 },
  { x: 66, y: 16, s: 2, d: 1.5 }, { x: 74, y: 62, s: 1.3, d: 2.2 },
  { x: 82, y: 30, s: 2.4, d: 0.9 }, { x: 90, y: 76, s: 1.5, d: 2.9 },
  { x: 93, y: 12, s: 1.2, d: 1.7 }, { x: 12, y: 48, s: 1.1, d: 2.4 },
  { x: 50, y: 55, s: 1, d: 0.2 }, { x: 87, y: 47, s: 1.4, d: 1.3 },
];

const SEEN_KEY = "dv-intro-seen";

export function Intro() {
  const [gone, setGone] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const skipRef = useRef<() => void>(() => {});

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    /* Debug hooks for stills: ?intro=off · ?intro=live · ?intro=<seconds> */
    const params = new URLSearchParams(window.location.search);
    const q = params.get("intro");
    if (q === "off") {
      setGone(true);
      return;
    }
    const frozen =
      q !== null && q !== "live" && !Number.isNaN(parseFloat(q))
        ? Math.max(0, parseFloat(q))
        : null;

    let alreadySeen = false;
    try {
      alreadySeen = sessionStorage.getItem(SEEN_KEY) === "1";
    } catch {
      /* private mode — always play */
    }
    if (alreadySeen && q === null) {
      setGone(true);
      return;
    }

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    /* ---------- collect the cast ---------- */
    const q$ = <E extends Element = SVGElement>(sel: string) =>
      root.querySelector(sel) as unknown as E;
    const veil = q$<HTMLDivElement>("[data-veil]");
    const stage = q$<HTMLDivElement>("[data-stage]");
    const svgWrap = q$<HTMLDivElement>("[data-svgwrap]");
    const svgEl = q$<SVGSVGElement>("[data-svg]");
    const markG = q$<SVGGElement>("[data-mark]");
    const skipBtn = q$<HTMLButtonElement>("[data-skip]");
    const streamMain = STREAMS.map((_, i) => q$<SVGPathElement>(`[data-s="${i}"]`));
    const streamGlow = STREAMS.map((_, i) => q$<SVGPathElement>(`[data-sg="${i}"]`));
    const dotEls = DOTS.map((_, i) => q$<SVGCircleElement>(`[data-d="${i}"]`));
    const cores = STREAMS.map((_, i) => q$<SVGCircleElement>(`[data-core="${i}"]`));
    const halos = STREAMS.map((_, i) => q$<SVGCircleElement>(`[data-chalo="${i}"]`));
    const heart = q$<SVGCircleElement>("[data-heart]");
    const heartHalo = q$<SVGCircleElement>("[data-hheart]");
    const bStroke = q$<SVGPathElement>("[data-bstroke]");
    const bFill = q$<SVGPathElement>("[data-bfill]");
    const bSheen = q$<SVGPathElement>("[data-bsheen]");
    const bGlow = q$<SVGPathElement>("[data-bglow]");
    const bCore = q$<SVGCircleElement>("[data-bcore]");
    const bCoreHalo = q$<SVGCircleElement>("[data-bhalo]");
    const eye = q$<SVGCircleElement>("[data-eye]");
    const ring = q$<SVGCircleElement>("[data-ring]");
    const flash = q$<SVGCircleElement>("[data-flash]");
    const embers = Array.from({ length: 12 }, (_, i) =>
      q$<SVGCircleElement>(`[data-ember="${i}"]`)
    );
    const wordSpans = Array.from(root.querySelectorAll<HTMLSpanElement>("[data-w]"));
    const caption = q$<HTMLDivElement>("[data-cap]");

    const streamLen = streamMain.map((p) => p.getTotalLength());
    const bodyLen = bStroke.getTotalLength();

    /* per-stream timing, derived from length so curves of different
       reach still arrive as one chord */
    const flights = STREAMS.map((_, i) => {
      const launch = T.burst + i * T.stagger;
      const dur = 0.34 + streamLen[i] * 0.0016;
      return { launch, dur, arrive: launch + dur };
    });
    const ingests = STREAMS.map((_, i) => {
      const launch = T.ingest0 + i * T.ingestStagger;
      return { launch, arrive: launch + T.ingestDur };
    });

    const markSeen = () => {
      try {
        sessionStorage.setItem(SEEN_KEY, "1");
      } catch {
        /* ignore */
      }
    };

    /* ---------- the master clock ---------- */
    let t0 = performance.now();
    if (reduced) t0 -= 2000; /* start at the settled mark, hold, hand off */
    let raf = 0;
    let done = false;
    let hiddenAt: number | null = null;

    /* The nav keeps out of the piece until the mark comes home. */
    document.documentElement.dataset.intro = "play";
    let docked = false;

    /* ---------- the flight plan, measured just before take-off ---------- */
    let plan: {
      ox: number; oy: number;   /* transform origin, svgWrap-local px */
      dx: number; dy: number;   /* travel of the mark's centre        */
      s: number;                /* final scale                        */
    } | null = null;
    const measureFlight = () => {
      const target = document.querySelector("[data-brand-mark]");
      if (!target) return;
      const bb = markG.getBBox();                    /* viewBox units */
      const svgRect = svgEl.getBoundingClientRect();
      const k = svgRect.width / 460;                 /* px per unit   */
      const compCx = bb.x + bb.width / 2;
      const compCy = bb.y + bb.height / 2;
      const compCxPx = svgRect.left + compCx * k;    /* screen px     */
      const compCyPx = svgRect.top + compCy * k;
      const tr = target.getBoundingClientRect();
      /* the nav shows the whole composition cropped to its own viewBox
         (38 88 366 262) — compare composition heights for the scale */
      const targetScale = tr.height / ((262) * k);
      plan = {
        ox: compCx * k,
        oy: compCy * k,
        dx: tr.left + tr.width / 2 - compCxPx,
        dy: tr.top + tr.height / 2 - compCyPx,
        s: targetScale,
      };
      svgWrap.style.transformOrigin = plan.ox.toFixed(1) + "px " + plan.oy.toFixed(1) + "px";
    };

    const finish = () => {
      if (done) return;
      done = true;
      markSeen();
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("visibilitychange", onVis);
      document.documentElement.style.overflow = "";
      delete document.documentElement.dataset.intro;
      setGone(true);
    };

    skipRef.current = () => {
      if (done) return;
      if (frozen !== null) {
        finish();
        return;
      }
      markSeen();
      const t = (performance.now() - t0) / 1000;
      if (t < T.navIn) t0 = performance.now() - T.navIn * 1000; /* straight to the dock */
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === " " || e.key === "Enter") {
        e.preventDefault();
        skipRef.current();
      }
    };
    const onVis = () => {
      if (document.hidden) {
        hiddenAt = performance.now();
      } else if (hiddenAt !== null) {
        t0 += performance.now() - hiddenAt;
        hiddenAt = null;
      }
    };
    window.addEventListener("keydown", onKey);
    document.addEventListener("visibilitychange", onVis);
    document.documentElement.style.overflow = "hidden";

    /* ---------- one frame ---------- */
    const render = (t: number) => {
      /* — camera: a slow settle-in, a kick at ignition — */
      const cam = t < 1.6 ? lerp(0.93, 1, outCubic(t / 1.6)) : 1;
      const kick = 1 + 0.045 * gauss(t - (T.ign + 0.05), 0.11);
      stage.style.transform = "scale(" + (cam * kick).toFixed(4) + ")";

      /* — the veil: solid while the piece plays, lifts as the mark flies — */
      veil.style.opacity = String(1 - smooth((t - T.bgFade0) / T.bgFadeDur));
      skipBtn.style.opacity = String(
        0.6 * smooth((t - 0.8) / 0.3) * (1 - smooth((t - T.holdEnd) / 0.3))
      );

      /* — the docking flight — */
      const fU = clamp01((t - T.flight0) / T.flightDur);
      if (fU > 0 && !plan && !reduced) measureFlight();
      if (fU > 0 && plan && !reduced) {
        const e = inOutCubic(fU);
        const eS = inOutCubic(clamp01((fU - 0.12) / 0.88));
        const bow = Math.sin(Math.PI * e) * 34;
        const len = Math.hypot(plan.dx, plan.dy) || 1;
        const px = (-plan.dy / len) * bow;
        const py = (plan.dx / len) * bow;
        svgWrap.style.transform =
          "translate(" + (plan.dx * e + px).toFixed(1) + "px, " +
          (plan.dy * e + py).toFixed(1) + "px) scale(" +
          lerp(1, plan.s, eS).toFixed(4) + ")";
      }
      /* handoff: the nav fades in around the mark, the flying copy bows out */
      if (t >= T.navIn && !docked) {
        docked = true;
        document.documentElement.dataset.intro = "dock";
      }
      svgWrap.style.opacity = String(1 - smooth((t - T.handoff0) / T.handoffDur));

      /* — the heart: swell, burst, then a core that brightens as
             each returning stream feeds it — */
      const appear = outCubic(t / 0.22);
      const spend = t < T.burst ? 1 : Math.max(0, 1 - (t - T.burst) / 0.18);
      let hr = 4.5 * appear * spend + 3.2 * smooth((t - T.burst - 0.1) / 0.3);
      let hop = 0.92 * appear;
      let feed = 0;
      for (let i = 0; i < 4; i++) feed += gauss(t - ingests[i].arrive, 0.05);
      hr += 3.5 * feed;
      hop = Math.min(1, hop + 0.5 * feed);
      const steady = smooth((t - T.ign) / 0.4);
      /* a quiet pulse so the hold never feels frozen */
      const breathe = 1 + 0.16 * Math.sin(t * 2.3) * steady;
      hr = lerp(hr, 4, steady) * breathe;
      hop = lerp(hop, 0.5 + 0.1 * Math.sin(t * 2.3), steady);
      heart.setAttribute("r", Math.max(0.01, hr).toFixed(2));
      heart.style.opacity = hop.toFixed(3);
      heartHalo.setAttribute("r", Math.max(0.01, hr * 2.6).toFixed(2));
      heartHalo.style.opacity = (hop * 0.5).toFixed(3);

      /* — the four streams: an emissary rides out drawing the line,
             then the data rides home along it — */
      for (let i = 0; i < 4; i++) {
        const L = streamLen[i];
        const f = flights[i];
        const g = ingests[i];
        const main = streamMain[i];
        const glow = streamGlow[i];

        const u = clamp01((t - f.launch) / f.dur);
        const s = L * outCubic(u);
        const iu = clamp01((t - g.launch) / T.ingestDur);
        const drawn = u > 0 ? smooth(u * 10) : 0;
        const sOp = drawn * (0.95 - 0.35 * smooth((t - g.arrive) / 0.4));
        const dash = s.toFixed(1) + " " + (L + 4).toFixed(1);
        main.style.strokeDasharray = dash;
        main.style.opacity = sOp.toFixed(3);
        glow.style.strokeDasharray = dash;
        glow.style.opacity = (sOp * 0.55).toFixed(3);

        /* comet: outbound head, then inbound packet */
        let cOp = 0;
        let px = 0;
        let py = 0;
        if (u > 0 && u < 1) {
          const p = main.getPointAtLength(s);
          px = p.x;
          py = p.y;
          cOp = smooth(u * 12) * (1 - smooth((u - 0.9) / 0.1));
        } else if (iu > 0 && iu < 1) {
          const p = main.getPointAtLength(L * (1 - inCubic(iu)));
          px = p.x;
          py = p.y;
          cOp = smooth(iu * 8) * (1 - smooth((iu - 0.85) / 0.15));
        }
        cores[i].setAttribute("cx", px.toFixed(1));
        cores[i].setAttribute("cy", py.toFixed(1));
        cores[i].style.opacity = cOp.toFixed(3);
        halos[i].setAttribute("cx", px.toFixed(1));
        halos[i].setAttribute("cy", py.toFixed(1));
        halos[i].style.opacity = (cOp * 0.6).toFixed(3);
      }

      /* — the dots: connected ones pop when their emissary lands,
             free dots wake on their own lazy schedule — */
      DOTS.forEach((d, i) => {
        const a =
          d.stream >= 0
            ? flights[d.stream].arrive
            : 0.58 + (i % 4) * 0.08 + h1(i * 3.7) * 0.12;
        const u = clamp01((t - a) / 0.4);
        const tw = 1 + 0.05 * Math.sin(t * 2.1 + i * 1.7) * smooth((t - a - 0.4) / 0.4);
        const sc = Math.max(0.001, outBack(u) * tw);
        dotEls[i].setAttribute(
          "transform",
          "translate(" + d.cx + " " + d.cy + ") scale(" + sc.toFixed(3) +
            ") translate(" + -d.cx + " " + -d.cy + ")"
        );
        dotEls[i].style.opacity = smooth(u * 2.5).toFixed(3);
      });

      /* — embers: each landing emissary sheds a tiny burst — */
      for (let i = 0; i < 4; i++) {
        const dot = DOTS[STREAMS[i].dot];
        const age = t - flights[i].arrive;
        for (let k = 0; k < 3; k++) {
          const idx = i * 3 + k;
          const el = embers[idx];
          if (age > 0 && age < 0.55) {
            const ang = h1(idx * 3.1 + 0.7) * Math.PI * 2;
            const sp = 26 + h1(idx * 7.7) * 36;
            el.setAttribute("cx", (dot.cx + Math.cos(ang) * sp * age).toFixed(1));
            el.setAttribute("cy", (dot.cy + Math.sin(ang) * sp * age).toFixed(1));
            el.setAttribute("r", (1.1 + 1.6 * (1 - age / 0.55)).toFixed(2));
            el.style.opacity = (0.75 * (1 - age / 0.55)).toFixed(3);
          } else {
            el.style.opacity = "0";
          }
        }
      }

      /* — the body: outline sweep, blue wash, the eye opens — */
      const bu = clamp01((t - T.bodyT0) / T.bodyDur);
      const be = inOutCubic(bu);
      const fillU = smooth((t - T.fillT0) / T.fillDur);
      bStroke.style.strokeDasharray =
        (bodyLen * be).toFixed(1) + " " + (bodyLen + 4).toFixed(1);
      bStroke.style.opacity = bu > 0 ? (0.95 - 0.6 * fillU).toFixed(3) : "0";
      const bcOp =
        bu > 0 && bu < 1 ? smooth(bu * 10) * (1 - smooth((bu - 0.92) / 0.08)) : 0;
      if (bcOp > 0) {
        const p = bStroke.getPointAtLength(bodyLen * be);
        bCore.setAttribute("cx", p.x.toFixed(1));
        bCore.setAttribute("cy", p.y.toFixed(1));
        bCoreHalo.setAttribute("cx", p.x.toFixed(1));
        bCoreHalo.setAttribute("cy", p.y.toFixed(1));
      }
      bCore.style.opacity = bcOp.toFixed(3);
      bCoreHalo.style.opacity = (bcOp * 0.55).toFixed(3);
      bFill.style.opacity = fillU.toFixed(3);
      bSheen.style.opacity = (fillU * 0.9).toFixed(3);
      const ig = gauss(t - T.ign, 0.08);
      bGlow.style.opacity = (
        fillU * (0.4 + 0.45 * ig + 0.07 * Math.sin(t * 2.2) * steady)
      ).toFixed(3);

      const eu = clamp01((t - T.eyeT) / 0.35);
      const esc = Math.max(0.001, outBack(eu));
      eye.setAttribute(
        "transform",
        "translate(" + EYE.cx + " " + EYE.cy + ") scale(" + esc.toFixed(3) +
          ") translate(" + -EYE.cx + " " + -EYE.cy + ")"
      );
      eye.style.opacity = smooth(eu * 3).toFixed(3);

      /* — ignition: flash + a ring that runs off the mark — */
      flash.style.opacity = (0.6 * ig).toFixed(3);
      const ru = clamp01((t - (T.ign - 0.04)) / 0.5);
      ring.setAttribute("r", (88 + 150 * outCubic(ru)).toFixed(1));
      ring.style.opacity = ru > 0 && ru < 1 ? ((1 - ru) * 0.4).toFixed(3) : "0";

      /* — the word: in, holds, then bows out before the flight — */
      const woU = 1 - smooth((t - T.wordOut0) / T.wordOutDur);
      wordSpans.forEach((el, i) => {
        const u = clamp01((t - T.wordT0 - i * T.wordStagger) / 0.55);
        el.style.opacity = (smooth(u * 2.2) * woU).toFixed(3);
        el.style.transform =
          "translateY(" +
          ((1 - outExpo(u)) * 16 + (1 - woU) * -10).toFixed(2) + "px)";
      });
      caption.style.opacity = (smooth((t - T.capT0) / 0.4) * woU).toFixed(3);
      caption.style.letterSpacing =
        lerp(0.52, 0.36, outCubic((t - T.capT0) / 0.6)).toFixed(3) + "em";
    };

    const frame = (now: number) => {
      if (done) return;
      const t = frozen !== null ? frozen : (now - t0) / 1000;
      render(t);
      if (frozen === null && t >= T.gone) {
        finish();
        return;
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("visibilitychange", onVis);
      document.documentElement.style.overflow = "";
      delete document.documentElement.dataset.intro;
      skipRef.current = () => {};
    };
  }, []);

  if (gone) return null;

  return (
    <div
      ref={rootRef}
      className={`${styles.overlay} dv-intro`}
      data-intro
      role="presentation"
      aria-hidden="true"
      onPointerDown={() => skipRef.current()}
    >
      <noscript>
        <style>{".dv-intro{display:none!important}"}</style>
      </noscript>

      {/* the veil: the solid dark the piece plays against, lifts for the flight */}
      <div className={styles.veil} data-veil>
        <div className={styles.stars} aria-hidden="true">
          {STARS.map((s, i) => (
            <i
              key={i}
              style={{
                left: s.x + "%",
                top: s.y + "%",
                width: s.s,
                height: s.s,
                animationDelay: s.d + "s",
              }}
            />
          ))}
        </div>
      </div>

      <div className={styles.stage} data-stage>
        <div className={styles.svgWrap} data-svgwrap>
          <svg className={styles.svg} viewBox="0 0 460 460" data-svg aria-hidden="true">
            <defs>
              <radialGradient id="dvBodyGrad" cx="0.62" cy="0.68" r="0.95">
                <stop offset="0%" stopColor="#4D8DFF" />
                <stop offset="45%" stopColor="#2563EB" />
                <stop offset="100%" stopColor="#16337F" />
              </radialGradient>
              <radialGradient id="dvSheen" cx="0.3" cy="0.22" r="0.6">
                <stop offset="0%" stopColor="#BFD9FF" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#BFD9FF" stopOpacity="0" />
              </radialGradient>
              <radialGradient id="dvDotGrad" cx="0.38" cy="0.36" r="0.78">
                <stop offset="0%" stopColor="#EDF4FF" />
                <stop offset="55%" stopColor="#7FB0FF" />
                <stop offset="100%" stopColor="#3B6FE0" />
              </radialGradient>
              {STREAMS.map((s, i) => (
                <linearGradient
                  key={i}
                  id={`dvSG${i}`}
                  gradientUnits="userSpaceOnUse"
                  x1={DOTS[s.dot].cx}
                  y1={DOTS[s.dot].cy}
                  x2="212"
                  y2="222"
                >
                  <stop offset="0%" stopColor="#5E9BFF" stopOpacity="0.25" />
                  <stop offset="55%" stopColor="#9CC2FF" stopOpacity="0.7" />
                  <stop offset="100%" stopColor="#EAF3FF" />
                </linearGradient>
              ))}
              <radialGradient id="dvFlash">
                <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
                <stop offset="45%" stopColor="#BFD9FF" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#BFD9FF" stopOpacity="0" />
              </radialGradient>
              <filter id="dvBloom" x="-80%" y="-80%" width="260%" height="260%">
                <feGaussianBlur stdDeviation="4.5" />
              </filter>
            </defs>

            {/* everything that makes up the mark — this group is what gets
                measured for the flight, so the fx layers stay outside it */}
            <g data-mark>
              {/* streams: soft bloom under-carriage, then the lit line */}
              <g fill="none" strokeLinecap="round">
                {STREAMS.map((s, i) => (
                  <path
                    key={`g${i}`}
                    data-sg={i}
                    d={s.d}
                    stroke="#7FB0FF"
                    strokeWidth="9"
                    opacity="0"
                    filter="url(#dvBloom)"
                  />
                ))}
                {STREAMS.map((s, i) => (
                  <path
                    key={`m${i}`}
                    data-s={i}
                    d={s.d}
                    stroke={`url(#dvSG${i})`}
                    strokeWidth="5.5"
                    opacity="0"
                  />
                ))}
              </g>

              {/* the data dots */}
              <g>
                {DOTS.map((d, i) => (
                  <circle
                    key={i}
                    data-d={i}
                    cx={d.cx}
                    cy={d.cy}
                    r={d.r}
                    fill="url(#dvDotGrad)"
                    opacity="0"
                  />
                ))}
              </g>

              {/* the body of the mark */}
              <g>
                <path data-bglow d={BODY_D} fill="url(#dvBodyGrad)" opacity="0" filter="url(#dvBloom)" />
                <path data-bfill d={BODY_D} fill="url(#dvBodyGrad)" opacity="0" />
                <path data-bsheen d={BODY_D} fill="url(#dvSheen)" opacity="0" />
                <path
                  data-bstroke
                  d={BODY_D}
                  fill="none"
                  stroke="#D6E6FF"
                  strokeWidth="3"
                  strokeLinecap="round"
                  opacity="0"
                />
                <circle data-eye cx={EYE.cx} cy={EYE.cy} r={EYE.r} fill="#F2F7FF" opacity="0" />
              </g>
            </g>

            {/* bloom layer: halos */}
            <g filter="url(#dvBloom)">
              <circle data-hheart cx={HEART.x} cy={HEART.y} r="12" fill="#9CC2FF" opacity="0" />
              {STREAMS.map((_, i) => (
                <circle key={`h${i}`} data-chalo={i} r="9" fill="#BFD9FF" opacity="0" />
              ))}
              <circle data-bhalo r="8" fill="#EAF3FF" opacity="0" />
            </g>

            {/* crisp layer: spark cores + embers */}
            <g>
              <circle data-heart cx={HEART.x} cy={HEART.y} r="5" fill="#EAF3FF" opacity="0" />
              {STREAMS.map((_, i) => (
                <circle key={`c${i}`} data-core={i} r="4" fill="#F4F9FF" opacity="0" />
              ))}
              <circle data-bcore r="3.5" fill="#FFFFFF" opacity="0" />
              {Array.from({ length: 12 }).map((_, i) => (
                <circle key={`e${i}`} data-ember={i} r="2.4" fill="#BFD9FF" opacity="0" />
              ))}
            </g>

            {/* ignition ring + flash */}
            <circle
              data-ring
              cx={BODY_C.x}
              cy={BODY_C.y}
              r="90"
              fill="none"
              stroke="#7FB0FF"
              strokeWidth="2.5"
              opacity="0"
            />
            <circle data-flash cx={BODY_C.x} cy={BODY_C.y} r="150" fill="url(#dvFlash)" opacity="0" />
          </svg>
        </div>

        <div className={styles.word} aria-hidden="true">
          {WORD.split("").map((ch, i) => (
            <span key={i} data-w={i}>
              {ch}
            </span>
          ))}
        </div>
        <div className={styles.caption} data-cap>
          {CAPTION}
        </div>
      </div>

      <button
        type="button"
        className={styles.skip}
        data-skip
        onClick={() => skipRef.current()}
        tabIndex={-1}
      >
        Skip
      </button>
    </div>
  );
}
