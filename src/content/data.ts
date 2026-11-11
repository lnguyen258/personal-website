// Placeholder content. Replace later; the concept comes first.
export interface PanelData {
  kicker: string;
  title: string;
  intro: string;
  html: string;
}

const tags = (t: string[]) => `<ul class="tags">${t.map((x) => `<li>${x}</li>`).join('')}</ul>`;

export const PANELS: Record<string, PanelData> = {
  about: {
    kicker: 'Who walks here',
    title: 'About',
    intro: 'A short line about who you are and what you care about. Keep it quiet and confident.',
    html: `<p>Second paragraph: what you are working on now, and what you are looking for.</p>
      <ul class="links"><li><a href="#">Email</a></li><li><a href="#">GitHub</a></li><li><a href="#">LinkedIn</a></li></ul>`,
  },
  experience: {
    kicker: 'The road so far',
    title: 'Experience',
    intro: 'Where the path has led, newest first.',
    html: `<ol class="timeline">
      <li><time>2025 – now</time><h3>Role Title</h3><span>Company One</span><p>One sentence about the impact you made.</p></li>
      <li><time>2023 – 2025</time><h3>Role Title</h3><span>Company Two</span><p>One sentence about the impact you made.</p></li>
      <li><time>2021 – 2023</time><h3>Role Title</h3><span>Company Three</span><p>One sentence about the impact you made.</p></li>
    </ol>`,
  },
  projects: {
    kicker: 'Things built',
    title: 'Projects',
    intro: 'A few pieces of work worth the climb.',
    html: `<div class="cards">
      <article><h3>Project One</h3><p>What it is and why it matters, in one or two lines.</p>${tags(['TypeScript', 'WebGL'])}</article>
      <article><h3>Project Two</h3><p>What it is and why it matters, in one or two lines.</p>${tags(['Python', 'ML'])}</article>
      <article><h3>Project Three</h3><p>What it is and why it matters, in one or two lines.</p>${tags(['Rust', 'CLI'])}</article>
    </div>`,
  },
  awards: {
    kicker: 'Marks of honour',
    title: 'Awards',
    intro: 'Recognition along the way.',
    html: `<ul class="awards">
      <li><b>1st</b><div><h3>Hackathon Name</h3><span>Organiser, 2025</span></div></li>
      <li><b>2nd</b><div><h3>Competition Name</h3><span>Organiser, 2024</span></div></li>
      <li><b>★</b><div><h3>Scholarship / Honour</h3><span>Institution, 2023</span></div></li>
    </ul>`,
  },
  more: {
    kicker: 'Beyond the ridge',
    title: 'More',
    intro: 'Skills, writing and the things that do not fit elsewhere.',
    html: tags(['TypeScript', 'React', 'Python', 'Rust', 'WebGL', 'Design', 'Writing']),
  },
};
