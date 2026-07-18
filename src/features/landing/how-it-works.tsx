"use client";

import { useEffect, useRef, useState } from "react";

import { PRESETS } from "./data";
import styles from "./landing.module.css";

const STEPS = [
  {
    title: "Connect the systems your team relies on",
    desc: "Live databases or imported metadata — warehouse-first, not generic chat.",
  },
  {
    title: "Review & approve the schema context",
    desc: "Descriptions, relationships, and values are checked before any answer runs.",
  },
  {
    title: "Ask, inspect SQL, and reuse the result",
    desc: "Natural-language questions become SQL, traces, and reusable dashboard views.",
  },
  {
    title: "Pin to a dashboard for live updates",
    desc: "Promote any answer into a tile. Numbers refresh on schedule so the team watches what matters.",
  },
];

const CONNECTIONS = [
  { name: "postgres_prod", meta: "42 tables · 3.1M rows", status: "synced 2m ago" },
  { name: "snowflake_warehouse", meta: "128 tables · 812M rows", status: "synced 14m ago" },
  { name: "bigquery_events", meta: "64 tables · 2.4B rows", status: "synced 6m ago" },
  { name: "mysql_billing", meta: "28 tables · 402K rows", status: "synced 1m ago" },
  { name: "databricks_lake", meta: "216 tables · 14B rows", status: "synced 22m ago" },
  { name: "metadata.yml (import)", meta: "84 entries · 3 domains", status: "approved" },
];

const SCHEMA_PATHS = [
  "M 12 28 C 28 28, 30 52, 42 52",
  "M 56 52 C 64 52, 66 22, 72 22",
  "M 56 52 C 64 52, 66 78, 72 78",
];

const SCHEMA_NODES = [
  {
    title: "customers",
    style: { top: "18%", left: "2%" },
    primary: false,
    cols: [
      { text: "id · uuid", highlight: false },
      { text: "region · text", highlight: true },
      { text: "tier · enum", highlight: false },
    ],
  },
  {
    title: "subscriptions",
    style: { top: "42%", left: "35%" },
    primary: true,
    cols: [
      { text: "arr · numeric", highlight: true },
      { text: "renewal_risk · enum", highlight: true },
      { text: "started_at", highlight: false },
    ],
  },
  {
    title: "plans",
    style: { top: "12%", left: "66%" },
    primary: false,
    cols: [
      { text: "code · text", highlight: false },
      { text: "tier · enum", highlight: false },
    ],
  },
  {
    title: "renewals",
    style: { top: "68%", left: "66%" },
    primary: false,
    cols: [
      { text: "event_type", highlight: false },
      { text: "occurred_at", highlight: false },
    ],
  },
];

const WEEKS = 12;
const CHART_MAX = 7;
const CHART_MIN = 0.5;
const CHART_W = 600;
const CHART_H = 200;
const CHART_PAD = 10;

interface DashState {
  a: number[];
  b: number[];
  c: number[];
  tile: [number, number, number];
}

function initDashState(): DashState {
  return {
    a: Array.from({ length: WEEKS }, (_, i) => 4.8 + Math.sin(i * 0.7) * 0.6 + i * 0.04),
    b: Array.from({ length: WEEKS }, (_, i) => 3.2 + Math.cos(i * 0.5) * 0.5 + i * 0.02),
    c: Array.from({ length: WEEKS }, (_, i) => 2.0 + Math.sin(i * 0.9 + 1) * 0.4),
    tile: [5670000, 142, 39900],
  };
}

function driftSeries(arr: number[], range: number): number[] {
  const last = arr[arr.length - 1];
  const next = Math.max(CHART_MIN, Math.min(CHART_MAX, last + (Math.random() - 0.5) * range));
  return [...arr.slice(1), next];
}

function tickDash(prev: DashState): DashState {
  return {
    a: driftSeries(prev.a, 0.5),
    b: driftSeries(prev.b, 0.35),
    c: driftSeries(prev.c, 0.3),
    tile: [
      Math.max(4.5e6, Math.min(7e6, prev.tile[0] + (Math.random() - 0.4) * 80000)),
      Math.max(120, Math.min(170, prev.tile[1] + (Math.random() > 0.5 ? 1 : -1))),
      Math.max(30000, Math.min(50000, prev.tile[2] + (Math.random() - 0.5) * 500)),
    ],
  };
}

function buildPath(arr: number[]): string {
  const stepX = (CHART_W - CHART_PAD * 2) / (arr.length - 1);
  return arr
    .map((v, i) => {
      const x = CHART_PAD + i * stepX;
      const y = CHART_PAD + (1 - (v - CHART_MIN) / (CHART_MAX - CHART_MIN)) * (CHART_H - CHART_PAD * 2);
      return (i === 0 ? "M" : "L") + x.toFixed(1) + " " + y.toFixed(1);
    })
    .join(" ");
}

function buildArea(arr: number[]): string {
  const line = buildPath(arr);
  const stepX = (CHART_W - CHART_PAD * 2) / (arr.length - 1);
  const lastX = (CHART_PAD + (arr.length - 1) * stepX).toFixed(1);
  return `${line} L ${lastX} ${CHART_H - CHART_PAD} L ${CHART_PAD} ${CHART_H - CHART_PAD} Z`;
}

function lastPoint(arr: number[]): { x: number; y: number } {
  const stepX = (CHART_W - CHART_PAD * 2) / (arr.length - 1);
  const idx = arr.length - 1;
  const x = CHART_PAD + idx * stepX;
  const y = CHART_PAD + (1 - (arr[idx] - CHART_MIN) / (CHART_MAX - CHART_MIN)) * (CHART_H - CHART_PAD * 2);
  return { x, y };
}

function fmtMoney(v: number): string {
  if (v >= 1e6) return "$" + (v / 1e6).toFixed(2) + "M";
  if (v >= 1e3) return "$" + (v / 1e3).toFixed(1) + "K";
  return "$" + Math.round(v);
}

function formatSince(updatedAt: number): string {
  const sec = Math.floor((Date.now() - updatedAt) / 1000);
  if (sec < 5) return "just now";
  if (sec < 60) return `${sec}s ago`;
  return `${Math.floor(sec / 60)}m ago`;
}

/**
 * "How it works" stepper: 4 stages, each swapping in a scene (connect grid,
 * schema graph, SQL + result, live dashboard). Auto-advances every 7s and
 * resets that timer on manual selection.
 */
export function HowItWorks() {
  const [activeStage, setActiveStage] = useState(0);
  const [schemaPlaying, setSchemaPlaying] = useState(false);
  const [dashState, setDashState] = useState<DashState>(() => initDashState());
  const [flashIdx, setFlashIdx] = useState<number | null>(null);
  const [sinceLabel, setSinceLabel] = useState("just now");

  const advanceTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const updatedAtRef = useRef(Date.now());

  function startAutoAdvance() {
    if (advanceTimerRef.current) clearInterval(advanceTimerRef.current);
    advanceTimerRef.current = setInterval(() => {
      setActiveStage((prev) => (prev + 1) % STEPS.length);
    }, 7000);
  }

  useEffect(() => {
    startAutoAdvance();
    return () => {
      if (advanceTimerRef.current) clearInterval(advanceTimerRef.current);
    };
  }, []);

  function handleStepClick(i: number) {
    setActiveStage(i);
    startAutoAdvance();
  }

  // Replay the schema-graph line animation each time stage 1 becomes active.
  useEffect(() => {
    if (activeStage !== 1) {
      setSchemaPlaying(false);
      return;
    }
    setSchemaPlaying(false);
    const raf = requestAnimationFrame(() => setSchemaPlaying(true));
    return () => cancelAnimationFrame(raf);
  }, [activeStage]);

  // Drive the live dashboard only while stage 3 is active.
  useEffect(() => {
    if (activeStage !== 3) return;

    setSinceLabel(formatSince(updatedAtRef.current));

    const tickTimer = setInterval(() => {
      setDashState((prev) => tickDash(prev));
      updatedAtRef.current = Date.now();
      const idx = Math.floor(Math.random() * 3);
      setFlashIdx(idx);
      setTimeout(() => setFlashIdx((cur) => (cur === idx ? null : cur)), 700);
    }, 2200);

    const sinceTimer = setInterval(() => {
      setSinceLabel(formatSince(updatedAtRef.current));
    }, 1000);

    return () => {
      clearInterval(tickTimer);
      clearInterval(sinceTimer);
    };
  }, [activeStage]);

  const pathA = buildPath(dashState.a);
  const pathB = buildPath(dashState.b);
  const pathC = buildPath(dashState.c);
  const areaA = buildArea(dashState.a);
  const dotA = lastPoint(dashState.a);

  return (
    <div className={styles.howLayout}>
      <div className={styles.howSteps} role="tablist">
        {STEPS.map((step, i) => (
          <button
            key={step.title}
            type="button"
            role="tab"
            aria-selected={activeStage === i}
            className={`${styles.howStep} ${activeStage === i ? styles.active : ""}`}
            onClick={() => handleStepClick(i)}
          >
            <div className={styles.howStepNum}>{String(i + 1).padStart(2, "0")}</div>
            <div>
              <div className={styles.howStepTitle}>{step.title}</div>
              <div className={styles.howStepDesc}>{step.desc}</div>
            </div>
          </button>
        ))}
      </div>

      <div className={styles.howPanel}>
        <div className={styles.howPanelHeader}>
          <h3>{STEPS[activeStage].title}</h3>
          <span className={styles.howPanelBadge}>Stage {String(activeStage + 1).padStart(2, "0")}</span>
        </div>

        <div className={styles.howScene}>
          {activeStage === 0 && (
            <div className={styles.sceneConnect}>
              {CONNECTIONS.map((db) => (
                <div key={db.name} className={styles.sceneDb}>
                  <div className={styles.sceneDbName}>{db.name}</div>
                  <div className={styles.sceneDbMeta}>{db.meta}</div>
                  <div className={styles.sceneDbStatus}>
                    <span className={styles.d} />
                    {db.status}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeStage === 1 && (
            <div className={`${styles.sceneSchema} ${schemaPlaying ? styles.playing : ""}`}>
              <svg className={styles.schemaLines} viewBox="0 0 100 100" preserveAspectRatio="none">
                {SCHEMA_PATHS.map((d) => (
                  <path key={d} d={d} />
                ))}
              </svg>
              {SCHEMA_NODES.map((node) => (
                <div
                  key={node.title}
                  className={`${styles.schemaNode} ${node.primary ? styles.primary : ""}`}
                  style={node.style}
                >
                  <div className={styles.schemaNodeTitle}>{node.title}</div>
                  {node.cols.map((col) => (
                    <div
                      key={col.text}
                      className={`${styles.schemaNodeCol} ${col.highlight ? styles.highlight : ""}`}
                    >
                      {col.text}
                    </div>
                  ))}
                </div>
              ))}
              <div className={styles.sceneSchemaStamp}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Context approved · 4 tables, 2 joins
              </div>
            </div>
          )}

          {activeStage === 2 && (
            <div className={styles.sceneSqlWrap}>
              <pre className={styles.sceneSql} dangerouslySetInnerHTML={{ __html: PRESETS[0].sql }} />
              <div className={styles.sceneResult}>
                <div className={styles.resultHeader}>
                  <span>Result · 4 rows · 142ms</span>
                  <span>exported to dashboard</span>
                </div>
                <table className={styles.resultTable}>
                  <thead>
                    <tr>
                      {PRESETS[0].head.map((h) => (
                        <th key={h}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {PRESETS[0].rows.map((row) => (
                      <tr key={row[0]}>
                        <td>{row[0]}</td>
                        <td>
                          <span className={styles.bar} style={{ width: `${row[2]}px` }} />
                          {row[1]}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeStage === 3 && (
            <div className={styles.sceneDashboard}>
              <div className={styles.dashToolbar}>
                <div className={styles.dashTitle}>Renewal Risk · weekly</div>
                <div className={styles.dashMeta}>
                  <span className={styles.dashLive}>
                    <span className={styles.dashLiveDot} />
                    live
                  </span>
                  <span className={styles.dashUpdated}>updated {sinceLabel}</span>
                </div>
              </div>
              <div className={styles.dashGrid}>
                <div className={`${styles.dashTile} ${flashIdx === 0 ? styles.flash : ""}`}>
                  <div className={styles.dashTileLabel}>Revenue at risk</div>
                  <div className={styles.dashTileValue}>{fmtMoney(dashState.tile[0])}</div>
                  <div className={`${styles.dashTileTrend} ${styles.up}`}>▲ 4.2% wow</div>
                </div>
                <div className={`${styles.dashTile} ${flashIdx === 1 ? styles.flash : ""}`}>
                  <div className={styles.dashTileLabel}>Accounts flagged</div>
                  <div className={styles.dashTileValue}>{Math.round(dashState.tile[1]).toLocaleString()}</div>
                  <div className={`${styles.dashTileTrend} ${styles.down}`}>▼ 6 this week</div>
                </div>
                <div className={`${styles.dashTile} ${flashIdx === 2 ? styles.flash : ""}`}>
                  <div className={styles.dashTileLabel}>Avg. ARR · at risk</div>
                  <div className={styles.dashTileValue}>{fmtMoney(dashState.tile[2])}</div>
                  <div className={`${styles.dashTileTrend} ${styles.up}`}>▲ 1.8% wow</div>
                </div>

                <div className={styles.dashChart}>
                  <div className={styles.dashChartHead}>
                    <div className={styles.dashChartTitle}>Risk by region · last 6 weeks</div>
                    <div className={styles.dashChartLegend}>
                      <span>
                        <i style={{ background: "var(--accent)" }} />
                        EMEA
                      </span>
                      <span>
                        <i style={{ background: "#5e9bff" }} />
                        NA
                      </span>
                      <span>
                        <i style={{ background: "#8b93f5" }} />
                        APAC
                      </span>
                    </div>
                  </div>
                  <svg className={styles.dashChartSvg} viewBox="0 0 600 200" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="howDashGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.25} />
                        <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <g stroke="var(--border-cream)" strokeWidth={1}>
                      <line x1="0" y1="40" x2="600" y2="40" />
                      <line x1="0" y1="90" x2="600" y2="90" />
                      <line x1="0" y1="140" x2="600" y2="140" />
                      <line x1="0" y1="190" x2="600" y2="190" />
                    </g>
                    <path d={areaA} fill="url(#howDashGradient)" />
                    <path d={pathA} fill="none" stroke="var(--accent)" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
                    <path d={pathB} fill="none" stroke="#5e9bff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                    <path d={pathC} fill="none" stroke="#8b93f5" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" strokeDasharray="4 4" />
                    <circle cx={dotA.x} cy={dotA.y} r={4} fill="var(--accent)" />
                  </svg>
                </div>
              </div>
              <div className={styles.dashPinned}>
                <span className={styles.dashPinnedIcon} aria-hidden="true">📌</span>
                Pinned from <span className={styles.mono}>Q: Which regions are at highest renewal risk?</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
