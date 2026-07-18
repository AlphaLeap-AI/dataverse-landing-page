import landingStyles from "./landing.module.css";
import styles from "./platform-section.module.css";
import { Reveal } from "./reveal";

const DB_DOTS = ["#6aa6dd", "#13c25b", "#8b9aff", "#6fe0b2", "#ffd24d"];

/** "The platform" section: four highlight cards, matching Dataverse Landing.dc.html #platform. */
export function PlatformSection() {
  return (
    <section id="platform" className={landingStyles.section}>
      <Reveal className={landingStyles.sectHead}>
        <span className={landingStyles.eyebrow}>The platform</span>
        <h2>Only what matters. Nothing you have to learn.</h2>
      </Reveal>

      <div className={styles.grid}>
        <Reveal index={0} className={styles.card}>
          <span className={styles.cardTag}>&ldquo;show me churn by plan&rdquo;</span>
          <h3>Ask in plain English</h3>
          <p>Questions in, answers out. In any language your team speaks.</p>
        </Reveal>

        <Reveal index={1} className={styles.card}>
          <span className={styles.dots}>
            {DB_DOTS.map((color) => (
              <i key={color} style={{ background: color }} />
            ))}
          </span>
          <h3>One brain, five databases</h3>
          <p>SQL, NoSQL and vector stores answered through a single conversation.</p>
        </Reveal>

        <Reveal index={2} className={styles.card}>
          <span className={`${styles.cardTag} ${styles.mint}`}>
            SELECT … <span className={styles.dim}>// optimized, inspectable</span>
          </span>
          <h3>Answers that show their work</h3>
          <p>Every result ships with the query behind it. Trust it, or check it.</p>
        </Reveal>

        <Reveal index={3} className={styles.card}>
          <span className={`${styles.cardTag} ${styles.muted}`}>SSO · RBAC · audit log</span>
          <h3>Enterprise-grade guardrails</h3>
          <p>Governed access and a production-ready architecture from day one.</p>
        </Reveal>
      </div>
    </section>
  );
}
