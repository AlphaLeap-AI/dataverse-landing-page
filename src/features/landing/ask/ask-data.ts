/**
 * Scripted scenarios for the hero's interactive ask experience.
 * Each one is a full simulated Dataverse answer: sources queried, the SQL
 * behind it, a chart, the headline number, and the "why" nobody asked for.
 *
 * The two scenarios are deliberately different *kinds* of question — one
 * answered from history, one answered by forecast — because that pair is
 * what buyers ask on a first call: "can it tell me what happened?" and
 * "can it tell me what's next?"
 */

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

export interface ScenarioStat {
  label: string;
  value: string;
}

export interface Scenario {
  id: string;
  question: string;
  /** Compact chip label for narrow screens. */
  short: string;
  keywords: string[];
  sources: string[];
  sql: string;
  /** The answer in words — the spec, the SKU, the thing they asked for. */
  verdict: string;
  value: string;
  caption: string;
  /** What the chart is actually plotting. */
  chartTitle: string;
  /** Small badge next to the chart title, e.g. the forecast confidence. */
  chartTag?: string;
  bars: ScenarioBar[];
  stats: ScenarioStat[];
  insight: string;
  /** The move the answer implies — what a good analyst would say next. */
  action: string;
  footnote: string;
}

/**
 * Only these two scenarios are wired for the public hero demo.
 * Free-text is disabled on purpose — expand this list when more
 * scripted answers are ready.
 */
export const DEMO_SCENARIOS: Scenario[] = [
  {
    id: "leasing",
    question: "Which property spec — bed, bath, car — rented the most in H1 2026?",
    short: "Top-renting spec in H1 2026?",
    keywords: ["property", "rent", "lease", "bedroom", "bathroom", "car", "spec", "leasing"],
    sources: ["Yardi Voyager", "PostgreSQL", "Google Sheets"],
    sql: `SELECT bedrooms, bathrooms, car_spaces,
       count(*)                       AS leases,
       median(rent_month)             AS median_rent,
       round(avg(days_on_market), 1)  AS avg_days_listed
FROM leases
WHERE signed_at BETWEEN '2026-01-01' AND '2026-06-30'
  AND status = 'executed'
GROUP BY 1, 2, 3
ORDER BY leases DESC
LIMIT 5;`,
    verdict: "3 bed · 2 bath · 2 car",
    value: "1,284",
    caption: "leases signed — 33% of all H1 2026 volume",
    chartTitle: "Leases signed · Jan–Jun 2026",
    chartTag: "bed · bath · car",
    bars: [
      { label: "3·2·2", h: 1, value: "1,284", hot: true },
      { label: "2·2·1", h: 0.75, value: "968" },
      { label: "4·2·2", h: 0.48, value: "611" },
      { label: "2·1·1", h: 0.38, value: "494" },
      { label: "1·1·1", h: 0.26, value: "337" },
    ],
    stats: [
      { label: "Median rent", value: "$2,850/mo" },
      { label: "Days on market", value: "11 days" },
      { label: "Renewal rate", value: "88%" },
    ],
    insight:
      "3·2·2 clears the market 8 days faster than your portfolio average and renews at 88% — yet it's only 21% of the stock you own. The 4·2·2 homes you keep acquiring sit 26 days and sign 6% under asking.",
    action: "Shift acquisition toward 3·2·2 in the 5 submarkets where it leases in under 10 days — 41 listings match today.",
    footnote: "9 queries · 3 sources · 1.8s",
  },
  {
    id: "forecast",
    question: "Which beauty product will sell best in our new New York store?",
    short: "Best seller in a new NYC store?",
    keywords: ["forecast", "predict", "beauty", "product", "new york", "store", "sell", "category"],
    sources: ["Shopify POS", "SAP", "BigQuery", "NielsenIQ"],
    sql: `WITH beauty AS (
  SELECT sku, category, sum(units) AS units_12mo
  FROM pos_sales
  WHERE segment = 'Beauty'
    AND sold_at >= current_date - INTERVAL '12 months'
  GROUP BY 1, 2
)
SELECT category, sku,
       forecast(units_12mo, market => 'New York DMA',
                horizon => 12) AS proj_units
FROM beauty JOIN nielsen_index USING (category)
ORDER BY proj_units DESC;`,
    verdict: "Vitamin-C brightening serum · 30 ml",
    value: "$1.24M",
    caption: "projected year-one revenue at the NY store",
    chartTitle: "Projected year-one revenue · New York",
    chartTag: "forecast · 87% confidence",
    bars: [
      { label: "Serums", h: 1, value: "$1.24M", hot: true, projected: true },
      { label: "SPF", h: 0.68, value: "$840K", projected: true },
      { label: "Cleanse", h: 0.56, value: "$690K", projected: true },
      { label: "Lip", h: 0.38, value: "$470K", projected: true },
      { label: "Masks", h: 0.29, value: "$360K", projected: true },
    ],
    stats: [
      { label: "Model confidence", value: "87%" },
      { label: "vs. store average", value: "2.3×" },
      { label: "Opening stock", value: "4,800 units" },
    ],
    insight:
      "You have no New York sales history — so we matched 11 stores with the same demographic and footfall profile. That market over-indexes 2.3× on vitamin-C serums, and 71% of the demand lands Sept–Feb. Your draft NY planogram gives serums 6% of shelf.",
    action: "Open with 4,800 units and 18% of shelf on serums; hold the lip range back until Q4.",
    footnote: "14 queries · 4 sources · 2.6s · 24-month seasonal model",
  },
];

/** @deprecated Prefer DEMO_SCENARIOS — kept as an alias for clarity. */
export const SCENARIOS = DEMO_SCENARIOS;

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
