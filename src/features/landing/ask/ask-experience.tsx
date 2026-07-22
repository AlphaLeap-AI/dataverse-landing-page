"use client";

import { ArrowRight, RotateCcw, Sparkles, TrendingUp, Users } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type ComponentType } from "react";

import { askState } from "../experience/scroll-driver";
import { DEMO_SCENARIOS, splitValue, type Scenario } from "./ask-data";
import styles from "./ask.module.css";

type Phase = "idle" | "sourcing" | "sql" | "chart" | "answer";

const SQL_KEYWORDS =
  /\b(SELECT|FROM|WHERE|GROUP BY|ORDER BY|LIMIT|JOIN|LEFT JOIN|ON|AND|OVER|PARTITION BY|AS|DESC|ASC|IN|NOT IN|BETWEEN|current_date|date_trunc)\b/g;

/** SQL strings are our own static constants — safe to colorize as HTML. */
function colorizeSql(sql: string): string {
  const escaped = sql.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return escaped
    .replace(SQL_KEYWORDS, '<span class="kw">$1</span>')
    .replace(/'[^']*'/g, '<span class="str">$&</span>')
    .replace(/\b(\d+(?:\.\d+)?)\b/g, '<span class="num">$1</span>');
}

const DEMO_META: Record<
  string,
  { Icon: ComponentType<{ size?: number; strokeWidth?: number; className?: string; "aria-hidden"?: boolean }>; hint: string }
> = {
  churn: { Icon: Users, hint: "Retention · support risk" },
  growth: { Icon: TrendingUp, hint: "Revenue · regions" },
};

interface AskExperienceProps {
  onPhaseChange?: (active: boolean) => void;
}

/**
 * Hero demo: two curated sample questions only. Free-text is intentionally
 * omitted — only these scripted scenarios are wired. Pick one, watch the
 * pipeline, then try the other or book a real demo.
 */
export function AskExperience({ onPhaseChange }: AskExperienceProps) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [typedSql, setTypedSql] = useState("");
  const [sqlDone, setSqlDone] = useState(false);
  const [num, setNum] = useState(0);
  const runRef = useRef(0);

  const setPhaseAndPulse = useCallback((p: Phase) => {
    setPhase(p);
    askState.pulse = p === "idle" ? 0 : p === "sourcing" ? 0.55 : p === "sql" ? 0.75 : p === "chart" ? 0.9 : 1;
  }, []);

  useEffect(() => {
    onPhaseChange?.(phase !== "idle");
  }, [phase, onPhaseChange]);

  // Cancel every pending timer on unmount.
  useEffect(
    () => () => {
      runRef.current++;
      askState.pulse = 0;
    },
    []
  );

  const run = useCallback(
    (picked: Scenario) => {
      const runId = ++runRef.current;
      const alive = () => runRef.current === runId;

      setScenario(picked);
      setTypedSql("");
      setSqlDone(false);
      setNum(0);
      setPhaseAndPulse("sourcing");

      window.setTimeout(() => {
        if (!alive()) return;
        setPhaseAndPulse("sql");
        // Typewriter
        let i = 0;
        const tick = () => {
          if (!alive()) return;
          i += 2 + Math.floor(Math.random() * 2);
          setTypedSql(picked.sql.slice(0, i));
          if (i < picked.sql.length) {
            window.setTimeout(tick, 14 + Math.random() * 22);
          } else {
            setSqlDone(true);
            window.setTimeout(() => {
              if (!alive()) return;
              setPhaseAndPulse("chart");
              window.setTimeout(() => {
                if (!alive()) return;
                setPhaseAndPulse("answer");
              }, 1150);
            }, 450);
          }
        };
        tick();
      }, 1500);
    },
    [setPhaseAndPulse]
  );

  // Answer number count-up.
  useEffect(() => {
    if (phase !== "answer" || !scenario) return;
    const { num: target } = splitValue(scenario.value);
    let raf = 0;
    const t0 = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - t0) / 1000);
      setNum(target * (1 - Math.pow(1 - t, 3)));
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [phase, scenario]);

  const reset = useCallback(() => {
    runRef.current++;
    setScenario(null);
    setTypedSql("");
    setSqlDone(false);
    setNum(0);
    setPhaseAndPulse("idle");
  }, [setPhaseAndPulse]);

  const select = (picked: Scenario) => {
    if (phase !== "idle") return;
    run(picked);
  };

  const running = phase !== "idle";
  const parts = scenario ? splitValue(scenario.value) : null;
  const sqlVisible = scenario && (phase === "sql" || phase === "chart" || phase === "answer");
  const chartVisible = scenario && (phase === "chart" || phase === "answer");
  const answerVisible = scenario && phase === "answer";

  return (
    <div className={`${styles.root} ${running ? styles.active : ""}`}>
      {!running ? (
        <div className={styles.picker}>
          <p className={styles.pickerLabel}>
            <Sparkles size={14} strokeWidth={2.2} aria-hidden="true" />
            Try a sample question
          </p>
          <div className={styles.questionGrid} role="list">
            {DEMO_SCENARIOS.map((s) => {
              const meta = DEMO_META[s.id];
              const Icon = meta?.Icon ?? Sparkles;
              return (
                <button
                  key={s.id}
                  type="button"
                  role="listitem"
                  className={styles.questionCard}
                  onClick={() => select(s)}
                >
                  <span className={styles.questionIcon} aria-hidden="true">
                    <Icon size={18} strokeWidth={2.1} />
                  </span>
                  <span className={styles.questionBody}>
                    <span className={styles.questionHint}>{meta?.hint ?? "Sample demo"}</span>
                    <span className={styles.qFull}>{s.question}</span>
                    <span className={styles.qShort}>{s.short}</span>
                  </span>
                  <span className={styles.questionCta}>
                    Run demo
                    <ArrowRight size={13} strokeWidth={2.6} aria-hidden="true" />
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div className={styles.selectedBar} aria-live="polite">
          <Sparkles size={16} strokeWidth={2.2} className={styles.icon} aria-hidden="true" />
          <span className={styles.selectedQuestion}>{scenario?.question}</span>
          {phase !== "answer" ? (
            <span className={styles.thinkingTag}>
              <span className={styles.liveDot} />
              Thinking…
            </span>
          ) : (
            <span className={styles.doneTag}>Answer ready</span>
          )}
        </div>
      )}

      <div className={styles.stage} aria-live="polite">
        {scenario && phase === "sourcing" ? (
          <div className={`${styles.sourcing} ${styles.panel}`}>
            <span className={styles.panelLabel}>
              <span className={styles.liveDot} />
              Querying {scenario.sources.length} sources…
            </span>
            <div className={styles.sourceRow}>
              {scenario.sources.map((s, i) => (
                <span key={s} className={styles.sourceChip} style={{ animationDelay: `${0.25 + i * 0.32}s` }}>
                  <i />
                  {s}
                </span>
              ))}
            </div>
          </div>
        ) : null}

        {sqlVisible ? (
          <div className={`${styles.sqlPanel} ${styles.panel} ${phase !== "sql" ? styles.docked : ""}`}>
            <span className={styles.panelLabel}>
              The query behind it
              <span className={styles.tagMono}>SQL · inspectable</span>
            </span>
            <pre className={styles.code}>
              {sqlDone ? (
                <code dangerouslySetInnerHTML={{ __html: colorizeSql(scenario.sql) }} />
              ) : (
                <code>
                  {typedSql}
                  <span className={styles.caret} />
                </code>
              )}
            </pre>
          </div>
        ) : null}

        {chartVisible ? (
          <div className={`${styles.chartPanel} ${styles.panel} ${phase === "answer" ? styles.docked : ""}`}>
            <span className={styles.panelLabel}>The shape of it</span>
            <div className={styles.bars}>
              {scenario.bars.map((b, i) => (
                <div key={b.label} className={styles.barCol}>
                  <span
                    className={`${styles.barFill} ${b.hot ? styles.barHot : ""}`}
                    style={{ height: `${b.h * 100}%`, transitionDelay: `${i * 110}ms` }}
                  />
                  <span className={styles.barLabel}>{b.label}</span>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {answerVisible && parts ? (
          <div className={`${styles.answerPanel} ${styles.panel}`}>
            <span className={styles.panelLabel}>The answer</span>
            <div className={styles.answerBig}>
              {parts.prefix}
              {num.toFixed(parts.decimals)}
              {parts.suffix}
              <span className={styles.answerCaption}>{scenario.caption}</span>
            </div>
            <p className={styles.insight}>{scenario.insight}</p>
            <span className={styles.footnote}>{scenario.footnote} · every number shows its SQL</span>
          </div>
        ) : null}
      </div>

      {answerVisible ? (
        <div className={styles.bridge}>
          <span className={styles.bridgeText}>
            <span className={styles.simTag}>Simulated on demo data</span>
            Imagine it on yours.
          </span>
          <a href="#demo" className={styles.bridgeCta}>
            Book a 30-min demo <ArrowRight size={13} strokeWidth={2.6} aria-hidden="true" />
          </a>
          <button type="button" className={styles.bridgeReset} onClick={reset}>
            <RotateCcw size={13} strokeWidth={2.4} aria-hidden="true" />
            Try another question
          </button>
        </div>
      ) : null}
    </div>
  );
}
