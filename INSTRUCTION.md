# INSTRUCTION — Design concept and how to build and iterate

Audience: me (the owner) and any coding agent working on this repo. This is the source of truth for the concept and the working rules. See [RESEARCH.md](RESEARCH.md) for why, [PLAN.md](PLAN.md) for the order of work.

## 1. Concept: "Ink Mist" (霧山 — misty mountains)

The site is **one long painted handscroll** (长卷) that the visitor explores by dragging, like a game map. Five peaks stand in the mist; each has a pagoda on top. Visiting a peak opens that section.

| Peak | Section | Pagoda motif |
|---|---|---|
| Tallest, centre | **Projects** | Multi-tier pagoda, brightest lantern |
| Left cliff | **Experience** | Pavilion on the cliff edge |
| Right crag | **Awards** | Small pagoda with a hanging banner |
| Island on the water | **About / Contact** | Lone boat-house, a tiny figure on shore |
| Far misty ridge | **Skills / Writing / more** | Barely visible, fades in when approached |

Starting view: the lake with the tiny figure (the visitor), a title in brush calligraphy, and a hint: *drag to wander*.

## 2. Interaction model

1. **Drag to pan** horizontally (and slightly vertically) with inertia. Wheel and touch also pan. Arrow keys work.
2. **Parallax depth**: each layer moves at a different speed (far 0.15× … foreground 1.3×). Fog layers drift on their own.
3. **Hover/focus a pagoda**: lantern glows (vermilion), the peak darkens slightly, a seal-stamp label appears.
4. **Click a pagoda**: camera eases and zooms toward the peak, fog parts around it, a paper-scroll panel unrolls with the section content (HTML overlay). Esc / click outside / back button closes it and the camera returns.
5. **Ambient life**: birds cross the sky, fog drifts, water ripples slightly, a few ink specks float. All subtle, low cost.
6. **Mini-map**: a thin ink-stroke ruler at the bottom with five seal dots; click to jump.
7. **List view toggle** (top-right): switches to a plain, fully accessible page with the same content.

## 3. Visual language (tokens)

```css
:root {
  --paper:   #f3ecdf;  /* background */
  --paper-2: #e8dfcc;
  --ink-900: #14130f;  /* near black */
  --ink-700: #3a3832;
  --ink-500: #6b685f;
  --ink-300: #a9a597;
  --ink-100: #d9d4c6;
  --seal:    #b8322a;  /* the ONLY accent: interactive things, seals, lantern glow */
  --gold:    #b08d4a;  /* very sparing, award details only */
}
```

Rules:
- No other saturated colours. No gradients except fog.
- Depth = lightness: far layers use `--ink-100…300`, foreground uses `--ink-900`.
- Panels look like rice paper: `--paper` fill, 1px `--ink-300` border, SVG-mask torn edge, soft shadow, subtle grain.
- Motion is slow and eased (600–1200 ms, `power3.out`/`expo.out`). Nothing bounces.
- Type: brush/serif display, clean sans body (see RESEARCH.md §5).

## 4. Tech stack (decided)

- **Vite + TypeScript**
- **PixiJS v8** for the world canvas (WebGL, WebGPU optional later)
- **GSAP** (core only) for camera and panel tweens. Single shared ticker with Pixi.
- **Plain HTML/CSS overlay** for content panels, nav, hint, list view
- Assets: AVIF with WebP fallback, one atlas for small sprites
- Hosting: static (Vercel is fine)

## 5. Hard performance rules

1. **No runtime blur filter on large layers.** Pre-bake blur/fog in the art.
2. At most **one full-screen shader pass** (fog drift + paper grain combined). Other filters only on small, bounded areas.
3. Layer textures ≤ 2048 px wide; far layers can be 1024 and upscaled (they are soft anyway).
4. Cap renderer resolution at `min(devicePixelRatio, 1.75)`; on low-end detection (low `hardwareConcurrency` or measured slow frames) drop to 1 and disable the shader pass.
5. Render on demand: pause the ticker when the tab is hidden and when the scene is idle with no animated layers visible.
6. Lazy load: poster image + title first, scene assets after first paint, audio only after user opts in.
7. Respect `prefers-reduced-motion`: no drifting fog/birds, instant camera moves.
8. Budgets from RESEARCH.md §6 are acceptance criteria, not suggestions.

## 6. Accessibility and fallbacks

- Every pagoda is a real focusable element (an invisible DOM button positioned over the canvas, with an `aria-label`) so keyboard and screen readers can reach it.
- Visible focus ring in `--seal`.
- Content lives in the DOM, never only in the canvas.
- No-WebGL or JS-off: static layered CSS parallax or the plain list view.

## 7. Self-improvement loop (screenshot → assess → fix)

Run this after every visual milestone. Do not skip the assessment step.

1. Start the dev server (`npm run dev`).
2. Capture screenshots with Playwright (script in `tools/shot.mjs`, created in PLAN.md Phase 1): desktop 1440×900, laptop 1280×720, mobile 390×844, and a state after clicking each pagoda. Save to `shots/<date>-<n>-<state>.png`.
3. **Look at each image** (open it with the image reader) and score it against the rubric below. Write the scores and the top 3 problems to `shots/NOTES.md`.
4. Fix the top problems, re-capture, and compare to the previous shot. Keep going until every criterion is ≥ 4 or a trade-off is documented.
5. Also record numbers: FPS (via `performance.now` sampling in a debug overlay, `?debug=1`), transfer size, draw calls.

### Rubric (score 1–5)

| # | Criterion | 5 means |
|---|---|---|
| 1 | Atmosphere | Reads instantly as misty ink-wash painting, clear depth via fog |
| 2 | Depth and layering | 3+ distinct planes, far = lighter and softer |
| 3 | Focal hierarchy | Eye goes to title → tallest pagoda → other peaks |
| 4 | Affordance | A newcomer knows they can drag and which things are clickable |
| 5 | Legibility | Title, labels and panel text pass contrast (≥ 4.5:1) over the art |
| 6 | Polish | Seals, brush dividers, panel edges feel crafted, not default |
| 7 | Restraint | Only paper, ink, and one red accent; nothing noisy |
| 8 | Performance | Meets budgets in RESEARCH.md §6 |
| 9 | Mobile | Works at 390 px: drag, panel, hints all usable |

## 8. Working rules for agents

- Keep content placeholder-only for now ("Project One", lorem). The concept and feel come first.
- Do not ship the stock reference image (it is watermarked). Use it only for comparison.
- Prefer small, reviewable commits; one phase of PLAN.md at a time.
- If a visual idea conflicts with a performance rule, the performance rule wins unless documented in `shots/NOTES.md`.
