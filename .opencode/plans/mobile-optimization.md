# Mobile Experience Optimization — Dataverse Landing Page

## Goal
Make the landing page feel native on phones (≤720px, focus 390×844 and 360×740):
typography, layout, and touch interaction tuned so the full story + ask demo +
conversion path work with zero scroll-fighting, zero clipped content, zero zoom bugs.

## User decisions (confirmed)
- Hero ask-active on mobile: **collapse title/subtitle fully** (smooth max-height → 0).
- Floating CTA on mobile: **hidden while inside the pinned story track** (nav CTA persists).

## Audit findings (verified via Playwright screenshots, 390×844)
1. Hero overflows 100svh — ghost CTA clipped below fold.
2. Ask flow: dimmed title+sub stay → panels + bridge CTA pushed below fold; hero grows
   taller than viewport → scrolling to read triggers `heroExit` camera dive (scroll fights user).
3. Chapter 04 (answer): 4 stacked cards + foot overflow viewport; "THE PLAN" cut mid-sentence;
   nested `overflow-y:auto` = scroll-trap inside the pinned sticky.
4. Floating CTA pill overlaps chapter content mid-story.
5. iOS auto-zoom: ask input 14px, demo email input 15.5px (<16px threshold).
6. Camera `pointermove` parallax active on coarse pointers → sway during touch scroll.
7. Scene objects (connect orbs, vault shell, answer scene) not aspect-fitted → clipped on portrait.
8. Short chapters top-anchor with dead bottom space; tall chapters overflow.
9. Tap targets <44px (chips ~31px, Ask btn ~37px, floating close 28px).
10. No `env(safe-area-inset-*)`; no viewport export; heavy stacked backdrop-blurs on mobile GPU.

## Implementation

### Phase 1 — Critical interaction fixes

**1. Compact mobile ask mode** — `journey.tsx`, `journey.module.css`, `ask/ask.module.css`
- Add `askActive` state already exists in journey.tsx. On ≤720px, when active:
  - Apply collapse class to badge/title/sub: `max-height: 0; opacity: 0; margin: 0;
    overflow: hidden; transition ~0.5s cubic-bezier(0.22,1,0.36,1)` (same pattern as
    `heroCtasHidden`). Wrap title+sub in a collapsible container so max-height animates.
  - Reduce hero top padding (96px → ~72px) in this state.
- `ask.module.css` mobile caps: `.code` max-height 150→110px; `.bars` min-height
  110→96px; `.panel` padding 16→14px; docked panels stay 44px.
- Bridge: already column on ≤560px — extend to ≤720px, buttons full-width, min-height
  46px, gap 10px.
- Target: bar + stage + bridge ≤ 100svh at 390×844 → no page scroll → no accidental
  heroExit during the flow.

**2. Answer chapter fits viewport** — `journey.module.css`
- Mobile (≤900px): `.answerGrid` becomes: SQL card full width, answer card full width,
  then `.whyPlanRow` 2-col grid for the why/plan cards (needs a wrapper div or
  grid-column rules: SQL `grid-column: 1/-1`, answer `1/-1`, why/plan auto 2-col).
- Compact: card padding 18→14px; `.sqlPre` min-height 90→64px, font-size 12→11px;
  `.answerBig` clamp min 30→26px; `.regionBars` gap tighter; `.foot` margin-top small.
- Verify content height ≤ viewport so `overflow-y:auto` never engages.

**3. iOS zoom fix** — `ask.module.css`, `demo-cta.module.css`
- `.input` font-size → 16px on ≤560px (both ask bar and finale email input).

**4. Disable pointer parallax on touch** — `experience/camera-rig.tsx`
- `const coarse = window.matchMedia("(pointer: coarse)")`; skip pointermove listener /
  force pointer target to 0 when coarse. Re-check on change events.

**5. Hero fold-fit** — `journey.module.css`
- ≤560px: hero padding 96/70 → 84/40; `.heroTitle` clamp min 42→38px; suggestion
  chips 2-per-row (`.suggestions` grid 2 cols, font 11.5px, padding 6 10); CTAs stay
  one row: `.btn` padding 12 18, font 14px, gap 10.

### Phase 2 — Composition

**6. Aspect-fit chapter scenes** — `experience/universe-canvas.tsx`
- Extract the fit formula `clamp(aspect/1.25, 0.6, 1)` into a small shared component
  (`<FittedGroup>`) that scales a group each frame; wrap `ConnectScene`, `AnswerScene`,
  `VaultScene` (same formula as the particle group) → nothing clips on portrait.

**7. Per-chapter vertical alignment** — `journey.tsx`, `journey.module.css`
- Add modifier class per chapter: chaos/connect/vault → `chapterCenter`
  (`align-items: center`); lattice/answer → keep `flex-start` top-anchored compact.
- Replace the blanket mobile `align-items: flex-start` rule.

### Phase 3 — System polish

**8. Tap targets** — `ask.module.css`, `landing.module.css`, `floating-cta.module.css`
- Suggestion chips min-height 40px; Ask button min-height 44px; bridge buttons ≥46px;
  floating close 28px visual but 44px hit area via `::before` inset -8px.

**9. Safe areas** — `landing.module.css`, `floating-cta.module.css`, `journey.module.css`
- `.navFixed`: `padding-top: env(safe-area-inset-top)`; floating CTA `bottom:
  calc(14px + env(safe-area-inset-bottom))`; footer `padding-bottom:
  calc(54px + env(safe-area-inset-bottom))`.

**10. Viewport export** — `src/app/layout.tsx`
- `export const viewport: Viewport = { width: "device-width", initialScale: 1,
  viewportFit: "cover", themeColor: "#04060d" }`.

**11. Mobile perf** — `journey.module.css`, `ask.module.css`
- On ≤720px: reduce backdrop-filter blur (panels 10px→6px or drop, raise bg opacity
  0.88→0.93); `.track` height 620vh → 560vh on mobile to shorten the story slightly.

## Out of scope (accepted)
- Landscape phones: layout remains usable via scroll; no dedicated composition.
- No new copy; no structural changes to desktop (all changes behind media queries or
  coarse-pointer checks).

## Verification
- Playwright mobile suite (reuse pwenv rig) at 390×844 AND 360×740:
  1. Hero: all CTAs' bounding boxes within viewport height (no clip).
  2. Ask flow: tap chip → wait → bridge CTA `getBoundingClientRect().bottom <= innerHeight`
     without scrolling; `window.scrollY === 0` throughout.
  3. Each chapter: at peak envelope, active chapter content bottom ≤ innerHeight + 8px.
  4. Tap-target audit: interactive elements ≥40px (excluding sr-only / aria-hidden).
  5. `document.documentElement.scrollWidth === window.innerWidth` at every stop.
  6. Zero page errors / console errors.
  7. Screenshot review of every stop (hero, ask×3, 5 chapters, platform, proof, finale).
- `npx tsc --noEmit` clean; `npm run build` static export passes.
- Desktop spot-check (1440×900) to confirm no regression from shared-CSS changes.

## Files touched
- `src/features/landing/journey.tsx` (collapse class wiring, chapter alignment modifiers)
- `src/features/landing/journey.module.css` (hero fold-fit, collapse, chapters, track)
- `src/features/landing/ask/ask.module.css` (panel caps, 16px input, targets, bridge)
- `src/features/landing/ask/ask-experience.tsx` (only if needed for classes — likely none)
- `src/features/landing/experience/camera-rig.tsx` (coarse-pointer parallax off)
- `src/features/landing/experience/universe-canvas.tsx` (FittedGroup for scenes)
- `src/features/landing/demo-cta.module.css` (16px email input, safe-area)
- `src/features/landing/ui/floating-cta.tsx` + `.module.css` (hide in track on mobile,
  hit area, safe-area)
- `src/features/landing/landing.module.css` (nav safe-area, compact mobile btns)
- `src/app/layout.tsx` (viewport export)
