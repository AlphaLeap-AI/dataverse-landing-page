import Link from "next/link";

import styles from "./landing.module.css";

/** Site footer: copyright + section links, matching Dataverse Landing.dc.html. */
export function Footer() {
  return (
    <footer className={styles.footer}>
      <span>© 2026 Dataverse · Your data never leaves your network.</span>
      <div className={styles.footLinks}>
        <Link href="#platform">Platform</Link>
        <Link href="#proof">Why it works</Link>
        <Link href="#demo">Book a demo</Link>
      </div>
    </footer>
  );
}
