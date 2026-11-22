import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import ContactForm from '../components/ContactForm';
import { EMAIL, HQ, offices, WHATSAPP } from '../data/company';
import { services } from '../data/services';
import { gsap, MQ, onAnchorClick, splitWords } from '../lib/motion';
import { useIdle, useMedia, useMounted, useZoneTimes, useIsoLayoutEffect } from '../lib/useMedia';

const ContactGlobe = lazy(() => import('../components/ContactGlobe'));

const steps = [
  { title: 'We review your brief', text: 'Our team reads every enquiry and comes back with any questions we need answered.' },
  { title: 'Discovery call', text: 'A focused conversation about your goals, audience, timeline and what success looks like.' },
  { title: 'Proposal & roadmap', text: 'A clear scope, approach and plan, so you know exactly what we will build and how.' },
];

const faqs = [
  {
    q: 'What happens after I send my brief?',
    a: 'We read every enquiry, come back with any questions we have, and suggest a short discovery call to understand your goals. From there we prepare a clear proposal and roadmap.',
  },
  {
    q: 'Do you work with clients outside the UAE?',
    a: 'Yes. With teams across the UAE, the United Kingdom and Pakistan, we work with businesses locally and internationally and are used to collaborating across time zones.',
  },
  {
    q: 'Can you improve my existing website instead of rebuilding it?',
    a: 'Often, yes. We can review your current platform, including its performance, design and SEO, and recommend whether targeted improvements or a rebuild will give you the better result.',
  },
  {
    q: 'What should I prepare before we talk?',
    a: 'Nothing formal. A few lines about your goals, a couple of websites you like, your ideal timeline and a rough budget range help us give you useful advice faster.',
  },
  {
    q: 'Which services can I enquire about?',
    a: `Any of our core services: ${services.map((s) => s.name).join(', ')}.`,
  },
];

const ArrowUpRight = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
    <path d="M7 17 17 7M9 7h8v8" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ArrowDown = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
    <path d="M12 5v14M6 13l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export default function ContactPage() {
  const root = useRef<HTMLElement>(null);
  const reduced = useMedia('(prefers-reduced-motion: reduce)');
  const mobile = useMedia('(max-width: 767px)');
  const times = useZoneTimes(offices.map((o) => o.timeZone));
  const mounted = useMounted();
  const idle = useIdle();
  const [copied, setCopied] = useState(false);
  const [openFaq, setOpenFaq] = useState(0);
  const bento = useRef<HTMLDivElement>(null);
  const hqIndex = offices.findIndex((o) => o.hq);
  const hq = offices[hqIndex];

  // Cursor spotlight on bento cards (writes CSS vars only).
  useEffect(() => {
    const grid = bento.current;
    if (!grid || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    const move = (e: PointerEvent) => {
      const card = (e.target as HTMLElement).closest<HTMLElement>('.c-card');
      if (!card) return;
      const r = card.getBoundingClientRect();
      card.style.setProperty('--mx', `${e.clientX - r.left}px`);
      card.style.setProperty('--my', `${e.clientY - r.top}px`);
    };
    grid.addEventListener('pointermove', move);
    return () => grid.removeEventListener('pointermove', move);
  }, []);

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(EMAIL);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      window.location.href = `mailto:${EMAIL}`;
    }
  };

  useIsoLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();
      mm.add({ desktop: MQ.desktop, mobile: MQ.mobile }, () => {
        // Opening (above the fold): time-based, plays once.
        const words = splitWords(root.current!.querySelector<HTMLElement>('.c-hero__title')!);
        gsap
          .timeline({ delay: 0.35, defaults: { ease: 'expo.out' } })
          .fromTo(words, { yPercent: 115, rotationX: -60 }, { yPercent: 0, rotationX: 0, duration: 1.4, stagger: 0.07 })
          .from('.c-hero__label, .c-hero__actions', { autoAlpha: 0, y: 30, duration: 1.2, stagger: 0.1 }, 0.4)
          // Readable content is visible from the first frame (fast first paint); it still rises into place.
          .from('.c-hero__lead, .c-hero__quick', { y: 30, duration: 1.2, stagger: 0.1 }, 0.5)
          .from('.c-hero__globe', { autoAlpha: 0, scale: 0.86, duration: 2, ease: 'power3.out' }, 0.2);

        // Globe drifts back as you scroll away.
        gsap.to('.c-hero__globe', {
          yPercent: 18,
          scale: 0.9,
          ease: 'none',
          scrollTrigger: { trigger: '.c-hero', start: 'top top', end: 'bottom top', scrub: true },
        });

        // Below the fold: everything is scrubbed to scroll and reverses on the way up.
        gsap.utils.toArray<HTMLElement>('.c-split').forEach((el) => {
          gsap.fromTo(
            splitWords(el),
            { yPercent: 110 },
            {
              yPercent: 0,
              stagger: 0.06,
              ease: 'power3.out',
              scrollTrigger: { trigger: el, start: 'top 90%', end: 'top 55%', scrub: 0.6 },
            },
          );
        });
        gsap.fromTo(
          '.c-card',
          { y: 70, rotationX: 14, transformPerspective: 1400, transformOrigin: '50% 100%' },
          {
            y: 0,
            rotationX: 0,
            stagger: 0.08,
            ease: 'power2.out',
            scrollTrigger: { trigger: '.c-bento', start: 'top 90%', end: 'top 35%', scrub: 0.6 },
          },
        );
        gsap.utils.toArray<HTMLElement>('[data-reveal-group]').forEach((group) => {
          gsap.from(group.querySelectorAll('[data-reveal]'), {
            y: 54,
            stagger: 0.08,
            ease: 'power2.out',
            scrollTrigger: { trigger: group, start: 'top 88%', end: 'top 50%', scrub: 0.6 },
          });
        });
        gsap.fromTo(
          '.c-process__line i',
          { scaleY: 0 },
          {
            scaleY: 1,
            ease: 'none',
            scrollTrigger: { trigger: '.c-process__steps', start: 'top 80%', end: 'bottom 55%', scrub: true },
          },
        );
        gsap.fromTo(
          '.c-final__panel',
          { clipPath: 'inset(10% 8% 10% 8% round 48px)' },
          {
            clipPath: 'inset(0% 0% 0% 0% round 36px)',
            ease: 'power2.out',
            scrollTrigger: { trigger: '.c-final', start: 'top 92%', end: 'top 40%', scrub: 0.6 },
          },
        );
      });
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <main id="main" ref={root} className="contact-page">
      {/* 1 — Hero */}
      <section className="c-hero" id="top" aria-labelledby="c-title">
        <div className="c-hero__bg" aria-hidden="true" />
        <div className="container c-hero__grid">
          <div className="c-hero__copy">
            <div className="section-label section-label--light c-hero__label">
              <span className="mono">(Contact)</span>
              <span>Start a project</span>
            </div>
            <h1 className="c-hero__title display" id="c-title">
              Let&rsquo;s Start a <em>Conversation.</em>
            </h1>
            <p className="c-hero__lead">
              Launching something new, rebuilding an existing platform or looking for a long-term
              technology partner? Tell us where you want to go, and we&rsquo;ll help you get there.
            </p>
            <div className="c-hero__actions">
              <a className="btn btn--light btn--lg" href="#contact-form" onClick={onAnchorClick}>
                Write to Us
                <ArrowDown />
              </a>
              <a className="btn btn--ghost-light btn--lg" href={WHATSAPP} target="_blank" rel="noopener noreferrer">
                Chat on WhatsApp ↗
              </a>
            </div>
            <dl className="c-hero__quick">
              <div>
                <dt className="mono">Email</dt>
                <dd>
                  <a href={`mailto:${EMAIL}`}>{EMAIL}</a>
                </dd>
              </div>
              <div>
                <dt className="mono">Headquarters</dt>
                <dd>{HQ}</dd>
              </div>
            </dl>
          </div>

          <div className="c-hero__globe">
            {/* Browser-only WebGL, mounted once the page is idle so it never delays first paint. */}
            {mounted && idle ? (
              <Suspense fallback={<div className="globe" />}>
                <ContactGlobe reduced={reduced} mobile={mobile} />
              </Suspense>
            ) : (
              <div className="globe" />
            )}
          </div>
        </div>
        <a className="c-hero__scroll mono" href="#offices" onClick={onAnchorClick}>
          Our offices <ArrowDown />
        </a>
      </section>

      {/* 2 — Where we are: offices + channels */}
      <section className="c-reach" id="offices" aria-labelledby="offices-title">
        <div className="container">
          <div className="c-head">
            <div className="section-label">
              <span className="mono">(01)</span>
              <span>Where we are</span>
            </div>
            <h2 className="c-split display" id="offices-title">
              Three regions. <em>One team.</em>
            </h2>
          </div>
          <p className="c-lede">
            Talk to the office closest to you, or reach the whole team by email or WhatsApp.
          </p>

          <div className="c-bento" ref={bento}>
            <article className="c-card c-card--hq">
              <span className="c-card__spot" aria-hidden="true" />
              <div className="c-card__map" aria-hidden="true" />
              <span className="c-beacon" aria-hidden="true">
                <i />
                <i />
                <i />
              </span>
              <div className="c-card__top">
                <span className="c-badge">Headquarters</span>
                <span className="mono c-card__coords">25.20° N · 55.27° E</span>
              </div>
              <div className="c-card__main">
                <h3 className="c-card__city">{hq.region}</h3>
                <p className="c-card__country">United Arab Emirates</p>
              </div>
              <div className="c-card__foot">
                <div className="c-clock">
                  <span className="mono">Local time</span>
                  <strong>{times[hqIndex].time}</strong>
                  <span className="mono">{times[hqIndex].zone}</span>
                </div>
                <a className="btn btn--light btn--lg c-card__call" href={`tel:${hq.tel}`}>
                  Call {hq.display}
                  <ArrowUpRight />
                </a>
              </div>
            </article>

            {offices.map((o, i) =>
              o.hq ? null : (
                <article className="c-card c-card--office" key={o.region}>
                  <span className="c-card__spot" aria-hidden="true" />
                  <div className="c-card__top">
                    <span className="mono c-card__eyebrow">Office</span>
                    <span className="c-chip-time mono">
                      <i aria-hidden="true" />
                      {times[i].time}
                      <em>{times[i].zone}</em>
                    </span>
                  </div>
                  <h3 className="c-card__city c-card__city--sm">{o.region}</h3>
                  <a className="c-card__line" href={`tel:${o.tel}`}>
                    <span>
                      <small className="mono">Call</small>
                      {o.display}
                    </span>
                    <span className="c-card__arrow">
                      <ArrowUpRight />
                    </span>
                  </a>
                </article>
              ),
            )}

            <article className="c-card c-card--channel">
              <span className="c-card__spot" aria-hidden="true" />
              <div className="c-card__top">
                <span className="c-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="22" height="22">
                    <rect x="3" y="5" width="18" height="14" rx="3" fill="none" stroke="currentColor" strokeWidth="1.6" />
                    <path d="m4 7 8 6 8-6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
                  </svg>
                </span>
                <button type="button" className="c-mini-btn" onClick={copyEmail}>
                  {copied ? 'Copied ✓' : 'Copy'}
                </button>
              </div>
              <h3 className="c-card__city c-card__city--sm">Email</h3>
              <a className="c-card__line" href={`mailto:${EMAIL}`}>
                <span>
                  <small className="mono">Write to</small>
                  {EMAIL}
                </span>
                <span className="c-card__arrow">
                  <ArrowUpRight />
                </span>
              </a>
            </article>

            <article className="c-card c-card--channel">
              <span className="c-card__spot" aria-hidden="true" />
              <div className="c-card__top">
                <span className="c-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="22" height="22">
                    <path
                      d="M12.04 3a8.94 8.94 0 0 0-7.7 13.5L3 21l4.62-1.3A8.95 8.95 0 1 0 12.04 3Zm0 16.3a7.33 7.33 0 0 1-3.74-1.02l-.27-.16-2.74.77.78-2.67-.18-.28a7.35 7.35 0 1 1 6.15 3.36Z"
                      fill="currentColor"
                    />
                  </svg>
                </span>
                <span className="mono c-card__eyebrow">Instant messaging</span>
              </div>
              <h3 className="c-card__city c-card__city--sm">WhatsApp</h3>
              <a className="c-card__line" href={WHATSAPP} target="_blank" rel="noopener noreferrer">
                <span>
                  <small className="mono">Chat with us</small>
                  +44 7570 792516
                </span>
                <span className="c-card__arrow">
                  <ArrowUpRight />
                </span>
              </a>
            </article>
          </div>
        </div>
      </section>

      {/* 3 — Brief */}
      <section className="c-brief" id="contact-form" aria-labelledby="brief-title">
        <div className="container">
          <div className="c-head">
            <div className="section-label">
              <span className="mono">(02)</span>
              <span>Your project</span>
            </div>
            <h2 className="c-split display" id="brief-title">
              Tell us about <em>your idea.</em>
            </h2>
          </div>
          <p className="c-lede">Share as much or as little as you like. A few lines about your goals is a great start.</p>

          <div className="c-brief__grid">
            <aside className="c-process" data-reveal-group>
              <div className="c-process__glow" aria-hidden="true" />
              <span className="mono c-process__kicker" data-reveal>
                How it works
              </span>
              <h3 className="c-process__title" data-reveal>
                From first message to a <em>clear plan.</em>
              </h3>
              <div className="c-process__steps">
                <span className="c-process__line" aria-hidden="true">
                  <i />
                </span>
                <ol>
                  {steps.map((st, i) => (
                    <li key={st.title} data-reveal>
                      <span className="c-process__num">{String(i + 1).padStart(2, '0')}</span>
                      <div>
                        <h4>{st.title}</h4>
                        <p>{st.text}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
              <div className="c-process__talk" data-reveal>
                <span className="mono">Prefer to talk?</span>
                <a href={`tel:${hq.tel}`}>
                  Dubai HQ · {hq.display}
                  <ArrowUpRight />
                </a>
                <a href={WHATSAPP} target="_blank" rel="noopener noreferrer">
                  Message us on WhatsApp
                  <ArrowUpRight />
                </a>
              </div>
            </aside>

            <div className="c-brief__form" data-reveal-group>
              <div data-reveal>
                <ContactForm />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4 — FAQ */}
      <section className="c-faq" aria-labelledby="faq-title">
        <div className="container c-faq__grid">
          <div className="c-faq__head">
            <div className="section-label">
              <span className="mono">(03)</span>
              <span>Good to know</span>
            </div>
            <h2 className="c-split display" id="faq-title">
              Questions, <em>answered.</em>
            </h2>
            <p className="c-lede">
              Something else on your mind? <a href={`mailto:${EMAIL}`}>Email us</a> and we&rsquo;ll
              get back to you.
            </p>
          </div>
          <div className="c-faq__list" data-reveal-group>
            {faqs.map((f, i) => {
              const open = openFaq === i;
              return (
                <div className={`c-faq__item ${open ? 'is-open' : ''}`} key={f.q} data-reveal>
                  <h3>
                    <button
                      type="button"
                      id={`faq-q-${i}`}
                      aria-expanded={open}
                      aria-controls={`faq-a-${i}`}
                      onClick={() => setOpenFaq(open ? -1 : i)}
                    >
                      <span className="c-faq__n mono">{String(i + 1).padStart(2, '0')}</span>
                      <span className="c-faq__q">{f.q}</span>
                      <span className="c-faq__icon" aria-hidden="true" />
                    </button>
                  </h3>
                  <div className="c-faq__panel" id={`faq-a-${i}`} role="region" aria-labelledby={`faq-q-${i}`}>
                    <div>
                      <p>{f.a}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 5 — Sign-off */}
      <section className="c-final" aria-labelledby="final-title">
        <div className="container">
          <div className="c-final__panel">
            <div className="c-final__bg" aria-hidden="true" />
            <span className="mono c-final__kicker">(04) Ready when you are</span>
            <h2 className="c-final__title display" id="final-title">
              Let&rsquo;s build <em>what&rsquo;s next.</em>
            </h2>
            <a className="c-final__email" href={`mailto:${EMAIL}`}>
              {EMAIL}
            </a>
            <div className="c-final__actions">
              <button type="button" className="btn btn--light btn--lg" onClick={copyEmail}>
                {copied ? 'Copied to clipboard ✓' : 'Copy email address'}
              </button>
              <a className="btn btn--ghost-light btn--lg" href={WHATSAPP} target="_blank" rel="noopener noreferrer">
                Chat on WhatsApp ↗
              </a>
            </div>
            <span className="sr-only" role="status" aria-live="polite">
              {copied ? 'Email address copied' : ''}
            </span>
          </div>
        </div>
      </section>
    </main>
  );
}
