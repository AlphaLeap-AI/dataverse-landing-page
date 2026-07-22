"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

import styles from "./landing.module.css";

/** Fixed glass nav with a scroll-progress bar and persistent demo CTA. */
export function NavBar() {
  const progressRef = useRef<HTMLDivElement | null>(null);

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

  return (
    <header className={styles.navFixed}>
      <div ref={progressRef} className={styles.navProgress} />
      <div className={styles.navInner}>
        <Link className={styles.brand} href="#top">
          <span className={styles.brandMark}>D</span>
          <span className={styles.brandWordmark}>Dataverse</span>
        </Link>
        <nav className={styles.navLinks}>
          <Link href="#story">The story</Link>
          <Link href="#platform">Platform</Link>
          <Link href="#proof">Proof</Link>
          <Link href="#demo" className={`${styles.btn} ${styles.btnPrimary} ${styles.btnSm} ${styles.navCta}`}>
            Book a demo
          </Link>
        </nav>
      </div>
    </header>
  );
}
