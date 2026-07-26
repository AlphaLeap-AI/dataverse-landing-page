"use client";

import { useCallback, useRef } from "react";

import landingStyles from "./landing.module.css";
import styles from "./ecosystem-section.module.css";
import { Reveal } from "./reveal";

/**
 * The ecosystem wall — model providers and everyday tools. One wide panel
 * (a different rhythm from the platform's 2×2 tilt cards) with the same
 * pointer-tracked glow, so it reads as a sibling section, not a bolt-on.
 * Tiles use tinted monogram marks — the same motif as the nav's brandMark —
 * so no trademarked logo assets are needed. Lists mirror the backend
 * catalogs (providers/llm/catalog.py, services/connectors/catalog.py).
 */

interface EcoTile {
  name: string;
  /** 1–2 letter monogram shown inside the tinted mark. */
  mark: string;
  /** 6-digit hex — the mark appends alpha suffixes for its bg/border. */
  tint: string;
  /** Render the mark in mono instead of serif (e.g. "{}"). */
  monoMark?: boolean;
}

const PROVIDERS: EcoTile[] = [
  { name: "OpenAI", mark: "O", tint: "#8fd3c7" },
  { name: "Anthropic", mark: "A", tint: "#d97757" },
  { name: "Google Gemini", mark: "G", tint: "#8fb4ff" },
  { name: "DeepSeek", mark: "DS", tint: "#57d0ff" },
  { name: "Z.AI (GLM)", mark: "Z", tint: "#c3d2ee" },
  { name: "Kimi", mark: "K", tint: "#a78bfa" },
  { name: "MiniMax", mark: "MM", tint: "#ff9a8a" },
  { name: "Qwen", mark: "Q", tint: "#c9a6ff" },
  { name: "xAI (Grok)", mark: "X", tint: "#eef2fb" },
  { name: "Mistral", mark: "Mi", tint: "#ffb347" },
  { name: "Groq", mark: "Gr", tint: "#ff8a5c" },
  { name: "Ollama", mark: "Ol", tint: "#4ade80" },
];

const TOOLS: EcoTile[] = [
  { name: "Notion", mark: "N", tint: "#eef2fb" },
  { name: "Jira & Confluence", mark: "J", tint: "#5f9bff" },
  { name: "GitHub", mark: "GH", tint: "#a8b4d0" },
  { name: "Google Drive", mark: "D", tint: "#4ade80" },
  { name: "Gmail", mark: "G", tint: "#ff9a8a" },
  { name: "Your MCP server", mark: "{}", tint: "#67e8f9", monoMark: true },
];

const SOON_TINT = "#8b96ad";

const TOOLS_SOON: EcoTile[] = [
  { name: "Slack", mark: "S", tint: SOON_TINT },
  { name: "Linear", mark: "L", tint: SOON_TINT },
  { name: "Asana", mark: "A", tint: SOON_TINT },
  { name: "HubSpot", mark: "H", tint: SOON_TINT },
  { name: "Outlook", mark: "O", tint: SOON_TINT },
  { name: "Google Calendar", mark: "C", tint: SOON_TINT },
];

export function EcosystemSection() {
  const panelRef = useRef<HTMLDivElement>(null);
  const raf = useRef(0);

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const el = panelRef.current;
    if (!el || e.pointerType === "touch") return;
    const rect = el.getBoundingClientRect();
    cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(() => {
      el.style.setProperty("--gx", `${(((e.clientX - rect.left) / rect.width) * 100).toFixed(1)}%`);
      el.style.setProperty("--gy", `${(((e.clientY - rect.top) / rect.height) * 100).toFixed(1)}%`);
    });
  }, []);

  return (
    <section id="ecosystem" className={landingStyles.section}>
      <Reveal className={landingStyles.sectHead}>
        <span className={landingStyles.eyebrow}>The ecosystem</span>
        <h2>Your models. Your tools.</h2>
        <p className={styles.lead}>
          Every database was just the start. Pick a frontier model for each question, run open-weight, or go
          fully local — and put the agent to work in the tools where your team already lives.
        </p>
      </Reveal>

      <Reveal index={1}>
        <div ref={panelRef} className={styles.panel} onPointerMove={onPointerMove}>
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
              OpenAI-compatible endpoint.{" "}
              <span className={styles.plusAccent}>
                Admins set the default, anyone can switch per question — keys stay server-side, encrypted at
                rest.
              </span>
            </p>
          </div>

          <div className={styles.divider} role="presentation" />

          {/* Everyday tools */}
          <div className={styles.group}>
            <div className={styles.groupHead}>
              <span className={styles.groupLabel}>Everyday tools</span>
              <span className={styles.groupNote}>One-click OAuth or token · per-user grants</span>
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
        style={{ color: tile.tint, background: `${tile.tint}24`, borderColor: `${tile.tint}52` }}
      >
        {tile.mark}
      </span>
      <span className={styles.tileName}>{tile.name}</span>
    </span>
  );
}
