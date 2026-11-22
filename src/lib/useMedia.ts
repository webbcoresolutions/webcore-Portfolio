import { useEffect, useLayoutEffect, useState } from 'react';

/**
 * Starts as `false` on both server and client so pre-rendered HTML hydrates
 * without mismatches; the real value is applied right after mount.
 */
export function useMedia(query: string) {
  const [match, setMatch] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const on = () => setMatch(mq.matches);
    on();
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, [query]);
  return match;
}

/** True only after hydration — gates browser-only UI (WebGL, live clocks). */
export function useMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}

/**
 * True once the page is idle after load, so heavy, non-essential work
 * (the WebGL scenes) never competes with the first paint.
 */
export function useIdle(timeout = 1200) {
  const [idle, setIdle] = useState(false);
  useEffect(() => {
    let id = 0;
    const go = () => {
      const ric = (window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number }).requestIdleCallback;
      if (ric) id = ric(() => setIdle(true), { timeout });
      else id = window.setTimeout(() => setIdle(true), 200);
    };
    if (document.readyState === 'complete') go();
    else window.addEventListener('load', go, { once: true });
    return () => {
      window.removeEventListener('load', go);
      window.clearTimeout(id);
      (window as Window & { cancelIdleCallback?: (n: number) => void }).cancelIdleCallback?.(id);
    };
  }, [timeout]);
  return idle;
}

/** Local time per IANA zone; renders a neutral placeholder until mounted (hydration-safe). */
export function useZoneTimes(zones: string[], interval = 15000) {
  const read = () =>
    zones.map((tz) => {
      const d = new Date();
      return {
        time: new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: tz }).format(d),
        zone:
          new Intl.DateTimeFormat('en-GB', { timeZone: tz, timeZoneName: 'short' })
            .formatToParts(d)
            .find((p) => p.type === 'timeZoneName')?.value ?? '',
      };
    });
  const [times, setTimes] = useState(() => zones.map(() => ({ time: '--:--', zone: '' })));
  useEffect(() => {
    setTimes(read());
    const id = window.setInterval(() => setTimes(read()), interval);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zones.join(), interval]);
  return times;
}

/** useLayoutEffect in the browser, useEffect during build-time pre-rendering (no SSR warnings). */
export const useIsoLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;
