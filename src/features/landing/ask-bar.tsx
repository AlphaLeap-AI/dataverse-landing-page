"use client";

import { ArrowRight, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

import styles from "./ask-bar.module.css";

const QUESTIONS = [
  "Which regions drove revenue growth last quarter?",
  "Why did churn spike in March?",
  "Which products have the best margin this month?",
  "Forecast next month's pipeline from current deals.",
];

/** Decorative hero input that types through example questions, matching the
 * "Ask" bubble further down the story's 04 · Ask beat. Purely atmospheric —
 * it links to the demo CTA rather than accepting real input. */
export function AskBar() {
  const [text, setText] = useState("");

  useEffect(() => {
    let alive = true;
    let timer: number;
    let qi = 0;
    let ci = 0;
    let deleting = false;

    const tick = () => {
      if (!alive) return;
      const q = QUESTIONS[qi];
      if (!deleting) {
        ci++;
        setText(q.slice(0, ci));
        if (ci === q.length) {
          deleting = true;
          timer = window.setTimeout(tick, 2200);
          return;
        }
        timer = window.setTimeout(tick, 32 + Math.random() * 40);
      } else {
        ci = Math.max(0, ci - 3);
        setText(q.slice(0, ci));
        if (ci === 0) {
          qi = (qi + 1) % QUESTIONS.length;
          deleting = false;
          timer = window.setTimeout(tick, 400);
          return;
        }
        timer = window.setTimeout(tick, 14);
      }
    };

    timer = window.setTimeout(tick, 900);
    return () => {
      alive = false;
      window.clearTimeout(timer);
    };
  }, []);

  return (
    <a href="#demo" className={styles.bar}>
      <Sparkles size={16} strokeWidth={2.2} className={styles.icon} aria-hidden="true" />
      <span className={styles.text}>
        {text}
        <span className={styles.caret} />
      </span>
      <span className={styles.askBtn}>
        Ask
        <ArrowRight size={13} strokeWidth={2.6} aria-hidden="true" />
      </span>
    </a>
  );
}
