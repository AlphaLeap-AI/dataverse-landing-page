import type { Metadata } from "next";
import Link from "next/link";

import styles from "@/features/legal/legal.module.css";
import { fontClassName } from "@/lib/fonts";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false },
};

/** Branded 404: same chrome as the legal pages, with a way back. */
export default function NotFound() {
  return (
    <div className={`${styles.root} ${fontClassName}`}>
      <header className={styles.bar}>
        <Link href="/" className={styles.wordmark}>
          <span className={styles.wordmarkDot} aria-hidden="true" />
          Dataverse
        </Link>
      </header>

      <main className={`${styles.doc} ${styles.notFound}`}>
        <p className={styles.eyebrow}>404</p>
        <h1 className={styles.title}>This page isn&rsquo;t in the schema.</h1>
        <p className={styles.notFoundLede}>
          The link may be old, or the address mistyped. Everything else is one click away.
        </p>
        <div className={styles.notFoundLinks}>
          <Link href="/" className={styles.notFoundPrimary}>
            Back to Dataverse
          </Link>
          <Link href="/#demo">Book a demo</Link>
        </div>
      </main>
    </div>
  );
}
