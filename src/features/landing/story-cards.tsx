import { forwardRef, type CSSProperties } from "react";

import styles from "./story-scroll.module.css";

export type CardDepth = "far" | "mid" | "near";
/** Index into DB_CLUSTERS — which database cluster this card flies into as the story resolves. */
export type ClusterIndex = 0 | 1 | 2 | 3 | 4;

interface Bar {
  h: number;
  color: string;
}

export type CardContent =
  | { kind: "chip-file"; icon: string; iconBg: string; iconColor: string; label: string }
  | { kind: "chip-db"; dotColor: string; label: string }
  | { kind: "bars"; label: string; bars: Bar[] }
  | {
      kind: "grid";
      label: string;
      icon?: { icon: string; bg: string; color: string };
      rows: number;
      cols: number;
      filled: number;
    }
  | { kind: "donut-bar"; label: string; donut: string; bars?: Bar[] }
  | {
      kind: "metric-inline";
      label: string;
      metricLabel: string;
      metricValue: string;
      metricColor?: string;
      bars?: Bar[];
    }
  | { kind: "metric-stacked"; label: string; metricLabel: string; metricValue: string; bars: Bar[] }
  | { kind: "regional"; label: string; bars: Bar[]; regions: string[] };

export interface FloatingCardSpec {
  left: number;
  top: number;
  cl: ClusterIndex;
  depth: CardDepth;
  content: CardContent;
}

export const DB_CLUSTERS: { name: string; color: string }[] = [
  { name: "PostgreSQL", color: "#336791" },
  { name: "Snowflake", color: "#29b5e8" },
  { name: "MySQL", color: "#f29111" },
  { name: "BigQuery", color: "#4285f4" },
  { name: "Oracle", color: "#a91d22" },
];

const ACCENT_VAR = "var(--acc,#1d6dff)";

export const FLOATING_CARDS: FloatingCardSpec[] = [
  // far — blurred background layer
  { left: 27, top: 15, cl: 3, depth: "far", content: { kind: "bars", label: "weekly_kpis.pptx", bars: [{ h: 40, color: "#a8c4ea" }, { h: 62, color: "#7fa9e8" }, { h: 48, color: "#a8c4ea" }, { h: 82, color: ACCENT_VAR }] } },
  { left: 49, top: 11, cl: 1, depth: "far", content: { kind: "grid", label: "hr_headcount.xlsx", rows: 2, cols: 4, filled: 4 } },
  { left: 67, top: 21, cl: 2, depth: "far", content: { kind: "donut-bar", label: "pipeline.pptx", donut: "conic-gradient(#7fa9e8 0 55%,#c9d8ef 55% 80%,#e6ebf2 80% 100%)" } },
  { left: 11, top: 37, cl: 2, depth: "far", content: { kind: "chip-file", icon: "CSV", iconBg: "#e3f2ea", iconColor: "#1a7f4b", label: "inventory_snapshot.csv" } },
  { left: 30, top: 79, cl: 0, depth: "far", content: { kind: "metric-inline", label: "gross_margin_trend.pptx", metricLabel: "Margin", metricValue: "62.7%", bars: [{ h: 35, color: "#a8c4ea" }, { h: 52, color: "#7fa9e8" }, { h: 70, color: "#4d8bff" }, { h: 86, color: ACCENT_VAR }] } },
  { left: 88, top: 52, cl: 1, depth: "far", content: { kind: "chip-file", icon: "SQL", iconBg: "#e8eef7", iconColor: "#334155", label: "supply_chain.sql" } },
  { left: 62, top: 82, cl: 2, depth: "far", content: { kind: "grid", label: "support_tickets.csv", rows: 2, cols: 4, filled: 4 } },

  // mid — softer blur
  { left: 22, top: 32, cl: 1, depth: "mid", content: { kind: "bars", label: "net_revenue_waterfall.pptx", bars: [{ h: 30, color: "#a8c4ea" }, { h: 48, color: "#16a34a" }, { h: 42, color: "#dc2626" }, { h: 66, color: "#7fa9e8" }, { h: 88, color: ACCENT_VAR }] } },
  { left: 74, top: 34, cl: 4, depth: "mid", content: { kind: "chip-db", dotColor: "#a91d22", label: "Oracle" } },
  { left: 54, top: 74, cl: 3, depth: "mid", content: { kind: "chip-file", icon: "PQ", iconBg: "#ece9fd", iconColor: "#6d5cff", label: "sensor_logs.parquet" } },
  { left: 7, top: 59, cl: 0, depth: "mid", content: { kind: "grid", label: "budget_v7_FINAL.xlsx", rows: 2, cols: 4, filled: 4 } },
  { left: 86, top: 87, cl: 2, depth: "mid", content: { kind: "chip-file", icon: "P", iconBg: "#fdeadd", iconColor: "#c2410c", label: "board_deck_draft.pptx" } },

  // near — hoverable foreground layer
  { left: 3, top: 12, cl: 2, depth: "near", content: { kind: "chip-file", icon: "X", iconBg: "#e3f2ea", iconColor: "#1a7f4b", label: "revenue_by_product.xlsx" } },
  { left: 2, top: 24, cl: 0, depth: "near", content: { kind: "grid", label: "customer_lifetime_value.xlsx", icon: { icon: "X", bg: "#e3f2ea", color: "#1a7f4b" }, rows: 3, cols: 4, filled: 4 } },
  { left: 4, top: 45, cl: 4, depth: "near", content: { kind: "metric-stacked", label: "user_engagement_metrics.pptx", metricLabel: "Monthly Active Users", metricValue: "128,540", bars: [{ h: 34, color: "#a8c4ea" }, { h: 48, color: "#a8c4ea" }, { h: 42, color: "#7fa9e8" }, { h: 66, color: "#7fa9e8" }, { h: 88, color: ACCENT_VAR }] } },
  { left: 3, top: 72, cl: 2, depth: "near", content: { kind: "chip-db", dotColor: "#f29111", label: "MySQL" } },
  { left: 12, top: 84, cl: 3, depth: "near", content: { kind: "metric-inline", label: "finance_kpi_dashboard.pptx", metricLabel: "EBITDA", metricValue: "$1.2M", bars: [{ h: 28, color: "#a8c4ea" }, { h: 44, color: "#a8c4ea" }, { h: 38, color: "#7fa9e8" }, { h: 58, color: "#7fa9e8" }, { h: 76, color: ACCENT_VAR }, { h: 92, color: ACCENT_VAR }] } },
  { left: 19, top: 7, cl: 0, depth: "near", content: { kind: "chip-file", icon: "SQL", iconBg: "#e8eef7", iconColor: "#334155", label: "churn_analysis.sql" } },
  { left: 36, top: 5, cl: 1, depth: "near", content: { kind: "donut-bar", label: "sales_pipeline_forecast.pptx", donut: `conic-gradient(${ACCENT_VAR} 0 42%,#93c0ff 42% 68%,#d6dfea 68% 100%)`, bars: [{ h: 36, color: "#a8c4ea" }, { h: 52, color: "#a8c4ea" }, { h: 46, color: "#7fa9e8" }, { h: 70, color: "#7fa9e8" }, { h: 90, color: ACCENT_VAR }] } },
  { left: 57, top: 8, cl: 3, depth: "near", content: { kind: "chip-file", icon: "CSV", iconBg: "#e3f2ea", iconColor: "#1a7f4b", label: "top_customers.csv" } },
  { left: 73, top: 6, cl: 0, depth: "near", content: { kind: "chip-db", dotColor: "#336791", label: "PostgreSQL" } },
  { left: 80, top: 18, cl: 4, depth: "near", content: { kind: "metric-inline", label: "monthly_recurring_revenue.pptx", metricLabel: "MRR Growth", metricValue: "$2.45M", bars: [{ h: 30, color: "#a8c4ea" }, { h: 38, color: "#a8c4ea" }, { h: 52, color: "#7fa9e8" }, { h: 47, color: "#7fa9e8" }, { h: 68, color: "#4d8bff" }, { h: 84, color: ACCENT_VAR }] } },
  { left: 85, top: 42, cl: 1, depth: "near", content: { kind: "grid", label: "cohort_retention.xlsx", icon: { icon: "X", bg: "#e3f2ea", color: "#1a7f4b" }, rows: 3, cols: 5, filled: 5 } },
  { left: 77, top: 61, cl: 1, depth: "near", content: { kind: "chip-db", dotColor: "#29b5e8", label: "Snowflake" } },
  { left: 80, top: 75, cl: 4, depth: "near", content: { kind: "regional", label: "regional_sales.pptx", bars: [{ h: 88, color: ACCENT_VAR }, { h: 64, color: "#4d8bff" }, { h: 44, color: "#7fa9e8" }, { h: 26, color: "#a8c4ea" }], regions: ["EMEA", "NA", "APAC", "LATAM"] } },
  { left: 58, top: 86, cl: 3, depth: "near", content: { kind: "chip-file", icon: "PQ", iconBg: "#ece9fd", iconColor: "#6d5cff", label: "orders_2024.parquet" } },
  { left: 36, top: 87, cl: 4, depth: "near", content: { kind: "metric-inline", label: "marketing_campaign_roi.pptx", metricLabel: "Campaign ROI", metricValue: "320%", metricColor: "#16a34a" } },
  { left: 17, top: 64, cl: 3, depth: "near", content: { kind: "chip-db", dotColor: "#4285f4", label: "BigQuery" } },
];

function BarChart({ bars, height = 40 }: { bars: Bar[]; height?: number }) {
  return (
    <div className={styles.barRow} style={{ height }}>
      {bars.map((bar, i) => (
        <span key={i} className={styles.bar} style={{ height: `${bar.h}%`, background: bar.color }} />
      ))}
    </div>
  );
}

function CardBody({ content }: { content: CardContent }) {
  switch (content.kind) {
    case "chip-file":
      return (
        <div className={styles.chipFile}>
          <span className={styles.chipIcon} style={{ background: content.iconBg, color: content.iconColor }}>
            {content.icon}
          </span>
          <span className={styles.chipLabel}>{content.label}</span>
        </div>
      );
    case "chip-db":
      return (
        <div className={styles.chipDb}>
          <i className={styles.chipDot} style={{ background: content.dotColor }} />
          <span className={styles.chipDbLabel}>{content.label}</span>
        </div>
      );
    case "bars":
      return (
        <div className={styles.panel}>
          <div className={styles.panelLabel}>{content.label}</div>
          <BarChart bars={content.bars} />
        </div>
      );
    case "grid":
      return (
        <div className={styles.panel}>
          {content.icon ? (
            <div className={styles.panelHeaderIcon}>
              <span className={styles.chipIcon} style={{ background: content.icon.bg, color: content.icon.color, width: 32, height: 32, fontSize: 11 }}>
                {content.icon.icon}
              </span>
              <span className={styles.panelLabelInline}>{content.label}</span>
            </div>
          ) : (
            <div className={styles.panelLabel}>{content.label}</div>
          )}
          <div className={styles.dotGrid} style={{ gridTemplateColumns: `repeat(${content.cols},1fr)` }}>
            {Array.from({ length: content.rows * content.cols }).map((_, i) => (
              <span key={i} className={styles.dotCell} data-filled={i % content.cols < content.filled} />
            ))}
          </div>
        </div>
      );
    case "donut-bar":
      return (
        <div className={styles.panel}>
          <div className={styles.panelLabel}>{content.label}</div>
          <div className={styles.donutRow}>
            <span className={styles.donut} style={{ background: content.donut }} />
            {content.bars ? <BarChart bars={content.bars} height={56} /> : <span className={styles.donutStub} />}
          </div>
        </div>
      );
    case "metric-inline":
      return (
        <div className={styles.panel}>
          <div className={styles.panelLabel}>{content.label}</div>
          <div className={styles.metricInline}>
            <span className={styles.metricInlineLabel}>{content.metricLabel}</span>
            <span className={styles.metricInlineValue} style={{ color: content.metricColor }}>
              {content.metricValue}
            </span>
          </div>
          {content.bars ? <BarChart bars={content.bars} /> : null}
        </div>
      );
    case "metric-stacked":
      return (
        <div className={styles.panel}>
          <div className={styles.panelLabel}>{content.label}</div>
          <div className={styles.metricStackedLabel}>{content.metricLabel}</div>
          <div className={styles.metricStackedValue}>{content.metricValue}</div>
          <BarChart bars={content.bars} height={46} />
        </div>
      );
    case "regional":
      return (
        <div className={styles.panel}>
          <div className={styles.panelLabel}>{content.label}</div>
          <BarChart bars={content.bars} height={48} />
          <div className={styles.regionLabels}>
            {content.regions.map((region) => (
              <span key={region}>{region}</span>
            ))}
          </div>
        </div>
      );
    default:
      return null;
  }
}

interface FloatingCardProps {
  spec: FloatingCardSpec;
  index: number;
}

/**
 * Wraps a single background card. Position/opacity is set via inline `left`/`top`
 * only; `transform` and `opacity` are driven imperatively per animation frame by
 * useStoryEngine (bypassing React re-renders, matching the source prototype's
 * direct-DOM-write approach for 60fps canvas-synced motion).
 */
export const FloatingCard = forwardRef<HTMLDivElement, FloatingCardProps>(function FloatingCard(
  { spec, index },
  ref
) {
  const isChip = spec.content.kind === "chip-file" || spec.content.kind === "chip-db";
  const rotate = index % 2 === 0 ? 1.2 : -1.2;

  return (
    <div
      ref={ref}
      className={styles.cardWrap}
      style={{ left: `${spec.left}%`, top: `${spec.top}%` }}
      data-cl={spec.cl}
    >
      <div
        className={[
          styles.card,
          styles[`depth-${spec.depth}`],
          isChip ? styles.cardChip : styles.cardPanel,
          spec.depth === "near" ? styles.cardHoverable : "",
        ].join(" ")}
        style={{ "--hoverRotate": `${rotate}deg` } as CSSProperties}
      >
        <CardBody content={spec.content} />
      </div>
    </div>
  );
});
