/**
 * Scripted scenarios for the hero's interactive ask experience.
 * Each one is a full simulated Dataverse answer: sources queried, the SQL
 * behind it, a chart, the headline number, and the "why" nobody asked for.
 */

export interface Scenario {
  id: string;
  question: string;
  /** Compact chip label for narrow screens. */
  short: string;
  keywords: string[];
  sources: string[];
  sql: string;
  value: string;
  caption: string;
  bars: { label: string; h: number; hot?: boolean }[];
  insight: string;
  footnote: string;
}

/**
 * Only these two scenarios are wired for the public hero demo.
 * Free-text is disabled on purpose — expand this list when more
 * scripted answers are ready.
 */
export const DEMO_SCENARIOS: Scenario[] = [
  {
    id: "churn",
    question: "Why did churn spike in March?",
    short: "Why did churn spike?",
    keywords: ["churn", "risk", "cancel", "retention", "leave", "spike"],
    sources: ["PostgreSQL", "Snowflake", "Zendesk"],
    sql: `SELECT s.region,
       count(*)        AS at_risk,
       sum(s.arr)      AS arr_at_risk,
       avg(t.hours)    AS ticket_wait
FROM subscriptions s
JOIN tickets t ON t.account_id = s.customer_id
WHERE s.renewal_risk = 'high'
  AND s.term_end < current_date + 90
GROUP BY 1
ORDER BY 3 DESC;`,
    value: "$3.8M",
    caption: "renewal ARR at risk this quarter",
    bars: [
      { label: "EMEA", h: 1, hot: true },
      { label: "NA", h: 0.63 },
      { label: "APAC", h: 0.37 },
      { label: "LATAM", h: 0.21 },
    ],
    insight:
      "Risk tracks support response time — accounts waiting >48h on tickets churn 3.1× more. 23 accounts named, ranked by save-ability.",
    footnote: "11 queries · 3 databases · 2.4s",
  },
  {
    id: "growth",
    question: "Which regions drove revenue growth last quarter?",
    short: "What drove growth?",
    keywords: ["revenue", "growth", "region", "quarter", "sales", "grew"],
    sources: ["Snowflake", "BigQuery"],
    sql: `SELECT region,
       sum(revenue)                         AS rev,
       rev / lag(rev) OVER w - 1            AS growth
FROM fct_revenue
WHERE quarter IN ('Q2', 'Q3')
GROUP BY 1
WINDOW w AS (PARTITION BY region ORDER BY quarter)
ORDER BY 3 DESC;`,
    value: "+18.2%",
    caption: "Q3 revenue growth, company-wide",
    bars: [
      { label: "EMEA", h: 1, hot: true },
      { label: "NA", h: 0.72 },
      { label: "APAC", h: 0.58 },
      { label: "LATAM", h: 0.3 },
    ],
    insight:
      "EMEA grew 31% — and 60% of that came from logistics expansions closed in August. One segment is carrying the quarter.",
    footnote: "7 queries · 2 databases · 1.9s",
  },
];

/** @deprecated Prefer DEMO_SCENARIOS — kept as an alias for clarity. */
export const SCENARIOS = DEMO_SCENARIOS;

/** Split "$3.8M" / "+18.2%" into animatable parts. */
export function splitValue(value: string): { prefix: string; num: number; decimals: number; suffix: string } {
  const m = value.match(/^([^0-9]*)([0-9]+(?:\.([0-9]+))?)(.*)$/);
  if (!m) return { prefix: "", num: 0, decimals: 0, suffix: value };
  return {
    prefix: m[1],
    num: parseFloat(m[2]),
    decimals: m[3]?.length ?? 0,
    suffix: m[4],
  };
}
