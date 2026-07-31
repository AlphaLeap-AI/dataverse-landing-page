"use client";

import { useState } from "react";

import { AskExperience } from "./ask/ask-experience";
import styles from "./ask-section.module.css";

/**
 * The interactive demo, in its own band between the video hero and the
 * pinned chapter track. It sits on the universe backdrop (no solid
 * background) so the particle field still reads behind it.
 *
 * Once a question is running the intro copy folds away on narrow screens:
 * the instruction has been followed, and on a phone it was the only thing
 * standing between the user and the answer they asked for.
 */
export function AskSection() {
  const [running, setRunning] = useState(false);

  return (
    <section id="ask" className={styles.root}>
      <div className={`${styles.inner} ${running ? styles.running : ""}`}>
        <div className={styles.intro}>
          <span className={styles.eyebrow}>Try it yourself</span>
          <h2 className={styles.title}>
            Ask a question. <em>Watch it work.</em>
          </h2>
          <p className={styles.lead}>
            Pick one of the questions below and follow the whole path — sources queried, SQL written, answer
            returned. No sign-up, no sales call.
          </p>
        </div>
        <AskExperience onPhaseChange={setRunning} />
      </div>
    </section>
  );
}
