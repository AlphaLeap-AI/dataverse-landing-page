"use client";

import { useRef } from "react";

import { FLOATING_CARDS, FloatingCard } from "./story-cards";
import styles from "./story-scroll.module.css";
import { useStoryEngine } from "./use-story-engine";

const CARD_CLS = FLOATING_CARDS.map((spec) => spec.cl);

const CHAOS_LETTERS = ["c", "h", "a", "o", "s"];

/**
 * The "chaos → order" scroll story: a sticky 100vh stage that plays through
 * five phases (chaos, connect, ask, answer, private) as the section scrolls
 * past, driven by a canvas particle simulation in useStoryEngine. The section
 * is taller than the narrative strictly needs so each phase gets a real dwell
 * time and the ending holds before releasing into the next page section.
 */
export function StoryScroll() {
  const storyRef = useRef<HTMLElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const statementRefs = useRef<(HTMLDivElement | null)[]>([]);
  const typedRef = useRef<HTMLSpanElement | null>(null);
  const bigNumRef = useRef<HTMLSpanElement | null>(null);
  const cueRef = useRef<HTMLDivElement | null>(null);

  useStoryEngine(
    {
      storyRef,
      canvasRef,
      cardRefs,
      cardCls: CARD_CLS,
      statementRefs,
      typedRef,
      bigNumRef,
      cueRef,
    },
    "#1d6dff",
    "cinematic"
  );

  const setStatementRef = (i: number) => (el: HTMLDivElement | null) => {
    statementRefs.current[i] = el;
  };

  return (
    <section id="top" ref={storyRef} className={styles.story}>
      <div className={styles.stage}>
        <canvas ref={canvasRef} className={styles.canvas} />

        <div className={styles.cardLayer} aria-hidden="true">
          {FLOATING_CARDS.map((spec, i) => (
            <FloatingCard
              key={i}
              spec={spec}
              index={i}
              ref={(el) => {
                cardRefs.current[i] = el;
              }}
            />
          ))}
        </div>

        {/* S0 · chaos */}
        <div ref={setStatementRef(0)} className={`${styles.stmt} ${styles.stmtHero}`}>
          <div className={styles.stmtInner}>
            <span className={styles.stmtEyebrow}>01 · Today</span>
            <h1 className={styles.stmtH1}>
              Your data lives in
              <br />
              <span className={styles.chaosWord} aria-label="chaos">
                {CHAOS_LETTERS.map((ch, i) => (
                  <span key={i} aria-hidden className={styles.chaosLetter}>
                    {ch}
                  </span>
                ))}
              </span>
              <span className={styles.chaosDot}>.</span>
            </h1>
            <p className={styles.stmtLede}>
              <span className={styles.stmtLedeDot} aria-hidden />
              Your senior data team, in <span className={styles.stmtLedeStrong}>one agent</span>.
            </p>
          </div>
        </div>

        {/* S1 · connect */}
        <div ref={setStatementRef(1)} className={styles.stmt}>
          <div className={styles.stmtInner}>
            <span className={styles.stmtEyebrow}>02 · Connect</span>
            <h2 className={styles.stmtH2}>Plug in every database.</h2>
            <p className={styles.stmtSub}>Postgres · Snowflake · MySQL · Oracle · BigQuery — one conversation</p>
          </div>
        </div>

        {/* S2 · ask */}
        <div ref={setStatementRef(2)} className={styles.stmt}>
          <div className={styles.stmtInner}>
            <span className={styles.stmtEyebrow}>03 · Ask</span>
            <h2 className={styles.stmtH2}>Ask in plain language.</h2>
            <div className={styles.askBubble}>
              <span className={styles.askBubbleLabel}>Ask</span>
              <span ref={typedRef} className={styles.askBubbleTyped} />
              <span className={styles.askBubbleCaret} />
            </div>
            <p className={styles.stmtSub}>English · Español · Français · 日本語 · 中文 · العربية · 한국어 — and dozens more</p>
          </div>
        </div>

        {/* S3 · answer */}
        <div ref={setStatementRef(3)} className={styles.stmt}>
          <div className={styles.stmtInner}>
            <span className={styles.stmtEyebrow}>04 · Answer</span>
            <h2 className={styles.stmtH2}>Chaos becomes an answer.</h2>
            <div className={styles.bigNum}>
              $<span ref={bigNumRef}>0.00</span>M
            </div>
            <p className={styles.stmtSub}>bar · line · area · donut · scatter · violin — any chart, on the fly</p>
          </div>
        </div>

        {/* S4 · private */}
        <div ref={setStatementRef(4)} className={styles.stmt}>
          <div className={styles.stmtInner}>
            <span className={styles.stmtEyebrow}>05 · Private</span>
            <h2 className={styles.stmtH2}>All of it, inside your walls.</h2>
            <p className={styles.stmtSub}>
              VPC · on-prem · air-gapped · your LLM · <span className={styles.highlight}>0 rows leave</span>
            </p>
          </div>
        </div>

        <div ref={cueRef} className={styles.cue}>
          <span className={styles.cueLabel}>Scroll</span>
          <span className={styles.cueLine} />
        </div>
      </div>
    </section>
  );
}
