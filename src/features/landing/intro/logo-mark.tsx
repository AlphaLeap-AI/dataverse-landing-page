import type { SVGProps } from "react";

/* ============================================================
   The Dataverse mark at rest — the exact finished state the
   intro animation lands on. Lives in the nav; the intro's flying
   mark cross-fades onto this very artwork, so the handoff reads
   as one continuous object. Gradient ids are namespaced (dvm*)
   so they never collide with the intro overlay's defs.
   ============================================================ */

const BODY_D = "M201.2 150 A112 112 0 1 1 201.2 294 L252 222 Z";

const STREAMS = [
  { d: "M220 212 C 190 168 152 126 122 112", dot: 0 },
  { d: "M218 218 C 190 206 164 196 141 188", dot: 2 },
  { d: "M216 228 C 175 234 132 231 97 227", dot: 3 },
  { d: "M220 234 C 190 278 154 312 121 336", dot: 6 },
];

const DOTS = [
  { cx: 122, cy: 112, r: 13 },
  { cx: 86, cy: 163, r: 8 },
  { cx: 141, cy: 188, r: 10 },
  { cx: 97, cy: 227, r: 15 },
  { cx: 135, cy: 272, r: 9 },
  { cx: 87, cy: 291, r: 7 },
  { cx: 121, cy: 336, r: 13 },
  { cx: 48, cy: 219, r: 5 },
  { cx: 62, cy: 262, r: 3.5 },
  { cx: 54, cy: 180, r: 3 },
];

export function LogoMark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="38 88 366 262" aria-hidden="true" {...props}>
      <defs>
        <radialGradient id="dvmBodyGrad" cx="0.62" cy="0.68" r="0.95">
          <stop offset="0%" stopColor="#4D8DFF" />
          <stop offset="45%" stopColor="#2563EB" />
          <stop offset="100%" stopColor="#16337F" />
        </radialGradient>
        <radialGradient id="dvmSheen" cx="0.3" cy="0.22" r="0.6">
          <stop offset="0%" stopColor="#BFD9FF" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#BFD9FF" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="dvmDotGrad" cx="0.38" cy="0.36" r="0.78">
          <stop offset="0%" stopColor="#EDF4FF" />
          <stop offset="55%" stopColor="#7FB0FF" />
          <stop offset="100%" stopColor="#3B6FE0" />
        </radialGradient>
        {STREAMS.map((s, i) => (
          <linearGradient
            key={i}
            id={`dvmSG${i}`}
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
        <filter id="dvmBloom" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="4.5" />
        </filter>
      </defs>

      <g fill="none" strokeLinecap="round">
        {STREAMS.map((s, i) => (
          <path
            key={i}
            d={s.d}
            stroke={`url(#dvmSG${i})`}
            strokeWidth="5.5"
            opacity="0.6"
          />
        ))}
      </g>

      <g>
        {DOTS.map((d, i) => (
          <circle key={i} cx={d.cx} cy={d.cy} r={d.r} fill="url(#dvmDotGrad)" />
        ))}
      </g>

      <g>
        <path d={BODY_D} fill="url(#dvmBodyGrad)" />
        <path d={BODY_D} fill="url(#dvmSheen)" opacity="0.9" />
        <path
          d={BODY_D}
          fill="none"
          stroke="#D6E6FF"
          strokeWidth="3"
          strokeLinecap="round"
          opacity="0.35"
        />
        <circle cx="218" cy="222" r="10.5" fill="#9CC2FF" opacity="0.25" filter="url(#dvmBloom)" />
        <circle cx="218" cy="222" r="4" fill="#EAF3FF" opacity="0.5" />
        <circle cx="337" cy="197" r="9" fill="#F2F7FF" />
      </g>
    </svg>
  );
}
