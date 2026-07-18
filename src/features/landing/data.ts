/**
 * Shared static data for the landing page's interactive demos.
 *
 * The `sql` fields contain pre-rendered, trusted HTML with `<span class="k|s|c">`
 * syntax-highlight markers. They are rendered via `dangerouslySetInnerHTML` and
 * styled through `:global(.k|.s|.c)` rules in `landing.module.css` — never user
 * input.
 */

export interface Preset {
  q: string;
  intent: string;
  tables: string;
  sqlmeta: string;
  runmeta: string;
  sql: string;
  rows: Array<[label: string, value: string, barWidth: number]>;
  rowsTitle: string;
  head: [string, string];
}

export const PRESETS: Preset[] = [
  {
    q: "Which regions are at highest renewal risk?",
    intent: "aggregate · group by region · filter renewal_risk='high'",
    tables: "customers · subscriptions (2 tables, 1 join)",
    sqlmeta: "18 tokens · deterministic · approved schema",
    runmeta: "142ms · 4 rows returned",
    sql: `<span class="c">-- renewal risk by region, approved definitions</span>
<span class="k">SELECT</span>  c.region, <span class="k">SUM</span>(s.arr) <span class="k">AS</span> revenue_at_risk
<span class="k">FROM</span>    subscriptions s
<span class="k">JOIN</span>    customers c <span class="k">ON</span> c.id = s.customer_id
<span class="k">WHERE</span>   s.renewal_risk = <span class="s">'high'</span>
<span class="k">GROUP BY</span> c.region
<span class="k">ORDER BY</span> revenue_at_risk <span class="k">DESC</span>;`,
    rows: [
      ["EMEA", "$2.41M", 128],
      ["NA", "$1.82M", 96],
      ["APAC", "$1.03M", 54],
      ["LATAM", "$0.41M", 22],
    ],
    rowsTitle: "Result · 4 rows",
    head: ["region", "revenue_at_risk"],
  },
  {
    q: "Top 5 customers by ARR this quarter",
    intent: "top-k · order by arr desc · limit 5 · quarter filter",
    tables: "customers · subscriptions (2 tables, 1 join)",
    sqlmeta: "22 tokens · includes date_trunc · approved",
    runmeta: "98ms · 5 rows returned",
    sql: `<span class="c">-- top 5 customers by ARR, current quarter</span>
<span class="k">SELECT</span>  c.name, <span class="k">SUM</span>(s.arr) <span class="k">AS</span> arr
<span class="k">FROM</span>    subscriptions s
<span class="k">JOIN</span>    customers c <span class="k">ON</span> c.id = s.customer_id
<span class="k">WHERE</span>   date_trunc(<span class="s">'quarter'</span>, s.started_at) = date_trunc(<span class="s">'quarter'</span>, now())
<span class="k">GROUP BY</span> c.name
<span class="k">ORDER BY</span> arr <span class="k">DESC</span>
<span class="k">LIMIT</span>   5;`,
    rows: [
      ["Helion Energy", "$1.24M", 124],
      ["Meridian Health", "$0.98M", 98],
      ["Northwind Co.", "$0.81M", 81],
      ["Atlas Freight", "$0.64M", 64],
      ["Orbit Labs", "$0.52M", 52],
    ],
    rowsTitle: "Result · 5 rows",
    head: ["customer", "arr"],
  },
  {
    q: "Expansion revenue vs. churn by plan",
    intent: "compare metrics · group by plan · date range = last 90d",
    tables: "plans · subscriptions · renewals (3 tables, 2 joins)",
    sqlmeta: "36 tokens · window fn · approved",
    runmeta: "211ms · 4 rows returned",
    sql: `<span class="c">-- expansion vs. churn, last 90 days, by plan</span>
<span class="k">SELECT</span>  p.code <span class="k">AS</span> plan,
        <span class="k">SUM</span>(<span class="k">CASE WHEN</span> r.event_type = <span class="s">'expansion'</span> <span class="k">THEN</span> s.arr <span class="k">END</span>) <span class="k">AS</span> expansion,
        <span class="k">SUM</span>(<span class="k">CASE WHEN</span> r.event_type = <span class="s">'churn'</span> <span class="k">THEN</span> s.arr <span class="k">END</span>) <span class="k">AS</span> churn
<span class="k">FROM</span>    renewals r
<span class="k">JOIN</span>    subscriptions s <span class="k">ON</span> s.id = r.subscription_id
<span class="k">JOIN</span>    plans p <span class="k">ON</span> p.code = s.plan_code
<span class="k">WHERE</span>   r.occurred_at &gt; now() - <span class="k">INTERVAL</span> <span class="s">'90 days'</span>
<span class="k">GROUP BY</span> p.code;`,
    rows: [
      ["Enterprise", "+$1.61M / −$0.22M", 128],
      ["Business", "+$0.84M / −$0.31M", 78],
      ["Team", "+$0.42M / −$0.19M", 46],
      ["Starter", "+$0.14M / −$0.11M", 18],
    ],
    rowsTitle: "Result · 4 rows",
    head: ["plan", "expansion / churn"],
  },
  {
    q: "Monthly new logos trend",
    intent: "time series · count distinct customers · group by month",
    tables: "customers · subscriptions (2 tables, 1 join)",
    sqlmeta: "14 tokens · date_trunc · approved",
    runmeta: "76ms · 6 rows returned",
    sql: `<span class="c">-- monthly new logos, last 6 months</span>
<span class="k">SELECT</span>  date_trunc(<span class="s">'month'</span>, <span class="k">MIN</span>(s.started_at)) <span class="k">AS</span> month,
        <span class="k">COUNT</span>(<span class="k">DISTINCT</span> c.id) <span class="k">AS</span> new_logos
<span class="k">FROM</span>    subscriptions s
<span class="k">JOIN</span>    customers c <span class="k">ON</span> c.id = s.customer_id
<span class="k">GROUP BY</span> c.id
<span class="k">ORDER BY</span> month <span class="k">DESC</span>
<span class="k">LIMIT</span>   6;`,
    rows: [
      ["Apr 2026", "34", 112],
      ["Mar 2026", "41", 132],
      ["Feb 2026", "28", 92],
      ["Jan 2026", "36", 118],
      ["Dec 2025", "22", 72],
      ["Nov 2025", "19", 62],
    ],
    rowsTitle: "Result · 6 rows",
    head: ["month", "new_logos"],
  },
];

export interface Connector {
  name: string;
  color: string;
  tip: string;
}

export const CONNECTORS: Connector[] = [
  { name: "PostgreSQL", color: "#336791", tip: "47 tables verified" },
  { name: "MySQL", color: "#00758f", tip: "schema sync via metadata" },
  { name: "SQL Server", color: "#a91d22", tip: "FTS-backed retrieval" },
  { name: "Snowflake", color: "#29b5e8", tip: "warehouse-native" },
  { name: "BigQuery", color: "#4285f4", tip: "dataset-scoped" },
  { name: "Databricks", color: "#ff3621", tip: "lakehouse-aware" },
  { name: "DuckDB", color: "#fdf200", tip: "embedded & local" },
  { name: "SQLite", color: "#003b57", tip: "import from file" },
];
