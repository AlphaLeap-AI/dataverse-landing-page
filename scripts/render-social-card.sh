#!/usr/bin/env bash
# Render the 1200×630 Open Graph / WhatsApp share image.
# Source: scripts/social-card.html → public/dataverse-social-card.{png,jpg}
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
HTML="$ROOT/scripts/social-card.html"
PNG="$ROOT/public/dataverse-social-card.png"
JPG="$ROOT/public/dataverse-social-card.jpg"

CHROME="${CHROME:-}"
if [[ -z "$CHROME" ]]; then
  for candidate in \
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
    "/Applications/Chromium.app/Contents/MacOS/Chromium" \
    "google-chrome" \
    "chromium" \
    "chromium-browser"; do
    if command -v "$candidate" >/dev/null 2>&1 || [[ -x "$candidate" ]]; then
      CHROME="$candidate"
      break
    fi
  done
fi

if [[ -z "${CHROME}" ]]; then
  echo "Error: Chrome/Chromium not found. Set CHROME=/path/to/chrome" >&2
  exit 1
fi

if [[ ! -f "$HTML" ]]; then
  echo "Error: missing $HTML" >&2
  exit 1
fi

echo "Rendering social card from $HTML ..."
"$CHROME" --headless=new --disable-gpu --hide-scrollbars \
  --window-size=1200,630 \
  --virtual-time-budget=8000 \
  --screenshot="$PNG" \
  "file://$HTML" >/dev/null 2>&1

if command -v magick >/dev/null 2>&1; then
  magick "$PNG" -resize '1200x630>' -quality 92 "$JPG"
elif command -v convert >/dev/null 2>&1; then
  convert "$PNG" -resize '1200x630>' -quality 92 "$JPG"
else
  # Pillow fallback
  python3 - <<PY
from PIL import Image
im = Image.open("$PNG").convert("RGB")
im = im.resize((1200, 630), Image.Resampling.LANCZOS)
im.save("$JPG", "JPEG", quality=92, optimize=True)
print("wrote $JPG via Pillow")
PY
fi

ls -la "$PNG" "$JPG"
echo "Done. Point og:image / twitter:image at /dataverse-social-card.jpg"
