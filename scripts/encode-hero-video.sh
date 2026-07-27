#!/usr/bin/env bash
#
# Encode the hero video into the three assets the landing page serves:
#
#   public/video/dataverse-demo.mp4   full cut, H.264 + AAC, faststart
#   public/video/hero-preview.mp4     silent looping teaser (H.264)
#   public/video/hero-preview.webm    same teaser, VP9 — ~35% smaller
#   public/video/hero-poster.jpg      first paint, before any video decodes
#
# Usage:
#   scripts/encode-hero-video.sh <source-video> [preview-start] [preview-length]
#
#   scripts/encode-hero-video.sh ~/Downloads/demo.mov
#   scripts/encode-hero-video.sh ~/Downloads/demo.mov 00:00:06 12
#
# preview-start defaults to 00:00:00 and preview-length to 10 (seconds).
# Pick a start point where the footage is visually busy but has no on-screen
# text — the hero copy sits on top of it.

set -euo pipefail

SRC="${1:-}"
PREVIEW_START="${2:-00:00:00}"
PREVIEW_LEN="${3:-10}"

if [[ -z "$SRC" ]]; then
  echo "usage: $0 <source-video> [preview-start] [preview-length]" >&2
  exit 1
fi

if [[ ! -f "$SRC" ]]; then
  echo "error: no such file: $SRC" >&2
  exit 1
fi

if ! command -v ffmpeg >/dev/null 2>&1; then
  echo "error: ffmpeg not found. Install it with:  brew install ffmpeg" >&2
  exit 1
fi

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT="$ROOT/public/video"
mkdir -p "$OUT"

# Cap at 1080p and force even dimensions (H.264 requires them).
SCALE="scale='min(1920,iw)':-2:flags=lanczos"
PREVIEW_SCALE="scale='min(1280,iw)':-2:flags=lanczos"

echo "→ full cut  → $OUT/dataverse-demo.mp4"
ffmpeg -hide_banner -loglevel error -stats -y -i "$SRC" \
  -vf "$SCALE" \
  -c:v libx264 -profile:v high -level 4.1 -preset slow -crf 21 \
  -pix_fmt yuv420p \
  -c:a aac -b:a 128k -ac 2 \
  -movflags +faststart \
  "$OUT/dataverse-demo.mp4"

echo "→ preview mp4 ($PREVIEW_LEN s from $PREVIEW_START) → $OUT/hero-preview.mp4"
ffmpeg -hide_banner -loglevel error -stats -y -ss "$PREVIEW_START" -t "$PREVIEW_LEN" -i "$SRC" \
  -vf "$PREVIEW_SCALE,fps=24" \
  -c:v libx264 -profile:v high -preset slow -crf 28 \
  -pix_fmt yuv420p -an \
  -movflags +faststart \
  "$OUT/hero-preview.mp4"

echo "→ preview webm → $OUT/hero-preview.webm"
ffmpeg -hide_banner -loglevel error -stats -y -ss "$PREVIEW_START" -t "$PREVIEW_LEN" -i "$SRC" \
  -vf "$PREVIEW_SCALE,fps=24" \
  -c:v libvpx-vp9 -crf 36 -b:v 0 -row-mt 1 -deadline good -cpu-used 2 \
  -pix_fmt yuv420p -an \
  "$OUT/hero-preview.webm"

echo "→ poster → $OUT/hero-poster.jpg"
ffmpeg -hide_banner -loglevel error -y -ss "$PREVIEW_START" -i "$SRC" \
  -vf "$SCALE" -frames:v 1 -q:v 4 \
  "$OUT/hero-poster.jpg"

echo
echo "Done:"
ls -lh "$OUT" | tail -n +2 | awk '{printf "  %-26s %s\n", $9, $5}'
echo
echo "Budget check — hero-preview.* is downloaded by every visitor."
echo "Keep it under ~3 MB; raise -crf or shorten the clip if it is over."
