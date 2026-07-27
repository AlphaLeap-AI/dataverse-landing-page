# Hero video assets

The landing page hero (`src/features/landing/video/hero-video.tsx`) expects
four files in this directory. They are **not** committed yet — the page
degrades to the gradient backdrop until they are.

| File | What it is | Budget |
| --- | --- | --- |
| `hero-poster.jpg` | First paint, before any video decodes | < 250 KB |
| `hero-preview.webm` | Silent looping teaser, VP9 | < 2 MB |
| `hero-preview.mp4` | Same teaser, H.264 fallback | < 3 MB |
| `dataverse-demo.mp4` | The full cut, with audio | < 25 MB |

## Generating them

```bash
brew install ffmpeg                       # one time
scripts/encode-hero-video.sh ~/path/to/demo.mov
```

Optionally pick where the preview loop is cut from — choose a stretch that is
visually busy but has no burned-in text, because the hero headline sits on top
of it:

```bash
scripts/encode-hero-video.sh ~/path/to/demo.mov 00:00:06 12
```

## Why the preview and the full cut are separate files

Every visitor downloads the preview, so it is short, silent, and heavily
compressed. The full cut is `preload="none"` and is only fetched once someone
hovers or focuses the play pill, so its size costs nothing to a visitor who
never clicks.

## Constraints worth knowing

- `-movflags +faststart` is mandatory. Without it the `moov` atom lands at the
  end of the file and the browser must download the whole thing before the
  first frame appears.
- GitHub Pages caps a single file at 100 MB and soft-caps bandwidth at
  100 GB/month. If `dataverse-demo.mp4` lands above ~25 MB, or the page starts
  getting real traffic, move the full cut to a CDN — swap the URLs in
  `src/lib/video.ts` and nothing else changes.
- A plain `<video>` cannot do adaptive bitrate. Everyone gets the one
  rendition you encode. That is the trade for not running a streaming service;
  if it starts mattering, that is the signal to move to Cloudflare Stream or
  Bunny Stream.
