"use client";

import { ArrowCounterClockwise, ArrowRight, Check, Fingerprint, PaperPlaneTilt } from "@phosphor-icons/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { askState } from "../experience/scroll-driver";
import {
  DEMO_SCENARIOS,
  formatValue,
  splitValue,
  sqlLineCount,
  tokenizeSql,
  type SqlTokenKind,
} from "./ask-data";
import styles from "./ask.module.css";

/**
 * Every beat of the run is derived from one clock, in ms:
 * the question types, the sources light up, the SQL is written,
 * the chart grows, the answer lands.
 */
const T = {
  question: 1200,
  sources: 2300,
  sqlType: 1500,
  chart: 4000,
  answer: 5300,
  send: 6700,
  end: 7800,
} as const;

const STEP_LABELS = ["Connect", "Query", "Chart", "Answer", "Send"] as const;

/** The rest of the catalogue, named where it does the most good. */
const ALSO_CONNECTS = "Drive · Calendar · Notion · GitHub · Jira · your own MCP server";

/** Percentage of the plot area the tallest bar fills — the rest is label headroom. */
const PLOT_CEILING = 82;

/** How long a stage's own reveal (bars growing, answer rising) takes. */
const REVEAL_MS = 950;

const TOKEN_CLASS: Record<SqlTokenKind, string> = {
  str: styles.str,
  num: styles.num,
  kw: styles.kw,
  fn: styles.fn,
  base: "",
};

const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
const outCubic = (x: number) => 1 - Math.pow(1 - x, 3);

/**
 * The demo, as a single self-running take. It starts when it scrolls into
 * view, pauses when it leaves, and once finished the four step markers
 * become tabs so any beat can be re-read.
 */
export function AskExperience() {
  const rootRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef(0);
  const lastRef = useRef(0);
  const clockRef = useRef(0);
  const doneRef = useRef(false);

  const [idx, setIdx] = useState(0);
  const [t, setT] = useState(0);
  const [done, setDone] = useState(false);
  /** Step the viewer pinned after the run finished; null = follow the clock. */
  const [view, setView] = useState<number | null>(null);
  /** The one thing the demo never does on its own — the write action. */
  const [sent, setSent] = useState(false);

  const stop = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = 0;
    lastRef.current = 0;
  }, []);

  const play = useCallback(() => {
    if (rafRef.current || doneRef.current) return;
    const step = (now: number) => {
      rafRef.current = 0;
      if (!lastRef.current) lastRef.current = now;
      // Cap the delta so a backgrounded tab doesn't skip the whole run.
      const dt = Math.min(64, now - lastRef.current);
      lastRef.current = now;
      const next = clockRef.current + dt;
      if (next >= T.end) {
        clockRef.current = T.end;
        doneRef.current = true;
        setT(T.end);
        setDone(true);
        return;
      }
      clockRef.current = next;
      setT(next);
      rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
  }, []);

  const finish = useCallback(() => {
    stop();
    clockRef.current = T.end;
    doneRef.current = true;
    setT(T.end);
    setDone(true);
  }, [stop]);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;

    // Reduced motion: no typewriter, no growth — the finished state, at once.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      finish();
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        // A fast scroll can deliver several entries at once — only the
        // last one describes where the section actually is now.
        if (entries[entries.length - 1].isIntersecting) play();
        else stop();
      },
      { rootMargin: "0px 0px -12% 0px" }
    );
    io.observe(el);
    return () => {
      io.disconnect();
      stop();
    };
  }, [play, stop, finish]);

  useEffect(
    () => () => {
      askState.pulse = 0;
    },
    []
  );

  const scenario = DEMO_SCENARIOS[idx];
  const tokens = useMemo(() => tokenizeSql(scenario.sql), [scenario.sql]);

  const live =
    t < T.sources ? 0 : t < T.chart ? 1 : t < T.answer ? 2 : t < T.send ? 3 : 4;
  const pinned = done && view !== null;
  const cur = pinned ? (view as number) : live;

  // Feeds the particle field behind the section.
  useEffect(() => {
    askState.pulse = [0.5, 0.7, 0.85, 1, 1][live];
  }, [live]);

  const restart = useCallback(
    (nextIdx: number) => {
      stop();
      clockRef.current = 0;
      doneRef.current = false;
      setIdx(nextIdx);
      setT(0);
      setDone(false);
      setView(null);
      setSent(false);
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) finish();
      else play();
    },
    [stop, play, finish]
  );

  /* ── derived frame ── */

  const questionProgress = clamp01(t / T.question);
  const typedQuestion = scenario.question.slice(
    0,
    Math.round(questionProgress * scenario.question.length)
  );

  // Once a step is pinned, its own content is always shown complete.
  const sourceClock = pinned && cur === 0 ? Number.POSITIVE_INFINITY : t - T.question;

  const typed = pinned && cur === 1 ? 1 : clamp01((t - T.sources) / T.sqlType);
  const sqlChars = Math.round(typed * scenario.sql.length);
  const visibleTokens: { text: string; kind: SqlTokenKind }[] = [];
  let consumed = 0;
  for (const token of tokens) {
    if (consumed >= sqlChars) break;
    const room = sqlChars - consumed;
    visibleTokens.push({
      text: room >= token.text.length ? token.text : token.text.slice(0, room),
      kind: token.kind,
    });
    consumed += token.text.length;
  }

  const barProgress = pinned && cur === 2 ? 1 : clamp01((t - T.chart) / REVEAL_MS);
  const answerProgress = pinned && cur === 3 ? 1 : clamp01((t - T.answer) / REVEAL_MS);

  const parts = splitValue(scenario.value);
  const bigNumber =
    parts.prefix +
    formatValue(parts.num * outCubic(answerProgress), parts.decimals, parts.grouped) +
    parts.suffix;

  /** Staggered rise for the answer column. */
  const rise = (delay: number) => {
    const p = clamp01((answerProgress - delay) / 0.34);
    return { opacity: p, transform: `translateY(${(1 - p) * 12}px)` };
  };

  const sendProgress = pinned && cur === 4 ? 1 : clamp01((t - T.send) / REVEAL_MS);
  const sendRise = (delay: number) => {
    const p = clamp01((sendProgress - delay) / 0.34);
    return { opacity: p, transform: `translateY(${(1 - p) * 12}px)` };
  };
  const delivery = scenario.delivery;

  const stepSubs = [
    `${scenario.sources.length} systems`,
    `${sqlLineCount(scenario.sql)} lines`,
    `${scenario.bars.length} series`,
    scenario.footnote.split(" · ").pop() ?? "",
    scenario.delivery.name,
  ];

  const stepProgress = (i: number) => {
    if (i < live) return 1;
    if (i > live) return 0;
    if (i === 0) return clamp01(t / T.sources);
    if (i === 1) return clamp01((t - T.sources) / (T.chart - T.sources));
    if (i === 2) return clamp01((t - T.chart) / (T.answer - T.chart));
    if (i === 3) return clamp01((t - T.answer) / (T.send - T.answer));
    return clamp01((t - T.send) / (T.end - T.send));
  };

  return (
    <div ref={rootRef} className={styles.root}>
      <p className={styles.questionLabel}>The question</p>
      <p className={styles.question}>
        {typedQuestion}
        <span className={styles.questionCaret} data-on={questionProgress < 1 ? "true" : "false"} />
      </p>

      <div className={styles.steps} role="tablist" aria-label="Demo steps">
        {STEP_LABELS.map((label, i) => (
          <button
            key={label}
            type="button"
            role="tab"
            id={`ask-step-${i}`}
            aria-controls={`ask-panel-${i}`}
            aria-selected={cur === i}
            className={styles.step}
            data-state={cur === i ? "active" : i <= live ? "seen" : "ahead"}
            disabled={!done}
            onClick={() => setView(i)}
          >
            <span className={styles.stepTrack}>
              <span
                className={styles.stepFill}
                data-passed={i < live || (done && i < 4) ? "true" : "false"}
                style={{ width: `${stepProgress(i) * 100}%` }}
              />
            </span>
            <span className={styles.stepLabel}>
              {label}
              {i <= live ? <span className={styles.stepSub}>{stepSubs[i]}</span> : null}
            </span>
          </button>
        ))}
      </div>

      <div className={styles.stage}>
        <div className={styles.track} style={{ transform: `translateX(-${cur * 20}%)` }}>
          {/* 01 · the systems it reached */}
          <section
            className={styles.panel}
            id="ask-panel-0"
            role="tabpanel"
            aria-labelledby="ask-step-0"
          >
            <span className={styles.panelLabel}>Reaching your systems</span>
            <div className={styles.sources}>
              {scenario.sources.map((source, i) => {
                const on = sourceClock > 120 + i * 180;
                return (
                  <div key={source.name} className={styles.source} data-on={on ? "true" : "false"}>
                    <span className={styles.sourceDot} />
                    <span className={styles.sourceName}>{source.name}</span>
                    <span className={styles.sourceMeta}>{on ? source.meta : "connecting…"}</span>
                  </div>
                );
              })}
            </div>
            <span className={styles.panelFoot}>Read-only · nothing leaves your network</span>
          </section>

          {/* 02 · the SQL it wrote */}
          <section
            className={styles.panel}
            id="ask-panel-1"
            role="tabpanel"
            aria-labelledby="ask-step-1"
          >
            <span className={styles.panelLabel}>
              The query it wrote
              <span className={styles.tagMono}>yours to audit</span>
            </span>
            <pre className={styles.code}>
              <code>
                {visibleTokens.map((token, i) => (
                  <span key={i} className={TOKEN_CLASS[token.kind]}>
                    {token.text}
                  </span>
                ))}
                <span
                  className={styles.caret}
                  data-on={cur === 1 ? "true" : "false"}
                  data-blink={cur === 1 && typed >= 1 ? "true" : "false"}
                />
              </code>
            </pre>
          </section>

          {/* 03 · the shape of the result */}
          <section
            className={styles.panel}
            id="ask-panel-2"
            role="tabpanel"
            aria-labelledby="ask-step-2"
          >
            <span className={styles.panelLabel}>The shape of it</span>
            <span className={styles.chartTitle}>
              {scenario.chartTitle}
              {scenario.chartTag ? <span className={styles.chartTag}>{scenario.chartTag}</span> : null}
            </span>
            <div className={styles.bars}>
              {scenario.bars.map((bar, i) => {
                const grown = outCubic(clamp01(barProgress * 1.45 - i * 0.09));
                const height = bar.h * PLOT_CEILING * grown;
                return (
                  <div key={bar.label} className={styles.barCol}>
                    <span className={styles.barTrack}>
                      <span
                        className={styles.barValue}
                        data-hot={bar.hot ? "true" : "false"}
                        style={{
                          bottom: `calc(${height}% + 7px)`,
                          opacity: clamp01((grown - 0.78) / 0.18),
                        }}
                      >
                        {bar.value}
                      </span>
                      <span
                        className={styles.barFill}
                        data-hot={bar.hot ? "true" : "false"}
                        data-projected={bar.projected ? "true" : "false"}
                        style={{ height: `${height}%` }}
                      />
                    </span>
                    <span className={styles.barLabel} data-hot={bar.hot ? "true" : "false"}>
                      {bar.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>

          {/* 04 · the answer */}
          <section
            className={`${styles.panel} ${styles.answerPanel}`}
            id="ask-panel-3"
            role="tabpanel"
            aria-labelledby="ask-step-3"
            aria-live="polite"
          >
            <div className={styles.answerGrid}>
              <div className={styles.answerCol}>
                <span className={`${styles.panelLabel} ${styles.panelLabelGold}`}>The answer</span>
                <p className={styles.verdict} style={rise(0)}>
                  {scenario.verdict}
                </p>
                <p className={styles.big} style={rise(0.1)}>
                  {bigNumber}
                </p>
                <span className={styles.caption} style={rise(0.18)}>
                  {scenario.caption}
                </span>
              </div>
              <div className={styles.answerCol}>
                {scenario.bullets.map((text, i) => (
                  <div key={text} className={styles.bullet} style={rise(0.24 + i * 0.13)}>
                    <Check size={13} weight="bold" aria-hidden="true" />
                    <span>{text}</span>
                  </div>
                ))}
                <p className={styles.move} style={rise(0.66)}>
                  {scenario.move}
                </p>
              </div>
            </div>
          </section>

          {/* 05 · out the door, through your own connector */}
          <section
            className={styles.panel}
            id="ask-panel-4"
            role="tabpanel"
            aria-labelledby="ask-step-4"
          >
            <span className={styles.panelLabel}>Sending it from your own tools</span>

            <div className={styles.connectorRow} style={sendRise(0)}>
              <span className={styles.connector}>
                <span className={styles.mark} aria-hidden="true">
                  {delivery.mark}
                </span>
                {delivery.name}
                <span className={styles.connected}>
                  <i />
                  Connected
                </span>
              </span>
              <span className={styles.toolCall}>{delivery.tool}</span>
            </div>

            <div className={styles.draft} style={sendRise(0.12)}>
              <div className={styles.headers}>
                {delivery.headers.map((h) => (
                  <p key={h.label} className={styles.headerRow}>
                    <span className={styles.headerLabel}>{h.label}</span>
                    <span className={styles.headerValue}>{h.value}</span>
                  </p>
                ))}
              </div>
              <p className={styles.msgBody}>{delivery.body}</p>
              <p className={styles.note}>{delivery.note}</p>
            </div>

            <div className={styles.confirm} style={sendRise(0.34)} aria-live="polite">
              {sent ? (
                <span className={styles.sentTag}>
                  <Check size={14} weight="bold" aria-hidden="true" />
                  {delivery.sentLabel}
                </span>
              ) : (
                <>
                  <span className={styles.guard}>
                    <Fingerprint size={14} weight="bold" aria-hidden="true" />
                    Nothing has been sent. Write actions run only after you approve.
                  </span>
                  <button type="button" className={styles.send} onClick={() => setSent(true)}>
                    <PaperPlaneTilt size={13} weight="bold" aria-hidden="true" />
                    {delivery.sendLabel}
                  </button>
                </>
              )}
            </div>

            <span className={styles.alsoLine} style={sendRise(0.5)}>
              Also connects {ALSO_CONNECTS}
            </span>
          </section>
        </div>
      </div>

      <div className={styles.footer}>
        <span className={styles.footnote}>{scenario.footnote}</span>
        <span className={styles.footerSpacer} />
        <button
          type="button"
          className={styles.switch}
          onClick={() => restart(idx === 0 ? 1 : 0)}
          disabled={!done}
        >
          <ArrowCounterClockwise size={13} weight="bold" aria-hidden="true" />
          {scenario.switchLabel}
        </button>
        <a href="#demo" className={styles.cta} data-done={done ? "true" : "false"}>
          <span className={styles.ctaDot} />
          Book a 30-min demo
          <ArrowRight size={14} weight="bold" aria-hidden="true" />
        </a>
      </div>
    </div>
  );
}
