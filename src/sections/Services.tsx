import { useRef, useState } from 'react';
import { useIsoLayoutEffect } from '../lib/useMedia';
import { services } from '../data/services';
import { gsap, MQ, ScrollTrigger, scrollToTarget, splitWords } from '../lib/motion';

const STEP = 21; // degrees between items on the drum
const pad = (n: number) => String(n).padStart(2, '0');

export default function Services() {
  const root = useRef<HTMLElement>(null);
  const drum = useRef<HTMLOListElement>(null);
  const trigger = useRef<ScrollTrigger | null>(null);
  const [active, setActive] = useState(0);

  useIsoLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();

      mm.add({ desktop: MQ.desktop, mobile: MQ.mobile }, (c) => {
        const words = splitWords(root.current!.querySelector<HTMLElement>('.services__title')!);
        gsap.fromTo(
          words,
          { yPercent: 110 },
          {
            yPercent: 0,
            stagger: 0.07,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: '.services__title',
              start: 'top 90%',
              end: 'top 55%',
              scrub: 0.6,
            },
          },
        );

        if (c.conditions?.desktop) {
          const items = gsap.utils.toArray<HTMLElement>('.drum__item');
          const max = (items.length - 1) * STEP;
          let last = -1;

          const paint = (rot: number) => {
            items.forEach((el, i) => {
              const d = Math.abs(rot - i * STEP) / STEP;
              // Text keeps full contrast; the drum's gradient mask provides the depth fade.
              // Items turned past the visible arc are hidden outright.
              el.style.visibility = d > 3.6 ? 'hidden' : 'visible';
              el.classList.toggle('is-front', d < 0.5);
            });
            const idx = Math.round(rot / STEP);
            if (idx !== last) {
              last = idx;
              setActive(idx);
            }
          };

          const R = 330;
          drum.current!.style.setProperty('--R', `${R}px`);
          gsap.set(drum.current, { z: -R, rotationX: 0 });
          const state = { rot: 0 };
          paint(0);
          const tween = gsap.to(state, {
            rot: max,
            ease: 'none',
            onUpdate: () => {
              gsap.set(drum.current, { rotationX: state.rot });
              paint(state.rot);
            },
            scrollTrigger: {
              trigger: '.services__pin',
              start: 'top top',
              end: () => `+=${window.innerHeight * 0.5 * items.length}`,
              pin: true,
              scrub: 0.9,
              anticipatePin: 1,
              invalidateOnRefresh: true,
            },
          });
          trigger.current = tween.scrollTrigger ?? null;

          // Rings respond to the same scroll.
          gsap.to('.services__ring--a', {
            rotationZ: 120,
            ease: 'none',
            scrollTrigger: { trigger: root.current, start: 'top bottom', end: 'bottom top', scrub: true },
          });
          gsap.to('.services__ring--b', {
            rotationZ: -90,
            ease: 'none',
            scrollTrigger: { trigger: root.current, start: 'top bottom', end: 'bottom top', scrub: true },
          });
          return () => {
            trigger.current = null;
          };
        }

        // Mobile: rows tilt up out of depth and highlight when centred.
        gsap.utils.toArray<HTMLElement>('.drum__item').forEach((el) => {
          gsap.fromTo(
            el,
            { rotationX: -55, y: 50 },
            {
              rotationX: 0,
              y: 0,
              ease: 'power2.out',
              scrollTrigger: { trigger: el, start: 'top 95%', end: 'top 65%', scrub: 0.5 },
            },
          );
          ScrollTrigger.create({
            trigger: el,
            start: 'top 60%',
            end: 'bottom 40%',
            toggleClass: 'is-front',
          });
        });
      });
    }, root);
    return () => ctx.revert();
  }, []);

  const goTo = (i: number) => {
    const st = trigger.current;
    if (!st) return;
    scrollToTarget(st.start + ((st.end - st.start) * i) / (services.length - 1));
  };

  return (
    <section id="services" className="services" ref={root}>
      {/* Text-free band that carries the light → navy transition */}
      <div className="services__fade" aria-hidden="true" />
      <div className="services__pin">
        <div className="services__rings" aria-hidden="true">
          <span className="services__ring services__ring--a" />
          <span className="services__ring services__ring--b" />
          <span className="services__core" />
        </div>

        <div className="container services__grid">
          <div className="services__left">
            <div className="section-label section-label--light">
              <span className="mono">(03)</span>
              <span>What we do</span>
            </div>
            <h2 className="services__title display">
              Services that <em>move</em> business forward.
            </h2>

            <div className="services__detail" aria-live="polite">
              <div className="services__counter mono">
                <span>{pad(active + 1)}</span>
                <i />
                <span>{pad(services.length)}</span>
              </div>
              <div className="services__descs">
                {services.map((s, i) => (
                  <div key={s.name} className={`services__desc ${i === active ? 'is-active' : ''}`} aria-hidden={i !== active}>
                    <p>{s.description}</p>
                    <ul>
                      {s.tags.map((t) => (
                        <li key={t}>{t}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="drum">
            <ol className="drum__scene" ref={drum}>
              {services.map((s, i) => (
                <li
                  key={s.name}
                  className="drum__item"
                  style={{ '--i': i } as React.CSSProperties}
                  onClick={() => goTo(i)}
                >
                  <span className="drum__num mono">{pad(i + 1)}</span>
                  <h3 className="drum__name">{s.name}</h3>
                  <p className="drum__desc">{s.description}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}
