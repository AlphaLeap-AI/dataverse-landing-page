"use client";

import { useEffect, useRef, useState } from "react";

import landingStyles from "./landing.module.css";
import styles from "./proof-section.module.css";
import { Reveal } from "./reveal";

const STATS = [
  { value: 30, suffix: " sec", decimals: 0, desc: "median time from question to answer, instead of three days and a ticket queue." },
  { value: 1, suffix: "", decimals: 0, desc: "interface for every employee, every data source, every question." },
];

/** Proof: count-up stats, set wide and narrow rather than as equal tiles. */
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
