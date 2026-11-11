export interface Section {
  id: string;
  label: string;
  seal: string; // single glyph shown as a seal stamp
  x: number; // world x of the pagoda
  topY: number; // world y of the peak top (pagoda sits here)
  baseY: number;
  width: number; // base width of the peak
  tiers: number;
  lean: number; // horizontal shift of the summit relative to the foot (world units)
  taper: number; // profile exponent: lower = bulgier body, higher = needle-like
  ledge: number; // 0..1, strength of a step/ledge halfway down
}

export const WORLD_W = 5400;
export const WORLD_H = 1000;

export const SECTIONS: Section[] = [
  { id: 'about', label: 'About', seal: '我', x: 800, topY: 580, baseY: 850, width: 330, tiers: 1, lean: 0, taper: 0.62, ledge: 0.2 },
  { id: 'experience', label: 'Experience', seal: '路', x: 1750, topY: 360, baseY: 850, width: 380, tiers: 2, lean: -70, taper: 0.8, ledge: 0.7 },
  { id: 'projects', label: 'Projects', seal: '作', x: 2850, topY: 290, baseY: 850, width: 440, tiers: 4, lean: 15, taper: 0.5, ledge: 0.35 },
  { id: 'awards', label: 'Awards', seal: '榮', x: 3950, topY: 340, baseY: 850, width: 360, tiers: 3, lean: 80, taper: 1.0, ledge: 0.9 },
  { id: 'more', label: 'More', seal: '遠', x: 4750, topY: 450, baseY: 850, width: 300, tiers: 2, lean: -40, taper: 0.7, ledge: 0.5 },
];
