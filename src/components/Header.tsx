import { useRef } from 'react';
import { useIsoLayoutEffect } from '../lib/useMedia';
import { onAnchorClick, onPageLinkClick, ScrollTrigger } from '../lib/motion';
import { WEBSITE } from '../data/company';

type Props = { page?: 'home' | 'contact' };

export default function Header({ page = 'home' }: Props) {
  const isHome = page === 'home';
  const progress = useRef<HTMLSpanElement>(null);

  // Hairline reading-progress indicator inside the bar.
  useIsoLayoutEffect(() => {
    const el = progress.current;
    if (!el) return;
    const st = ScrollTrigger.create({
      start: 0,
      end: 'max',
      onUpdate: (self) => {
        el.style.transform = `scaleX(${self.progress.toFixed(4)})`;
      },
    });
    return () => st.kill();
  }, []);

  return (
    <header className={`site-header ${isHome ? '' : 'site-header--page'}`}>
      <div className="site-header__bar">
        <a
          href={isHome ? '#top' : '/'}
          className="site-header__slot"
          data-brand-slot={isHome ? '' : undefined}
          onClick={isHome ? onAnchorClick : onPageLinkClick}
          tabIndex={isHome ? -1 : 0}
          aria-label="Webcore Solutions home"
        >
          {/* On the home page the animated brand mark docks here; elsewhere (and with reduced motion) this static logo shows. */}
          <img
            className="site-header__logo-static"
            src="/brand/logo-400.webp"
            srcSet="/brand/logo-400.webp 400w, /brand/logo-800.webp 800w"
            sizes="156px"
            alt="Webcore Solutions"
            width={800}
            height={196}
            loading="lazy"
            decoding="async"
          />
        </a>

        <div className="site-header__actions">
          <a
            className="btn btn--outline btn--sm header-visit"
            href={WEBSITE}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Visit our website, webcoreuae.com (opens in a new tab)"
          >
            <svg className="header-visit__globe" viewBox="0 0 24 24" width="17" height="17" aria-hidden="true">
              <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.6" />
              <path d="M3 12h18M12 3c2.6 2.6 3.9 5.6 3.9 9s-1.3 6.4-3.9 9c-2.6-2.6-3.9-5.6-3.9-9S9.4 5.6 12 3Z" fill="none" stroke="currentColor" strokeWidth="1.6" />
            </svg>
            <span className="header-visit__long">Visit Our Website</span>
            <span className="header-visit__short">Website</span>
            <svg className="header-visit__arrow" viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
              <path d="M7 17 17 7M9 7h8v8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
          <a
            className="btn btn--primary btn--sm header-contact"
            href={isHome ? '/contact/' : '#contact-form'}
            onClick={isHome ? onPageLinkClick : onAnchorClick}
            aria-current={isHome ? undefined : 'page'}
          >
            Contact
            <span className="header-contact__dot" aria-hidden="true" />
          </a>
        </div>
        <span className="site-header__progress" aria-hidden="true">
          <i ref={progress} />
        </span>
      </div>
    </header>
  );
}
