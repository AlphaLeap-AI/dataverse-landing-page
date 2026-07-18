import landingStyles from "./landing.module.css";
import styles from "./proof-section.module.css";
import { Reveal } from "./reveal";

const STATS = [
  { value: "30 sec", desc: "median time from question to answer — not three days and a ticket queue." },
  { value: "80%", desc: "fewer ad-hoc report requests landing on your analysts." },
  { value: "1", desc: "interface for every employee, every data source, every question." },
];

const LOGOS = [
  { name: "NORTHSTAR", style: { fontFamily: "var(--serif)", fontWeight: 600, letterSpacing: "0.06em" } },
  { name: "helion", style: { fontFamily: "var(--mono)", letterSpacing: "0.14em" } },
  { name: "MERIDIAN", style: { fontWeight: 600, letterSpacing: "0.22em" } },
  { name: "Atlas Freight", style: { fontFamily: "var(--serif)", fontStyle: "italic" } },
  { name: "ORBIT_LABS", style: { fontFamily: "var(--mono)", letterSpacing: "0.1em" } },
];

/** "Why it works" section: three stat cells, a testimonial, and client wordmarks. */
export function ProofSection() {
  return (
    <section id="proof" className={landingStyles.section}>
      <Reveal className={landingStyles.sectHead}>
        <span className={landingStyles.eyebrow}>Why it works</span>
        <h2>From &ldquo;ask the data team&rdquo; to &ldquo;ask the data.&rdquo;</h2>
      </Reveal>

      <div className={styles.stats}>
        {STATS.map((stat, i) => (
          <Reveal key={stat.value} index={i} className={styles.stat}>
            <div className={styles.statValue}>{stat.value}</div>
            <p className={styles.statDesc}>{stat.desc}</p>
          </Reveal>
        ))}
      </div>

      <Reveal className={styles.testimonial}>
        <p className={styles.quote}>
          &ldquo;The first Monday after rollout, nobody asked me for a report. They asked Dataverse.&rdquo;
        </p>
        <span className={styles.attribution}>Head of Data · placeholder testimonial</span>
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
