import gsap from 'gsap';
import { PANELS } from '../content/data';
import { SECTIONS } from '../content/sections';

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

export function createPanel(onClose: () => void) {
  const el = document.getElementById('panel') as HTMLElement;
  let current: string | null = null;

  el.innerHTML = `
    <div class="rod top"></div>
    <div class="sheet">
      <button class="close" aria-label="Close section">&times;</button>
      <div class="stamp" aria-hidden="true"></div>
      <p class="kicker"></p>
      <h2 id="panel-title"></h2>
      <div class="brush" aria-hidden="true"></div>
      <p class="intro"></p>
      <div class="body"></div>
    </div>
    <div class="rod bottom"></div>`;
  const q = <T extends HTMLElement>(s: string) => el.querySelector(s) as T;
  const sheet = q<HTMLElement>('.sheet');
  el.setAttribute('role', 'dialog');
  el.setAttribute('aria-labelledby', 'panel-title');
  q<HTMLButtonElement>('.close').addEventListener('click', () => onClose());

  function open(id: string) {
    const data = PANELS[id];
    const sec = SECTIONS.find((s) => s.id === id);
    if (!data || !sec) return;
    q('.stamp').textContent = sec.seal;
    q('.kicker').textContent = data.kicker;
    q('#panel-title').textContent = data.title;
    q('.intro').textContent = data.intro;
    q('.body').innerHTML = data.html;
    sheet.scrollTop = 0;
    current = id;
    el.hidden = false;
    el.classList.add('open');
    gsap.killTweensOf([el, sheet]);
    if (reduced) {
      gsap.set(el, { opacity: 1, y: 0 });
      gsap.set(sheet, { clipPath: 'inset(0 0 0% 0)' });
    } else {
      gsap.fromTo(el, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out', delay: 0.35 });
      // unroll like a hanging scroll: reveal top to bottom
      gsap.fromTo(sheet, { clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0% 0)', duration: 1.0, ease: 'power2.inOut', delay: 0.4 });
    }
    q<HTMLButtonElement>('.close').focus({ preventScroll: true });
  }

  function close() {
    if (!current) return;
    current = null;
    el.classList.remove('open');
    gsap.killTweensOf([el, sheet]);
    gsap.to(el, { opacity: 0, y: 16, duration: reduced ? 0 : 0.4, ease: 'power2.in', onComplete: () => { el.hidden = true; } });
  }

  return { open, close, get current() { return current; } };
}
