import Link from "next/link";

import styles from "./landing.module.css";

/**
 * Site footer: copyright + section links. `compact` renders the slim strip
 * docked at the bottom of the pinned finale panel.
 */
export function Footer({ compact = false }: { compact?: boolean }) {
  return (
    <footer className={`${styles.footer} ${compact ? styles.footerCompact : ""}`}>
      <span>© 2026 Dataverse · Your data never leaves your network.</span>
      <div className={styles.footLinks}>
        <Link href="#story">The story</Link>
        <Link href="#platform">Platform</Link>
        <Link href="#proof">Proof</Link>
        <Link href="#demo">Book a demo</Link>
      </div>
    </footer>
  );
}
