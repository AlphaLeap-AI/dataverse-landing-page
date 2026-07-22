"use client";

import { useEffect, useRef, useState } from "react";

import landingStyles from "./landing.module.css";
import styles from "./proof-section.module.css";
import { Reveal } from "./reveal";

const STATS = [
  { value: 30, suffix: " sec", decimals: 0, desc: "median time from question to answer — not three days and a ticket queue." },
  { value: 80, suffix: "%", decimals: 0, desc: "fewer ad-hoc report requests landing on your analysts." },
  { value: 1, suffix: "", decimals: 0, desc: "interface for every employee, every data source, every question." },
];

const LOGOS = [
  { name: "NORTHSTAR", style: { fontFamily: "var(--serif)", fontWeight: 600, letterSpacing: "0.06em" } },
  { name: "helion", style: { fontFamily: "var(--mono)", letterSpacing: "0.14em" } },
  { name: "MERIDIAN", style: { fontWeight: 600, letterSpacing: "0.22em" } },
  { name: "Atlas Freight", style: { fontFamily: "var(--serif)", fontStyle: "italic" } },
  { name: "ORBIT_LABS", style: { fontFamily: "var(--mono)", letterSpacing: "0.1em" } },
];

/** Proof: count-up stats, a testimonial, and client wordmarks. */
export function ProofSection() {
  return (
    <section id="proof" className={landingStyles.section}>
      <Reveal className={landingStyles.sectHead}>
        <span className={landingStyles.eyebrow}>Proof</span>
        <h2>From &ldquo;ask the data team&rdquo; to &ldquo;ask the data.&rdquo;</h2>
      </Reveal>

      <div className={styles.stats}>
        {STATS.map((stat, i) => (
          <Reveal key={stat.suffix + stat.value} index={i} className={styles.stat}>
            <CountUp value={stat.value} suffix={stat.suffix} decimals={stat.decimals} />
            <p className={styles.statDesc}>{stat.desc}</p>
          </Reveal>
        ))}
      </div>

      <Reveal className={styles.testimonial}>
        <p className={styles.quote}>
          &ldquo;The first Monday after rollout, nobody asked me for a report. They asked Dataverse.&rdquo;
        </p>
        <span className={styles.attribution}>Head of Data · enterprise pilot</span>
        <div className={styles.logos}>
          {LOGOS.map((logo) => (
            <span key={logo.name} className={styles.logo} style={logo.style}>
              {logo.name}
            </span>
          ))}
        </div>
      </Reveal>
    </section>
  );
}

function CountUp({ value, suffix, decimals }: { value: number; suffix: string; decimals: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) return;
        observer.disconnect();
        const t0 = performance.now();
        const step = (now: number) => {
          const t = Math.min(1, (now - t0) / 1400);
          setDisplay(value * (1 - Math.pow(1 - t, 3)));
          if (t < 1) raf = requestAnimationFrame(step);
        };
        raf = requestAnimationFrame(step);
      },
      { threshold: 0.4 }
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [value]);

  return (
    <div ref={ref} className={styles.statValue}>
      {display.toFixed(decimals)}
      {suffix}
    </div>
  );
}
