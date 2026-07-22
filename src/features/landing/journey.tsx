"use client";

import { Check, FileCode, Hourglass, Layers, Network, Zap } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { AskExperience } from "./ask/ask-experience";
import { UniverseCanvas } from "./experience/universe-canvas";
import { CHAPTERS, type ChapterKey, chapterLocal, envelope, scrollState } from "./experience/scroll-driver";
import styles from "./journey.module.css";
import landingStyles from "./landing.module.css";

const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);

/* ── chapter copy ─────────────────────────────────────────────── */

const PAIN_CARDS = [
  {
    Icon: Hourglass,
    stat: "3 weeks",
    title: "The wait",
    body: "From question to deck. By the board meeting, the number is already stale.",
  },
  {
    Icon: FileCode,
    stat: "0.4%",
    title: "The gatekeeper",
    body: "Of your company can write SQL. Everyone else files a ticket and waits in line.",
  },
  {
    Icon: Layers,
    stat: "12 tools",
    title: "The sprawl",
    body: "Dashboards stacked on dashboards, each telling a different version of the truth.",
  },
];

const DB_CHIPS = [
  { name: "PostgreSQL", color: "#6aa6dd" },
  { name: "MongoDB", color: "#13c25b" },
  { name: "Snowflake", color: "#7fd4ff" },
  { name: "BigQuery", color: "#5f9bff" },
  { name: "Elasticsearch", color: "#ffd24d" },
  { name: "Redis", color: "#ff9a8a" },
  { name: "Kafka", color: "#c9a6ff" },
  { name: "Databricks", color: "#8b9aff" },
];

const CHAPTER_SQL = `SELECT region, sum(arr) AS at_risk
FROM subscriptions
WHERE renewal_risk = 'high'
GROUP BY 1
ORDER BY 2 DESC;`;

/* ── component ────────────────────────────────────────────────── */

/**
 * The scroll-driven heart of the page: hero (with the interactive ask
 * experience) followed by a pinned five-chapter journey. One rAF loop
 * writes scroll state for the WebGL scene and drives overlay envelopes.
 */
export function Journey() {
  const heroRef = useRef<HTMLElement>(null);
  const heroInnerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLElement>(null);
  const chapterRefs = useRef<Partial<Record<ChapterKey, HTMLDivElement | null>>>({});
  const sqlRef = useRef<HTMLSpanElement>(null);
  const bigNumRef = useRef<HTMLSpanElement>(null);
  const [askActive, setAskActive] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReducedMotion(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  /* Scroll → shared state. */
  useEffect(() => {
    let ticking = false;
    const update = () => {
      ticking = false;
      const vh = window.innerHeight;
      const y = window.scrollY;

      scrollState.heroExit = clamp01(y / (vh * 0.92));

      const track = trackRef.current;
      if (track) {
        const rect = track.getBoundingClientRect();
        scrollState.journey = clamp01(-rect.top / Math.max(1, rect.height - vh));
      }

      const finaleEl = document.getElementById("demo");
      if (finaleEl) {
        const r = finaleEl.getBoundingClientRect();
        scrollState.finale = clamp01((vh - r.top) / (vh * 0.85));
      }

      const docH = document.documentElement.scrollHeight - vh;
      scrollState.doc = docH > 0 ? clamp01(y / docH) : 0;
    };
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  /* Overlay envelopes + scrubbed details, one rAF loop. */
  useEffect(() => {
    let raf = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      const j = scrollState.journey;

      for (const ch of CHAPTERS) {
        const root = chapterRefs.current[ch.key];
        if (!root) continue;
        // Chaos starts fully visible; vault holds through the track's end.
        const a = ch.key === "chaos" ? -0.08 : ch.window[0];
        const b = ch.key === "vault" ? 1.1 : ch.window[1];
        const env = envelope(j, a, b, 0.024);
        root.style.opacity = env.toFixed(3);
        root.style.transform = `translateY(${((1 - env) * 34).toFixed(1)}px)`;
        const active = env > 0.6;
        if (active !== root.classList.contains(styles.isActive)) {
          root.classList.toggle(styles.isActive, active);
        }
      }

      const inner = heroInnerRef.current;
      if (inner) {
        const h = scrollState.heroExit;
        inner.style.opacity = String(clamp01(1 - h * 1.5));
        inner.style.transform = `translateY(${(-h * 90).toFixed(1)}px)`;
      }

      // 04 · Answer: SQL types itself as you scroll.
      const local = chapterLocal(j, "answer");
      if (sqlRef.current) {
        const n = Math.floor(clamp01((local - 0.08) / 0.4) * CHAPTER_SQL.length);
        const current = sqlRef.current.textContent ?? "";
        const next = CHAPTER_SQL.slice(0, n);
        if (current !== next) sqlRef.current.textContent = next;
      }
      if (bigNumRef.current) {
        const t = clamp01((local - 0.42) / 0.3);
        const eased = 1 - Math.pow(1 - t, 3);
        bigNumRef.current.textContent = (3.8 * eased).toFixed(1);
      }
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const setChapterRef = (key: ChapterKey) => (el: HTMLDivElement | null) => {
    chapterRefs.current[key] = el;
  };

  return (
    <>
      <UniverseCanvas reducedMotion={reducedMotion} />

      {/* ── HERO ── */}
      <section id="top" ref={heroRef} className={`${styles.hero} ${askActive ? styles.heroAskActive : ""}`}>
        <div ref={heroInnerRef} className={styles.heroInner}>
          {/* On mobile this whole block collapses away while the ask demo
              runs, so the pipeline + bridge CTA fit in one viewport. */}
          <div className={`${styles.heroLead} ${askActive ? styles.heroLeadCollapsed : ""}`}>
            <span className={styles.heroBadge}>
              <i className={styles.heroBadgeDot} />
              AI-native analytics<span className={styles.heroBadgeOpt}> · inside your walls</span>
            </span>
            <h1 className={`${styles.heroTitle} ${askActive ? styles.heroTitleDim : ""}`}>
              Ask <em>anything</em>.
              <br />
              Trust the answer.
            </h1>
            <p className={styles.heroSub}>
              <span className={styles.copyFull}>
                Dataverse plugs into every database you own, grounds each question in your approved schema, and
                returns SQL-backed answers in seconds — entirely inside your network.
              </span>
              <span className={styles.copyShort}>
                Every database you own. One conversation. SQL-backed answers in seconds — inside your network.
              </span>
            </p>
          </div>

          <AskExperience onPhaseChange={setAskActive} />

          <div className={`${styles.heroCtas} ${askActive ? styles.heroCtasHidden : ""}`}>
            <a href="#demo" className={`${landingStyles.btn} ${landingStyles.btnPrimary}`}>
              Book a 30-min demo
            </a>
            <a href="#story" className={`${landingStyles.btn} ${landingStyles.btnGhost}`}>
              Watch it think ↓
            </a>
          </div>
        </div>
        <div className={styles.scrollCue} aria-hidden="true">
          <span>Scroll</span>
          <span className={styles.scrollCueLine} />
        </div>
      </section>

      {/* ── CHAPTER TRACK ── */}
      <section id="story" ref={trackRef} className={styles.track}>
        <div className={styles.sticky}>
          {/* 01 · CHAOS */}
          <div ref={setChapterRef("chaos")} className={`${styles.chapter} ${styles.chapterCenter}`}>
            <div className={styles.chapterInner}>
              <span className={styles.eyebrow}>01 · The problem</span>
              <h2 className={styles.h2}>
                The truth is in there.
                <br />
                <em>So is the noise.</em>
              </h2>
              <div className={styles.painGrid}>
                {PAIN_CARDS.map((p) => (
                  <div key={p.title} className={`${styles.painCard} ${styles.anim}`}>
                    <p.Icon size={20} strokeWidth={2} className={styles.painIcon} aria-hidden="true" />
                    <div className={styles.painStat}>{p.stat}</div>
                    <div className={styles.painTitle}>{p.title}</div>
                    <p className={styles.painBody}>{p.body}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 02 · CONNECT */}
          <div ref={setChapterRef("connect")} className={`${styles.chapter} ${styles.chapterCenter}`}>
            <div className={styles.chapterInner}>
              <span className={styles.eyebrow}>02 · Connect</span>
              <h2 className={styles.h2}>
                Every source.
                <br />
                <em>One conversation.</em>
              </h2>
              <p className={`${styles.lead} ${styles.anim}`}>
                Warehouses, lakes, production databases, streams — plugged in live, not exported stale.
              </p>
              <div className={`${styles.chipRow} ${styles.anim}`}>
                {DB_CHIPS.map((db) => (
                  <span key={db.name} className={styles.dbChip}>
                    <i style={{ background: db.color }} />
                    {db.name}
                  </span>
                ))}
                <span className={`${styles.dbChip} ${styles.dbChipMore}`}>+ 30 more</span>
              </div>
            </div>
          </div>

          {/* 03 · UNDERSTAND */}
          <div ref={setChapterRef("lattice")} className={`${styles.chapter} ${styles.chapterCenter}`}>
            <div className={styles.chapterInner}>
              <span className={styles.eyebrow}>03 · Understand</span>
              <h2 className={styles.h2}>
                It reads your <em>entire database</em> —
                <br />
                and writes the docs nobody did.
              </h2>
              <div className={`${styles.learnGrid} ${styles.anim}`}>
                <div className={styles.tableCard}>
                  <div className={styles.tableCardHead}>
                    <span className={styles.tableCardHeadLeft}>
                      <span className={styles.livePulse} />
                      <span>Table · subscriptions</span>
                    </span>
                    <span className={styles.aiTag}>AI-documented</span>
                  </div>
                  <p className={styles.tableCardDesc}>
                    &ldquo;One row per customer contract term. Tracks plan, billing value and renewal state across
                    its lifecycle.&rdquo;
                  </p>
                  <div className={styles.columnGrid}>
                    <span className={styles.colName}>arr</span>
                    <span className={styles.colDesc}>&quot;annual recurring revenue, USD&quot;</span>
                    <span className={styles.colName}>renewal_risk</span>
                    <span className={styles.colDesc}>&quot;churn likelihood: low · med · high&quot;</span>
                    <span className={styles.colName}>term_end</span>
                    <span className={styles.colDesc}>&quot;contract expiry — renewal due&quot;</span>
                  </div>
                </div>
                <div className={styles.statsCard}>
                  <span className={styles.statCell}>
                    <b>47</b>tables mapped
                  </span>
                  <span className={styles.statCell}>
                    <b>612</b>columns explained
                  </span>
                  <span className={styles.statCell}>
                    <b className={styles.mint}>0</b>human inputs
                  </span>
                </div>
              </div>
              <p className={`${styles.foot} ${styles.anim}`}>
                Every table described. Every join mapped — even the ones nobody wrote down. Reviewed and
                approved by your team before a single answer runs.
              </p>
            </div>
          </div>

          {/* 04 · ANSWER */}
          <div ref={setChapterRef("answer")} className={`${styles.chapter} ${styles.chapterCenter}`}>
            <div className={styles.chapterInner}>
              <span className={styles.eyebrow}>04 · Answer</span>
              <h2 className={styles.h2}>
                One question in.
                <br />
                <em>A full analysis out.</em>
              </h2>
              <div className={styles.answerGrid}>
                <div className={`${styles.sqlCard} ${styles.anim}`}>
                  <span className={styles.cardLabel}>The query · inspectable</span>
                  <pre className={styles.sqlPre}>
                    <span ref={sqlRef} />
                    <span className={styles.sqlCaret} />
                  </pre>
                </div>
                <div className={`${styles.answerCard} ${styles.anim}`}>
                  <span className={styles.cardLabel}>The answer · 2.4s</span>
                  <div className={styles.answerBig}>
                    $<span ref={bigNumRef}>0.0</span>M
                    <span className={styles.answerBigCaption}>renewal ARR at risk</span>
                  </div>
                  <div className={styles.regionBars}>
                    <span>EMEA</span>
                    <span className={styles.regionBar} style={{ width: "100%" }} />
                    <span>NA</span>
                    <span className={styles.regionBar} style={{ width: "63%", opacity: 0.55 }} />
                    <span>APAC</span>
                    <span className={styles.regionBar} style={{ width: "37%", opacity: 0.35 }} />
                  </div>
                </div>
                <div className={`${styles.answerCard} ${styles.anim}`}>
                  <span className={`${styles.cardLabel} ${styles.labelGold}`}>Unasked · the why</span>
                  <p className={styles.answerText}>
                    <span className={styles.copyFull}>
                      Risk tracks support response time. Accounts waiting <b className={styles.gold}>&gt;48h</b> on
                      tickets churn <b>3.1×</b> more. 23 accounts named and ranked by save-ability.
                    </span>
                    <span className={styles.copyShort}>
                      Accounts waiting <b className={styles.gold}>&gt;48h</b> on tickets churn <b>3.1×</b> more. 23
                      accounts ranked by save-ability.
                    </span>
                  </p>
                </div>
                <div className={`${styles.answerCard} ${styles.answerCardMint} ${styles.anim}`}>
                  <span className={`${styles.cardLabel} ${styles.labelMint}`}>The plan</span>
                  <p className={styles.answerText}>
                    <span className={styles.copyFull}>
                      <b className={styles.mint}>$3.1M recoverable</b> — fast-lane tickets for flagged accounts, CSM
                      outreach drafted, and it re-checks the metric weekly so you don&apos;t have to.
                    </span>
                    <span className={styles.copyShort}>
                      <b className={styles.mint}>$3.1M recoverable</b> — fast-lane tickets, CSM outreach drafted,
                      re-checked weekly.
                    </span>
                  </p>
                </div>
              </div>
              <p className={`${styles.foot} ${styles.anim}`}>
                <span className={styles.mono}>11 queries · 3 databases · 2.4s</span> — like a whole data team,
                minus the ticket queue.
              </p>
            </div>
          </div>

          {/* 05 · PRIVATE */}
          <div ref={setChapterRef("vault")} className={`${styles.chapter} ${styles.chapterCenter}`}>
            <div className={styles.chapterInner}>
              <span className={styles.eyebrow}>05 · Private</span>
              <h2 className={styles.h2}>
                It never leaves
                <br />
                <em>your walls.</em>
              </h2>
              <p className={`${styles.lead} ${styles.anim}`}>
                Deploy in your VPC, air-gapped, or with your own models. Role-based access, audit logs,
                governance first.
              </p>
              <div className={`${styles.chipRow} ${styles.anim}`}>
                <span className={styles.vaultChip}>VPC &amp; on-prem</span>
                <span className={styles.vaultChip}>Air-gapped</span>
                <span className={styles.vaultChip}>Your own LLM</span>
                <span className={styles.vaultChip}>SSO · RBAC · audit</span>
              </div>
              <p className={`${styles.foot} ${styles.anim}`}>
                <span className={styles.mintText}>Zero data leaves your infrastructure.</span>
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
