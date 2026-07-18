"use client";

import { useEffect, useRef, useState } from "react";

import { PRESETS } from "./data";
import landingStyles from "./landing.module.css";
import styles from "./live-demo.module.css";

const DEMO_PRESETS = PRESETS.slice(0, 2);

const TRACE_STEPS = [
  { title: "Interpret the question", key: "intent" as const, status: "interpreting question…" },
  { title: "Retrieve approved schema context", key: "tables" as const, status: "retrieving schema…" },
  { title: "Generate SQL", key: "sqlmeta" as const, status: "writing SQL…" },
  { title: "Execute & summarize", key: "runmeta" as const, status: "executing query…" },
];

const STAGE_WAITS = [700, 850, 900, 750];

type TraceStatus = "idle" | "active" | "done";

interface ResultData {
  title: string;
  head: [string, string];
  rows: Array<[string, string, number]>;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function computeTraceStates(idx: number, finalState: "active" | "done"): TraceStatus[] {
  return TRACE_STEPS.map((_, i) => {
    if (i < idx) return "done";
    if (i === idx) return finalState;
    return "idle";
  });
}

/**
 * "Watch it work" section: a side-by-side trace / answer walkthrough that
 * auto-loops between the two live presets while the section is in view.
 */
export function LiveDemo() {
  const [activePreset, setActivePreset] = useState(0);
  const [promptText, setPromptText] = useState("");
  const [showCaret, setShowCaret] = useState(false);
  const [traceStates, setTraceStates] = useState<TraceStatus[]>(() => computeTraceStates(-1, "active"));
  const [traceFills, setTraceFills] = useState({ intent: "", tables: "", sqlmeta: "", runmeta: "" });
  const [panelState, setPanelState] = useState("listening…");
  const [sqlHtml, setSqlHtml] = useState("");
  const [showSql, setShowSql] = useState(false);
  const [sqlLoading, setSqlLoading] = useState(true);
  const [result, setResult] = useState<ResultData | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [resultLoading, setResultLoading] = useState(true);

  const runTokenRef = useRef(0);
  const inViewRef = useRef(false);
  const aliveRef = useRef(true);
  const demoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = demoRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        inViewRef.current = entries[0]?.isIntersecting ?? false;
      },
      { threshold: 0.2 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    aliveRef.current = true;

    const waitInView = async () => {
      while (aliveRef.current && !inViewRef.current) await sleep(400);
    };

    const runPreset = async (idx: number) => {
      const myToken = ++runTokenRef.current;
      const preset = DEMO_PRESETS[idx];

      setActivePreset(idx);
      setShowSql(false);
      setSqlLoading(true);
      setShowResult(false);
      setResultLoading(true);
      setPanelState("listening…");
      setTraceStates(computeTraceStates(-1, "active"));
      setTraceFills({ intent: preset.intent, tables: preset.tables, sqlmeta: preset.sqlmeta, runmeta: preset.runmeta });
      setPromptText("");
      setShowCaret(true);

      for (let i = 0; i < preset.q.length; i++) {
        await sleep(20 + Math.random() * 16);
        if (runTokenRef.current !== myToken) return;
        setPromptText((prev) => prev + preset.q[i]);
      }
      setShowCaret(false);

      for (let i = 0; i < STAGE_WAITS.length; i++) {
        setTraceStates(computeTraceStates(i, "active"));
        setPanelState(TRACE_STEPS[i].status);
        if (i === 2) {
          setSqlHtml(preset.sql);
          setShowSql(true);
          setSqlLoading(false);
        }
        await sleep(STAGE_WAITS[i]);
        if (runTokenRef.current !== myToken) return;
      }

      setTraceStates(computeTraceStates(STAGE_WAITS.length - 1, "done"));
      setResultLoading(false);
      setPanelState("answer ready ✓");
      setResult({ title: preset.rowsTitle, head: preset.head, rows: preset.rows });
      setShowResult(true);
    };

    const loop = async () => {
      let idx = 0;
      while (aliveRef.current) {
        await waitInView();
        if (!aliveRef.current) return;
        await runPreset(idx);
        if (!aliveRef.current) return;
        await sleep(4800);
        idx = (idx + 1) % DEMO_PRESETS.length;
      }
    };

    void loop();
    return () => {
      aliveRef.current = false;
      runTokenRef.current += 1;
    };
  }, []);

  function handleChipClick(idx: number) {
    runTokenRef.current += 1;
    const myToken = ++runTokenRef.current;
    const preset = DEMO_PRESETS[idx];
    setActivePreset(idx);
    setShowSql(false);
    setSqlLoading(true);
    setShowResult(false);
    setResultLoading(true);
    setPanelState("listening…");
    setTraceStates(computeTraceStates(-1, "active"));
    setTraceFills({ intent: preset.intent, tables: preset.tables, sqlmeta: preset.sqlmeta, runmeta: preset.runmeta });
    setPromptText(preset.q);
    setShowCaret(false);

    void (async () => {
      for (let i = 0; i < STAGE_WAITS.length; i++) {
        setTraceStates(computeTraceStates(i, "active"));
        setPanelState(TRACE_STEPS[i].status);
        if (i === 2) {
          setSqlHtml(preset.sql);
          setShowSql(true);
          setSqlLoading(false);
        }
        await sleep(STAGE_WAITS[i]);
        if (runTokenRef.current !== myToken) return;
      }
      setTraceStates(computeTraceStates(STAGE_WAITS.length - 1, "done"));
      setResultLoading(false);
      setPanelState("answer ready ✓");
      setResult({ title: preset.rowsTitle, head: preset.head, rows: preset.rows });
      setShowResult(true);
    })();
  }

  const maxBar = result ? Math.max(...result.rows.map((row) => row[2])) : 1;

  return (
    <section id="see" className={styles.section}>
      <div className={styles.head}>
        <span className={landingStyles.eyebrow}>Live</span>
        <h2>Watch it work.</h2>
      </div>

      <div className={styles.frame}>
        <div className={landingStyles.ask} style={{ minHeight: "auto" }} ref={demoRef}>
          <div className={landingStyles.askHeader}>
            <div className={landingStyles.askHeaderLeft}>
              <div className={landingStyles.dots}>
                <span />
                <span />
                <span />
              </div>
              Ask Dataverse
            </div>
            <span className={landingStyles.askTag}>
              <span className={landingStyles.askTagDot} />
              live · production replica
            </span>
          </div>

          <div className={landingStyles.askBody}>
            <div className={styles.chips}>
              {DEMO_PRESETS.map((preset, i) => (
                <button
                  key={preset.q}
                  type="button"
                  className={`${landingStyles.askPreset} ${activePreset === i ? landingStyles.active : ""}`}
                  onClick={() => handleChipClick(i)}
                >
                  {preset.q}
                </button>
              ))}
            </div>

            <div className={landingStyles.askPrompt}>
              <div className={landingStyles.askPromptLabel}>Ask</div>
              <div className={landingStyles.askPromptText}>
                {promptText}
                {showCaret && <span className={landingStyles.caret} />}
              </div>
            </div>

            <div className={styles.grid}>
              <div className={styles.traceCol}>
                {TRACE_STEPS.map((step, i) => {
                  const state = traceStates[i];
                  return (
                    <div
                      key={step.title}
                      className={`${landingStyles.traceStep} ${state === "active" ? landingStyles.active : ""} ${state === "done" ? landingStyles.done : ""}`}
                    >
                      <div className={landingStyles.traceNum}>{i + 1}</div>
                      <div>
                        <div className={landingStyles.traceTitle}>{step.title}</div>
                        <div className={landingStyles.traceDetail}>{traceFills[step.key]}</div>
                      </div>
                      <div className={landingStyles.traceStatus}>
                        {state === "done" ? "✓" : state === "active" ? <span className={landingStyles.traceSpinner} /> : "…"}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className={styles.answerCol}>
                <div className={styles.answerHead}>
                  <span>ANSWER PANEL</span>
                  <span>{panelState}</span>
                </div>

                <div className={`${styles.panelSlot} ${styles.sqlSlot}`}>
                  <div
                    className={`${styles.skeleton} ${styles.skeletonDark}`}
                    style={{ opacity: sqlLoading ? 1 : 0 }}
                  >
                    <span className={styles.skeletonLine} style={{ width: "52%" }} />
                    <span className={styles.skeletonLine} style={{ width: "78%" }} />
                    <span className={styles.skeletonLine} style={{ width: "66%" }} />
                  </div>
                  <pre
                    className={`${styles.sqlPanel} ${showSql ? styles.show : ""}`}
                    dangerouslySetInnerHTML={{ __html: sqlHtml }}
                  />
                </div>

                <div className={styles.panelSlot}>
                  <div
                    className={`${styles.skeleton} ${styles.skeletonLight}`}
                    style={{ opacity: resultLoading ? 1 : 0 }}
                  >
                    <span className={styles.skeletonLine} style={{ width: "42%" }} />
                    <span className={styles.skeletonLine} style={{ width: "88%" }} />
                    <span className={styles.skeletonLine} style={{ width: "70%" }} />
                    <span className={styles.skeletonLine} style={{ width: "55%" }} />
                  </div>
                  <div className={`${styles.resultPanel} ${showResult ? styles.show : ""}`}>
                    <div className={landingStyles.resultHeader}>
                      <span>{result?.title ?? ""}</span>
                      <span>inspected by analyst</span>
                    </div>
                    <table className={landingStyles.resultTable}>
                      {result && (
                        <>
                          <thead>
                            <tr>
                              {result.head.map((h) => (
                                <th key={h}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {result.rows.map((row) => {
                              const width = Math.round((row[2] / maxBar) * 140);
                              return (
                                <tr key={row[0]}>
                                  <td>{row[0]}</td>
                                  <td>
                                    <span className={landingStyles.bar} style={{ width: `${width}px` }} />
                                    {row[1]}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </>
                      )}
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
