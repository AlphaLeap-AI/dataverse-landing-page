import Link from "next/link";
import type { ReactNode } from "react";

import { lastUpdated } from "./company";
import styles from "./legal.module.css";

/**
 * Chrome shared by the privacy policy and the terms of service: masthead,
 * document column, and footer.
 *
 * Fonts come in as a class from `src/lib/fonts.ts`, the same module the
 * landing page uses, so the legal routes stay independent of the
 * (deliberately bare) root layout.
 */
export function LegalShell({
  current,
  eyebrow,
  title,
  lede,
  sections,
  children,
  fontClassName,
}: {
  /** Which masthead link to mark as the active page. */
  current: "privacy" | "terms";
  eyebrow: string;
  title: string;
  lede: ReactNode;
  /** Section anchors, rendered as the contents list. Order must match the body. */
  sections: ReadonlyArray<{ id: string; label: string }>;
  children: ReactNode;
  fontClassName: string;
}) {
  return (
    <div className={`${styles.root} ${fontClassName}`}>
      <header className={styles.bar}>
        <Link href="/" className={styles.wordmark}>
          <span className={styles.wordmarkDot} aria-hidden="true" />
          Dataverse
        </Link>
        <nav className={styles.barLinks}>
          <Link href="/privacy" data-current={current === "privacy"}>
            Privacy
          </Link>
          <Link href="/terms" data-current={current === "terms"}>
            Terms
          </Link>
          <Link href="/">Back to site</Link>
        </nav>
      </header>

      <main className={styles.doc}>
        <p className={styles.eyebrow}>{eyebrow}</p>
        <h1 className={styles.title}>{title}</h1>
        <div className={styles.meta}>
          <span>Last updated: {lastUpdated}</span>
          <span>Effective: {lastUpdated}</span>
        </div>

        <div className={styles.lede}>{lede}</div>

        <nav className={styles.toc} aria-label="Contents">
          <p className={styles.tocTitle}>Contents</p>
          <ol className={styles.tocList}>
            {sections.map((section) => (
              <li key={section.id}>
                <a href={`#${section.id}`}>{section.label}</a>
              </li>
            ))}
          </ol>
        </nav>

        {children}
      </main>

      <footer className={styles.footer}>
        <span>© 2026 Dataverse · Your data never leaves your network.</span>
        <div className={styles.footLinks}>
          <Link href="/">Home</Link>
          <Link href="/privacy">Privacy Policy</Link>
          <Link href="/terms">Terms of Service</Link>
        </div>
      </footer>
    </div>
  );
}

/** One numbered section of a legal document. */
export function Section({
  id,
  heading,
  children,
}: {
  id: string;
  heading: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className={styles.section}>
      <h2>{heading}</h2>
      {children}
    </section>
  );
}

/** A pulled-aside statement readers should not skim past. */
export function Callout({ children }: { children: ReactNode }) {
  return <div className={styles.callout}>{children}</div>;
}

/** Two-column definition table. */
export function DefinitionTable({
  columns,
  rows,
}: {
  columns: readonly [string, string];
  rows: ReadonlyArray<readonly [string, ReactNode]>;
}) {
  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>{columns[0]}</th>
            <th>{columns[1]}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([term, definition]) => (
            <tr key={term}>
              <td>{term}</td>
              <td>{definition}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Closing contact panel. */
export function ContactBlock({ children }: { children: ReactNode }) {
  return <address className={styles.contact}>{children}</address>;
}
