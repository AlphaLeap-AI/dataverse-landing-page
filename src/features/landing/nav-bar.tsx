"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import styles from "./landing.module.css";

const SECTIONS = [
  { id: "story", label: "The story" },
  { id: "ecosystem", label: "Ecosystem" },
  { id: "platform", label: "Platform" },
  { id: "proof", label: "Proof" },
] as const;

type SectionId = (typeof SECTIONS)[number]["id"];

/** Floating glass nav with a scroll-progress bar, scroll-spy and persistent demo CTA. */
export function NavBar() {
  const progressRef = useRef<HTMLDivElement | null>(null);
  const [active, setActive] = useState<SectionId | null>(null);

  useEffect(() => {
    let ticking = false;
    const update = () => {
      ticking = false;
      const docH = document.documentElement.scrollHeight - window.innerHeight;
      if (progressRef.current) {
        progressRef.current.style.width = `${docH > 0 ? (window.scrollY / docH) * 100 : 0}%`;
      }
    };
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    update();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* A section is current while it crosses the viewport's midline. The story
     track is many screens tall, so a threshold on visible area would never
     fire for it — a zero-height band in the middle works for every size. */
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const id = entry.target.id as SectionId;
          if (entry.isIntersecting) setActive(id);
          else setActive((current) => (current === id ? null : current));
        }
      },
      { rootMargin: "-50% 0px -50% 0px" }
    );
    for (const { id } of SECTIONS) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, []);

  return (
    <header className={styles.navFixed}>
      <div ref={progressRef} className={styles.navProgress} />
      <div className={styles.navInner}>
        <Link className={styles.brand} href="#top">
          <span className={styles.brandMark} aria-hidden="true">
            D
          </span>
          <span className={styles.brandWordmark}>Dataverse</span>
        </Link>
        <nav className={styles.navLinks} aria-label="Sections">
          {SECTIONS.map(({ id, label }) => (
            <Link key={id} href={`#${id}`} aria-current={active === id ? "location" : undefined}>
              {label}
            </Link>
          ))}
          <Link href="#demo" className={`${styles.btn} ${styles.btnPrimary} ${styles.btnSm} ${styles.navCta}`}>
            Book a demo
          </Link>
        </nav>
      </div>
    </header>
  );
}
