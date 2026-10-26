import landingStyles from "./landing.module.css";
import styles from "./ecosystem-section.module.css";
import { Reveal } from "./reveal";

/**
 * The ecosystem wall — model providers and everyday tools. One wide panel,
 * a different rhythm from the platform's tilt cards.
 * Tiles use neutral monogram marks — the same motif as the nav's brandMark —
 * so no trademarked logo assets are needed. Lists mirror the backend
 * catalogs (providers/llm/catalog.py, services/connectors/catalog.py).
 */

interface EcoTile {
  name: string;
  /** 1–2 letter monogram shown inside the mark. */
  mark: string;
  /** Render the mark in mono instead of serif (e.g. "{}"). */
  monoMark?: boolean;
}

const PROVIDERS: EcoTile[] = [
  { name: "OpenAI", mark: "O" },
  { name: "Anthropic", mark: "A" },
  { name: "Google Gemini", mark: "G" },
  { name: "DeepSeek", mark: "DS" },
  { name: "Z.AI (GLM)", mark: "Z" },
  { name: "Kimi", mark: "K" },
  { name: "MiniMax", mark: "MM" },
  { name: "Qwen", mark: "Q" },
  { name: "xAI (Grok)", mark: "X" },
  { name: "Mistral", mark: "Mi" },
  { name: "Groq", mark: "Gr" },
  { name: "Ollama", mark: "Ol" },
];

const TOOLS: EcoTile[] = [
  { name: "Notion", mark: "N" },
  { name: "Jira & Confluence", mark: "J" },
  { name: "GitHub", mark: "GH" },
  { name: "Google Drive", mark: "D" },
  { name: "Gmail", mark: "G" },
  { name: "Your MCP server", mark: "{}", monoMark: true },
];

const TOOLS_SOON: EcoTile[] = [
  { name: "Slack", mark: "S" },
  { name: "Linear", mark: "L" },
  { name: "Asana", mark: "A" },
  { name: "HubSpot", mark: "H" },
  { name: "Outlook", mark: "O" },
  { name: "Google Calendar", mark: "C" },
];

export function EcosystemSection() {
  return (
    <section id="ecosystem" className={landingStyles.section}>
      <Reveal className={landingStyles.sectHead}>
        <span className={landingStyles.eyebrow}>The ecosystem</span>
        <h2>Your models. Your tools.</h2>
        <p className={styles.lead}>
          Every database was just the start. Pick a frontier model for each question, run open weights, or go
          fully local — and put the agent to work in the tools where your team already lives.
        </p>
      </Reveal>

      <Reveal index={1}>
        <div className={styles.panel}>
          {/* Model providers */}
          <div className={styles.group}>
            <div className={styles.groupHead}>
              <span className={styles.groupLabel}>Model providers</span>
              <span className={styles.groupNote}>Cloud, open-weight, or fully local</span>
            </div>
            <div className={styles.grid}>
              {PROVIDERS.map((tile) => (
                <EcoTileView key={tile.name} tile={tile} />
              ))}
            </div>
            <p className={styles.plusLine}>
              + Together AI · Fireworks · Azure OpenAI · Azure AI Foundry · OpenRouter — or any
              OpenAI compatible endpoint.{" "}
              <span className={styles.plusAccent}>
                Admins set the default, anyone can switch per question — keys stay on the server, encrypted at
                rest.
              </span>
            </p>
          </div>

          <div className={styles.divider} role="presentation" />

          {/* Everyday tools */}
          <div className={styles.group}>
            <div className={styles.groupHead}>
              <span className={styles.groupLabel}>Everyday tools</span>
              <span className={styles.groupNote}>One click OAuth or token · grants per member</span>
            </div>
            <div className={styles.grid}>
              {TOOLS.map((tile) => (
                <EcoTileView key={tile.name} tile={tile} />
              ))}
            </div>
            <span className={styles.soonCaption}>Coming soon</span>
            <div className={styles.grid}>
              {TOOLS_SOON.map((tile) => (
                <EcoTileView key={tile.name} tile={tile} soon />
              ))}
            </div>
            <p className={styles.plusLine}>
              <span className={styles.plusAccent}>Admins enable, members authorize</span> — every connector
              call runs with the member&rsquo;s own permissions, never the admin&rsquo;s.
            </p>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

function EcoTileView({ tile, soon = false }: { tile: EcoTile; soon?: boolean }) {
  return (
    <span className={`${styles.tile} ${soon ? styles.tileSoon : ""}`}>
      <span
        aria-hidden="true"
        className={`${styles.mark} ${tile.monoMark ? styles.markMono : ""}`}
      >
        {tile.mark}
      </span>
      <span className={styles.tileName}>{tile.name}</span>
    </span>
  );
}
