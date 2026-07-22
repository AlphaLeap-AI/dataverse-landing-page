"use client";

import { useEffect, useRef, useState } from "react";

import styles from "./demo-cta.module.css";
import { Footer } from "./footer";

const DEMO_EMAIL = process.env.NEXT_PUBLIC_DEMO_EMAIL?.trim() ?? "";
const IS_DEMO_EMAIL_CONFIGURED = DEMO_EMAIL.length > 0;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const TRUST_ITEMS = [
  "30-min live walkthrough",
  "Your data, your sources",
  "An engineer in the room",
  "Setup in days, not quarters",
];

/**
 * The finale — sticky full-viewport conversion moment. A tall scroll track
 * pins the screen so visitors can't skim past the most important CTA.
 * Headline sits higher; the form + trust dock floats up as the user keeps
 * scrolling through the pin, then locks. The footer is docked inside the
 * pinned panel, so the pin end IS the bottom of the page — the whole
 * section stays settled at the bottom breakpoint (no drift, no snap-back).
 */
export function DemoCta() {
  const trackRef = useRef<HTMLElement>(null);
  const clusterRef = useRef<HTMLDivElement>(null);
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  useEffect(() => {
    const track = trackRef.current;
    const cluster = clusterRef.current;
    if (!track || !cluster) return;

    let raf = 0;
    // Latch: once the bar has floated in, keep it revealed until the
    // section fully leaves — avoids flicker / snap-back hide.
    let latched = false;

    const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

    const update = () => {
      raf = 0;
      const rect = track.getBoundingClientRect();
      const vh = window.innerHeight;
      const trackH = track.offsetHeight;
      const pinRange = Math.max(1, trackH - vh);

      // Float starts as the panel approaches (so #demo deep-links still
      // show the bar) and finishes partway into the pin — the rest of the
      // pin is a settled full-viewport hold. The footer docks inside the
      // panel, so the page ends exactly where the pin ends: no post-pin
      // drift, no snap-back on release.
      const riseStart = vh * 0.55; // begin rising when track nears mid-viewport
      const riseEnd = -pinRange * 0.45; // fully up ~45% into the pin
      let reveal = clamp01((riseStart - rect.top) / (riseStart - riseEnd));

      const inView = rect.top < vh * 0.85 && rect.bottom > vh * 0.1;
      if (reveal >= 0.97) latched = true;
      // Only unlatch once the finale has fully left the viewport.
      if (rect.bottom <= 0 || rect.top >= vh) latched = false;

      // Once fully revealed, lock the bar in place for the rest of the pin.
      if (latched && inView) reveal = 1;

      // Scroll-linked float (not a CSS enter/leave toggle) so releasing
      // mid-scroll keeps the current state instead of snapping it away.
      const y = (1 - reveal) * 64;
      cluster.style.opacity = String(reveal);
      cluster.style.transform = `translate3d(0, ${y.toFixed(1)}px, 0)`;
    };

    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedEmail = email.trim();

    if (!EMAIL_PATTERN.test(trimmedEmail)) {
      setError("Please use a valid work email.");
      return;
    }
    if (!IS_DEMO_EMAIL_CONFIGURED) {
      setError("");
      return;
    }

    const subject = "Dataverse demo request";
    const body = ["Dataverse demo request", "", `Work email: ${trimmedEmail}`].join("\n");
    const mailtoHref = `mailto:${DEMO_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.assign(mailtoHref);

    setError("");
    setSent(true);
  }

  const configMessage = IS_DEMO_EMAIL_CONFIGURED
    ? null
    : process.env.NODE_ENV === "development"
      ? "Set NEXT_PUBLIC_DEMO_EMAIL to enable demo requests in development."
      : "NEXT_PUBLIC_DEMO_EMAIL must be configured before launch.";

  return (
    <section id="demo" ref={trackRef} className={styles.track} aria-label="Book a demo">
      <div className={styles.panel}>
        {/* Upper field — headline sits higher so the form can occupy more of the frame */}
        <div className={styles.upper}>
          <div className={styles.copy}>
            <span className={styles.eyebrow}>The universe is listening</span>
            <h2 className={styles.headline}>
              <span className={styles.lineMuted}>Your data is</span>
              <span className={styles.lineReady}>ready.</span>
              <span className={styles.lineGradient}>Are you?</span>
            </h2>
            <p className={styles.lead}>
              See Dataverse answer your hardest questions — live, on your own sources. Thirty minutes. Zero
              commitment.
            </p>
          </div>
        </div>

        {/* Bottom slot sits higher; cluster floats up as pin progress advances */}
        <div className={styles.bottomSlot}>
          <div ref={clusterRef} className={styles.bottomCluster}>
            {sent ? (
              <div className={styles.successShell}>
                <div className={styles.success}>
                  <span className={styles.successDot} />
                  <span className={styles.successText}>
                    You&apos;re in. We&apos;ll reach out within one business day to pick a slot.
                  </span>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate className={styles.form}>
                <div className={styles.pill}>
                  <label className={styles.field}>
                    <span className={styles.srOnly}>Work email</span>
                    <input
                      type="email"
                      name="email"
                      autoComplete="email"
                      placeholder="you@company.com"
                      value={email}
                      onChange={(event) => {
                        setEmail(event.target.value);
                        setError("");
                      }}
                      className={styles.input}
                    />
                  </label>
                  <button type="submit" className={styles.submit}>
                    Book my demo <span aria-hidden="true">→</span>
                  </button>
                </div>

                {error ? <p className={styles.error}>{error}</p> : null}
                {configMessage ? (
                  <p className={styles.configNote} aria-live="polite">
                    {configMessage}
                  </p>
                ) : null}
              </form>
            )}

            <ul className={styles.trust}>
              {TRUST_ITEMS.map((label) => (
                <li key={label} className={styles.trustItem}>
                  <svg className={styles.trustIcon} viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <path
                      d="M3.5 8.25 6.4 11.1 12.5 4.9"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span>{label}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Docked inside the pinned panel: the pin end is the page bottom,
            so the settled section never drifts or snaps back on release. */}
        <Footer compact />
      </div>
    </section>
  );
}
