"use client";

import { AskExperience } from "./ask/ask-experience";
import styles from "./ask-section.module.css";

/**
 * The interactive demo, in its own band between the video hero and the
 * pinned chapter track. It sits on the universe backdrop (no solid
 * background) so the particle field still reads behind it.
 */
export function AskSection() {
  return (
    <section id="ask" className={styles.root}>
      <div className={styles.inner}>
        <span className={styles.eyebrow}>Try it yourself</span>
        <h2 className={styles.title}>
          Ask a question. <em>Watch it work.</em>
        </h2>
        <p className={styles.lead}>
          Pick one of the questions below and follow the whole path — sources queried, SQL written, answer
          returned. No sign-up, no sales call.
        </p>
        <AskExperience />
      </div>
    </section>
  );
}
