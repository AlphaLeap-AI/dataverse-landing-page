"use client";

import { useEffect, useRef, useState } from "react";

import { PRESETS } from "./data";
import styles from "./landing.module.css";

const PARTICLE_TOKENS = [
  "SELECT arr",
  "GROUP BY region",
  "JOIN customers",
  "renewal_risk",
  "date_trunc",
  "SUM(arr)",
  "WHERE tier",
  "ORDER BY",
  "subscriptions",
  "COUNT(DISTINCT)",
  "plan_code",
  "approved",
  "→ SQL",
  "142ms",
];

const TRACE_STEPS = [
  { title: "Interpret the question", key: "intent" as const },
  { title: "Retrieve approved schema context", key: "tables" as const },
  { title: "Generate SQL", key: "sqlmeta" as const },
  { title: "Execute & summarize", key: "runmeta" as const },
];

const STAGE_WAITS = [700, 850, 900, 700];

type TraceStatus = "idle" | "active" | "done";

interface Particle {
  id: number;
  token: string;
  left: number;
  duration: number;
}

interface ResultData {
  title: string;
  head: [string, string];
  rows: Array<[string, string, number]>;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** idx === -1 resets every step to idle, matching the prototype's setTraceState(-1, "idle"). */
function computeTraceStates(idx: number, finalState: "active" | "done"): TraceStatus[] {
  return TRACE_STEPS.map((_, i) => {
    if (i < idx) return "done";
    if (i === idx) return finalState;
    return "idle";
  });
}

/**
 * Hero "Ask Dataverse" interactive demo: types out a preset question, steps
 * through the interpret → retrieve → generate → execute trace, reveals the
 * generated SQL, then renders a result table. Auto-cycles through presets
 * while the demo is in view.
 */
export function AskDemo() {
  const [promptText, setPromptText] = useState("");
  const [showCaret, setShowCaret] = useState(false);
  const [traceStates, setTraceStates] = useState<TraceStatus[]>(() => computeTraceStates(-1, "active"));
  const [traceFills, setTraceFills] = useState({ intent: "", tables: "", sqlmeta: "", runmeta: "" });
  const [sqlHtml, setSqlHtml] = useState("");
  const [showSql, setShowSql] = useState(false);
  const [result, setResult] = useState<ResultData | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [activePreset, setActivePreset] = useState(0);
  const [particles, setParticles] = useState<Particle[]>([]);

  const runTokenRef = useRef(0);
  const currentPresetRef = useRef(0);
  const heroInViewRef = useRef(true);
  const cycleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const askRef = useRef<HTMLDivElement>(null);
  const particleIdRef = useRef(0);
  const reducedMotionRef = useRef(false);

  async function typeText(text: string, runToken: number, speed: number) {
    setPromptText("");
    if (reducedMotionRef.current) {
      setShowCaret(false);
      setPromptText(text);
      return;
    }
    setShowCaret(true);
    for (let i = 0; i < text.length; i++) {
      await sleep(speed + Math.random() * 18);
      if (runTokenRef.current !== runToken) return;
      setPromptText((prev) => prev + text[i]);
    }
    setShowCaret(false);
  }

  async function runPreset(idx: number) {
    runTokenRef.current += 1;
    const myToken = runTokenRef.current;
    const preset = PRESETS[idx];

    setShowSql(false);
    setSqlHtml("");
    setShowResult(false);
    setTraceStates(computeTraceStates(-1, "active"));
    setTraceFills({
      intent: preset.intent,
      tables: preset.tables,
      sqlmeta: preset.sqlmeta,
      runmeta: preset.runmeta,
    });

    await typeText(preset.q, myToken, 18);
    if (runTokenRef.current !== myToken) return;

    for (let i = 0; i < STAGE_WAITS.length; i++) {
      setTraceStates(computeTraceStates(i, "active"));
      if (i === 2) {
        setSqlHtml(preset.sql);
        setShowSql(true);
      }
      await sleep(STAGE_WAITS[i]);
      if (runTokenRef.current !== myToken) return;
    }

    setTraceStates(computeTraceStates(STAGE_WAITS.length - 1, "done"));
    setResult({ title: preset.rowsTitle, head: preset.head, rows: preset.rows });
    setShowResult(true);
  }

  function scheduleCycle() {
    if (cycleTimerRef.current) clearTimeout(cycleTimerRef.current);
    cycleTimerRef.current = setTimeout(() => {
      if (!heroInViewRef.current) {
        scheduleCycle();
        return;
      }
      currentPresetRef.current = (currentPresetRef.current + 1) % PRESETS.length;
      setActivePreset(currentPresetRef.current);
      void runPreset(currentPresetRef.current).then(scheduleCycle);
    }, 9000);
  }

  function handlePresetClick(idx: number) {
    currentPresetRef.current = idx;
    setActivePreset(idx);
    void runPreset(idx);
  }

  // Kick off the first run, then start the auto-cycle.
  useEffect(() => {
    reducedMotionRef.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const startTimer = setTimeout(() => void runPreset(0), 600);
    const cycleKickTimer = reducedMotionRef.current ? null : setTimeout(scheduleCycle, 7500);

    return () => {
      clearTimeout(startTimer);
      if (cycleKickTimer) clearTimeout(cycleKickTimer);
      if (cycleTimerRef.current) clearTimeout(cycleTimerRef.current);
      runTokenRef.current += 1;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Pause the auto-cycle while the demo is scrolled out of view.
  useEffect(() => {
    const el = askRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        heroInViewRef.current = entries[0]?.isIntersecting ?? true;
      },
      { threshold: 0.25 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Floating SQL-fragment particles in the aura behind the demo.
  useEffect(() => {
    if (reducedMotionRef.current) return;

    const spawn = () => {
      const id = particleIdRef.current++;
      const token = PARTICLE_TOKENS[Math.floor(Math.random() * PARTICLE_TOKENS.length)];
      const left = 6 + Math.random() * 88;
      const duration = 5 + Math.random() * 4;
      setParticles((prev) => [...prev, { id, token, left, duration }]);
      setTimeout(() => {
        setParticles((prev) => prev.filter((p) => p.id !== id));
      }, 10000);
    };

    const initialTimers = [0, 1, 2, 3].map((i) => setTimeout(spawn, i * 400));
    const interval = setInterval(spawn, 900);

    return () => {
      initialTimers.forEach(clearTimeout);
      clearInterval(interval);
    };
  }, []);

  const maxBar = result ? Math.max(...result.rows.map((row) => row[2])) : 1;

  return (
    <div className={styles.askStage}>
      <div className={styles.askAura} aria-hidden="true">
        <div className={`${styles.blob} ${styles.b1}`} />
        <div className={`${styles.blob} ${styles.b2}`} />
        <div className={`${styles.blob} ${styles.b3}`} />
      </div>
      <div className={styles.askGrid} aria-hidden="true" />
      <div className={styles.askParticles} aria-hidden="true">
        {particles.map((particle) => (
          <span
            key={particle.id}
            className={styles.askParticle}
            style={{ left: `${particle.left}%`, animationDuration: `${particle.duration}s` }}
          >
            {particle.token}
          </span>
        ))}
      </div>

      <div className={styles.ask} ref={askRef}>
        <div className={styles.askHeader}>
          <div className={styles.askHeaderLeft}>
            <div className={styles.dots}>
              <span />
              <span />
              <span />
            </div>
            <span>Ask Dataverse</span>
          </div>
          <span className={styles.askTag}>
            <span className={styles.askTagDot} />
            live walkthrough
          </span>
        </div>

        <div className={styles.askBody}>
          <div className={styles.askPresets} role="tablist" aria-label="Preset questions">
            {PRESETS.map((preset, i) => (
              <button
                key={preset.q}
                type="button"
                role="tab"
                aria-selected={activePreset === i}
                className={`${styles.askPreset} ${activePreset === i ? styles.active : ""}`}
                onClick={() => handlePresetClick(i)}
              >
                {preset.q}
              </button>
            ))}
          </div>

          <div className={styles.askPrompt}>
            <div className={styles.askPromptLabel}>Ask</div>
            <div className={styles.askPromptText}>
              {promptText}
              {showCaret && <span className={styles.caret} />}
            </div>
          </div>

          <div className={styles.askTrace}>
            {TRACE_STEPS.map((step, i) => {
              const state = traceStates[i];
              return (
                <div
                  key={step.title}
                  className={`${styles.traceStep} ${state === "active" ? styles.active : ""} ${state === "done" ? styles.done : ""}`}
                >
                  <div className={styles.traceNum}>{i + 1}</div>
                  <div>
                    <div className={styles.traceTitle}>{step.title}</div>
                    <div className={styles.traceDetail}>{traceFills[step.key]}</div>
                  </div>
                  <div className={styles.traceStatus}>
                    {state === "done" ? "✓" : state === "active" ? <span className={styles.traceSpinner} /> : "…"}
                  </div>
                </div>
              );
            })}
          </div>

          <pre
            className={`${styles.askSql} ${showSql ? styles.show : ""}`}
            dangerouslySetInnerHTML={{ __html: sqlHtml }}
          />

          <div className={`${styles.askResult} ${showResult ? styles.show : ""}`}>
            <div className={styles.askResultInner}>
              <div className={styles.resultHeader}>
                <span>{result?.title ?? ""}</span>
                <span>inspected by analyst</span>
              </div>
              <table className={styles.resultTable}>
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
                              <span className={styles.bar} style={{ width: `${width}px` }} />
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
  );
}
