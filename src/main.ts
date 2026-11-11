import './style.css';
import { Application, Container, Sprite, Texture } from 'pixi.js';
import gsap from 'gsap';
import { SECTIONS, WORLD_H, WORLD_W } from './content/sections';
import { BIRD_GLIDE, BIRD_POSES, birdFrames, foregroundLayer, fogLayer, glowTexture, midLayer, ridgeLayer, TS, waterLayer } from './world/art';
import { createPanel } from './ui/panel';

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const params = new URLSearchParams(location.search);
const debug = params.has('debug');
const FOCUS_ZOOM = 1.22;

// parallax layer width in world units (cap by max texture size)
const lw = (p: number) => Math.min(4096 / TS, WORLD_W * p + 2600);
const clamp = (v: number, a: number, b: number) => Math.min(Math.max(v, a), b);

async function boot() {
  const app = new Application();
  await app.init({
    resizeTo: window,
    backgroundAlpha: 0,
    antialias: false,
    resolution: Math.min(window.devicePixelRatio || 1, 1.75),
    autoDensity: true,
  });
  document.getElementById('stage')!.appendChild(app.canvas);

  const world = new Container();
  app.stage.addChild(world);

  interface Layer { box: Container; p: number; drift: number; fog: boolean; }
  const layers: Layer[] = [];
  const addLayer = (canvas: HTMLCanvasElement, p: number, drift = 0, fog = false) => {
    const box = new Container();
    const sp = new Sprite(Texture.from(canvas));
    sp.scale.set(1 / TS);
    box.addChild(sp);
    world.addChild(box);
    layers.push({ box, p, drift, fog });
    return box;
  };

  // --- back to front -------------------------------------------------------
  addLayer(ridgeLayer(lw(0.1), { seed: 1, base: 470, amp: 230, freq: 0.0032, tone: 188, alpha: 0.5, blur: 5, spiky: 0.7 }), 0.1);
  addLayer(ridgeLayer(lw(0.22), { seed: 2, base: 560, amp: 250, freq: 0.0038, tone: 160, alpha: 0.55, blur: 4, spiky: 0.8 }), 0.22);
  addLayer(fogLayer(lw(0.3), { seed: 11, y: 520, h: 120, count: 14, alpha: 0.75 }), 0.3, 40, true);
  addLayer(ridgeLayer(lw(0.45), { seed: 3, base: 650, amp: 300, freq: 0.0046, tone: 126, alpha: 0.62, blur: 3, spiky: 0.85 }), 0.45);
  addLayer(fogLayer(lw(0.55), { seed: 12, y: 640, h: 140, count: 14, alpha: 0.8 }), 0.55, -55, true);

  // birds (cross the sky slowly)
  const birdBox = new Container();
  const birdTex = birdFrames().map((c) => Texture.from(c));
  const birds: { s: Sprite; x: number; y: number; v: number; ph: number; rate: number }[] = [];
  for (let i = 0; i < 6; i++) {
    const s = new Sprite(birdTex[0]);
    s.anchor.set(0.5);
    const size = 0.34 + Math.random() * 0.34; // nearer birds are bigger and a bit darker
    s.scale.set(size);
    s.alpha = 0.45 + size * 0.7;
    birdBox.addChild(s);
    // keep the flight band below the title area
    birds.push({ s, x: Math.random() * 3000, y: 260 + Math.random() * 190, v: 20 + size * 40, ph: Math.random() * 6, rate: 3.2 + Math.random() * 1.6 });
  }
  world.addChild(birdBox);
  layers.push({ box: birdBox, p: 0.6, drift: 0, fog: false });

  addLayer(fogLayer(lw(0.8), { seed: 13, y: 720, h: 120, count: 14, alpha: 0.7 }), 0.8, 70, true);
  const midCanvas = midLayer(lw(1));
  const mid = addLayer(midCanvas, 1);
  addLayer(waterLayer(lw(1), midCanvas), 1);
  addLayer(fogLayer(lw(1.05), { seed: 14, y: 800, h: 100, count: 16, alpha: 0.75 }), 1.05, -45, true);

  // lanterns glow (in the mid plane, p = 1)
  const glowTex = Texture.from(glowTexture());
  const glows = new Map<string, Sprite>();
  for (const s of SECTIONS) {
    const g = new Sprite(glowTex);
    g.anchor.set(0.5);
    g.scale.set(3);
    g.position.set(s.x + s.lean, s.topY - 28 - s.tiers * 6);
    g.alpha = 0.4;
    mid.addChild(g);
    glows.set(s.id, g);
  }

  addLayer(foregroundLayer(lw(1.35)), 1.35);

  // --- camera --------------------------------------------------------------
  // x/y in world units. The scene is anchored to the BOTTOM of the screen, so zooming
  // keeps the water line steady and grows the peaks upward.
  const cam = { x: 0, y: 0, v: 0, base: 1, zoom: 1, s: 1, viewW: 1600, max: 0, fog: 1 };
  const recalc = () => {
    cam.s = cam.base * cam.zoom;
    cam.viewW = app.screen.width / cam.s;
    cam.max = Math.max(0, WORLD_W - cam.viewW);
    cam.x = clamp(cam.x, 0, cam.max);
  };
  const resize = () => {
    cam.base = Math.max(0.55, app.screen.height / WORLD_H);
    recalc();
  };
  resize();
  window.addEventListener('resize', resize);

  const stage = document.getElementById('stage')!;
  const hint = document.getElementById('hint')!;
  let dragging = false;
  let lastX = 0;
  let moved = 0;

  // --- panel + focus -------------------------------------------------------
  const btns = new Map<string, HTMLButtonElement>();
  const lit = (id: string, on: boolean) => gsap.to(glows.get(id)!, { alpha: on ? 0.8 : 0.4, duration: 0.5, overwrite: true });
  const isNarrow = () => app.screen.width <= 800;
  let focusId: string | null = null;

  const camTo = (x: number, y: number, zoom: number, fog: number, dur: number) => {
    gsap.killTweensOf(cam);
    cam.v = 0;
    gsap.to(cam, { x, y, zoom, fog, duration: reduced ? 0 : dur, ease: 'power3.inOut' });
  };

  const panel = createPanel(() => closeSection());

  function openSection(id: string, instant = false) {
    const sec = SECTIONS.find((s) => s.id === id);
    if (!sec) return;
    if (focusId && focusId !== id) lit(focusId, false);
    focusId = id;
    hint.classList.add('gone');
    document.body.classList.add('reading');
    lit(id, true);
    const z = FOCUS_ZOOM;
    const vw = app.screen.width / (cam.base * z);
    const frac = isNarrow() ? 0.5 : 0.3;
    const sx = sec.x + sec.lean;
    const tx = clamp(sx - vw * frac, 0, Math.max(0, WORLD_W - vw));
    // on narrow screens a bottom sheet covers the lower half, so lift the scene
    const ty = isNarrow() ? Math.max(0, (0.72 * app.screen.height) / (cam.base * z) - (WORLD_H - sec.topY) - 40) : 0;
    if (instant) {
      gsap.killTweensOf(cam);
      Object.assign(cam, { x: tx, y: ty, zoom: z, fog: 0.35 });
      recalc();
    } else {
      camTo(tx, ty, z, 0.35, 1.5);
    }
    panel.open(id);
    if (location.hash.slice(1) !== id) history.pushState(null, '', `#${id}`);
  }

  function closeSection(fromPop = false) {
    if (!focusId) return;
    const id = focusId;
    focusId = null;
    panel.close();
    lit(id, false);
    document.body.classList.remove('reading');
    camTo(cam.x, 0, 1, 1, 1.2);
    btns.get(id)?.focus({ preventScroll: true });
    if (!fromPop && location.hash) history.pushState(null, '', location.pathname + location.search);
  }

  // drag / touch with inertia
  stage.addEventListener('pointerdown', (e) => {
    dragging = true;
    lastX = e.clientX;
    moved = 0;
    gsap.killTweensOf(cam, 'x');
    cam.v = 0;
    stage.setPointerCapture(e.pointerId);
    stage.classList.add('dragging');
  });
  stage.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const dx = e.clientX - lastX;
    lastX = e.clientX;
    moved += Math.abs(dx);
    cam.x = clamp(cam.x - dx / cam.s, 0, cam.max);
    cam.v = -dx / cam.s / Math.max(app.ticker.deltaMS / 1000, 0.008);
    if (moved > 24) hint.classList.add('gone');
  });
  const end = () => { dragging = false; stage.classList.remove('dragging'); };
  stage.addEventListener('pointerup', () => {
    if (moved < 6 && focusId) closeSection(); // a plain click on the scenery closes the panel
    end();
  });
  stage.addEventListener('pointercancel', end);
  stage.addEventListener('wheel', (e) => {
    e.preventDefault();
    gsap.killTweensOf(cam, 'x');
    cam.v += (Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY) * 4;
    hint.classList.add('gone');
  }, { passive: false });
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeSection();
    if (e.key === 'ArrowRight') cam.v += 900;
    if (e.key === 'ArrowLeft') cam.v -= 900;
  });
  window.addEventListener('popstate', () => {
    const id = location.hash.slice(1);
    if (SECTIONS.some((s) => s.id === id)) openSection(id);
    else closeSection(true);
  });

  const goTo = (x: number) => {
    if (focusId) closeSection();
    gsap.killTweensOf(cam);
    cam.v = 0;
    const target = clamp(x - cam.viewW / 2, 0, cam.max);
    gsap.to(cam, { x: target, duration: reduced ? 0 : 1.4, ease: 'power3.inOut' });
    hint.classList.add('gone');
  };

  // --- DOM hotspots + ruler ------------------------------------------------
  const hs = document.getElementById('hotspots')!;
  const ruler = document.getElementById('ruler')!;
  for (const s of SECTIONS) {
    const b = document.createElement('button');
    b.setAttribute('aria-label', `${s.label} section`);
    b.innerHTML = `<span class="seal"><b>${s.seal}</b>${s.label}</span>`;
    b.addEventListener('mouseenter', () => lit(s.id, true));
    b.addEventListener('mouseleave', () => focusId !== s.id && lit(s.id, false));
    b.addEventListener('focus', () => lit(s.id, true));
    b.addEventListener('blur', () => focusId !== s.id && lit(s.id, false));
    b.addEventListener('click', () => openSection(s.id));
    hs.appendChild(b);
    btns.set(s.id, b);

    const m = document.createElement('button');
    m.setAttribute('aria-label', `Go to ${s.label}`);
    m.title = s.label;
    m.style.left = `${(s.x / WORLD_W) * 100}%`;
    m.addEventListener('click', () => (focusId ? openSection(s.id) : goTo(s.x)));
    ruler.appendChild(m);
  }
  const rulerCursor = document.createElement('div');
  rulerCursor.className = 'cursor';
  ruler.appendChild(rulerCursor);

  // --- main loop -----------------------------------------------------------
  const dbg = document.getElementById('debug')!;
  const titleEl = document.getElementById('title')!;
  if (debug) dbg.hidden = false;
  let t = 0;
  let fpsAcc = 0, fpsN = 0;
  app.ticker.add((tk) => {
    const dt = Math.min(tk.deltaMS / 1000, 0.05);
    t += dt;
    recalc();
    if (!dragging) {
      cam.x += cam.v * dt;
      cam.v *= Math.exp(-dt * 3.2);
      if (Math.abs(cam.v) < 0.5) cam.v = 0;
      if (cam.x < 0 || cam.x > cam.max) { cam.x = clamp(cam.x, 0, cam.max); cam.v = 0; }
    }
    const s = cam.s;
    const H = app.screen.height;
    for (const l of layers) {
      // drift is offset so the layer's left edge never enters the viewport
      const drift = reduced ? 0 : Math.sin(t * 0.07 + l.p * 5) * l.drift - Math.abs(l.drift);
      l.box.x = (-cam.x * l.p + drift) * s;
      l.box.y = H - WORLD_H * s - cam.y * s * l.p;
      l.box.scale.set(s);
      if (l.fog) l.box.alpha = cam.fog; // fog parts around the focused peak
    }
    if (!reduced) {
      for (const b of birds) {
        b.x += b.v * dt;
        if (b.x > 3600) b.x = -200;
        b.s.position.set(b.x, b.y + Math.sin(t * 0.8 + b.ph) * 14);
        b.s.rotation = Math.cos(t * 0.8 + b.ph) * 0.06; // follows the gentle bob
        // flap in bursts, then glide with wings held up
        const gliding = Math.sin(t * 0.35 + b.ph * 3) > 0.45;
        const idx = gliding ? BIRD_GLIDE : Math.floor(((t * b.rate + b.ph) % 1) * BIRD_POSES.length);
        b.s.texture = birdTex[idx];
      }
    }
    const oy = H - WORLD_H * s - cam.y * s;
    for (const sec of SECTIONS) {
      const b = btns.get(sec.id)!;
      b.style.transform = `translate(${(sec.x + sec.lean - cam.x) * s}px, ${oy + (sec.topY - 90) * s}px)`;
    }
    if (!focusId) titleEl.style.opacity = String(Math.max(0, 1 - cam.x / 500));
    rulerCursor.style.left = `${((cam.x + cam.viewW / 2) / WORLD_W) * 100}%`;
    if (debug) {
      fpsAcc += tk.deltaMS; fpsN++;
      if (fpsAcc > 500) {
        dbg.textContent = `fps ${(1000 / (fpsAcc / fpsN)).toFixed(0)}\nres ${app.renderer.resolution}\ncamX ${cam.x.toFixed(0)}/${cam.max.toFixed(0)}\nzoom ${cam.zoom.toFixed(2)}`;
        fpsAcc = 0; fpsN = 0;
      }
    }
  });

  // initial view / deep link / test hooks
  cam.x = clamp(800 - cam.viewW / 2, 0, cam.max); // centre the first island
  const camParam = params.get('cam');
  if (camParam) cam.x = clamp(Number(camParam), 0, cam.max);
  const startId = location.hash.slice(1);
  if (SECTIONS.some((x) => x.id === startId)) openSection(startId, params.has('instant') || reduced);
  if (params.has('birds')) {
    // debug: lay out every wing pose at 3x so the shape can be checked
    const row = document.createElement('div');
    row.style.cssText = 'position:fixed;left:0;top:0;display:flex;gap:8px;padding:12px;background:#f3ecdf;z-index:99';
    birdFrames().forEach((c) => { c.style.width = `${c.width * 3}px`; row.appendChild(c); });
    document.body.appendChild(row);
  }
  (window as unknown as { __ready: boolean }).__ready = true;
}

boot();
