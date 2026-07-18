"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

import styles from "./landing.module.css";

/** Fixed nav with a scroll-progress bar and a shadow that appears once the page scrolls. */
export function NavBar() {
  const navRef = useRef<HTMLElement | null>(null);
  const progressRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let ticking = false;
    const update = () => {
      ticking = false;
      const y = window.scrollY;
      const docH = document.documentElement.scrollHeight - window.innerHeight;
      if (progressRef.current) {
        progressRef.current.style.width = `${docH > 0 ? (y / docH) * 100 : 0}%`;
      }
      if (navRef.current) {
        navRef.current.style.boxShadow = y > 10 ? "rgba(12,26,43,.06) 0 8px 24px -8px" : "none";
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

  return (
    <header ref={navRef} className={styles.navFixed}>
      <div ref={progressRef} className={styles.navProgress} />
      <div className={styles.navInner}>
        <Link className={styles.brand} href="/">
          <span className={styles.brandMark}>D</span>
          <span className={styles.brandWordmark}>Dataverse</span>
        </Link>
        <div className={styles.navCta}>
          <Link className={`${styles.btn} ${styles.btnPrimary}`} href="#demo">
            Book demo
          </Link>
        </div>
      </div>
    </header>
  );
}
