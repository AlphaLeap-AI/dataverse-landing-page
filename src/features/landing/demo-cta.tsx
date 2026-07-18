"use client";

import { useState } from "react";

import styles from "./demo-cta.module.css";
import { Reveal } from "./reveal";

const DEMO_EMAIL = process.env.NEXT_PUBLIC_DEMO_EMAIL?.trim() ?? "";
const IS_DEMO_EMAIL_CONFIGURED = DEMO_EMAIL.length > 0;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const TRUST_ITEMS = [
  { icon: "clock" as const, label: "30-min live walkthrough" },
  { icon: "check" as const, label: "Your data, your sources" },
  { icon: "check" as const, label: "Setup in days, not quarters" },
];

/** Closing conversion section — large cinematic headline + inline email CTA. */
export function DemoCta() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

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
    <section id="demo" className={styles.section}>
      <div className={styles.glow} aria-hidden="true" />

      <Reveal className={styles.revealBlock}>
        <div className={styles.copy}>
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
      </Reveal>

      {sent ? (
        <Reveal index={1} className={styles.revealBlock}>
          <div className={styles.successShell}>
            <div className={styles.success}>
              <span className={styles.successDot} />
              <span className={styles.successText}>
                You&apos;re in. We&apos;ll reach out within one business day to pick a slot.
              </span>
            </div>
          </div>
        </Reveal>
      ) : (
        <Reveal index={1} className={styles.revealBlock}>
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
        </Reveal>
      )}

      <Reveal index={2} className={styles.revealBlock}>
        <ul className={styles.trust}>
          {TRUST_ITEMS.map((item) => (
            <li key={item.label} className={styles.trustItem}>
              {item.icon === "clock" ? (
                <svg className={styles.trustIcon} viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <circle cx="8" cy="8" r="6.25" stroke="currentColor" strokeWidth="1.4" />
                  <path d="M8 4.5V8l2.25 1.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : (
                <svg className={styles.trustIcon} viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path
                    d="M3.5 8.25 6.4 11.1 12.5 4.9"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
              <span>{item.label}</span>
            </li>
          ))}
        </ul>
      </Reveal>
    </section>
  );
}
