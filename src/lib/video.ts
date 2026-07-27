import { asset } from "./assets";

export interface VideoSource {
  src: string;
  /** MIME type — the browser picks the first one it can decode. */
  type: string;
}

export interface HeroVideoConfig {
  /** First paint of the panel: shown until the preview has decoded a frame. */
  poster: string;
  /** Muted, silent, looping teaser. Downloaded eagerly — keep it small. */
  preview: VideoSource[];
  /** The real thing, with audio. Only fetched once the visitor shows intent. */
  full: VideoSource[];
  /** Accessible name for the player dialog. */
  title: string;
  /** Rendered on the play pill, e.g. "2 min". Omit to hide. */
  durationLabel?: string;
  /** Intrinsic aspect ratio (w / h) — reserves layout space, avoids CLS. */
  aspectRatio: number;
}

/**
 * ── Hosting swap point ────────────────────────────────────────────
 *
 * Self-hosted out of `public/video/` (see `public/video/README.md` and
 * `scripts/encode-hero-video.sh`). To move to a CDN — Cloudflare Stream,
 * Bunny, S3+CloudFront — replace the `asset(...)` calls with absolute URLs
 * and nothing else in the app has to change:
 *
 *   full: [{ src: "https://customer-xyz.cloudflarestream.com/<uid>/downloads/default.mp4",
 *            type: "video/mp4" }]
 *
 * The one thing a plain <video> cannot do is adaptive bitrate. If you move to
 * HLS (`.m3u8`) you also need hls.js for non-Safari browsers — at that point
 * point `full` at the CDN's MP4 rendition, or wire hls.js into HeroVideo.
 */
export const heroVideo: HeroVideoConfig = {
  poster: asset("/video/hero-poster.jpg"),
  preview: [
    { src: asset("/video/hero-preview.webm"), type: "video/webm" },
    { src: asset("/video/hero-preview.mp4"), type: "video/mp4" },
  ],
  full: [{ src: asset("/video/dataverse-demo.mp4"), type: "video/mp4" }],
  title: "Dataverse product demo",
  durationLabel: "2 min",
  aspectRatio: 16 / 9,
};
