import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { gsap, MQ, isFinePointer, onAnchorClick } from '../lib/motion';
import { heroState } from '../lib/heroState';
import { useIdle, useMedia, useIsoLayoutEffect } from '../lib/useMedia';

const HeroScene = lazy(() => import('../components/HeroScene'));

/**
 * The logo is rendered as three pixel-exact layers cut from the official file
 * (public/brand/*). At rest they recompose the original logo exactly; in motion
 * they separate in depth to give the mark real dimensionality.
 */
export default function Hero() {
  const section = useRef<HTMLElement>(null);
  const brand = useRef<HTMLAnchorElement>(null);
  const [active, setActive] = useState(true);
  const [sceneReady, setSceneReady] = useState(false);
  const reduced = useMedia('(prefers-reduced-motion: reduce)');
  const mobile = useMedia('(max-width: 767px)');
  // The WebGL scene is decorative: mount it once the page is idle so it never competes with first paint.
  const idle = useIdle();

  // Only render WebGL while the hero is on screen.
  useEffect(() => {
    const el = section.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setActive(entry.isIntersecting), {
      rootMargin: '10% 0px',
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useIsoLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();

      mm.add(
        { motion: '(prefers-reduced-motion: no-preference)', desktop: MQ.desktop },
        (c) => {
          if (!c.conditions?.motion) return;
          const isDesk = !!c.conditions.desktop;
          const b = brand.current!;
          const q = gsap.utils.selector(b);
          const header = document.querySelector<HTMLElement>('.site-header');
          const slot = () => document.querySelector<HTMLElement>('[data-brand-slot]')!;

          /* ---------------- Opening sequence (time-based, plays once) ---------------- */
          // The layer images are fetched now (after first paint), not up front.
          q('.brand__layer img').forEach((img) => {
            const el = img as HTMLImageElement;
            if (el.dataset.srcset) el.srcset = el.dataset.srcset;
            if (el.dataset.src) el.src = el.dataset.src;
          });
          gsap.set(b, { '--fx-in': 0 });
          const intro = gsap.timeline({ delay: 0.25, defaults: { ease: 'expo.out' } });
          intro
            .fromTo('.hero__beam', { scaleX: 0, autoAlpha: 1 }, { scaleX: 1, duration: 1, ease: 'expo.inOut' })
            .to('.hero__beam', { scaleY: 40, autoAlpha: 0, duration: 0.9, ease: 'power2.out' }, '>-0.15')
            .fromTo(
              q('.brand__layer--mark img'),
              { autoAlpha: 0, z: -520, rotationY: -38, x: -40, filter: 'blur(16px)' },
              { autoAlpha: 1, z: 0, rotationY: 0, x: 0, filter: 'blur(0px)', duration: 1.9, clearProps: 'filter' },
              0.75,
            )
            .fromTo(
              q('.brand__layer--word img'),
              { autoAlpha: 0, clipPath: 'inset(0% 100% 0% 0%)', x: -60 },
              { autoAlpha: 1, clipPath: 'inset(0% 0% 0% 0%)', x: 0, duration: 1.6, clearProps: 'clipPath' },
              1.1,
            )
            .fromTo(
              q('.brand__layer--tag img'),
              { autoAlpha: 0, z: 320, y: -40, rotation: -14 },
              { autoAlpha: 1, z: 0, y: 0, rotation: 0, duration: 1.5, ease: 'expo.out' },
              1.45,
            )
            .to(b, { '--fx-in': 1, duration: 1.6, ease: 'power2.out' }, 1.3)
            .fromTo('.hero__frame', { autoAlpha: 0 }, { autoAlpha: 1, duration: 1.2, ease: 'power2.out' }, 1.9)
            .add(() => b.classList.add('is-lit'), 2.4);

          /* ---------------- Scroll choreography (pinned + scrubbed) ---------------- */
          gsap.set(b, { xPercent: -50, yPercent: -50, x: 0, y: 0, '--fx': 1 });
          const target = () => {
            const r = slot().getBoundingClientRect();
            // The header slides in from y: -24, so measure its resting position
            // (remove its current translate), otherwise the logo docks too high.
            const headerY = header ? Number(gsap.getProperty(header, 'y')) || 0 : 0;
            return {
              x: r.left + r.width / 2 - window.innerWidth / 2,
              y: r.top - headerY + r.height / 2 - window.innerHeight / 2,
              scale: r.width / b.offsetWidth,
            };
          };
          const depth = isDesk ? 1 : 0.35;

          const tl = gsap.timeline({
            defaults: { ease: 'none' },
            scrollTrigger: {
              trigger: section.current,
              start: 'top top',
              end: () => `+=${window.innerHeight * 1.3}`,
              pin: true,
              scrub: isDesk ? 0.9 : 0.5,
              anticipatePin: 1,
              invalidateOnRefresh: true,
              onUpdate: (self) => {
                heroState.progress = self.progress;
                b.classList.toggle('is-docked', self.progress > 0.97);
              },
            },
          });

          // Scroll cue wipes away (text stays fully opaque); visibility flips only at the very end.
          tl.fromTo('.hero__scroll', { clipPath: 'inset(0% 0% 0% 0%)' }, { clipPath: 'inset(100% 0% 0% 0%)', y: -24, duration: 0.2 }, 0)
            .to('.hero__scroll', { autoAlpha: 0, duration: 0.005 }, 0.2)
            .to(b, { '--fx': 0, duration: 0.3 }, 0)
            // 1. The mark turns in space and its layers separate.
            .to(q('.brand__orbit'), { rotationY: -16 * depth, rotationX: 9 * depth, duration: 0.24, ease: 'power1.out' }, 0)
            .to(q('.brand__layer--tag'), { z: 190 * depth, duration: 0.24, ease: 'power1.out' }, 0)
            .to(q('.brand__layer--mark'), { z: 80 * depth, duration: 0.24, ease: 'power1.out' }, 0)
            .to(q('.brand__layer--word'), { z: -50 * depth, duration: 0.24, ease: 'power1.out' }, 0)
            .to(b, { scale: isDesk ? 1.06 : 1, duration: 0.24, ease: 'power1.out' }, 0)
            // 2. It recombines while gliding into the header.
            .to(q('.brand__orbit'), { rotationY: 0, rotationX: 0, duration: 0.5, ease: 'power2.inOut' }, 0.26)
            .to(q('.brand__layer'), { z: 0, duration: 0.45, ease: 'power2.inOut' }, 0.26)
            .to(
              b,
              {
                x: () => target().x,
                y: () => target().y,
                scale: () => target().scale,
                duration: 0.66,
                ease: 'power3.inOut',
              },
              0.26,
            )
            // Tagline rises through a mask: never partially transparent.
            .fromTo('.hero__tagline', { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.005 }, 0.62)
            .fromTo(
              '.hero__tagline',
              { clipPath: 'inset(100% 0% 0% 0%)', y: 70, rotationX: -40 },
              { clipPath: 'inset(-20% -5% -20% -5%)', y: 0, rotationX: 0, duration: 0.3, ease: 'power2.out' },
              0.62,
            );
          if (header) {
            // Header slides in; its visibility flips in a near-instant window (no half-transparent controls).
            tl.fromTo(header, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.01 }, 0.8).fromTo(
              header,
              { y: -24 },
              { y: 0, duration: 0.12, ease: 'power2.out' },
              0.8,
            );
          }

          /* ---------------- Exit: the stage dissolves into the next scene ---------------- */
          const pin = tl.scrollTrigger!;
          gsap
            .timeline({
              defaults: { ease: 'none' },
              scrollTrigger: {
                start: () => pin.end,
                end: () => pin.end + window.innerHeight * 0.95,
                scrub: true,
                invalidateOnRefresh: true,
                onUpdate: (self) => (heroState.exit = self.progress),
              },
            })
            .to('.hero__tagline-wrap', { yPercent: -80 }, 0)
            .to('.hero__bg, .hero__floor', { autoAlpha: 0 }, 0)
            .to('.hero__gl', { autoAlpha: 0 }, 0.2);

          /* ---------------- Pointer: tilt, key light, cast shadow, layer parallax ---------------- */
          if (isFinePointer()) {
            const hero = section.current!;
            const to = (el: Element | null, prop: string, d = 0.9) =>
              gsap.quickTo(el, prop, { duration: d, ease: 'power3.out' });
            const tilt = q('.brand__tilt')[0];
            const rx = to(tilt, 'rotationX');
            const ry = to(tilt, 'rotationY');
            const shX = to(q('.brand__shadow')[0], 'x', 1.2);
            const shY = to(q('.brand__shadow')[0], 'y', 1.2);
            const layers = [
              { el: q('.brand__layer--tag')[0], k: 16 },
              { el: q('.brand__layer--mark')[0], k: 6 },
              { el: q('.brand__layer--word')[0], k: -4 },
            ].map(({ el, k }) => ({ x: to(el, 'x', 1.1), y: to(el, 'y', 1.1), k }));

            const onMove = (e: PointerEvent) => {
              const nx = e.clientX / window.innerWidth - 0.5;
              const ny = e.clientY / window.innerHeight - 0.5;
              heroState.pointerX = nx;
              heroState.pointerY = ny;
              const k = Math.max(0, 1 - heroState.progress * 4);
              rx(-ny * 14 * k);
              ry(nx * 20 * k);
              // The light follows the cursor; the shadow falls away from it.
              shX(-nx * 60 * k);
              shY(-ny * 30 * k);
              layers.forEach((l) => {
                l.x(nx * l.k * k);
                l.y(ny * l.k * 0.6 * k);
              });
              hero.style.setProperty('--lx', `${50 + nx * 70}%`);
              hero.style.setProperty('--ly', `${46 + ny * 50}%`);
              b.style.setProperty('--sheen-x', `${50 + nx * 60}%`);
            };
            window.addEventListener('pointermove', onMove, { passive: true });
            return () => window.removeEventListener('pointermove', onMove);
          }
        },
      );
    });
    return () => ctx.revert();
  }, []);

  return (
    <>
      <section id="top" className="hero" ref={section} aria-label="Webcore Solutions">
        <div className="hero__bg" aria-hidden="true">
          <span className="hero__aura hero__aura--a" />
          <span className="hero__aura hero__aura--b" />
          <span className="hero__aura hero__aura--c" />
          <span className="hero__light" />
        </div>
        <div className="hero__floor" aria-hidden="true">
          <i />
        </div>
        <div className={`hero__canvas ${sceneReady ? 'is-ready' : ''}`} aria-hidden="true">
          {idle && (
            <Suspense fallback={null}>
              <HeroScene
                active={active}
                reduced={reduced}
                mobile={mobile}
                onReady={() => setSceneReady(true)}
              />
            </Suspense>
          )}
        </div>
        <span className="hero__beam" aria-hidden="true" />

        <h1 className="sr-only">Webcore Solutions: digital technology and creative solutions</h1>
        <img
          className="hero__static-logo"
          src="/brand/logo-800.webp"
          srcSet="/brand/logo-800.webp 800w, /logo.webp 2490w"
          sizes="84vw"
          alt=""
          width={2490}
          height={610}
        />

        <div className="hero__frame">
          <a className="hero__scroll" href="#intro" onClick={onAnchorClick}>
            <span className="mono">Scroll to explore</span>
            <span className="hero__scroll-track">
              <span className="hero__scroll-dot" />
            </span>
          </a>
        </div>
        <div className="hero__tagline-wrap" aria-hidden="true">
          <p className="hero__tagline">
            Engineering <em>digital presence</em> for ambitious brands.
          </p>
        </div>
      </section>

      {/* The brand mark: huge in the hero, docks into the header on scroll. */}
      <a
        className="brand"
        href="#top"
        ref={brand}
        onClick={onAnchorClick}
        aria-label="Webcore Solutions, back to top"
      >
        <span className="brand__orbit">
          <span className="brand__tilt">
            <img className="brand__shadow" src="/brand/logo-800.webp" alt="" aria-hidden="true" width={800} height={196} {...{ fetchpriority: "high" }} />
            <span className="brand__stack">
              <span className="brand__layer brand__layer--word" aria-hidden="true">
                <img
                  data-src="/brand/logo-word.webp"
                  data-srcset="/brand/logo-word-763.webp 763w, /brand/logo-word.webp 1525w"
                  sizes="(max-width: 767px) 52vw, min(47vw, 650px)"
                  width={1525}
                  height={610}
                  alt=""
                  draggable={false}
                />
              </span>
              <span className="brand__layer brand__layer--mark" aria-hidden="true">
                <img
                  data-src="/brand/logo-mark.webp"
                  data-srcset="/brand/logo-mark-483.webp 483w, /brand/logo-mark.webp 965w"
                  sizes="(max-width: 767px) 33vw, min(30vw, 411px)"
                  width={965}
                  height={610}
                  alt=""
                  draggable={false}
                />
              </span>
              <span className="brand__layer brand__layer--tag" aria-hidden="true">
                <img
                  data-src="/brand/logo-tag.webp"
                  data-srcset="/brand/logo-tag-203.webp 203w, /brand/logo-tag.webp 406w"
                  sizes="(max-width: 767px) 14vw, min(13vw, 173px)"
                  width={406}
                  height={189}
                  alt=""
                  draggable={false}
                />
              </span>
              <span className="brand__sheen" aria-hidden="true" />
            </span>
          </span>
        </span>
        <img className="brand__reflection" src="/brand/logo-800.webp" alt="" aria-hidden="true" width={800} height={196} />
        <span className="brand__floor" aria-hidden="true" />
      </a>
    </>
  );
}
