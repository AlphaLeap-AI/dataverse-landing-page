import Link from "next/link";

import styles from "./cta-section.module.css";
import { DemoRequestForm } from "./demo-request-form";
import { Reveal } from "./reveal";

/** Dark, rounded-top closing section: CTA headline, the demo request form, and the site footer row. */
export function CtaSection() {
  return (
    <section id="demo" className={styles.section}>
      <div className={styles.glow} aria-hidden="true" />
      <Reveal className={styles.inner}>
        <h2>
          See your data <em>tidy itself</em>.
        </h2>
        <p className={styles.lead}>30 minutes, an engineer in the room, your governance questions welcome.</p>
        <div className={styles.formSlot}>
          <DemoRequestForm />
        </div>
      </Reveal>

      <div className={styles.footRow}>
        <span>© 2026 Dataverse · Your data never leaves your network.</span>
        <span className={styles.footLinks}>
          <Link href="#features">Platform</Link>
          <Link href="#see">Live demo</Link>
          <Link href="#demo">Book demo</Link>
        </span>
      </div>
    </section>
  );
}
