import { useRef } from 'react';
import { useIsoLayoutEffect } from '../lib/useMedia';
import { gsap, MQ, splitWords } from '../lib/motion';

const layers = [
  { label: 'Strategy', note: 'Discovery · Roadmap' },
  { label: 'Design', note: 'UI/UX · Brand' },
  { label: 'Engineering', note: 'Web · Software' },
  { label: 'Growth', note: 'SEO · Automation' },
];

const stats = [
  { value: 2012, suffix: '', label: 'Trusted since' },
  { value: 450, suffix: '+', label: 'Clients served' },
  { value: 3, suffix: '', label: 'Regions · UAE, UK, PK' },
  { value: 8, suffix: '', label: 'Core disciplines' },
];

export default function Intro() {
  const root = useRef<HTMLElement>(null);

  useIsoLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();
      mm.add({ desktop: MQ.desktop, mobile: MQ.mobile }, (c) => {
        const isDesk = !!c.conditions?.desktop;
        const words = splitWords(root.current!.querySelector<HTMLElement>('.intro__title')!);

        // Headline: words rise out of masks in 3D and "ink in" as you scroll.
        gsap.fromTo(
          words,
          { yPercent: 115, rotationX: -70, color: '#B9C4DA' },
          {
            yPercent: 0,
            rotationX: 0,
            color: (_i: number, el: Element) => (el.closest('em') ? '#1F63CF' : '#07122B'),
            ease: 'power2.out',
            stagger: 0.06,
            scrollTrigger: {
              trigger: '.intro__title',
              start: 'top 88%',
              end: isDesk ? 'bottom 45%' : 'bottom 60%',
              scrub: 0.6,
            },
          },
        );

        gsap.from('.intro__body > *', {
          y: 60,
          stagger: 0.12,
          ease: 'power2.out',
          scrollTrigger: { trigger: '.intro__body', start: 'top 85%', end: 'top 50%', scrub: 0.6 },
        });

        // Exploded view: layers separate in depth as the section scrolls.
        const panes = gsap.utils.toArray<HTMLElement>('.stack__pane');
        gsap.fromTo(
          panes,
          { z: (i: number) => i * 8, opacity: 0.3 },
          {
            z: (i: number) => i * (isDesk ? 78 : 52),
            opacity: 1,
            ease: 'none',
            scrollTrigger: { trigger: '.stack', start: 'top 85%', end: 'bottom 35%', scrub: 0.8 },
          },
        );
        gsap.fromTo(
          '.stack__scene',
          { rotationZ: -28, rotationX: 62 },
          {
            rotationZ: -42,
            rotationX: 56,
            ease: 'none',
            scrollTrigger: { trigger: '.stack', start: 'top bottom', end: 'bottom top', scrub: true },
          },
        );

        // Count-up stats, tied to scroll so they reverse too.
        gsap.utils.toArray<HTMLElement>('[data-count]').forEach((el) => {
          const to = Number(el.dataset.count);
          const from = to > 1000 ? to - 40 : 0;
          const obj = { v: from };
          gsap.to(obj, {
            v: to,
            ease: 'power1.out',
            onUpdate: () => (el.textContent = String(Math.round(obj.v))),
            scrollTrigger: { trigger: el, start: 'top 92%', end: 'top 62%', scrub: 0.5 },
          });
        });

        // Kinetic band.
        gsap.fromTo(
          '.band__row--a',
          { xPercent: 0 },
          { xPercent: -28, ease: 'none', scrollTrigger: { trigger: '.band', start: 'top bottom', end: 'bottom top', scrub: true } },
        );
        gsap.fromTo(
          '.band__row--b',
          { xPercent: -28 },
          { xPercent: 0, ease: 'none', scrollTrigger: { trigger: '.band', start: 'top bottom', end: 'bottom top', scrub: true } },
        );
      });
    }, root);
    return () => ctx.revert();
  }, []);

  const bandWords = ['Strategy', 'Design', 'Engineering', 'Growth', 'Automation', 'Experience'];

  return (
    <section id="intro" className="intro" ref={root}>
      <div className="container">
        <div className="section-label">
          <span className="mono">(01)</span>
          <span>Who we are</span>
        </div>

        <h2 className="intro__title display">
          We Don&rsquo;t Just Build Websites. <br className="hide-sm" />
          We Build <em>Digital Experiences.</em>
        </h2>

        <div className="intro__grid">
          <div className="stack" aria-hidden="true">
            <div className="stack__scene">
              {layers.map((l, i) => (
                <div className="stack__pane" key={l.label} style={{ '--i': i } as React.CSSProperties}>
                  <span className="mono">0{i + 1}</span>
                  <strong>{l.label}</strong>
                  <small>{l.note}</small>
                </div>
              ))}
            </div>
          </div>

          <div className="intro__body">
            <p className="lead">
              Webcore Solutions is a digital technology and creative solutions company. We help
              businesses <strong>establish, grow and scale</strong> their digital presence, bringing
              technology, design and innovation together in products that perform.
            </p>
            <p>
              From strategy and brand to engineering and growth, our teams across the UAE, the
              United Kingdom and Pakistan partner with startups, enterprises and institutions that
              expect more from digital.
            </p>
            <dl className="stats">
              {stats.map((s) => (
                <div key={s.label} className="stat">
                  <dt className="mono">{s.label}</dt>
                  <dd>
                    <span data-count={s.value}>{s.value}</span>
                    {s.suffix}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>

      <div className="band" aria-hidden="true">
        <div className="band__row band__row--a">
          {[...bandWords, ...bandWords].map((w, i) => (
            <span key={i}>
              {w}
              <i className="band__mark">/</i>
            </span>
          ))}
        </div>
        <div className="band__row band__row--b">
          {[...bandWords, ...bandWords].reverse().map((w, i) => (
            <span key={i} className="outline">
              {w}
              <i className="band__mark">/</i>
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
