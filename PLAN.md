# PLAN — Ink Mist portfolio

Order of work. Each phase ends with the screenshot/assess loop from [INSTRUCTION.md](INSTRUCTION.md) §7. Don't start a phase before the previous one scores ≥ 4 on its relevant rubric rows.

## Phase 0 — Setup (½ day)
- [x] `npm create vite@latest` (vanilla-ts), add `pixi.js@8`, `gsap`
- [x] Folder layout: `src/world/` (scene, camera, layers, fx), `src/ui/` (panels, nav, hint), `src/content/` (placeholder data), `public/art/`, `tools/`, `shots/`
- [x] CSS tokens from INSTRUCTION.md §3, font loading (subset, swap)
- [x] Install Playwright (dev) and write `tools/shot.mjs` (multi-viewport screenshots to `shots/`)
- [x] `?debug=1` overlay: FPS, draw calls, DPR

**Done when:** blank paper-coloured page loads, screenshot script works.

## Phase 1 — Greybox world (1 day)
- [x] Pixi app, world container, camera (position + zoom), drag/touch/wheel pan with inertia, clamped bounds
- [x] 5 placeholder peaks (flat shapes) + pagoda hotspots in the right positions
- [x] Parallax: 6 layer containers with speed factors
- [x] Shared ticker (Pixi + GSAP), pause when hidden
- [x] DOM hotspot buttons synced to pagoda positions (keyboard + aria)

**Done when:** you can drag the greybox smoothly at 60 fps and tab to each hotspot.

## Phase 2 — Painted look (2–3 days, the hard part)
Art pipeline, in order of preference; start with the cheapest and upgrade:
1. **Procedural placeholder art**: generate ridgelines and mountains as layered noise silhouettes (canvas/SVG → texture) with ink-brush edges. Gets the look moving without waiting for art.
2. **Generated/own painted layers**: produce 8–12 separate transparent layers (far peaks, mid cliffs, trees, rocks, pagodas, water, foreground), pre-blurred by depth, in our own style (not the watermarked stock image). Export AVIF/WebP ≤ 2048 px, pack small sprites in an atlas.
3. Fog: 2–3 semi-transparent fog sprites that drift slowly between planes (baked), plus one combined shader pass (soft fog drift + paper grain + vignette).
- [~] Sky gradient + faint sun-glow behind far peaks
- [ ] Water: mirrored, darkened, slightly displaced copy of the lower scene (one small displacement filter limited to the water rect)
- [~] Ambient: birds (a few sprites on paths), ink specks (≤ 40 particles)

**Done when:** a screenshot of the start view is recognisably in the family of the reference image (atmosphere, depth, focal hierarchy ≥ 4).

## Phase 3 — Interaction and panels (2 days)
- [x] Hover/focus: lantern glow, peak darkening, seal-stamp label
- [x] Click → camera ease + zoom, fog "parts" (fade/scale fog sprites near the peak), panel unrolls (clip-path animation)
- [x] Panel content templates: Projects (cards), Experience (timeline), Awards (list with seals), About/Contact
- [x] Close via Esc / outside click / back button; camera returns; URL hash per section (`#projects`)
- [x] Mini-map ruler with seal dots, click to jump
- [x] First-visit hint (*drag to wander*) that fades after the first drag

**Done when:** full loop (explore → open → read → close) works on mouse, touch and keyboard.

## Phase 4 — Performance and fallbacks (1 day)
- [ ] Lazy loading order: poster → scene → audio
- [ ] AVIF/WebP with fallback, atlas, texture size audit
- [ ] DPR cap, low-end detection, shader-pass off switch
- [ ] Render-on-demand when idle
- [ ] `prefers-reduced-motion`, no-WebGL → CSS parallax fallback, list view toggle
- [ ] Measure against RESEARCH.md §6 budgets (Lighthouse + manual FPS on a mid-range phone)

**Done when:** all budgets met or deviations documented in `shots/NOTES.md`.

## Phase 5 — Delight (optional, 1–2 days)
- [ ] Opt-in ambient audio (wind, distant gong on open)
- [ ] Hover ink-bloom on cursor, brush-stroke page transitions
- [ ] Day/dusk toggle (swap tint LUT, lanterns brighter at dusk)
- [ ] The tiny figure follows the camera/cursor loosely

## Phase 6 — Content and launch
- [ ] Real content for Projects / Experience / Awards / About
- [ ] SEO metadata, OG image (a crop of our own art), sitemap-less single page with hash sections
- [ ] Deploy (static host), custom domain, analytics-lite

## Decision log (open questions for the owner)
1. **Art source:** generate with an image model, commission/hand-paint, or procedural-only? (Biggest lever on final quality.)
2. **Name/identity:** brush title text and seal glyph (needs your name or a chosen character).
3. **Language:** English only, or add Chinese/Vietnamese accents?
4. **Sound:** include or skip?
5. **Which sections beyond Projects / Experience / Awards / About?**

## First concrete step
Phase 0 + Phase 1 in one go, then run the first screenshot/assess cycle and write `shots/NOTES.md`.
