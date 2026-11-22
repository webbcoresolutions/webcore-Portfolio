import { useRef } from 'react';
import { useIsoLayoutEffect } from '../lib/useMedia';
import { gsap } from '../lib/motion';

const PAPER = '#FAFCFF';
const NAVY = '#040B1F';
// Route the crossfade through brand blues so it never passes through muddy grey.
const DUSK = [PAPER, '#C9D9F4', '#2A57A8', '#0C1F4D', NAVY];
const DAWN = [...DUSK].reverse();

/**
 * One fixed colour field behind the whole page. Sections are transparent, so
 * light → navy → light changes are scrubbed by scroll instead of hard-cut,
 * which makes the page read as a single continuous scene (and reverses on scroll-up).
 * Mounted after all sections so its triggers account for earlier pin spacers.
 */
export default function Backdrop() {
  const ref = useRef<HTMLDivElement>(null);

  useIsoLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const bd = ref.current!;
        gsap.set(bd, { backgroundColor: PAPER });

        // Into the night: the visible light → navy blend is the text-free band at the top
        // of Services; the shared backdrop follows while Services fills the screen.
        gsap.to(bd, {
          keyframes: { backgroundColor: DUSK, easeEach: 'none' },
          ease: 'none',
          scrollTrigger: { trigger: '.services__pin', start: 'top 60%', end: 'top 20%', scrub: true },
        });

        // Back to daylight: CTA → contact
        gsap.to(bd, {
          keyframes: { backgroundColor: DAWN, easeEach: 'none' },
          ease: 'none',
          immediateRender: false,
          scrollTrigger: { trigger: '.cta', start: 'bottom bottom', end: 'bottom 45%', scrub: true },
        });
      });
    });
    return () => ctx.revert();
  }, []);

  return (
    <>
      <div className="backdrop" ref={ref} aria-hidden="true" />
      <div className="grain" aria-hidden="true" />
    </>
  );
}
