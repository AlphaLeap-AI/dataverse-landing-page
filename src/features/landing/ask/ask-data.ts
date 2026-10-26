/**
 * Scripted scenarios for the ask experience.
 * Each one is a full simulated Dataverse answer, told in four beats:
 * the systems it reached, the SQL it wrote, the shape of the result,
 * and the answer with the move it implies.
 *
 * The two scenarios are deliberately different *kinds* of question — one
 * answered from history, one answered by forecast — because that pair is
 * what buyers ask on a first call: "can it tell me what happened?" and
 * "can it tell me what's next?"
 */

export interface ScenarioSource {
  name: string;
  /** Shown once the source is reached — what it actually contributed. */
  meta: string;
}

export interface ScenarioBar {
  /** Axis label under the bar. */
  label: string;
  /** Relative height, 0–1, where 1 is the tallest bar. */
  h: number;
  /** Printed above the bar — the actual figure, not a mystery. */
  value: string;
  /** The winning bar: the one that answers the question. */
  hot?: boolean;
  /** Forecast rather than measured — rendered hatched. */
  projected?: boolean;
}

/**
 * The last beat: the answer leaving Dataverse through a connector the
 * member has authorized. The confirm gate is real — write actions
 * (send_email, post_message) return a preview first and only run once
 * the member approves.
 */
export interface ScenarioDelivery {
  /** Connector name as it appears in Integration > Connectors. */
  name: string;
  /** 1-letter monogram — same motif as the ecosystem wall, no logo assets. */
  mark: string;
  /** The tool the agent calls, as it appears in the run log. */
  tool: string;
  /** Header rows above the message body. */
  headers: { label: string; value: string }[];
  body: string;
  /** Small print under the body — attachment or posting identity. */
  note: string;
  sendLabel: string;
  sentLabel: string;
}

export interface Scenario {
  id: string;
  question: string;
  /** Label on the button that switches to the other scenario. */
  switchLabel: string;
  sources: ScenarioSource[];
  sql: string;
  /** What the chart is actually plotting. */
  chartTitle: string;
  /** Small badge next to the chart title, e.g. the forecast confidence. */
  chartTag?: string;
  bars: ScenarioBar[];
  /** The answer in words — the spec, the SKU, the thing they asked for. */
  verdict: string;
  value: string;
  caption: string;
  /** The "why" nobody asked for — one line each. */
  bullets: string[];
  /** The move the answer implies — what a good analyst would say next. */
  move: string;
  delivery: ScenarioDelivery;
  footnote: string;
}

/**
 * Only these two scenarios are wired for the public demo.
 * Free-text is disabled on purpose — expand this list when more
 * scripted answers are ready.
 */
export const DEMO_SCENARIOS: Scenario[] = [
  {
    id: "leasing",
    question: "Which property spec rented the most in H1 2026? Email the leasing team what we should buy next.",
    switchLabel: "Ask the forecast question",
    sources: [
      { name: "Yardi Voyager", meta: "412k leases" },
      { name: "PostgreSQL", meta: "38k units" },
      { name: "Google Sheets", meta: "submarkets" },
    ],
    sql: `SELECT bedrooms, bathrooms, car_spaces,
       count(*)           AS leases,
       median(rent_month) AS median_rent
FROM leases
WHERE signed_at BETWEEN '2026-01-01' AND '2026-06-30'
  AND status = 'executed'
GROUP BY 1,2,3
ORDER BY leases DESC
LIMIT 5;`,
    chartTitle: "Leases signed · Jan–Jun 2026",
    chartTag: "bed · bath · car",
    bars: [
      { label: "3·2·2", h: 1, value: "1,284", hot: true },
      { label: "2·2·1", h: 0.75, value: "968" },
      { label: "4·2·2", h: 0.48, value: "611" },
      { label: "2·1·1", h: 0.38, value: "494" },
      { label: "1·1·1", h: 0.26, value: "337" },
    ],
    verdict: "3 bed · 2 bath · 2 car",
    value: "1,284",
    caption: "leases signed — 33% of H1 volume",
    bullets: [
      "Clears in 11 days — 8 faster than portfolio average",
      "88% renewal, your highest of any spec",
      "Only 21% of the stock you actually own",
    ],
    move: "Shift acquisition to 3·2·2 — 41 listings match today.",
    delivery: {
      name: "Gmail",
      mark: "G",
      tool: "gmail · send_email",
      headers: [
        { label: "To", value: "leasing-team@northgate.com" },
        { label: "Subject", value: "H1 2026 — 3·2·2 is your best-performing spec" },
      ],
      body: "3 bed · 2 bath · 2 car signed 1,284 leases — 33% of H1 volume, 11 days to lease, 88% renewal — yet it's only 21% of what we own. Proposal: shift acquisition to 3·2·2 in the five submarkets under 10 days. 41 listings match today.",
      note: "Attached · answer.sql, 3 sources",
      sendLabel: "Approve & send",
      sentLabel: "Sent from your mailbox · 09:14",
    },
    footnote: "9 queries · 3 sources · 1.8s",
  },
  {
    id: "forecast",
    question: "Which beauty product will sell best in our new NY store? Post the plan to #merch-planning.",
    switchLabel: "Ask the leasing question",
    sources: [
      { name: "Shopify POS", meta: "2.1m sales" },
      { name: "SAP", meta: "inventory" },
      { name: "BigQuery", meta: "footfall" },
      { name: "NielsenIQ", meta: "market index" },
    ],
    sql: `WITH beauty AS (
  SELECT sku, category, sum(units) AS units_12mo
  FROM pos_sales
  WHERE segment = 'Beauty'
    AND sold_at >= current_date - INTERVAL '12 months'
  GROUP BY 1,2
)
SELECT category, forecast(units_12mo,
         market => 'New York DMA') AS proj
FROM beauty JOIN nielsen_index USING (category)
ORDER BY proj DESC;`,
    chartTitle: "Projected year-one revenue · New York",
    chartTag: "forecast · 87% conf.",
    bars: [
      { label: "Serums", h: 1, value: "$1.24M", hot: true, projected: true },
      { label: "SPF", h: 0.68, value: "$840K", projected: true },
      { label: "Cleanse", h: 0.56, value: "$690K", projected: true },
      { label: "Lip", h: 0.38, value: "$470K", projected: true },
      { label: "Masks", h: 0.29, value: "$360K", projected: true },
    ],
    verdict: "Vitamin-C brightening serum · 30 ml",
    value: "$1.24M",
    caption: "projected year-one revenue",
    bullets: [
      "2.3× what your average store does in beauty",
      "87% confidence, from 11 look-alike stores",
      "Your draft planogram gives it just 6% of shelf",
    ],
    move: "Open with 4,800 units and 18% of shelf.",
    delivery: {
      name: "Slack",
      mark: "S",
      tool: "slack · post_message",
      headers: [
        { label: "Channel", value: "#merch-planning" },
        { label: "Thread", value: "New York store · opening plan" },
      ],
      body: "NY opening: vitamin-C brightening serum 30 ml projects $1.24M year one — 2.3× our store average, 87% confidence from 11 look-alike stores. The draft planogram gives it 6% of shelf. Recommend 4,800 units and 18%.",
      note: "Posts as you · never as a shared bot",
      sendLabel: "Approve & post",
      sentLabel: "Posted to #merch-planning · 09:14",
    },
    footnote: "14 queries · 4 sources · 2.6s",
  },
];

/** Line count of the generated SQL — the "Query" step's sub-label. */
export function sqlLineCount(sql: string): number {
  return sql.split("\n").length;
}

/* ── SQL syntax colouring ─────────────────────────────────────── */

const KEYWORDS = [
  "GROUP BY",
  "ORDER BY",
  "LEFT JOIN",
  "PARTITION BY",
  "NOT IN",
  "SELECT",
  "FROM",
  "WHERE",
  "LIMIT",
  "WITH",
  "JOIN",
  "USING",
  "AND",
  "OVER",
  "DESC",
  "ASC",
  "BETWEEN",
  "INTERVAL",
  "ON",
  "AS",
  "IN",
];

const FUNCTIONS = ["current_date", "date_trunc", "forecast", "median", "count", "round", "avg", "sum"];

const TOKEN_RE = new RegExp(
  `('[^']*')|(\\b\\d+(?:\\.\\d+)?\\b)|\\b(${KEYWORDS.join("|")})\\b|\\b(${FUNCTIONS.join("|")})\\b`,
  "gi"
);

export type SqlTokenKind = "str" | "num" | "kw" | "fn" | "base";

export interface SqlToken {
  text: string;
  kind: SqlTokenKind;
}

/**
 * Split SQL into coloured runs. Done once per scenario so the typewriter
 * can slice a character budget across the runs without re-parsing.
 */
export function tokenizeSql(sql: string): SqlToken[] {
  const out: SqlToken[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  TOKEN_RE.lastIndex = 0;
  while ((m = TOKEN_RE.exec(sql))) {
    if (m.index > last) out.push({ text: sql.slice(last, m.index), kind: "base" });
    out.push({ text: m[0], kind: m[1] ? "str" : m[2] ? "num" : m[3] ? "kw" : "fn" });
    last = m.index + m[0].length;
  }
  if (last < sql.length) out.push({ text: sql.slice(last), kind: "base" });
  return out;
}

/** Split "$1.24M" / "1,284" into animatable parts. */
export function splitValue(value: string): {
  prefix: string;
  num: number;
  decimals: number;
  suffix: string;
  grouped: boolean;
} {
  const m = value.match(/^([^0-9]*)([0-9][0-9,]*(?:\.([0-9]+))?)(.*)$/);
  if (!m) return { prefix: "", num: 0, decimals: 0, suffix: value, grouped: false };
  return {
    prefix: m[1],
    num: parseFloat(m[2].replace(/,/g, "")),
    decimals: m[3]?.length ?? 0,
    suffix: m[4],
    grouped: m[2].includes(","),
  };
}

/** Render a count-up frame the same way the source string was written. */
export function formatValue(n: number, decimals: number, grouped: boolean): string {
  return grouped
    ? n.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
    : n.toFixed(decimals);
}
