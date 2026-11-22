import { useRef } from 'react';
import { useIsoLayoutEffect } from '../lib/useMedia';
import { gsap, isFinePointer, MQ, onAnchorClick, onPageLinkClick, splitWords } from '../lib/motion';
import { EMAIL } from '../data/company';

/** Buttons drift slightly toward the cursor (desktop only). */
function useMagnetic(root: React.RefObject<HTMLElement>) {
  useIsoLayoutEffect(() => {
    if (!isFinePointer() || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const els = Array.from(root.current?.querySelectorAll<HTMLElement>('[data-magnetic]') ?? []);
    const cleanups = els.map((el) => {
      const x = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'power3.out' });
      const y = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'power3.out' });
      const move = (e: PointerEvent) => {
        const r = el.getBoundingClientRect();
        x((e.clientX - (r.left + r.width / 2)) * 0.25);
        y((e.clientY - (r.top + r.height / 2)) * 0.35);
      };
      const leave = () => {
        x(0);
        y(0);
      };
      el.addEventListener('pointermove', move);
      el.addEventListener('pointerleave', leave);
      return () => {
        el.removeEventListener('pointermove', move);
        el.removeEventListener('pointerleave', leave);
      };
    });
    return () => cleanups.forEach((c) => c());
  }, [root]);
}

export default function CTA() {
  const root = useRef<HTMLElement>(null);
  useMagnetic(root);

  useIsoLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();
      mm.add({ desktop: MQ.desktop, mobile: MQ.mobile }, (c) => {
        const isDesk = !!c.conditions?.desktop;
        gsap.fromTo(
          '.cta__card',
          { clipPath: isDesk ? 'inset(6% 7% 6% 7% round 48px)' : 'inset(3% 4% 3% 4% round 28px)' },
          {
            clipPath: 'inset(0% 0% 0% 0% round 0px)',
            ease: 'none',
            scrollTrigger: { trigger: root.current, start: 'top 85%', end: 'top 15%', scrub: 0.6 },
          },
        );
        // Floor travels toward the viewer (transform only: no repaint).
        gsap.fromTo(
          '.cta__floor i',
          { y: 0 },
          {
            y: 480,
            ease: 'none',
            scrollTrigger: { trigger: root.current, start: 'top bottom', end: 'bottom top', scrub: true },
          },
        );
        // Exit: the card lifts off as daylight (contact) arrives.
        gsap.fromTo(
          '.cta__card',
          { clipPath: 'inset(0% 0% 0% 0% round 0px 0px 0px 0px)' },
          {
            clipPath: isDesk
              ? 'inset(0% 3% 7% 3% round 0px 0px 48px 48px)'
              : 'inset(0% 2% 4% 2% round 0px 0px 28px 28px)',
            ease: 'none',
            immediateRender: false,
            scrollTrigger: { trigger: root.current, start: 'bottom 95%', end: 'bottom 35%', scrub: 0.6 },
          },
        );
        gsap.fromTo(
          '.cta__content',
          { y: 0 },
          {
            y: -80,
            ease: 'none',
            immediateRender: false,
            scrollTrigger: { trigger: root.current, start: 'bottom 80%', end: 'bottom 25%', scrub: true },
          },
        );
        const words = splitWords(root.current!.querySelector<HTMLElement>('.cta__title')!);
        gsap.fromTo(
          words,
          { yPercent: 115, rotationX: -50 },
          {
            yPercent: 0,
            rotationX: 0,
            stagger: 0.05,
            ease: 'power3.out',
            scrollTrigger: { trigger: '.cta__title', start: 'top 88%', end: 'top 45%', scrub: 0.6 },
          },
        );
        gsap.from('.cta__desc, .cta__actions, .cta__mail', {
          y: 44,
          stagger: 0.1,
          scrollTrigger: { trigger: '.cta__desc', start: 'top 92%', end: 'top 65%', scrub: 0.6 },
        });
      });
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <section className="cta" id="cta" ref={root} aria-labelledby="cta-title">
      <div className="cta__card">
        <div className="cta__floor" aria-hidden="true">
          <i />
        </div>
        <div className="cta__glow" aria-hidden="true" />
        <div className="container cta__content">
          <span className="mono cta__label">(04) — Start a project</span>
          <h2 className="cta__title display" id="cta-title">
            Have an Idea? <br />
            Let&rsquo;s Build Something <em>Extraordinary.</em>
          </h2>
          <p className="cta__desc">
            Whether you&rsquo;re launching a new business, transforming an existing platform or
            looking for a technology partner, we&rsquo;re ready to help.
          </p>
          <div className="cta__actions">
            <a href="#work" className="btn btn--ghost-light btn--lg" data-magnetic onClick={onAnchorClick}>
              Explore More Projects
            </a>
            <a href="/contact/" className="btn btn--light btn--lg" data-magnetic onClick={onPageLinkClick}>
              Book a Consultation
              <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                <path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
          </div>
          <p className="cta__mail">
            or write to us at <a href={`mailto:${EMAIL}`}>{EMAIL}</a>
          </p>
        </div>
      </div>
    </section>
  );
}
