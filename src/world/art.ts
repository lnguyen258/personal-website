// Procedural placeholder art (Phase 2 step 1). Everything is baked ONCE into canvases
// at TS (texture scale) resolution; there are no runtime blur filters.
import { SECTIONS, WORLD_H, type Section } from '../content/sections';

export const TS = 0.5; // texture scale: world unit -> texture px

export function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function noise1D(seed: number) {
  const r = rng(seed);
  const tbl = Array.from({ length: 512 }, () => r());
  const f = (x: number) => {
    const i = Math.floor(x);
    const t = x - i;
    const s = t * t * (3 - 2 * t);
    return tbl[i & 511] * (1 - s) + tbl[(i + 1) & 511] * s;
  };
  return (x: number) => f(x) * 0.55 + f(x * 2.1 + 17) * 0.3 + f(x * 4.7 + 41) * 0.15;
}

function make(wWorld: number, hWorld = WORLD_H) {
  const c = document.createElement('canvas');
  c.width = Math.min(4096, Math.ceil(wWorld * TS));
  c.height = Math.ceil(hWorld * TS);
  const ctx = c.getContext('2d')!;
  ctx.scale(TS, TS);
  return { c, ctx };
}

const rgba = (v: number, a: number) => `rgba(${v},${Math.round(v * 0.98)},${Math.round(v * 0.93)},${a})`;

/** Distant ridgelines: soft, light, baked blur. */
export function ridgeLayer(w: number, o: { seed: number; base: number; amp: number; freq: number; tone: number; alpha: number; blur: number; spiky: number }) {
  const { c, ctx } = make(w);
  const n = noise1D(o.seed);
  ctx.filter = `blur(${o.blur}px)`;
  ctx.beginPath();
  ctx.moveTo(-50, WORLD_H + 50);
  for (let x = -50; x <= w + 50; x += 6) {
    const v = n(x * o.freq);
    const ridged = 1 - Math.abs(2 * n(x * o.freq * 0.7 + 90) - 1);
    const y = o.base - o.amp * ((1 - o.spiky) * v + o.spiky * ridged * ridged);
    ctx.lineTo(x, y);
  }
  ctx.lineTo(w + 50, WORLD_H + 50);
  ctx.closePath();
  const g = ctx.createLinearGradient(0, o.base - o.amp, 0, o.base + 80);
  g.addColorStop(0, rgba(o.tone, o.alpha));
  g.addColorStop(0.55, rgba(Math.min(255, o.tone + 40), o.alpha * 0.7));
  g.addColorStop(1, rgba(236, 0));
  ctx.fillStyle = g;
  ctx.fill();
  return c;
}

/** Soft fog bands in paper colour. */
export function fogLayer(w: number, o: { seed: number; y: number; h: number; count: number; alpha: number }) {
  const { c, ctx } = make(w);
  const r = rng(o.seed);
  ctx.filter = 'blur(18px)';
  for (let i = 0; i < o.count; i++) {
    const x = r() * w;
    const y = o.y + (r() - 0.5) * o.h;
    const rx = 160 + r() * 420;
    const ry = 28 + r() * 55;
    const g = ctx.createRadialGradient(x, y, 0, x, y, rx);
    g.addColorStop(0, `rgba(246,240,228,${o.alpha * (0.6 + r() * 0.4)})`);
    g.addColorStop(1, 'rgba(246,240,228,0)');
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(1, ry / rx);
    ctx.translate(-x, -y);
    ctx.fillStyle = g;
    ctx.fillRect(x - rx, y - rx, rx * 2, rx * 2);
    ctx.restore();
  }
  return c;
}

function peakPath(ctx: CanvasRenderingContext2D, s: Section, r: () => number) {
  const steps = 26;
  const left: [number, number][] = [];
  const right: [number, number][] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const y = s.topY + (s.baseY - s.topY) * t;
    // karst tower profile: narrow top, bulging mid, wide foot
    const step = 1 / (1 + Math.exp(-(t - 0.5) * 24)); // sigmoid ledge
    const prof = (0.2 + 0.8 * Math.pow(t, s.taper)) * (1 + s.ledge * 0.28 * step - s.ledge * 0.1);
    const bump = 1 + (r() - 0.5) * 0.18 + Math.sin(t * 9 + s.x) * 0.05;
    const hw = (s.width / 2) * prof * bump;
    const cx = s.x + s.lean * (1 - t);
    left.push([cx - hw - (r() - 0.5) * 8, y]);
    right.push([cx + hw * (0.92 + r() * 0.12), y]);
  }
  // join points with quadratic midpoints so the outline looks brushed, not polygonal
  const smooth = (pts: [number, number][]) => {
    for (let i = 1; i < pts.length - 1; i++) {
      const mx = (pts[i][0] + pts[i + 1][0]) / 2;
      const my = (pts[i][1] + pts[i + 1][1]) / 2;
      ctx.quadraticCurveTo(pts[i][0], pts[i][1], mx, my);
    }
    ctx.lineTo(pts[pts.length - 1][0], pts[pts.length - 1][1]);
  };
  ctx.beginPath();
  ctx.moveTo(left[0][0], left[0][1]);
  smooth(left);
  const rr = [...right].reverse();
  ctx.lineTo(rr[0][0], rr[0][1]);
  smooth(rr);
  ctx.closePath();
  return { left, right };
}

function pagoda(ctx: CanvasRenderingContext2D, x: number, y: number, tiers: number, scale: number) {
  ctx.fillStyle = '#14130f';
  ctx.strokeStyle = '#14130f';
  let w = 46 * scale;
  let cy = y;
  const th = 30 * scale;
  for (let i = 0; i < tiers; i++) {
    // body
    ctx.fillRect(x - w * 0.34, cy - th * 0.55, w * 0.68, th * 0.55);
    // upswept roof
    const rw = w * 0.62;
    ctx.beginPath();
    ctx.moveTo(x - rw, cy - th * 0.55 - 9 * scale);
    ctx.quadraticCurveTo(x - rw * 0.55, cy - th * 0.55 + 3 * scale, x, cy - th * 0.55 - 2 * scale);
    ctx.quadraticCurveTo(x + rw * 0.55, cy - th * 0.55 + 3 * scale, x + rw, cy - th * 0.55 - 9 * scale);
    ctx.quadraticCurveTo(x + rw * 0.6, cy - th * 0.55 - 12 * scale, x, cy - th * 0.55 - 15 * scale);
    ctx.quadraticCurveTo(x - rw * 0.6, cy - th * 0.55 - 12 * scale, x - rw, cy - th * 0.55 - 9 * scale);
    ctx.fill();
    cy -= th;
    w *= 0.82;
  }
  // finial
  ctx.lineWidth = 2 * scale;
  ctx.beginPath();
  ctx.moveTo(x, cy + th * 0.45 - 12 * scale);
  ctx.lineTo(x, cy + th * 0.45 - 34 * scale);
  ctx.stroke();
  // base platform
  ctx.fillRect(x - 46 * scale * 0.62, y, 46 * scale * 1.24, 5 * scale);
}

/** Filled branch that tapers from width w0 to w1 along a quadratic curve. */
function taperedBranch(ctx: CanvasRenderingContext2D, x0: number, y0: number, cx: number, cy: number, x1: number, y1: number, w0: number, w1: number) {
  const n = 10;
  const L: [number, number][] = [];
  const R: [number, number][] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const px = (1 - t) * (1 - t) * x0 + 2 * (1 - t) * t * cx + t * t * x1;
    const py = (1 - t) * (1 - t) * y0 + 2 * (1 - t) * t * cy + t * t * y1;
    const dx = 2 * (1 - t) * (cx - x0) + 2 * t * (x1 - cx);
    const dy = 2 * (1 - t) * (cy - y0) + 2 * t * (y1 - cy);
    const d = Math.hypot(dx, dy) || 1;
    const w = (w0 + (w1 - w0) * t) / 2;
    L.push([px - (dy / d) * w, py + (dx / d) * w]);
    R.push([px + (dy / d) * w, py - (dx / d) * w]);
  }
  ctx.beginPath();
  ctx.moveTo(L[0][0], L[0][1]);
  L.forEach(([x, y]) => ctx.lineTo(x, y));
  for (let i = R.length - 1; i >= 0; i--) ctx.lineTo(R[i][0], R[i][1]);
  ctx.closePath();
  ctx.fill();
}

/** Flat pine-pad foliage: overlapping horizontal ellipses with needle strokes on the lower edge. */
function foliagePad(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, r: () => number, tone: string) {
  ctx.fillStyle = tone;
  ctx.strokeStyle = tone;
  for (let i = 0; i < 4; i++) {
    ctx.globalAlpha = 0.55 + r() * 0.35;
    ctx.beginPath();
    ctx.ellipse(x + (r() - 0.5) * size * 0.9, y + (r() - 0.5) * size * 0.25, size * (0.55 + r() * 0.35), size * (0.16 + r() * 0.08), (r() - 0.5) * 0.25, 0, Math.PI * 2);
    ctx.fill();
  }
  // needles radiate outward around the pad's rim, with a slight droop
  ctx.globalAlpha = 0.9;
  ctx.lineWidth = 1.3;
  ctx.lineCap = 'round';
  for (let i = 0; i < 34; i++) {
    const a = r() * Math.PI * 2;
    const px = x + Math.cos(a) * size * 0.8;
    const py = y + Math.sin(a) * size * 0.2;
    const l = 5 + r() * 8;
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(px + Math.cos(a) * l, py + Math.sin(a) * l * 0.8 + 2 + r() * 3);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

function tree(ctx: CanvasRenderingContext2D, x: number, y: number, len: number, ang: number, depth: number, r: () => number, tone: string, w = 8 + depth * 4.5) {
  if (depth === 0 || len < 4) {
    foliagePad(ctx, x, y, 34 + r() * 22, r, tone);
    return;
  }
  const x2 = x + Math.sin(ang) * len;
  const y2 = y - Math.cos(ang) * len;
  const w1 = Math.max(2.2, w * 0.7);
  ctx.fillStyle = tone;
  taperedBranch(ctx, x, y, (x + x2) / 2 + (r() - 0.5) * 60, (y + y2) / 2 + (r() - 0.5) * 16, x2, y2, w, w1);
  ctx.beginPath(); // round joint so angled segments never leave a notch
  ctx.arc(x2, y2, w1 / 2, 0, Math.PI * 2);
  ctx.fill();
  // a short bare side twig on thick limbs adds gnarl
  if (depth > 2 && r() > 0.4) {
    const tx = x + (x2 - x) * 0.55;
    const ty = y + (y2 - y) * 0.55;
    const side = r() > 0.5 ? 1 : -1;
    const ex = tx + side * (50 + r() * 20);
    const ey = ty - 8 - r() * 16;
    taperedBranch(ctx, tx, ty, tx + side * 24, ty - 2, ex, ey, Math.max(5, w1 * 0.7), 3);
    foliagePad(ctx, ex, ey - 3, 22 + r() * 12, r, tone); // pad sits exactly on the twig tip
  }
  const branches = depth > 2 ? 2 : 3;
  for (let i = 0; i < branches; i++) {
    // the trunk (first two levels) bends gently; outer limbs may swing wide
    const swing = depth >= 5 ? 0.5 : 1.5;
    tree(ctx, x2, y2, len * (0.68 + r() * 0.12), ang + (r() - 0.5) * swing, depth - 1, r, tone, w1);
  }
}

/** Flared roots at the base of a trunk. */
function roots(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, tone: string) {
  ctx.fillStyle = tone;
  ctx.beginPath();
  ctx.moveTo(x - w * 1.5, y + 14);
  ctx.quadraticCurveTo(x - w * 0.8, y + 2, x - w * 0.55, y - 38);
  ctx.lineTo(x + w * 0.55, y - 38);
  ctx.quadraticCurveTo(x + w * 0.9, y + 2, x + w * 1.6, y + 14);
  ctx.closePath();
  ctx.fill();
}

/** The main playable plane: peaks + pagodas + the little figure. */
export function midLayer(w: number) {
  const { c, ctx } = make(w);
  const r = rng(7);

  for (const s of SECTIONS) {
    // ink body
    const { left, right } = peakPath(ctx, s, rng(s.x));
    const g = ctx.createLinearGradient(s.x - s.width / 2, 0, s.x + s.width / 2, 0);
    g.addColorStop(0, '#1b1a16');
    g.addColorStop(0.45, '#4a4740');
    g.addColorStop(0.8, '#8b8778');
    g.addColorStop(1, '#6d6a5f');
    ctx.fillStyle = g;
    ctx.fill();
    ctx.save();
    peakPath(ctx, s, rng(s.x)); // same outline as the fill, so texture never spills past the edge
    ctx.clip();
    // vertical rock streaks (brush strokes)
    // short, slanted, tapering strokes (cun texture) instead of long rain-like lines
    for (let i = 0; i < 150; i++) {
      const x = s.x - s.width / 2 + r() * s.width;
      const y0 = s.topY + r() * (s.baseY - s.topY) * 0.85;
      const len = 14 + r() * 46;
      const sl = (r() - 0.35) * 22;
      ctx.strokeStyle = r() > 0.5 ? `rgba(20,19,15,${0.18 + r() * 0.3})` : `rgba(232,226,210,${0.12 + r() * 0.22})`;
      ctx.lineWidth = 1 + r() * 2.8;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(x, y0);
      ctx.quadraticCurveTo(x + sl * 0.2, y0 + len * 0.5, x + sl, y0 + len);
      ctx.stroke();
    }
    // angular facets: light comes from the right, so right-hand planes are pale, left-hand dark
    const H = s.baseY - s.topY;
    for (let i = 0; i < 16; i++) {
      const u = r(); // 0 = left edge, 1 = right edge
      const cx = s.x + s.lean * 0.5 + (u - 0.5) * s.width * 0.85;
      const y0 = s.topY + r() * H * 0.6;
      const y1 = y0 + 90 + r() * 220;
      const w0 = 8 + r() * 22;
      const w1 = w0 + 10 + r() * 30;
      const lean = (r() - 0.5) * 40;
      const light = u > 0.45;
      const a = light ? 0.05 + r() * 0.08 : 0.08 + r() * 0.12;
      const rgb = light ? '236,230,214' : '10,9,7';
      // feathered vertically so the ends dissolve like a wet wash
      const fg = ctx.createLinearGradient(0, y0, 0, y1);
      fg.addColorStop(0, `rgba(${rgb},0)`);
      fg.addColorStop(0.3, `rgba(${rgb},${a})`);
      fg.addColorStop(0.7, `rgba(${rgb},${a})`);
      fg.addColorStop(1, `rgba(${rgb},0)`);
      ctx.fillStyle = fg;
      ctx.filter = 'blur(3px)';
      ctx.beginPath();
      ctx.moveTo(cx - w0, y0);
      ctx.lineTo(cx + w0, y0 + 6);
      ctx.lineTo(cx + w1 + lean, y1);
      ctx.lineTo(cx - w1 + lean, y1 - 8);
      ctx.closePath();
      ctx.fill();
    }
    // rim light along the lit (right) edge
    ctx.strokeStyle = 'rgba(244,238,222,0.55)';
    ctx.lineWidth = 3.5;
    ctx.lineJoin = 'round';
    ctx.filter = 'blur(1px)';
    ctx.beginPath();
    right.slice(0, 20).forEach(([x, y], i) => (i ? ctx.lineTo(x - 1.5, y) : ctx.moveTo(x - 1.5, y)));
    ctx.stroke();
    ctx.restore();

    // foliage on top and ledges: many small soft dabs, not big discs
    ctx.save();
    ctx.filter = 'blur(2px)';
    for (let i = 0; i < 46; i++) {
      const [lx, ly] = left[Math.floor(r() * 9)];
      ctx.fillStyle = `rgba(24,26,20,${0.25 + r() * 0.4})`;
      ctx.beginPath();
      ctx.ellipse(lx + 14 + r() * s.width * 0.3, ly + (r() - 0.35) * 30, 4 + r() * 9, 3 + r() * 6, r(), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
    // pagoda
    pagoda(ctx, s.x + s.lean, s.topY + 6, s.tiers, 1.15 + s.tiers * 0.09);
  }

  // base mist: peaks melt into fog near the water
  ctx.save();
  ctx.globalCompositeOperation = 'destination-out';
  const fg = ctx.createLinearGradient(0, 600, 0, 860);
  fg.addColorStop(0, 'rgba(0,0,0,0)');
  fg.addColorStop(1, 'rgba(0,0,0,0.95)');
  ctx.fillStyle = fg;
  ctx.fillRect(0, 600, w, 280);
  ctx.restore();

  return c;
}

/** The little traveller on a rock; drawn on top of the water so the mist can't hide them. */
function traveller(ctx: CanvasRenderingContext2D, fx: number, fy: number) {
  const ink = '#15140f';
  ctx.save();
  ctx.translate(fx, fy);
  ctx.scale(1.2, 1.2); // local coords: origin at the feet, y up is negative
  ctx.fillStyle = ink;
  ctx.strokeStyle = ink;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // small rock underfoot
  ctx.beginPath();
  ctx.moveTo(-46, 8);
  ctx.quadraticCurveTo(-28, -9, -2, -6);
  ctx.quadraticCurveTo(24, -12, 44, 8);
  ctx.closePath();
  ctx.fill();

  // wind-blown scarf (behind the body)
  ctx.lineWidth = 3;
  ctx.globalAlpha = 0.85;
  ctx.beginPath();
  ctx.moveTo(-4, -62);
  ctx.bezierCurveTo(-14, -64, -22, -58, -33, -62);
  ctx.stroke();
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-4, -59);
  ctx.bezierCurveTo(-12, -56, -20, -50, -28, -52);
  ctx.stroke();
  ctx.globalAlpha = 1;

  // robe: narrow shoulders, belling out to a curved hem
  ctx.beginPath();
  ctx.moveTo(-6.5, -64);
  ctx.bezierCurveTo(-10, -50, -16, -26, -19, -3);
  ctx.quadraticCurveTo(0, 3, 17, -3);
  ctx.bezierCurveTo(14, -26, 10, -50, 6.5, -64);
  ctx.quadraticCurveTo(0, -67, -6.5, -64);
  ctx.closePath();
  ctx.fill();

  // staff, slightly slanted, with a gourd on a cord
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(26, -106);
  ctx.lineTo(21, 3);
  ctx.stroke();
  ctx.lineWidth = 0.9;
  ctx.beginPath();
  ctx.moveTo(25.5, -96);
  ctx.lineTo(22, -90);
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(21, -85, 3.2, 5, 0.25, 0, Math.PI * 2);
  ctx.fill();

  // arm reaching to the staff (wide sleeve)
  ctx.lineWidth = 6.5;
  ctx.beginPath();
  ctx.moveTo(5, -58);
  ctx.quadraticCurveTo(15, -54, 23, -47);
  ctx.stroke();

  // head and conical bamboo hat with a slightly concave profile
  ctx.beginPath();
  ctx.ellipse(0, -70, 6, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-33, -72);
  ctx.quadraticCurveTo(-13, -76, 0, -92);
  ctx.quadraticCurveTo(13, -76, 33, -72);
  ctx.quadraticCurveTo(0, -64, -33, -72);
  ctx.closePath();
  ctx.fill();

  // pale rim light on the right edge of the robe and hat
  ctx.strokeStyle = 'rgba(236,230,214,0.28)';
  ctx.lineWidth = 1.1;
  ctx.beginPath();
  ctx.moveTo(6.5, -62);
  ctx.bezierCurveTo(10, -48, 14, -26, 16, -5);
  ctx.moveTo(1, -90);
  ctx.quadraticCurveTo(10, -77, 28, -72.5);
  ctx.stroke();
  ctx.restore();
}

/** Lake: pale reflecting water with ink streaks, fades into fog at top. */
export function waterLayer(w: number, mid: HTMLCanvasElement) {
  const { c, ctx } = make(w);
  const r = rng(21);
  const top = 840;
  const g = ctx.createLinearGradient(0, top, 0, WORLD_H);
  g.addColorStop(0, 'rgba(236,229,214,0.0)');
  g.addColorStop(0.12, 'rgba(228,221,205,0.9)');
  g.addColorStop(1, 'rgba(196,191,176,0.95)');
  ctx.fillStyle = g;
  ctx.fillRect(0, top, w, WORLD_H - top);

  // reflection: mid plane mirrored about the shoreline, squashed, softened and faded with depth
  // mirror line sits above the waterline: the foot of each peak is lost in mist, so reflecting
  // about 790 pushes the solid, un-misted rock body into the visible water.
  const shore = 790;
  const refl = document.createElement('canvas');
  refl.width = c.width;
  refl.height = c.height;
  const rc = refl.getContext('2d')!;
  rc.scale(TS, TS);
  rc.filter = 'blur(4px)';
  rc.save();
  rc.translate(0, shore);
  rc.scale(1, -0.6);
  rc.translate(0, -shore);
  rc.drawImage(mid, 0, 0, mid.width / TS, mid.height / TS);
  rc.restore();
  rc.filter = 'none';
  rc.globalCompositeOperation = 'destination-in';
  const fade = rc.createLinearGradient(0, shore, 0, WORLD_H);
  // 0 at the water's top edge (no hard line), full soon after, then dissolving with depth
  const topK = (top - shore) / (WORLD_H - shore);
  fade.addColorStop(0, 'rgba(0,0,0,0)');
  fade.addColorStop(topK, 'rgba(0,0,0,0)');
  fade.addColorStop(topK + 0.16, 'rgba(0,0,0,1)');
  fade.addColorStop(0.78, 'rgba(0,0,0,0.5)');
  fade.addColorStop(1, 'rgba(0,0,0,0)');
  rc.fillStyle = fade;
  rc.fillRect(0, shore, refl.width / TS, WORLD_H - shore);
  // draw in thin strips with a ripple offset that grows with depth
  const sw = refl.width / TS;
  // the water surface (top = 840) fades in over the mirrored image, so only draw from there down
  ctx.globalAlpha = 0.85;
  for (let y = top; y < WORLD_H; y += 3) {
    const k = (y - top) / (WORLD_H - top);
    const dx = Math.sin(y * 0.42) * (1 + k * 5);
    ctx.drawImage(refl, 0, y * TS, refl.width, 3 * TS, dx, y, sw, 3);
  }
  ctx.globalAlpha = 1;
  ctx.filter = 'blur(1.2px)';
  for (let i = 0; i < 260; i++) {
    const x = r() * w;
    const y = top + 15 + Math.pow(r(), 0.8) * (WORLD_H - top - 15);
    const len = 30 + r() * 220;
    ctx.strokeStyle = r() > 0.5 ? `rgba(60,58,50,${0.06 + r() * 0.16})` : `rgba(250,246,236,${0.25 + r() * 0.4})`;
    ctx.lineWidth = 1 + r() * 2.5;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + len, y + (r() - 0.5) * 2);
    ctx.stroke();
  }
  ctx.filter = 'none';
  traveller(ctx, 520, 925);
  return c;
}

/** Foreground: dark rocks and gnarled trees framing the edges, moves fastest. */
export function foregroundLayer(w: number) {
  const { c, ctx } = make(w);
  const r = rng(99);
  // Foreground moves 1.35x. When the camera frames a peak (peak at ~30-50% of the view) the
  // foreground item sits at gx - 1.35*(s.x - 800). Keep trees out of that window.
  const treeBlocked = (gx: number) =>
    SECTIONS.some((s) => Math.abs(gx - (1.35 * s.x - 280)) < 420);
  const groups: number[] = [];
  for (let gx = 250; gx < 6800; gx += 520) groups.push(gx);
  for (const gx of groups) {
    // rocks
    for (let i = 0; i < 6; i++) {
      const x = gx + (r() - 0.5) * 380;
      const rw = 90 + r() * 200;
      const rh = 40 + r() * 90;
      const g = ctx.createLinearGradient(0, WORLD_H - rh, 0, WORLD_H);
      g.addColorStop(0, `rgba(95,90,78,${0.85})`);
      g.addColorStop(1, 'rgba(26,25,20,0.98)');
      ctx.fillStyle = g;
      // smooth, slightly lumpy boulder: jittered contour joined with quadratic curves
      const pts: [number, number][] = [];
      const n = 8;
      for (let k = 0; k <= n; k++) {
        const u = k / n;
        const hump = Math.sin(u * Math.PI) ** 0.7;
        pts.push([x - rw / 2 + u * rw, WORLD_H + 10 - (rh * hump * (0.78 + r() * 0.35))]);
      }
      ctx.beginPath();
      ctx.moveTo(pts[0][0], WORLD_H + 12);
      ctx.lineTo(pts[0][0], pts[0][1]);
      for (let k = 1; k < pts.length - 1; k++) {
        const mx = (pts[k][0] + pts[k + 1][0]) / 2;
        const my = (pts[k][1] + pts[k + 1][1]) / 2;
        ctx.quadraticCurveTo(pts[k][0], pts[k][1], mx, my);
      }
      ctx.lineTo(pts[n][0], pts[n][1]);
      ctx.lineTo(pts[n][0], WORLD_H + 12);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = 'rgba(232,225,208,0.25)';
      ctx.beginPath();
      ctx.ellipse(x - rw * 0.08, WORLD_H - rh * 0.8, rw * 0.18, rh * 0.12, -0.2, 0, Math.PI * 2);
      ctx.fill();
    }
    // tree
    if (!treeBlocked(gx) && gx % 1040 === 250) {
      ctx.globalAlpha = 1; // opaque: translucent limbs would darken where they overlap
      roots(ctx, gx + 40, WORLD_H - 36, 8 + 6 * 4.5, '#1a1915');
      tree(ctx, gx + 40, WORLD_H - 40, 130 + r() * 60, -0.12 + (r() - 0.5) * 0.3, 6, r, '#1a1915');
      ctx.globalAlpha = 1;
    }
  }
  return c;
}

/** Soft radial glow used for pagoda lanterns. */
export function glowTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const ctx = c.getContext('2d')!;
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, 'rgba(214,70,52,0.85)');
  g.addColorStop(0.3, 'rgba(184,50,42,0.35)');
  g.addColorStop(1, 'rgba(184,50,42,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  return c;
}

/**
 * Ink-brush bird, pre-rendered in several wing poses (f = +1 wings up ... -1 wings down).
 * Cycling these frames is cheaper and looks far better than squashing one sprite.
 */
export const BIRD_POSES = [1, 0.4, -0.25, -1, -0.25, 0.4]; // flap cycle
export const BIRD_GLIDE = 5; // index of a calm, slightly raised pose used while gliding
export function birdFrames(): HTMLCanvasElement[] {
  const W = 96;
  const H = 60;
  return BIRD_POSES.map((f) => {
    const c = document.createElement('canvas');
    c.width = W;
    c.height = H;
    const ctx = c.getContext('2d')!;
    ctx.fillStyle = '#14130f';
    const sx = W / 2;
    const sy = 32;
    // wings: tapered, curved, thick at the shoulder, pointed at the tip
    const wing = (dir: 1 | -1) => {
      const tipX = sx + dir * 40;
      const amp = f > 0 ? 22 : 12; // downstroke is shorter and rounder than the upstroke
      const tipY = sy - f * amp + 4;
      const ctrlX = sx + dir * 20;
      const ctrlY = sy - f * (amp - 2) - 5;
      ctx.beginPath();
      ctx.moveTo(sx + dir * 2, sy - 3);
      ctx.quadraticCurveTo(ctrlX, ctrlY - 3, tipX, tipY);
      ctx.quadraticCurveTo(ctrlX - dir * 2, ctrlY + 9, sx + dir * 3, sy + 3);
      ctx.closePath();
      ctx.fill();
    };
    wing(-1);
    wing(1);
    // body (head to the right), tail wedge to the left
    ctx.beginPath();
    ctx.ellipse(sx, sy, 9, 3.9, 0.08, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(sx + 10, sy - 1, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(sx - 6, sy - 1);
    ctx.lineTo(sx - 16, sy - 3);
    ctx.lineTo(sx - 15, sy + 3);
    ctx.lineTo(sx - 6, sy + 2);
    ctx.fill();
    return c;
  });
}
