// Usage: node tools/shot.mjs [label]   (dev server must be running; set URL=http://localhost:PORT/)
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const label = process.argv[2] ?? 'run';
const base = process.env.URL ?? 'http://localhost:5173/';
mkdirSync('shots', { recursive: true });

// each entry: [name, query+hash, wait ms]
const desktop = [
  ['start', '', 1500],
  ['cam1300', '&cam=1300', 1500],
  ['cam3400', '&cam=3400', 1500],
  ['projects', '&instant#projects', 3200],
  ['awards', '&instant#awards', 3200],
];
const mobile = [
  ['start', '', 1500],
  ['experience', '&instant#experience', 3200],
];
// ONLY="start,projects" limits which shots are taken; DPR=2 for detail checks
const only = process.env.ONLY ? process.env.ONLY.split(',') : null;
const dpr = Number(process.env.DPR ?? 1);
const pick = (a) => (only ? a.filter(([n]) => only.includes(n)) : a);
const views = [
  { name: 'desktop', w: 1440, h: 900, shots: pick(desktop) },
  { name: 'mobile', w: 390, h: 844, shots: pick(mobile) },
].filter((v) => v.shots.length && (!process.env.VIEW || v.name === process.env.VIEW));

const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
for (const v of views) {
  const page = await browser.newPage({ viewport: { width: v.w, height: v.h }, deviceScaleFactor: dpr });
  page.on('console', (m) => m.type() === 'error' && console.log('console error:', m.text()));
  page.on('pageerror', (e) => console.log('page error:', e.message));
  for (const [name, q, wait] of v.shots) {
    await page.goto('about:blank');
    await page.goto(`${base}?debug=1${q}`);
    await page.waitForFunction(() => window.__ready === true, null, { timeout: 120000 });
    await page.waitForTimeout(wait);
    const file = `shots/${label}-${v.name}-${name}.png`;
    // CLIP="x,y,w,h" (CSS px) crops to a region; combine with DPR=2 for detail checks
    const clip = process.env.CLIP ? Object.fromEntries(process.env.CLIP.split(',').map((n, i) => [['x', 'y', 'width', 'height'][i], Number(n)])) : undefined;
    await page.screenshot({ path: file, clip, timeout: 180000 });
    console.log('saved', file);
  }
  await page.close();
}
await browser.close();
