"use client";

import { Check, FileCode, Hourglass, Layers, Network, Zap } from "lucide-react";
import { type CSSProperties, useEffect, useRef, useState } from "react";

import { AskBar } from "./ask-bar";
import { DataUniverse, type MorphMapperRef, type MorphProgressRef } from "./data-universe";
import styles from "./galaxy-story.module.css";
import landingStyles from "./landing.module.css";
import { type BeatKey, useGalaxy } from "./use-galaxy";

/** Ambient DataUniverse morph axis — subtle backdrop, independent of the
 *  story formation canvas (which still owns beat-driven shape morphs). */
function mapPageScrollToMorph(p: number): number {
  // p is document scroll progress 0–1; ease through the redesign shapes gently
  if (p <= 0) return 0;
  if (p < 0.2) return p * 5 * 0.8; // chaos → sphere
  if (p < 0.45) return 0.8 + ((p - 0.2) / 0.25) * 1.0; // → rings
  if (p < 0.75) return 1.8 + ((p - 0.45) / 0.3) * 1.0; // → grid
  return Math.min(4, 2.8 + ((p - 0.75) / 0.25) * 1.2); // → tunnel
}

// Mirrors DB_COLORS in galaxy-formations.ts — one chip per satellite in the
// 01 · Connect particle formation, plus an open-ended "+ more" chip.
const CONNECT_DBS = [
  { name: "PostgreSQL", color: "#6aa6dd" },
  { name: "MongoDB", color: "#13c25b" },
  { name: "DynamoDB", color: "#8b9aff" },
  { name: "Snowflake", color: "#7fd4ff" },
  { name: "BigQuery", color: "#5f9bff" },
  { name: "Elasticsearch", color: "#ffd24d" },
  { name: "Redis", color: "#ff9a8a" },
  { name: "Kafka", color: "#c9a6ff" },
];

const SOURCE_MARQUEE = [
  "PostgreSQL",
  "MongoDB",
  "DynamoDB",
  "Weaviate",
  "Elasticsearch",
  "MySQL",
  "Snowflake",
  "BigQuery",
  "Redis",
  "Kafka",
];

const PROOF_CHIPS = [
  { Icon: Check, label: "No SQL required" },
  { Icon: Network, label: "Every source, one interface" },
  { Icon: Zap, label: "Answers in ~3 seconds" },
];

// Chaos + closing copy fade in line by line (each entry = one display line).
// `em` renders with the gradient accent treatment. Short lines on purpose:
// on phones each word fills the width, so the block owns half the screen.
const CHAOS_HEADLINE_LINES: { pre?: string; em?: string }[] = [
  { pre: "Getting" },
  { pre: "answers" },
  { pre: "shouldn't" },
  { pre: "be this" },
  { em: "hard." },
];

const CHAOS_CLOSE_LINES: { pre?: string; em?: string }[] = [
  { pre: "Meanwhile," },
  { pre: "your data" },
  { em: "already" },
  { em: "knows." },
];

const CHAOS_PAINS = [
  {
    Icon: Hourglass,
    stat: "3 weeks",
    title: "The Wait",
    body: "From question to deck — by board meeting day, the number is already stale.",
  },
  {
    Icon: FileCode,
    stat: "0.4%",
    title: "The Gatekeeper",
    body: "Of your company can write SQL. Everyone else files a ticket and waits in line.",
  },
  {
    Icon: Layers,
    stat: "12 tools",
    title: "The Sprawl",
    body: "Dashboards stacked on dashboards, each telling a different version of the truth.",
  },
];

// Decorative multilingual questions drifting behind the "Ask" beat's typed
// bubble — aria-hidden, purely atmospheric (the same set of world-language
// example questions from the design, regardless of the visitor's locale).
interface FloatQuestion {
  text: string;
  dir?: "rtl";
  /** Blurred depth-layer items: desktop-only — too much clutter at phone width. */
  desktopOnly?: boolean;
  style: CSSProperties & { "--fs": string };
}
// Font size rides the --fs custom property (not inline font-size) so the
// mobile media query can scale every question down proportionally.
const ASK_FLOAT_QUESTIONS: FloatQuestion[] = [
  { text: "¿Qué clientes tienen mayor riesgo?", style: { left: "6%", top: "9%", "--fs": "22px", color: "#5d6f96", animationDuration: "7s", animationDelay: "0s" } },
  { text: "解約リスクが最も高い顧客は？", style: { right: "8%", top: "7%", "--fs": "26px", color: "#6d82b0", animationDuration: "9s", animationDelay: "-3s" } },
  { text: "Quel est notre chiffre d'affaires ce trimestre ?", desktopOnly: true, style: { left: "14%", top: "22%", "--fs": "15px", color: "#4a5878", filter: "blur(1px)", animationDuration: "11s", animationDelay: "-5s" } },
  { text: "본 분기 매출 상위 고객은?", style: { right: "4%", top: "30%", "--fs": "20px", color: "#5d6f96", animationDuration: "8s", animationDelay: "-1s" } },
  { text: "本季度收入增长如何？", style: { left: "3%", top: "42%", "--fs": "24px", color: "#7189ba", animationDuration: "10s", animationDelay: "-6s" } },
  { text: "Wie hoch ist unsere Abwanderung?", desktopOnly: true, style: { right: "6%", top: "52%", "--fs": "17px", color: "#4a5878", filter: "blur(1px)", animationDuration: "12s", animationDelay: "-2s" } },
  { text: "ما هي المناطق الأكثر خطورة؟", dir: "rtl", style: { left: "8%", top: "62%", "--fs": "23px", color: "#6d82b0", animationDuration: "9s", animationDelay: "-4s" } },
  { text: "Какие регионы под риском?", desktopOnly: true, style: { right: "12%", top: "68%", "--fs": "15px", color: "#4a5878", filter: "blur(1px)", animationDuration: "10s", animationDelay: "-7s" } },
  { text: "इस तिमाही में राजस्व कितना है?", style: { left: "20%", top: "80%", "--fs": "19px", color: "#5d6f96", animationDuration: "8s", animationDelay: "-2.5s" } },
  { text: "Qual foi a receita deste mês?", style: { right: "22%", top: "86%", "--fs": "22px", color: "#6d82b0", animationDuration: "11s", animationDelay: "-5.5s" } },
  { text: "รายได้เดือนนี้เท่าไหร่?", desktopOnly: true, style: { left: "44%", top: "5%", "--fs": "14px", color: "#4a5878", filter: "blur(1px)", animationDuration: "9s", animationDelay: "-1.5s" } },
  { text: "Hangi bölgeler risk altında?", style: { left: "48%", top: "90%", "--fs": "16px", color: "#5d6f96", animationDuration: "10s", animationDelay: "-8s" } },
  { text: "Hoeveel klanten verloren we?", desktopOnly: true, style: { right: "34%", top: "14%", "--fs": "15px", color: "#4a5878", filter: "blur(1px)", animationDuration: "12s", animationDelay: "-4.5s" } },
  { text: "Quali clienti stanno crescendo?", desktopOnly: true, style: { left: "30%", top: "71%", "--fs": "14px", color: "#4a5878", filter: "blur(1px)", animationDuration: "9.5s", animationDelay: "-6.5s" } },
];

/**
 * Hero + scroll story with two layered WebGL backgrounds:
 * 1. DataUniverse (redesign) — ambient interactive starfield behind everything
 * 2. Story canvas via useGalaxy — original beat-driven formation morphs
 *    (chaos → clusters → lattice → constellation → stream → chart → shell)
 *
 * useGalaxy also fades beat copy in/out from story scroll progress.
 * Opens with a "chaos" pain-point beat before the six-step "how Dataverse
 * works" beats (01 Connect … 06 Private).
 */
export function GalaxyStory() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const storyRef = useRef<HTMLElement>(null);
  const dimRef = useRef<HTMLDivElement>(null);
  const typedRef = useRef<HTMLSpanElement>(null);
  const bigNumRef = useRef<HTMLSpanElement>(null);
  const sqlCardRef = useRef<HTMLDivElement>(null);
  const beatRefs = useRef<Partial<Record<BeatKey, HTMLDivElement | null>>>({});
  const chaosGhostRef = useRef<HTMLDivElement>(null);
  const chaosLineRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const chaosCardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const chaosCloseRef = useRef<HTMLParagraphElement>(null);
  const chaosCloseLineRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const learnTrackRef = useRef<HTMLDivElement>(null);
  const universeProgressRef = useRef(0) as MorphProgressRef;
  const universeMapperRef = useRef(mapPageScrollToMorph) as MorphMapperRef;
  const [reducedMotion, setReducedMotion] = useState(false);
  // Phones only run the story canvas — a second ambient WebGL context is a
  // big part of why mobile scrolling stuttered.
  const [showAmbient, setShowAmbient] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReducedMotion(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    setShowAmbient(window.innerWidth > 720);
    return () => mq.removeEventListener("change", sync);
  }, []);

  // Drive ambient DataUniverse from full-page scroll (not story-only).
  useEffect(() => {
    const onScroll = () => {
      const total = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      universeProgressRef.current = window.scrollY / total;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  useGalaxy(
    {
      canvasRef,
      storyRef,
      beatRefs,
      dimRef,
      typedRef,
      bigNumRef,
      sqlCardRef,
      chaosGhostRef,
      chaosLineRefs,
      chaosCardRefs,
      chaosCloseRef,
      chaosCloseLineRefs,
      learnTrackRef,
    },
    { density: "high", calm: reducedMotion }
  );

  const setBeatRef = (key: BeatKey) => (el: HTMLDivElement | null) => {
    beatRefs.current[key] = el;
  };

  return (
    <>
      {/* Ambient redesign universe — desktop only; phones keep a single
          WebGL context so the story scroll stays smooth. */}
      {showAmbient ? (
        <DataUniverse
          progress={universeProgressRef}
          mapper={universeMapperRef}
          reducedMotion={reducedMotion}
        />
      ) : null}
      {/* Original beat-driven particle morph canvas (useGalaxy) */}
      <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />

      <section id="top" className={styles.hero}>
        <div className={styles.heroScrim}>
          <span className={styles.heroBadge}>
            <i className={styles.heroBadgeDot} />
            AI-native analytics
          </span>
          <h1 className={styles.heroTitle}>
            {/* The space before <br /> matters: mobile hides the break and
                relies on natural wrapping ("already has" must keep its gap). */}
            Your data already{" "}
            <br />
            has the <em>answers</em>.
          </h1>
          <p className={styles.heroSub}>
            Ask in plain English. Dataverse finds them in seconds — across every database you own.
          </p>
          <div className={styles.heroAsk}>
            <AskBar />
          </div>
          <div className={styles.heroChips}>
            {PROOF_CHIPS.map(({ Icon, label }) => (
              <span key={label} className={styles.heroChip}>
                <Icon size={14} strokeWidth={2.4} aria-hidden="true" />
                {label}
              </span>
            ))}
          </div>
        </div>
        <div className={styles.heroCtas}>
          <a href="#demo" className={`${landingStyles.btn} ${landingStyles.btnPrimary}`}>
            Book a 30-min demo
          </a>
          <a href="#story" className={`${landingStyles.btn} ${landingStyles.btnGhost}`}>
            Watch it think ↓
          </a>
        </div>
        <div className={styles.heroMarquee}>
          <p className={styles.heroMarqueeLabel}>One interface for your entire stack</p>
          <div className={styles.heroMarqueeMask}>
            <div className={styles.heroMarqueeTrack} aria-hidden="true">
              {[...SOURCE_MARQUEE, ...SOURCE_MARQUEE].map((name, i) => (
                <span key={`${name}-${i}`} className={styles.heroMarqueeItem}>
                  <i />
                  {name}
                </span>
              ))}
            </div>
          </div>
        </div>
        <div className={styles.scrollCue}>
          <span>Scroll</span>
          <span className={styles.scrollCueLine} />
        </div>
      </section>

      <section id="story" ref={storyRef} className={styles.story}>
        <div className={styles.stage}>
          <div ref={dimRef} className={styles.dim} aria-hidden="true" />

          <div ref={setBeatRef("chaos")} className={styles.beat}>
            <div className={styles.chaosStage}>
              <div ref={chaosGhostRef} className={styles.chaosGhost} aria-hidden="true">
                noise noise
              </div>

              {/* Each layer below is a full-bleed flex-centering wrapper
                  that is never itself transformed — centering stays on the
                  CSS side so the per-word/per-card JS transforms (set
                  directly in use-galaxy.ts) never fight a CSS transform for
                  control of the same element. */}
              <div className={styles.chaosLayer}>
                <h2 className={styles.chaosHeadline}>
                  {CHAOS_HEADLINE_LINES.map((line, i) => (
                    <span
                      key={line.pre ?? line.em}
                      ref={(el) => {
                        chaosLineRefs.current[i] = el;
                      }}
                      className={styles.chaosLine}
                    >
                      {line.pre}
                      {line.em ? <em>{line.em}</em> : null}
                    </span>
                  ))}
                </h2>
              </div>

              <div className={styles.chaosLayer}>
                <div className={styles.chaosCards}>
                  {CHAOS_PAINS.map((pain, i) => (
                    <div
                      key={pain.title}
                      ref={(el) => {
                        chaosCardRefs.current[i] = el;
                      }}
                      className={styles.chaosCard}
                    >
                      <pain.Icon className={styles.chaosCardIcon} size={20} strokeWidth={2} aria-hidden="true" />
                      <div className={styles.chaosCardStat}>{pain.stat}</div>
                      <div className={styles.chaosCardTitle}>{pain.title}</div>
                      <p className={styles.chaosCardBody}>{pain.body}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className={styles.chaosLayer}>
                <p ref={chaosCloseRef} className={styles.chaosClose}>
                  {CHAOS_CLOSE_LINES.map((line, i) => (
                    <span
                      key={line.pre ?? line.em}
                      ref={(el) => {
                        chaosCloseLineRefs.current[i] = el;
                      }}
                      className={styles.chaosLine}
                    >
                      {line.pre}
                      {line.em ? <em>{line.em}</em> : null}
                    </span>
                  ))}
                </p>
              </div>
            </div>
          </div>

          <div ref={setBeatRef("connect")} className={styles.beat}>
            <div className={styles.beatInner}>
              <span className={styles.beatEyebrow}>01 · Connect</span>
              <h2 className={styles.beatH2}>
                First, it plugs into <em>everything</em> you own.
              </h2>
              <div className={styles.chipRow}>
                {CONNECT_DBS.map((db) => (
                  <span key={db.name} className={styles.dbChip}>
                    <i style={{ background: db.color }} />
                    {db.name}
                  </span>
                ))}
                <span className={`${styles.dbChip} ${styles.dbChipMore}`}>+ 30 more</span>
              </div>
              <p className={styles.beatFoot}>One interface. No switching tools. No stitching results by hand.</p>
            </div>
          </div>

          <div ref={setBeatRef("learn")} className={`${styles.beat} ${styles.beatWide}`}>
            <div className={styles.beatInner}>
              <span className={styles.beatEyebrow}>02 · Understand</span>
              <h2 className={styles.beatH2}>
                It reads your <em>entire database</em>.
                <br />
                <span className={styles.beatH2Em}>And writes the documentation nobody ever did.</span>
              </h2>
              <div ref={learnTrackRef} className={styles.learnGrid}>
                <div className={styles.tableCard}>
                  <div className={styles.tableCardHead}>
                    <span className={styles.tableCardHeadLeft}>
                      <span className={styles.livePulse} />
                      <span className={styles.tableCardLabel}>Table · subscriptions</span>
                    </span>
                    <span className={styles.aiTag}>AI-documented</span>
                  </div>
                  <p className={styles.tableCardDesc}>
                    &ldquo;One row per customer contract term. Tracks plan, billing value and renewal state across
                    its lifecycle.&rdquo;
                  </p>
                  <div className={styles.columnGrid}>
                    <span className={styles.colName}>customer_id</span>
                    <span className={styles.colType}>uuid · FK</span>
                    <span className={styles.colDesc}>&quot;links to customers.id&quot;</span>
                    <span className={styles.colName}>arr</span>
                    <span className={styles.colType}>numeric(12,2)</span>
                    <span className={styles.colDesc}>&quot;annual recurring revenue, USD&quot;</span>
                    <span className={styles.colName}>renewal_risk</span>
                    <span className={styles.colType}>enum</span>
                    <span className={styles.colDesc}>&quot;churn likelihood: low · med · high&quot;</span>
                    <span className={styles.colName}>term_end</span>
                    <span className={styles.colType}>date</span>
                    <span className={styles.colDesc}>&quot;contract expiry — renewal due&quot;</span>
                  </div>
                </div>
                <div className={styles.joinsCard}>
                  <div className={styles.joinsCardHead}>Joins it discovered</div>
                  <div className={styles.joinsList}>
                    <span>
                      subscriptions <b>⟷</b> customers <i>on customer_id</i>
                    </span>
                    <span>
                      orders <b>⟷</b> customers <i>on customer_id</i>
                    </span>
                    <span>
                      tickets <b>⟷</b> accounts <i>inferred — no FK</i>
                    </span>
                  </div>
                </div>
                <div className={styles.statsCard}>
                  <span className={styles.statCell}>
                    <b>47</b>tables
                  </span>
                  <span className={styles.statCell}>
                    <b>612</b>columns
                  </span>
                  <span className={styles.statCell}>
                    <b className={styles.green}>0</b>human inputs
                  </span>
                </div>
              </div>
              <p className={styles.beatFoot}>
                Every table described. Every column typed and explained. Every join mapped — even the ones nobody
                wrote down.
              </p>
            </div>
          </div>

          <div ref={setBeatRef("skills")} className={styles.beat}>
            <div className={styles.beatInner}>
              <span className={styles.beatEyebrow}>03 · Teach</span>
              <h2 className={styles.beatH2}>
                Teach it how <em>your business</em> counts.
              </h2>
              <div className={styles.chipRow}>
                <span className={`${styles.tagChip} ${styles.tagGold}`}>rule · fiscal year starts Feb</span>
                <span className={styles.tagChip}>skill · NRR, our way</span>
                <span className={styles.tagChip}>marketplace · cohort retention</span>
                <span className={`${styles.tagChip} ${styles.tagGreen}`}>
                  <i className={styles.tagDot} />
                  shared with 12 teammates
                </span>
              </div>
              <p className={styles.beatFoot}>
                Define rules, build skills, or import them from the marketplace — your whole team asks with the
                same context. No custom metric ever missed.
              </p>
            </div>
          </div>

          <div ref={setBeatRef("ask")} className={styles.beat}>
            <div className={styles.beatInner}>
              <span className={styles.beatEyebrow}>04 · Ask</span>
              <h2 className={styles.beatH2}>
                Then, you just <em>ask</em>.
                <br />
                <span className={styles.beatH2Em}>In any language you think in.</span>
              </h2>
              <div className={styles.askBubble}>
                <span className={styles.askLabel}>Ask</span>
                <span className={styles.askText}>
                  <span ref={typedRef} />
                  <span className={styles.caret} />
                </span>
              </div>
              <p className={styles.beatFoot}>No SQL. No dashboards. No ticket to the data team.</p>
            </div>
            <div className={styles.floatLayer} aria-hidden="true">
              {ASK_FLOAT_QUESTIONS.map((q) => (
                <span
                  key={q.text}
                  dir={q.dir}
                  className={`${styles.floatSpan}${q.desktopOnly ? ` ${styles.floatDesktopOnly}` : ""}`}
                  style={q.style}
                >
                  {q.text}
                </span>
              ))}
            </div>
          </div>

          <div ref={setBeatRef("answer")} className={`${styles.beat} ${styles.beatWide}`}>
            <div className={styles.beatInner}>
              <span className={styles.beatEyebrow}>05 · Answer</span>
              <h2 className={styles.beatH2}>
                One question in. A <em>full analysis</em> back.
                <br />
                <span className={styles.beatH2Em}>It answers, then digs for the why — and what to do about it.</span>
              </h2>
              <div ref={sqlCardRef} className={styles.answerGrid}>
                <div className={styles.answerCard}>
                  <span className={styles.answerCardLabel}>The answer · 2.4s</span>
                  <div className={styles.answerBig}>
                    $<span ref={bigNumRef}>0.00</span>M <span className={styles.answerBigCaption}>renewal ARR at risk</span>
                  </div>
                  <div className={styles.regionBars}>
                    <span>EMEA</span>
                    <span className={styles.regionBar} style={{ width: "100%" }} />
                    <span>1.9M</span>
                    <span>NA</span>
                    <span className={styles.regionBar} style={{ width: "63%", opacity: 0.55 }} />
                    <span>1.2M</span>
                    <span>APAC</span>
                    <span className={styles.regionBar} style={{ width: "37%", opacity: 0.35 }} />
                    <span>0.7M</span>
                    <span>LATAM</span>
                    <span className={styles.regionBar} style={{ width: "21%", opacity: 0.22 }} />
                    <span>0.4M</span>
                  </div>
                </div>

                <div className={styles.answerCard}>
                  <span className={`${styles.answerCardLabel} ${styles.labelGreen}`}>Unasked · the why</span>
                  <p className={styles.answerText}>
                    Risk tracks support response time. Accounts waiting <b className={styles.gold}>&gt;48h</b> on
                    tickets churn <span className={styles.answerInlineNum}>3.1×</span> more.
                  </p>
                  <svg viewBox="0 0 220 64" className={styles.sparkline} role="img" aria-label="Churn rises with ticket response time">
                    <polyline points="4,50 40,48 76,44 112,36 148,26 184,16 216,8" fill="none" stroke="#ff9a8a" strokeWidth={2} />
                    <polyline
                      points="4,54 40,53 76,52 112,50 148,49 184,47 216,46"
                      fill="none"
                      stroke="#7fb0ff"
                      strokeWidth={2}
                      strokeDasharray="4 3"
                    />
                    <text x="4" y="12" fontFamily="var(--mono)" fontSize="8.5" fill="#ff9a8a">
                      churn % vs response time
                    </text>
                    <text x="4" y="62" fontFamily="var(--mono)" fontSize="8.5" fill="#67738f">
                      &lt;4h → 72h+
                    </text>
                  </svg>
                </div>

                <div className={styles.answerCard}>
                  <span className={styles.answerCardLabel}>Who exactly · 23 accounts</span>
                  <div className={styles.accountList}>
                    <span>Atlas Freight</span>
                    <span>$310K</span>
                    <span className={styles.red}>62h avg</span>
                    <span>Helion GmbH</span>
                    <span>$275K</span>
                    <span className={styles.red}>55h avg</span>
                    <span>Meridian SA</span>
                    <span>$240K</span>
                    <span className={styles.gold}>49h avg</span>
                    <span className={styles.mono}>+ 20 more, ranked</span>
                    <span />
                    <span />
                  </div>
                  <p className={styles.answerFoot}>
                    Every account named, sized and ranked by save-ability — ready to hand to sales.
                  </p>
                </div>

                <div className={`${styles.answerCard} ${styles.answerCardGreen}`}>
                  <span className={`${styles.answerCardLabel} ${styles.labelGreen}`}>The plan · projected</span>
                  <div className={`${styles.answerBig} ${styles.green}`}>
                    $3.1M <span className={styles.answerBigCaption}>recoverable this quarter</span>
                  </div>
                  <div className={styles.planList}>
                    <span>
                      <b className={styles.green}>1.</b> Fast-lane tickets for the 23 flagged accounts
                    </span>
                    <span>
                      <b className={styles.green}>2.</b> CSM outreach before <span className={styles.gold}>term_end</span> —
                      list drafted
                    </span>
                    <span>
                      <b className={styles.green}>3.</b> Re-check weekly — it watches the metric for you
                    </span>
                  </div>
                </div>
              </div>
              <p className={styles.beatFoot}>
                <span className={styles.mono}>11 queries · 3 databases · 2.4s</span> — every chart shows its SQL.
                Like a whole data team, minus the ticket queue.
              </p>
            </div>
          </div>

          <div ref={setBeatRef("private")} className={styles.beat}>
            <div className={styles.beatInner}>
              <span className={styles.beatEyebrow}>06 · Private</span>
              <h2 className={styles.beatH2}>
                And it all stays inside <em>your walls</em>.
              </h2>
              <p className={styles.beatFoot}>
                Deploy inside your VPC or on-prem. Role-based access.{" "}
                <span className={styles.blue}>Zero data leaves your infrastructure.</span>
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
