"use client";

import { useCallback, useRef } from "react";

import landingStyles from "./landing.module.css";
import styles from "./platform-section.module.css";
import { Reveal } from "./reveal";

const DB_DOT_COUNT = 5;

/**
 * Platform highlights with pointer-tracked 3D tilt — the cards physically
 * respond to the visitor, like everything else on this page.
 */
export function PlatformSection() {
  return (
    <section id="platform" className={landingStyles.section}>
      <Reveal className={landingStyles.sectHead}>
        <span className={landingStyles.eyebrow}>The platform</span>
        <h2>Plain questions in. Checked answers out.</h2>
      </Reveal>

      <div className={styles.grid}>
        <TiltCard index={0}>
          <span className={styles.cardTag}>&ldquo;why did churn spike in march?&rdquo;</span>
          <h3>Ask like you talk</h3>
          <p>Plain language in, grounded answers out — in any language your team thinks in.</p>
        </TiltCard>

        <TiltCard index={1}>
          <span className={styles.dots}>
            {Array.from({ length: DB_DOT_COUNT }, (_, i) => (
              <i key={i} />
            ))}
          </span>
          <h3>One brain, every database</h3>
          <p>SQL, NoSQL, warehouses and streams answered through a single conversation.</p>
        </TiltCard>

        <TiltCard index={2}>
          <span className={styles.cardTag}>
            SELECT … <span className={styles.dim}>// optimized, inspectable</span>
          </span>
          <h3>Answers that show their work</h3>
          <p>Every result ships with the query behind it. Trust it, or check it — your call.</p>
        </TiltCard>

        <TiltCard index={3}>
          <span className={`${styles.cardTag} ${styles.muted}`}>SSO · RBAC · audit log</span>
          <h3>Guardrails, built in</h3>
          <p>SSO, access roles and an audit log ship on day one. Nothing to bolt on later.</p>
        </TiltCard>
      </div>
    </section>
  );
}

function TiltCard({ children, index }: { children: React.ReactNode; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const raf = useRef(0);

  const onMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el || e.pointerType === "touch") return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(() => {
      el.style.transform = `perspective(900px) rotateX(${(-py * 7).toFixed(2)}deg) rotateY(${(px * 9).toFixed(2)}deg) translateY(-4px)`;
    });
  }, []);

  const onLeave = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    cancelAnimationFrame(raf.current);
    el.style.transform = "";
  }, []);

  return (
    <Reveal index={index} className={styles.cardWrap}>
      <div ref={ref} className={styles.card} onPointerMove={onMove} onPointerLeave={onLeave}>
        {children}
      </div>
    </Reveal>
  );
}
