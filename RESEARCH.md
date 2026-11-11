# RESEARCH — "Ink Mist" portfolio concept

Goal: a personal portfolio that feels like a premium game UI, themed as a misty Chinese ink-wash (shan shui) landscape, draggable like a game map, yet loads and runs fast in a browser.

## 1. What the reference image tells us (visual analysis)

The reference (stock ink-wash landscape) breaks down into reusable design rules:

| Observation | Design rule |
|---|---|
| Monochrome ink + warm cream paper (`#f3ecdf`-ish), no saturated colors | Palette = paper, 4–5 ink greys, **one** accent (vermilion seal red `#b8322a`) used only for interactive things |
| 3–4 depth planes: dark foreground rocks/trees, mid cliffs, pale far peaks fading into fog | Build as **separate layers** with atmospheric perspective: farther = lighter, lower contrast, blurrier |
| Fog bands separate every plane | Fog is both aesthetic *and* the performance trick (hides edges, lets us use low-res far layers) |
| Pagodas small, on peaks, dark against fog | Natural "hotspots"; each peak = one section |
| Tiny human silhouette on the shore | Scale cue and a possible player avatar / cursor companion |
| Calm water with reflections in the lower third | Empty space for UI/title, and a spot for a cheap reflection |
| Birds, scattered ink specks | Cheap ambient particles |

Note: the image carries a stock-site watermark. Use it as a **reference only**, not as a shipped asset. Final art must be our own (generated/licensed/hand-made, see PLAN.md).

## 2. Approaches considered

| Approach | Visual ceiling | Perf | Effort | Verdict |
|---|---|---|---|---|
| A. Pure CSS/DOM parallax with layered images | Medium | Excellent | Low | Good fallback, limited "game feel" |
| B. **2D WebGL scene (PixiJS v8) with pre-baked layered art + tiny shaders** | High | Very good | Medium | **Recommended** |
| C. Three.js with real 3D mountains | Very high | Heavier, bigger assets, harder on mobile | High | Overkill; 3D ink look is still an open research problem (see sources) |
| D. Fully procedural ink/fluid simulation in shaders | Highest "wow" | Risky on mobile/low-end GPUs, needs WebGPU for best results | Very high | Use only for small accents (fog drift, ink reveal) |

Why B: a 2D scene made of ~8–12 painted layers gets us a convincing parallax diorama, the painted look comes from the art itself (not the runtime), and the GPU only does cheap sprite compositing.

## 3. Findings that drive the decisions

**Rendering library**
- PixiJS is the strongest fit for 2D sprite-heavy scenes; v8 supports WebGL 2 and WebGPU with automatic fallback. Three.js is better when you truly need 3D. For a portfolio, asset weight, batching and load time matter more than WebGL vs WebGPU. (Caveat: most comparisons are vendor/SEO pages and one GitHub benchmark, none is portfolio-specific. Treat as directional.)
- Sources: [js-game-rendering-benchmark](https://github.com/Shirajuki/js-game-rendering-benchmark), [Konva: best canvas library 2026](https://konvajs.org/docs/guides/best-canvas-library.html), [Pixi v8 launch](https://pixijs.com/blog/pixi-v8-launches)

**Filters are the main perf trap**
- Every PixiJS filter = an extra render target + a per-pixel pass; blur needs multiple passes; mobile GPUs have much lower fill rate. Set explicit filter areas, lower blur `quality`, set `antialias: false` / `useContextAlpha: false` on weak devices.
- **Decision: never use runtime blur on full-screen layers.** Pre-bake blur and fog into the textures (export far layers already soft). Use runtime shaders only on small regions or a single cheap full-screen pass (fog drift + paper grain merged into one fragment shader).
- Sources: [Pixi filters guide](https://pixijs.com/8.x/guides/components/filters.md), [Pixi performance tips](https://pixijs.com/8.x/guides/concepts/performance-tips.md), [Pixi filter notes](https://abratabia.com/pixijs/filters-and-shaders.php)

**Ink / fog look in the browser**
- Existing techniques to borrow: noise-based layered mist between ridgelines (two layers of 2D noise), noise-broken edges with a darker contour for ink-wash shading, full-page paper-grain shader. Several of these are WebGPU-only, so we port the idea to a WebGL fragment shader instead of depending on WebGPU.
- Sources: [Codrops: Still, ink wash in WebGPU](https://tympanus.net/codrops/2026/09/09/still-from-akira-to-ink-wash-building-a-generative-garden-in-webgpu/), [Codrops: Paper shaders](https://tympanus.net/codrops/?p=124140), [Valley Mist shader](https://www.shadcn.io/shaders/valley-mist-shader), [Ink Ridges (WebGL, MIT)](https://21st.dev/@ryanonline1234/components/ink-ridges.md), [Ink diffusion in GLSL](https://ileivoivm.github.io/inkField/tech/en/index.html)

**Game-like portfolio precedents**
- Common stack among award-style sites: GSAP + Lenis for motion/scroll, Three.js or WebGL for the world, a single shared ticker driving everything. Some build a playable world with a conventional documentation view alongside it (Aurel's Grand Theater); this "world + plain pages" split is a pattern worth copying for accessibility and SEO.
- Sources: [Aurel's Grand Theater](https://tympanus.net/codrops/2025/05/20/behind-the-curtain-building-aurels-grand-theater-from-design-to-code/), [Brandon Yasin portfolio](https://tympanus.net/codrops/?p=124097), [Giulio cyberpunk portfolio](https://tympanus.net/codrops/2026/04/14/they-call-me-giulio-the-making-of-a-cinematic-cyberpunk-portfolio/), [Arnaud Rocca portfolio](https://tympanus.net/codrops/2026/03/31/arnaud-roccas-portfolio-from-a-gsap-powered-motion-system-to-fluid-webgl/)
- I found no source for exactly "drag-to-pan 2D world + pagoda hubs", so the interaction design below is original work, not a copy.

## 4. UI framework question

"UI framework" for this site = two separate layers:
1. **World layer** (canvas): PixiJS. Not a DOM UI kit.
2. **Content layer** (HTML overlay): panels, text, buttons. Plain accessible HTML styled with CSS variables. A heavy component kit (MUI, shadcn full set) is unnecessary and would fight the ink aesthetic. If we want a framework for state/routing, **Svelte or React via Vite** are both fine; Next.js is only needed if we want SSR for SEO. Recommendation: **Vite + TypeScript + vanilla DOM panels** (smallest bundle) and keep the door open to Svelte.

Keeping content as real HTML means: SEO, screen readers, text selection, and print/PDF resume come free.

## 5. Typography and sound (cheap premium cues)

- Display: a brush/calligraphic serif (e.g. *Ma Shan Zheng* or *Noto Serif SC* for CJK accents, *Cormorant Garamond* / *Cinzel* for Latin). Body: *Inter* or *Noto Sans*. Self-host, subset, `font-display: swap`.
- Details that read as "expensive game": vermilion seal-stamp (印章) icons, thin ink-brush dividers, scroll-paper panels with torn edges (SVG mask, not images), subtle hover ink-bloom, soft gong/wind audio (opt-in, muted by default, lazy loaded).

## 6. Performance budget (targets)

| Metric | Target |
|---|---|
| First meaningful paint (poster image + title) | < 1.0 s on 4G |
| Total initial transfer | < 1.2 MB (JS < 150 KB gz, hero poster < 150 KB) |
| Full scene assets (lazy, after first paint) | < 4 MB, AVIF/WebP, ≤ 2048 px wide per layer |
| Frame rate | 60 fps desktop, ≥ 45 fps mid-range phone |
| Draw calls | < 40, layers batched into one texture atlas where possible |
| Idle behaviour | Ticker pauses when tab hidden / scene idle (render-on-demand for static states) |
| Fallbacks | `prefers-reduced-motion`, no-WebGL → static layered CSS parallax, JS-off → plain HTML content |

## 7. Risks

1. **Art is the bottleneck**, not code. Layered, seamlessly tiling ink mountains with transparent fog are hard to get from a single generated image. Mitigation in PLAN.md: start with procedural SVG/canvas-generated placeholder ridgelines, then swap in real art.
2. Mobile fill rate with many large alpha layers. Mitigation: cap DPR at 1.5–2, small far layers, atlas.
3. Drag-only navigation is not discoverable or accessible. Mitigation: visible hint, keyboard arrows, a "list view" toggle, and click-to-jump nav.
4. Blur-by-filter temptation. Mitigation: banned in the budget above.
