import { useEffect, useRef, useState } from 'react';
import { useZoneTimes, useIsoLayoutEffect } from '../lib/useMedia';
import { EMAIL, HQ, offices, socials, WEBSITE, WHATSAPP } from '../data/company';
import { services } from '../data/services';
import {
  gsap,
  isFinePointer,
  isMotionPaused,
  MOTION_EVENT,
  MQ,
  onAnchorClick,
  onPageLinkClick,
  prefersReducedMotion,
  ScrollTrigger,
  setMotionPaused,
} from '../lib/motion';

type Props = { page?: 'home' | 'contact' };

const ArrowUpRight = ({ size = 16 }: { size?: number }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
    <path d="M7 17 17 7M9 7h8v8" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export default function Footer({ page = 'home' }: Props) {
  const isHome = page === 'home';
  const root = useRef<HTMLElement>(null);
  const badge = useRef<HTMLDivElement>(null);
  const ring = useRef<SVGCircleElement>(null);
  const times = useZoneTimes(offices.map((o) => o.timeZone), 20000);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    setPaused(isMotionPaused());
    const on = (e: Event) => setPaused((e as CustomEvent<boolean>).detail);
    window.addEventListener(MOTION_EVENT, on);
    return () => window.removeEventListener(MOTION_EVENT, on);
  }, []);

  // On the home page sections are in-page anchors; from other pages they link home.
  const sectionLink = (hash: string) => ({
    href: isHome ? hash : `/${hash}`,
    onClick: isHome ? onAnchorClick : onPageLinkClick,
  });
  const contactLink = isHome
    ? { href: '/contact/', onClick: onPageLinkClick }
    : { href: '#contact-form', onClick: onAnchorClick };
  const badgeLink = isHome ? contactLink : sectionLink('#work');
  const badgeText = isHome ? 'Start a project · Start a project · ' : 'Explore our work · Explore our work · ';

  useIsoLayoutEffect(() => {
    const ctx = gsap.context(() => {
      // Back-to-top ring mirrors overall page progress.
      const circle = ring.current;
      if (circle) {
        const len = 2 * Math.PI * 21;
        circle.style.strokeDasharray = String(len);
        circle.style.strokeDashoffset = String(len);
        ScrollTrigger.create({
          start: 0,
          end: 'max',
          onUpdate: (self) => (circle.style.strokeDashoffset = String(len * (1 - self.progress))),
        });
      }

      const mm = gsap.matchMedia();
      mm.add({ desktop: MQ.desktop, mobile: MQ.mobile }, () => {
        gsap.fromTo(
          '.footer__signature span',
          { backgroundSize: '0% 100%' },
          {
            backgroundSize: '100% 100%',
            ease: 'none',
            // Completes exactly at the bottom of the page.
            scrollTrigger: { trigger: '.footer__signature', start: 'top bottom', end: 'max', scrub: true },
          },
        );
        gsap.from('.footer__hero > *', {
          y: 50,
          stagger: 0.1,
          ease: 'power2.out',
          scrollTrigger: { trigger: '.footer__hero', start: 'top 92%', end: 'top 60%', scrub: 0.6 },
        });
        gsap.from('.footer__col', {
          y: 40,
          stagger: 0.06,
          ease: 'power2.out',
          scrollTrigger: { trigger: '.footer__grid', start: 'top 95%', end: 'top 70%', scrub: 0.6 },
        });
        gsap.fromTo(
          '.footer__badge',
          { rotation: -40, scale: 0.7 },
          {
            rotation: 0,
            scale: 1,
            ease: 'power2.out',
            scrollTrigger: { trigger: '.footer__hero', start: 'top 95%', end: 'top 55%', scrub: 0.6 },
          },
        );
      });
    }, root);

    // Magnetic badge (desktop pointer only).
    const el = badge.current;
    let cleanup = () => {};
    if (el && isFinePointer() && !prefersReducedMotion()) {
      const core = el.querySelector('.footer__badge-core');
      const x = gsap.quickTo(core, 'x', { duration: 0.6, ease: 'power3.out' });
      const y = gsap.quickTo(core, 'y', { duration: 0.6, ease: 'power3.out' });
      const move = (e: PointerEvent) => {
        const r = el.getBoundingClientRect();
        x((e.clientX - (r.left + r.width / 2)) * 0.3);
        y((e.clientY - (r.top + r.height / 2)) * 0.3);
      };
      const leave = () => {
        x(0);
        y(0);
      };
      el.addEventListener('pointermove', move);
      el.addEventListener('pointerleave', leave);
      cleanup = () => {
        el.removeEventListener('pointermove', move);
        el.removeEventListener('pointerleave', leave);
      };
    }
    return () => {
      cleanup();
      ctx.revert();
    };
  }, []);

  const ticker = services.map((s) => s.name);

  return (
    <footer className="footer" ref={root}>
      <div className="footer__bg" aria-hidden="true" />

      {/* Services ticker */}
      <div className="footer__ticker" aria-hidden="true">
        <div className="footer__ticker-track">
          {[0, 1].map((k) => (
            <div className="footer__ticker-group" key={k}>
              {ticker.map((t) => (
                <span key={t}>
                  {t}
                  <i>✦</i>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="container">
        <div className="footer__hero">
          <div className="footer__intro">
            <a
              {...(isHome ? { href: '#top', onClick: onAnchorClick } : { href: '/', onClick: onPageLinkClick })}
              className="footer__logo"
              aria-label="Webcore Solutions home"
            >
              <img
                src="/brand/logo-400.webp"
                srcSet="/brand/logo-400.webp 400w, /brand/logo-800.webp 800w"
                sizes="(max-width: 767px) 220px, 340px"
                alt="Webcore Solutions"
                width={800}
                height={196}
                loading="lazy"
                decoding="async"
              />
            </a>
            <p className="footer__statement">
              Digital technology &amp; creative solutions, helping businesses <em>establish</em>,{' '}
              <em>grow</em> and <em>scale</em> their digital presence since 2012.
            </p>
            <div className="footer__actions">
              <a className="btn btn--outline btn--lg" href={WEBSITE} target="_blank" rel="noopener noreferrer">
                Visit Our Website
                <ArrowUpRight />
              </a>
            </div>
          </div>

          {/* The rotating ring text is decorative and sits outside the link; the link is the
              whole circle with a clear accessible name. */}
          <div className="footer__badge" ref={badge}>
            <svg className="footer__badge-ring" viewBox="0 0 200 200" aria-hidden="true">
              <defs>
                <path id="footer-badge-path" d="M100,100 m-74,0 a74,74 0 1,1 148,0 a74,74 0 1,1 -148,0" />
              </defs>
              <text textLength="462" lengthAdjust="spacing">
                <textPath href="#footer-badge-path" startOffset="0">
                  {badgeText}
                </textPath>
              </text>
            </svg>
            <a className="footer__badge-link" {...badgeLink}>
              <span className="sr-only">{isHome ? 'Start a project' : 'Explore our work'}</span>
              <span className="footer__badge-core" aria-hidden="true">
                <ArrowUpRight size={30} />
              </span>
            </a>
          </div>
        </div>

        <div className="footer__grid">
          <nav className="footer__col" aria-label="Footer">
            <span className="footer__label mono">Explore</span>
            {[
              ['Studio', sectionLink('#intro')],
              ['Projects', sectionLink('#work')],
              ['Services', sectionLink('#services')],
              ['Contact', contactLink],
            ].map(([label, link]) => (
              <a key={label as string} {...(link as object)} className="footer__nav-link">
                <span>{label as string}</span>
                <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true">
                  <path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </a>
            ))}
          </nav>

          <div className="footer__col">
            <span className="footer__label mono">Offices</span>
            {offices.map((o, i) => (
              <a key={o.region} href={`tel:${o.tel}`} className="footer__office">
                <span className="footer__office-row">
                  <strong>
                    {o.region}
                    {o.hq && <em className="footer__hq">HQ</em>}
                  </strong>
                  <span className="footer__time mono">
                    <i aria-hidden="true" />
                    <span className="sr-only">Local time </span>
                    {times[i].time}
                  </span>
                </span>
                <span className="footer__phone">{o.display}</span>
              </a>
            ))}
          </div>

          <div className="footer__col">
            <span className="footer__label mono">Get in touch</span>
            <a href={`mailto:${EMAIL}`} className="footer__contact footer__contact--email">
              <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                <rect x="3" y="5" width="18" height="14" rx="3" fill="none" stroke="currentColor" strokeWidth="1.6" />
                <path d="m4 7 8 6 8-6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
              </svg>
              {EMAIL}
            </a>
            <a href={WHATSAPP} target="_blank" rel="noopener noreferrer" className="footer__contact">
              <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                <path d={socials.find((s) => s.label === 'WhatsApp')!.path} fill="currentColor" />
              </svg>
              Chat on WhatsApp
            </a>
            <span className="footer__contact footer__muted">
              <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                <path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21Z" fill="none" stroke="currentColor" strokeWidth="1.6" />
                <circle cx="12" cy="9.5" r="2.4" fill="none" stroke="currentColor" strokeWidth="1.6" />
              </svg>
              {HQ}
            </span>
          </div>

          <div className="footer__col">
            <span className="footer__label mono">Follow</span>
            <div className="socials">
              {socials.map((s) => (
                <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" aria-label={`${s.label} (opens in a new tab)`}>
                  <svg viewBox="0 0 24 24" width="19" height="19" aria-hidden="true">
                    <path d={s.path} fill="currentColor" />
                  </svg>
                </a>
              ))}
            </div>
            <a href={WEBSITE} target="_blank" rel="noopener noreferrer" className="footer__site">
              webcoreuae.com ↗
            </a>
          </div>
        </div>
      </div>

      <p className="footer__signature" aria-hidden="true">
        <span>We build digital experiences.</span>
      </p>

      <div className="container">
        <div className="footer__bottom">
          <span suppressHydrationWarning>© {new Date().getFullYear()} Webcore Solutions. All rights reserved.</span>
          <span className="footer__bottom-mid mono">UAE · United Kingdom · Pakistan</span>
          <button
            type="button"
            className="footer__motion"
            aria-pressed={paused}
            onClick={() => setMotionPaused(!paused)}
          >
            <span className="footer__motion-icon" aria-hidden="true">
              {paused ? (
                <svg viewBox="0 0 24 24" width="14" height="14"><path d="M8 5v14l11-7z" fill="currentColor" /></svg>
              ) : (
                <svg viewBox="0 0 24 24" width="14" height="14"><path d="M7 5h4v14H7zM13 5h4v14h-4z" fill="currentColor" /></svg>
              )}
            </span>
            {paused ? 'Play animations' : 'Pause animations'}
          </button>
          <a href="#top" onClick={onAnchorClick} className="footer__up">
            Back to top
            <span className="footer__up-ring" aria-hidden="true">
              <svg viewBox="0 0 48 48">
                <circle className="footer__up-track" cx="24" cy="24" r="21" />
                <circle className="footer__up-progress" ref={ring} cx="24" cy="24" r="21" />
              </svg>
              <b>↑</b>
            </span>
          </a>
        </div>
      </div>
    </footer>
  );
}
