import { useRef, useState } from 'react';
import { useIsoLayoutEffect } from '../lib/useMedia';
import { projects, type Project } from '../data/projects';
import { BrowserFrame, PageStrip, PhoneFrame } from '../components/ProjectPreview';
import { gsap, MQ, ScrollTrigger, splitWords } from '../lib/motion';

const pad = (n: number) => String(n).padStart(2, '0');

function VisitLink({ project }: { project: Project }) {
  return (
    <a
      className="visit"
      href={project.url}
      target="_blank"
      rel="noopener noreferrer"
    >
      <span>Visit Website</span>
      <span className="sr-only">: {project.name} (opens in a new tab)</span>
      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
        <path d="M7 17 17 7M9 7h8v8" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </a>
  );
}

function CaseText({ project, index, size = 'lg' }: { project: Project; index: number; size?: 'lg' | 'md' }) {
  return (
    <div className={`case-text case-text--${size}`}>
      <div className="case-text__top">
        <span className="case-text__num" aria-hidden="true">
          {pad(index + 1)}
        </span>
        <span className="case-text__meta mono">
          <span>{project.sector}</span>
          <span>{project.location}</span>
        </span>
      </div>
      <h3 className="case-text__name">{project.name}</h3>
      <p className="case-text__desc">{project.description}</p>
      <ul className="case-text__tags" aria-label="Scope">
        {project.tags.map((t) => (
          <li key={t}>{t}</li>
        ))}
      </ul>
      <VisitLink project={project} />
    </div>
  );
}

/* ---------------- Featured spreads: four distinct compositions ---------------- */

function SpreadA({ p, i }: { p: Project; i: number }) {
  return (
    <article className="spread spread--a" style={{ '--accent': p.accent, '--tint': p.tint } as React.CSSProperties}>
      <div className="spread__visual">
        <div className="spread__panel" aria-hidden="true" />
        <div className="shot" data-reveal>
          <BrowserFrame project={p} sizes="(min-width: 1024px) 64vw, 100vw" />
        </div>
        <PhoneFrame project={p} className="spread__phone" />
      </div>
      <CaseText project={p} index={i} />
    </article>
  );
}

function SpreadB({ p, i }: { p: Project; i: number }) {
  return (
    <article className="spread spread--b" style={{ '--accent': p.accent, '--tint': p.tint } as React.CSSProperties}>
      <span className="spread__ghost" aria-hidden="true">
        {pad(i + 1)}
      </span>
      <CaseText project={p} index={i} />
      <div className="spread__visual">
        <div className="shot" data-reveal>
          <BrowserFrame project={p} sizes="(min-width: 1024px) 62vw, 100vw" />
        </div>
        <p className="spread__hint mono" aria-hidden="true">
          Hover to scroll the live layout
        </p>
      </div>
    </article>
  );
}

function SpreadC({ p, i }: { p: Project; i: number }) {
  return (
    <article className="spread spread--c" style={{ '--accent': p.accent, '--tint': p.tint } as React.CSSProperties}>
      <header className="spread__head">
        <span className="mono">
          {pad(i + 1)} — {p.sector}
        </span>
        <h3 className="spread__title" data-split>
          {p.name}
        </h3>
      </header>
      <div className="spread__stage">
        <div className="shot" data-reveal>
          <BrowserFrame project={p} sizes="(min-width: 1024px) 80vw, 100vw" />
        </div>
        <PhoneFrame project={p} className="spread__phone" />
      </div>
      <div className="spread__foot">
        <p className="case-text__desc">{p.description}</p>
        <div>
          <ul className="case-text__tags">
            {p.tags.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
          <VisitLink project={p} />
        </div>
      </div>
    </article>
  );
}

function SpreadD({ p, i }: { p: Project; i: number }) {
  return (
    <article className="spread spread--d" style={{ '--accent': p.accent, '--tint': p.tint } as React.CSSProperties}>
      <div className="spread__visual">
        <div className="shot" data-reveal>
          <BrowserFrame project={p} sizes="(min-width: 1024px) 58vw, 100vw" />
        </div>
        <PageStrip project={p} className="spread__strip" />
      </div>
      <CaseText project={p} index={i} />
    </article>
  );
}

const spreads = [SpreadA, SpreadB, SpreadC, SpreadD];

/* ---------------- Horizontal gallery panels ---------------- */

function Panel({ p, i }: { p: Project; i: number }) {
  const flip = i % 2 === 1;
  return (
    <article
      className={`panel ${flip ? 'panel--flip' : ''}`}
      style={{ '--accent': p.accent, '--tint': p.tint } as React.CSSProperties}
    >
      <span className="panel__num" aria-hidden="true">
        {pad(i + 1)}
      </span>
      <div className="panel__visual">
        <div className="panel__shot">
          <BrowserFrame project={p} sizes="(min-width: 1024px) 50vw, 100vw" />
        </div>
        {flip && <PhoneFrame project={p} className="panel__phone" />}
      </div>
      <CaseText project={p} index={i} size="md" />
    </article>
  );
}

export default function Projects() {
  const root = useRef<HTMLElement>(null);
  const [current, setCurrent] = useState(0);
  const featured = projects.slice(0, 4);
  const rest = projects.slice(4);

  useIsoLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();

      mm.add({ desktop: MQ.desktop, mobile: MQ.mobile }, (c) => {
        const isDesk = !!c.conditions?.desktop;

        // Section title
        const words = splitWords(root.current!.querySelector<HTMLElement>('.work__title')!);
        gsap.fromTo(
          words,
          { yPercent: 110, rotationX: -60 },
          {
            yPercent: 0,
            rotationX: 0,
            stagger: 0.08,
            ease: 'power3.out',
            scrollTrigger: { trigger: '.work__head', start: 'top 85%', end: 'top 40%', scrub: 0.6 },
          },
        );

        // Screenshot reveals (clip + inner scale), scrubbed both ways.
        gsap.utils.toArray<HTMLElement>('[data-reveal]').forEach((el) => {
          const tl = gsap.timeline({
            scrollTrigger: { trigger: el, start: 'top 92%', end: isDesk ? 'top 35%' : 'top 55%', scrub: 0.7 },
          });
          tl.fromTo(
            el,
            {
              clipPath: 'inset(14% 10% 14% 10% round 28px)',
              y: 80,
              rotationX: isDesk ? 18 : 10,
              transformPerspective: 1800,
              transformOrigin: '50% 100%',
            },
            { clipPath: 'inset(-10% -10% -10% -10% round 0px)', y: 0, rotationX: 0, ease: 'power2.out' },
          ).fromTo(el.querySelector('.frame__media'), { scale: 1.2 }, { scale: 1, ease: 'power2.out' }, 0);
        });

        // Phones float at a different depth (parallax).
        gsap.utils.toArray<HTMLElement>('.spread__phone').forEach((el) => {
          gsap.fromTo(
            el,
            { y: isDesk ? 160 : 80, rotation: 6 },
            {
              y: isDesk ? -60 : -20,
              rotation: -2,
              ease: 'none',
              scrollTrigger: { trigger: el.closest('.spread'), start: 'top bottom', end: 'bottom top', scrub: true },
            },
          );
        });

        // Case text
        gsap.utils.toArray<HTMLElement>('.spread .case-text, .spread__foot').forEach((el) => {
          gsap.from(el.children, {
            y: 48,
            stagger: 0.08,
            ease: 'power2.out',
            scrollTrigger: { trigger: el, start: 'top 90%', end: 'top 55%', scrub: 0.6 },
          });
        });

        // Oversized title in spread C
        gsap.utils.toArray<HTMLElement>('.spread__title[data-split]').forEach((el) => {
          gsap.fromTo(
            splitWords(el),
            { yPercent: 105 },
            {
              yPercent: 0,
              stagger: 0.1,
              ease: 'power3.out',
              scrollTrigger: { trigger: el, start: 'top 90%', end: 'top 55%', scrub: 0.6 },
            },
          );
        });

        // Ghost index in spread B drifts
        gsap.utils.toArray<HTMLElement>('.spread__ghost').forEach((el) => {
          gsap.fromTo(el, { yPercent: 30 }, {
            yPercent: -30,
            ease: 'none',
            scrollTrigger: { trigger: el.parentElement, start: 'top bottom', end: 'bottom top', scrub: true },
          });
        });

        // Full-page strip: content scrolls as the page scrolls.
        gsap.utils.toArray<HTMLElement>('.strip').forEach((el) => {
          const img = el.querySelector<HTMLElement>('.strip__img');
          gsap.fromTo(img, { yPercent: 0 }, {
            yPercent: () => {
              const view = el.querySelector<HTMLElement>('.strip__view')!;
              return img && img.offsetHeight ? -100 * (1 - view.offsetHeight / img.offsetHeight) : -60;
            },
            ease: 'none',
            scrollTrigger: { trigger: el, start: 'top 85%', end: 'bottom 15%', scrub: 0.5, invalidateOnRefresh: true },
          });
        });

        if (isDesk) {
          // Horizontal showcase: pinned, scroll-linked translateX.
          const track = root.current!.querySelector<HTMLElement>('.hscroll__track')!;
          const distance = () => track.scrollWidth - window.innerWidth;
          // Wayfinding HUD: one source of truth, whichever case study (vertical spread or
          // horizontal panel) is closest to the viewport centre. Created after the pin so
          // its end accounts for the pin spacing.
          const items = gsap.utils.toArray<HTMLElement>('.spread, .panel');
          const pick = () => {
            const cx = window.innerWidth / 2;
            const cy = window.innerHeight / 2;
            let best = 0;
            let bestD = Infinity;
            items.forEach((el, i) => {
              const r = el.getBoundingClientRect();
              const d = Math.hypot(r.left + r.width / 2 - cx, (r.top + r.height / 2 - cy) * 1.4);
              if (d < bestD) {
                bestD = d;
                best = i;
              }
            });
            setCurrent(best);
          };
          const h = gsap.to(track, {
            x: () => -distance(),
            ease: 'none',
            onUpdate: () => pick(),
            scrollTrigger: {
              trigger: '.hscroll',
              start: 'top top',
              end: () => `+=${distance()}`,
              pin: true,
              scrub: 0.8,
              anticipatePin: 1,
              invalidateOnRefresh: true,
            },
          });
          gsap.fromTo('.hscroll__progress i', { scaleX: 0 }, {
            scaleX: 1,
            ease: 'none',
            scrollTrigger: { trigger: '.hscroll', start: 'top top', end: () => `+=${distance()}`, scrub: true },
          });
          // Inner parallax inside each moving panel
          gsap.utils.toArray<HTMLElement>('.panel').forEach((panel) => {
            gsap.fromTo(
              panel.querySelector('.panel__shot'),
              { xPercent: 8, rotationY: -8 },
              {
                xPercent: -4,
                rotationY: 4,
                ease: 'none',
                scrollTrigger: { trigger: panel, containerAnimation: h, start: 'left right', end: 'right left', scrub: true },
              },
            );
            const phone = panel.querySelector('.panel__phone');
            if (phone) {
              gsap.fromTo(phone, { y: 80 }, {
                y: -60,
                ease: 'none',
                scrollTrigger: { trigger: panel, containerAnimation: h, start: 'left right', end: 'right left', scrub: true },
              });
            }
          });
          ScrollTrigger.create({
            trigger: root.current,
            start: 'top 40%',
            end: 'bottom 70%',
            toggleClass: { targets: root.current!.querySelector('.work-hud'), className: 'is-on' },
            onUpdate: pick,
            onToggle: pick,
          });
        } else {
          gsap.utils.toArray<HTMLElement>('.panel').forEach((panel) => {
            gsap.from(panel.querySelectorAll('.panel__shot, .case-text > *'), {
              y: 56,
              stagger: 0.06,
              ease: 'power2.out',
              scrollTrigger: { trigger: panel, start: 'top 88%', end: 'top 50%', scrub: 0.6 },
            });
          });
        }
      });
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <section id="work" className="work" ref={root}>
      <div className="container work__head">
        <div className="section-label">
          <span className="mono">(02)</span>
          <span>Selected work</span>
        </div>
        <div className="work__head-row">
          <h2 className="work__title display">
            Our <em>Projects</em>
          </h2>
          <p className="work__intro">
            <span className="work__count">{pad(projects.length)}</span>
            Live platforms we have designed and engineered, from enterprise consultancies and energy
            groups to e-commerce, education and SaaS.
          </p>
        </div>
      </div>

      <div className="container spreads">
        {featured.map((p, i) => {
          const Spread = spreads[i % spreads.length];
          return <Spread key={p.slug} p={p} i={i} />;
        })}
      </div>

      <div className="hscroll">
        <div className="hscroll__track">
          <div className="hscroll__intro">
            <span className="mono">(02.1) — More launches</span>
            <h3>
              Built for <em>every</em> industry.
            </h3>
            <p>
              Energy, agriculture, hospitality, education and secure software: each crafted around
              its own audience.
            </p>
            <div className="hscroll__progress" aria-hidden="true">
              <i />
            </div>
            <span className="hscroll__hint mono" aria-hidden="true">
              Keep scrolling →
            </span>
          </div>
          {rest.map((p, j) => (
            <Panel key={p.slug} p={p} i={j + featured.length} />
          ))}
        </div>
      </div>

      <div className="work-hud" aria-hidden="true" style={{ '--accent': projects[current].accent } as React.CSSProperties}>
        <span className="work-hud__count">
          <strong>{pad(current + 1)}</strong>
          <span>/ {pad(projects.length)}</span>
        </span>
        <span className="work-hud__name">{projects[current].name}</span>
        <span className="work-hud__bar">
          <i style={{ transform: `scaleX(${(current + 1) / projects.length})` }} />
        </span>
      </div>
    </section>
  );
}
