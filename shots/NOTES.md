# Screenshot review log

FPS in these shots comes from headless Chromium with software GL (SwiftShader), so it says nothing about real-GPU speed. Measure on a real device in Phase 4.

## r1 -> r3 (Phase 0/1 greybox + procedural art)

| Criterion | r1 | r3 | Note |
|---|---|---|---|
| 1 Atmosphere | 4 | 4 | Reads as ink-wash; fog layers work |
| 2 Depth | 4 | 4 | 4 ridge planes + 3 fog bands |
| 3 Focal hierarchy | 3 | 4 | Lantern glow now draws the eye to the pagoda |
| 4 Affordance | 3 | 4 | Hint + ruler + glow; seal labels appear on hover |
| 5 Legibility | 4 | 4 | Title fades out when leaving the start view |
| 6 Polish | 2 | 3 | Traveller, brush-like trees fixed; peaks still generic |
| 7 Restraint | 5 | 5 | Paper, ink, one red accent |
| 8 Performance | ? | ? | Not measurable here; no runtime blur, 1 canvas per layer |
| 9 Mobile | 2 | 3 | Opens on the first island; hint no longer wraps |

### Fixed this round
- Traveller was hidden under the water layer -> redrawn on top, on a rock, with a hat and staff
- Foreground trees were angular sticks -> tapered, curved, round joins
- Ghost-bubble ovals on cliffs -> smaller, fainter, plus dark strata dabs
- Vertical seam at left edge (fog layer drift exposing its edge) -> drift offset
- Projects pagoda cropped and overlapping the title -> lowered peaks, title fades with scroll
- Mobile started on a tree -> start camera centres the first island; hint nowrap

### Top problems to fix next
1. All five peaks share one silhouette recipe; vary shape (leaning, split summit, ledges)
2. A foreground tree can land in front of the focal peak (see cam2300); control foreground placement per section
3. Cliff texture is still "rain-like" vertical streaks; needs brush-stroke texture (Phase 2 step 2: real art)
4. No click behaviour yet beyond camera move (Phase 3 panels)
5. Water reflection is a faint wedge; consider a mirrored, displaced copy

## r4 -> r6 (Phase 3: panels, zoom, fog parting + visual fixes)

| Criterion | r3 | r6 | Note |
|---|---|---|---|
| 1 Atmosphere | 4 | 4 | Fog fades back when a peak is focused, lantern lights up |
| 2 Depth | 4 | 4 | Zoom 1.22 anchored to the waterline grows peaks upward |
| 3 Focal hierarchy | 4 | 5 | Open state: lit pagoda left, scroll panel right |
| 4 Affordance | 4 | 4 | Click, Esc, click-away, X, ruler, back button all close/open |
| 5 Legibility | 4 | 5 | Panel text on paper passes contrast |
| 6 Polish | 3 | 4 | Hanging-scroll panel with rods, seal, brush divider; smooth rocks; trees frame the start view |
| 7 Restraint | 5 | 5 | |
| 8 Performance | ? | ? | Still unmeasured on a real GPU |
| 9 Mobile | 3 | 4 | Bottom-sheet panel, scene lifted above it, ruler hidden while reading |

### Fixed this round
- Peaks now vary (lean, taper, ledge); cliff texture is short slanted strokes
- Foreground trees excluded from the window in front of each peak
- Panel overflowed the screen: GSAP transform fought CSS `translate`; centring moved to flexbox
- Ruler collided with panel: shifts left on desktop, hides on mobile while reading
- Lantern glow toned down when lit

### Top problems to fix next
1. Cliff still reads as generated: dark strata ovals look like floating lenses (real art in Phase 2 step 2)
2. Water reflection is just a faint wedge
3. Hotspot hover label (seal + name) not captured in screenshots yet; verify by hovering in a real browser
4. Real GPU FPS, transfer size, memory (textures are ~4096 px canvases)
5. Panel content is placeholder; no focus trap (intentionally non-modal)

## Polish pass (one small change per step, screenshot after each)

| Step | Change | Verdict |
|---|---|---|
| 1 | Cliff: lit/shadow facets with right-side light + rim light; fill and clip share one outline | Hard tape-like facets -> feathered (vertical gradient + 3px blur). Kept. |
| 2 | Peak outline joined with quadratic curves instead of straight segments | Clear win: reads as brushed rock, not low-poly. Kept. |
| 3 | Water: real reflection of the mid plane (mirror about y=790, squashed 0.6, blurred, rippled strips, ramped in at the water edge) | First pass too faint, second had a hard line at the water edge, third ramped in cleanly. Kept. |

Next candidates (in order): pagoda detail (flat dark blocks, no eaves/windows), seam where peak foot meets water, foliage dabs on summit look like floating specks, foreground rocks need texture, title typography.

## Polish pass 2: person, tree, bird (close-up crops at DPR 2)

| Subject | Before | Change | Verdict |
|---|---|---|---|
| Person | Arrow/lighthouse look: tiny triangle hat, plain tapered torso, staff touching nothing | Bamboo hat (douli), belled robe, arm to a slanted staff with a gourd, wind-blown scarf, pale rim light, smaller rock | First hat was witch-like (too tall); lowered apex and widened brim. Moved the figure right so the tree trunk no longer crowds it. |
| Tree | Uniform fat tube, round blob foliage, translucent overlaps made seams | Tapered filled limbs, root flare, side twigs ending exactly at flat pine pads, needles radiating around the pad rim, opaque fill, round joints, gentler trunk bend | Needles first hung down like tentacles and twigs didn't reach the pads; both fixed. Joint notches fixed with round caps. |
| Bird | Two-arc "M" squashed vertically to flap | Ink-brush bird (tapered wings, body, head, tail), 6 pre-rendered wing poses, flap bursts with glide, size-based opacity, bob/tilt, flight band kept below the title | Downstroke was stiff and near the frame edge; shortened and rounded. `?birds` shows the pose sheet. |

Tooling added: `CLIP="x,y,w,h"`, `VIEW=desktop|mobile`, `DPR=2` for `tools/shot.mjs`.

Still open: trees are similar in canopy shape across the scene; pagoda detail; summit foliage specks; foreground rock texture; title typography.
