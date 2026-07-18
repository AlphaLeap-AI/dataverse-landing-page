import styles from "./features-grid.module.css";
import landingStyles from "./landing.module.css";
import { Reveal } from "./reveal";

const DB_DOTS = ["#336791", "#29b5e8", "#f29111", "#4285f4"];

/** Bento grid of five platform highlights, styled after the v2 design's minimal-text bento. */
export function FeaturesGrid() {
  return (
    <section id="features" className={styles.section}>
      <Reveal className={styles.head}>
        <span className={landingStyles.eyebrow}>The platform</span>
        <h2>Everything that matters, up front.</h2>
      </Reveal>

      <div className={styles.grid}>
        <Reveal className={`${styles.card} ${styles.span3}`}>
          <div className={styles.pillRow}>
            <span className={styles.dbDots}>
              {DB_DOTS.map((color) => (
                <i key={color} style={{ background: color }} />
              ))}
            </span>
            <span className={styles.pillLine} />
            <span className={styles.pill}>Ask anything</span>
          </div>
          <div>
            <h3>Chat with every database</h3>
            <p>Postgres to Snowflake — one thread, live sources.</p>
          </div>
        </Reveal>

        <Reveal className={`${styles.card} ${styles.span3} ${styles.dark}`}>
          <div className={styles.darkRow}>
            <span className={styles.darkIcon}>●</span>
            <span className={styles.darkTag}>YOUR NETWORK · NO EGRESS</span>
          </div>
          <div className={styles.darkBody}>
            <h3>Fully private, on-prem ready</h3>
            <p>VPC, air-gapped, your own LLM. Full control.</p>
          </div>
        </Reveal>

        <Reveal className={`${styles.card} ${styles.span2}`}>
          <div className={styles.mockGrid}>
            <span className={styles.mockBlock} />
            <span className={`${styles.mockBlock} ${styles.mockBlockActive}`} />
            <span className={`${styles.mockBlock} ${styles.mockBlockWide}`} />
          </div>
          <div>
            <h3>Dashboards on the fly</h3>
            <p>Pin any answer. It stays live.</p>
          </div>
        </Reveal>

        <Reveal className={`${styles.card} ${styles.span2}`}>
          <div className={styles.tags}>
            <span className={`${styles.tag} ${styles.tagAccent}`}>fiscal starts Feb</span>
            <span className={styles.tag}>NRR skill</span>
            <span className={styles.tag}>rule #12</span>
          </div>
          <div>
            <h3>Skills &amp; business rules</h3>
            <p>Encode how your company counts.</p>
          </div>
        </Reveal>

        <Reveal className={`${styles.card} ${styles.span2}`}>
          <div className={styles.quote}>
            …for <mark>active customers</mark> in Q3
          </div>
          <div>
            <h3>Glossary &amp; company knowledge</h3>
            <p>Your terms mean one thing, everywhere.</p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
