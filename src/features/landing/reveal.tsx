"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

import styles from "./landing.module.css";

interface RevealProps {
  children: ReactNode;
  className?: string;
  /** Stagger index — delays the transition by index * 90ms, matching grids of reveal cards. */
  index?: number;
}

/** Fades + slides children into view the first time they cross the viewport. */
export function Reveal({ children, className, index = 0 }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const classes = [styles.reveal, visible ? styles.in : "", className]
    .filter(Boolean)
    .join(" ");

  return (
    <div ref={ref} className={classes} style={{ transitionDelay: `${index * 90}ms` }}>
      {children}
    </div>
  );
}
