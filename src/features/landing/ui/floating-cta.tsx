"use client";

import { ArrowRight, X } from "lucide-react";
import { useEffect, useState } from "react";

import { scrollState } from "../experience/scroll-driver";
import styles from "./floating-cta.module.css";

const DISMISS_KEY = "dv-floating-cta-dismissed";

/**
 * Persistent conversion: a floating "Book a demo" pill that appears once
 * the visitor is deep into the story and politely steps aside near the
 * finale (which has its own CTA). Dismissal is remembered for the session.
 */
export function FloatingCta() {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(DISMISS_KEY) === "1") setDismissed(true);
    } catch {
      // storage unavailable — harmless
    }

    let ticking = false;
    const update = () => {
      ticking = false;
      const vh = window.innerHeight;
      const docH = document.documentElement.scrollHeight - vh;
      const p = docH > 0 ? window.scrollY / docH : 0;

      const finale = document.getElementById("demo");
      const finaleNear = finale ? finale.getBoundingClientRect().top < vh * 0.85 : false;

      // On phones the pill would cover the pinned chapter overlays (they
      // fill the whole viewport) — the nav CTA covers conversion there.
      const mobileInTrack =
        window.innerWidth <= 720 && scrollState.journey > 0 && scrollState.journey < 1;

      setVisible(p > 0.42 && !finaleNear && !mobileInTrack);
    };
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const dismiss = () => {
    setDismissed(true);
    try {
      sessionStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // ignore
    }
  };

  if (dismissed) return null;

  return (
    <div className={`${styles.root} ${visible ? styles.shown : ""}`} aria-hidden={!visible}>
      <a href="#demo" className={styles.pill} tabIndex={visible ? 0 : -1}>
        <span className={styles.pulseDot} />
        Book a demo
        <ArrowRight size={14} strokeWidth={2.6} aria-hidden="true" />
      </a>
      <button
        type="button"
        className={styles.close}
        onClick={dismiss}
        aria-label="Dismiss"
        tabIndex={visible ? 0 : -1}
      >
        <X size={13} strokeWidth={2.4} aria-hidden="true" />
      </button>
    </div>
  );
}
