import { CONNECTORS } from "./data";
import styles from "./landing.module.css";

/** Verified-connector chips with CSS-only hover tooltips. */
export function Connectors() {
  return (
    <section className={styles.connectors} id="connectors">
      <div className={styles.connectorsInner}>
        <span className={styles.connectorsLabel}>Verified connectors</span>
        <div className={styles.connectorRow}>
          {CONNECTORS.map((connector) => (
            <span key={connector.name} className={styles.connector}>
              <span
                className={styles.connectorSwatch}
                style={{ background: connector.color }}
                aria-hidden="true"
              />
              {connector.name}
              <span className={styles.connectorTip}>{connector.tip}</span>
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
