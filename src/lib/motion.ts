import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger);

export { gsap, ScrollTrigger };

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const isFinePointer = () =>
  typeof window !== 'undefined' && window.matchMedia('(hover: hover) and (pointer: fine)').matches;

/* ------------------------------------------------------------------ */
/* User-controlled motion pause (WCAG 2.2.2 Pause, Stop, Hide)          */
/* ------------------------------------------------------------------ */
const PAUSE_KEY = 'wc-motion-paused';
export const MOTION_EVENT = 'wc:motion';

export function isMotionPaused() {
  return typeof document !== 'undefined' && document.documentElement.classList.contains('motion-paused');
}

export function setMotionPaused(paused: boolean) {
  document.documentElement.classList.toggle('motion-paused', paused);
  try {
    localStorage.setItem(PAUSE_KEY, paused ? '1' : '0');
  } catch {
    /* storage unavailable */
  }
  window.dispatchEvent(new CustomEvent(MOTION_EVENT, { detail: paused }));
}

/** Breakpoints shared by gsap.matchMedia across sections. */
export const MQ = {
  desktop: '(min-width: 1024px) and (prefers-reduced-motion: no-preference)',
  mobile: '(max-width: 1023px) and (prefers-reduced-motion: no-preference)',
  reduced: '(prefers-reduced-motion: reduce)',
};

let lenis: Lenis | null = null;

export function initSmoothScroll() {
  if (prefersReducedMotion() || lenis) return () => {};
  lenis = new Lenis({ duration: 1.15, smoothWheel: true });
  lenis.on('scroll', ScrollTrigger.update);
  const tick = (time: number) => lenis?.raf(time * 1000);
  gsap.ticker.add(tick);
  gsap.ticker.lagSmoothing(0);
  return () => {
    gsap.ticker.remove(tick);
    lenis?.destroy();
    lenis = null;
  };
}

/** Freeze page scrolling (e.g. while the mobile menu is open). */
export function lockScroll(lock: boolean) {
  if (lenis) (lock ? lenis.stop() : lenis.start());
  document.documentElement.style.overflow = lock ? 'hidden' : '';
}

/** Scroll to an in-page section; works with or without Lenis. */
export function scrollToTarget(target: string | number, immediate = false) {
  const el = typeof target === 'string' ? document.querySelector<HTMLElement>(target) : null;
  if (typeof target === 'string' && !el) return;
  if (lenis) {
    lenis.scrollTo(el ?? (target as number), { offset: 0, duration: 1.6, immediate });
  } else if (el) {
    el.scrollIntoView({ behavior: immediate || prefersReducedMotion() ? 'auto' : 'smooth' });
  } else {
    window.scrollTo({ top: target as number });
  }
}

/* ------------------------------------------------------------------ */
/* Page transitions: a brand curtain wipes up, the next page wipes it away */
/* ------------------------------------------------------------------ */
const CURTAIN_KEY = 'wc-curtain';

export function goToPage(url: string) {
  const curtain = document.querySelector<HTMLElement>('.curtain');
  if (!curtain || prefersReducedMotion()) {
    window.location.href = url;
    return;
  }
  try {
    sessionStorage.setItem(CURTAIN_KEY, '1');
  } catch {
    /* storage unavailable: transition still plays, arrival just won't be covered */
  }
  curtain.classList.remove('is-leaving');
  curtain.classList.add('is-armed');
  // Two frames so the armed (display) state is committed before the wipe transitions.
  requestAnimationFrame(() => requestAnimationFrame(() => curtain.classList.add('is-covering')));
  window.setTimeout(() => (window.location.href = url), 760);
}

/** Click handler for links to another page of the site. */
export function onPageLinkClick(e: React.MouseEvent<HTMLAnchorElement>) {
  if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
  e.preventDefault();
  goToPage(e.currentTarget.href);
}

/** Called once on boot: lifts the curtain if we arrived through a transition. */
export function revealPage() {
  const html = document.documentElement;
  const curtain = document.querySelector<HTMLElement>('.curtain');
  if (!curtain) return;
  if (html.classList.contains('is-arriving')) {
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        curtain.classList.add('is-leaving');
        html.classList.remove('is-arriving');
        window.setTimeout(() => curtain.classList.remove('is-leaving', 'is-armed'), 900);
      }),
    );
  }
  // Returning via the back button restores a frozen page that still has the curtain down.
  window.addEventListener('pageshow', (ev) => {
    if (ev.persisted) {
      curtain.classList.remove('is-covering', 'is-leaving', 'is-armed');
      html.classList.remove('is-arriving');
    }
  });
}

const toTop = () => {
  if (lenis) lenis.scrollTo(0, { immediate: true, force: true });
  window.scrollTo(0, 0);
};

/**
 * Shared boot for every page: smooth scroll, trigger refresh, deep links, curtain.
 *
 * Pages always open at the top, including on reload. The only exception is a
 * genuine arrival from another page with a section hash (e.g. /contact/ → /#work).
 */
export function bootPage() {
  // ScrollTrigger records the browser's scroll-restoration mode at start-up and
  // re-applies it on every refresh, so it must be told to keep 'manual' too.
  history.scrollRestoration = 'manual';
  ScrollTrigger.clearScrollMemory('manual');

  const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
  const hash = location.hash.length > 1 ? location.hash : '';
  const deepLink = hash && nav?.type === 'navigate' ? hash : '';
  if (hash) history.replaceState(null, '', location.pathname + location.search); // never survives a reload

  const stop = initSmoothScroll();
  toTop();
  revealPage();

  const refresh = () => {
    ScrollTrigger.refresh();
    if (!deepLink) toTop();
  };
  const settle = () => {
    ScrollTrigger.refresh();
    // Deep links must wait until pinned sections have been measured.
    if (deepLink) requestAnimationFrame(() => scrollToTarget(deepLink, true));
    else toTop();
  };
  // Belt and braces for browsers that persist the position on unload.
  const onUnload = () => window.scrollTo(0, 0);

  document.fonts?.ready.then(settle);
  window.addEventListener('load', refresh, { once: true });
  window.addEventListener('beforeunload', onUnload);
  return () => {
    stop();
    window.removeEventListener('load', refresh);
    window.removeEventListener('beforeunload', onUnload);
  };
}

/** Click handler for anchor links (`href="#id"`) that routes through smooth scroll. */
export function onAnchorClick(e: React.MouseEvent<HTMLAnchorElement>) {
  const href = e.currentTarget.getAttribute('href');
  if (!href || !href.startsWith('#')) return;
  e.preventDefault();
  // Deliberately not written to the URL, so a reload always starts at the top.
  scrollToTarget(href === '#top' ? 0 : href);
}

/** Split text into masked words for reveal animations (keeps it accessible). */
export function splitWords(el: HTMLElement) {
  if (el.dataset.split) return Array.from(el.querySelectorAll<HTMLElement>('.w-inner'));
  const label = el.textContent ?? '';
  const walk = (node: Node): Node[] => {
    if (node.nodeType === Node.TEXT_NODE) {
      const frag: Node[] = [];
      (node.textContent ?? '').split(/(\s+)/).forEach((part) => {
        if (!part) return;
        if (/^\s+$/.test(part)) {
          frag.push(document.createTextNode(' '));
          return;
        }
        const outer = document.createElement('span');
        outer.className = 'w';
        const inner = document.createElement('span');
        inner.className = 'w-inner';
        inner.textContent = part;
        outer.appendChild(inner);
        frag.push(outer);
      });
      return frag;
    }
    if (node.nodeType === Node.ELEMENT_NODE) {
      const clone = (node as HTMLElement).cloneNode(false) as HTMLElement;
      Array.from(node.childNodes).forEach((c) => walk(c).forEach((n) => clone.appendChild(n)));
      return [clone];
    }
    return [];
  };
  const nodes = Array.from(el.childNodes).flatMap(walk);
  el.replaceChildren(...nodes);
  el.setAttribute('aria-label', label.replace(/\s+/g, ' ').trim());
  el.querySelectorAll('.w').forEach((w) => w.setAttribute('aria-hidden', 'true'));
  el.dataset.split = '1';
  return Array.from(el.querySelectorAll<HTMLElement>('.w-inner'));
}
