import { useCallback, useRef, useState } from 'react';
import type { Project } from '../data/projects';
import { isFinePointer } from '../lib/motion';
import { useMounted } from '../lib/useMedia';

const src = (slug: string, kind: string) => `/projects/${slug}-${kind}.webp`;

/** Subtle pointer-driven 3D tilt + glare. Writes CSS vars only (GPU-friendly, no re-render). */
function useTilt(max = 6) {
  const ref = useRef<HTMLDivElement>(null);
  const frame = useRef(0);
  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!ref.current || !isFinePointer()) return;
      const el = ref.current;
      const r = el.getBoundingClientRect();
      const nx = (e.clientX - r.left) / r.width - 0.5;
      const ny = (e.clientY - r.top) / r.height - 0.5;
      cancelAnimationFrame(frame.current);
      frame.current = requestAnimationFrame(() => {
        el.style.setProperty('--rx', `${(-ny * max).toFixed(2)}deg`);
        el.style.setProperty('--ry', `${(nx * max).toFixed(2)}deg`);
        el.style.setProperty('--gx', `${(nx + 0.5) * 100}%`);
        el.style.setProperty('--gy', `${(ny + 0.5) * 100}%`);
        el.style.setProperty('--cx', `${e.clientX - r.left}px`);
        el.style.setProperty('--cy', `${e.clientY - r.top}px`);
      });
    },
    [max],
  );
  const onPointerLeave = useCallback(() => {
    cancelAnimationFrame(frame.current);
    ref.current?.style.setProperty('--rx', '0deg');
    ref.current?.style.setProperty('--ry', '0deg');
  }, []);
  return { ref, onPointerMove, onPointerLeave };
}

function Placeholder({ project }: { project: Project }) {
  return (
    <div className="shot-placeholder" style={{ background: project.tint }}>
      <span className="mono">{project.domain}</span>
      <strong>{project.name}</strong>
      <small>Preview coming soon</small>
    </div>
  );
}

export function BrowserFrame({
  project,
  sizes = '(min-width: 1024px) 60vw, 100vw',
  hoverScroll = true,
  className = '',
  linked = true,
}: {
  project: Project;
  sizes?: string;
  hoverScroll?: boolean;
  className?: string;
  /** Make the whole preview open the live site (the visible "Visit Website" link stays the accessible one). */
  linked?: boolean;
}) {
  const tilt = useTilt(5);
  const mounted = useMounted();
  const [failed, setFailed] = useState(false);
  const [wantFull, setWantFull] = useState(false);
  const [shift, setShift] = useState<number | null>(null);

  const onEnter = () => {
    if (hoverScroll && isFinePointer()) setWantFull(true);
  };

  const onFullLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    const ratio = img.naturalHeight / img.naturalWidth;
    const viewRatio = 10 / 16;
    // How far (as % of the image's own height) to travel so its bottom meets the viewport bottom.
    setShift(ratio > viewRatio ? (1 - viewRatio / ratio) * 100 : 0);
  };

  return (
    <div
      ref={tilt.ref}
      className={`frame ${className} ${shift ? 'has-full' : ''}`}
      style={{ '--accent': project.accent, '--dur': `${Math.max(3, (shift ?? 0) / 9)}s`, '--shift': `-${shift ?? 0}%` } as React.CSSProperties}
      onPointerEnter={onEnter}
      onPointerMove={tilt.onPointerMove}
      onPointerLeave={tilt.onPointerLeave}
    >
      <div className="frame__bar" aria-hidden="true">
        <i />
        <i />
        <i />
        <span className="frame__url">{project.domain}</span>
      </div>
      <div className="frame__view">
        {failed ? (
          <Placeholder project={project} />
        ) : (
          // The wrapper is what the scroll reveal scales; the image itself mounts after
          // hydration (lazy), with a <noscript> copy for no-JS visitors and crawlers.
          <div className="frame__media">
            {mounted ? (
              <img
                className="frame__img"
                src={src(project.slug, '1280')}
                srcSet={`${src(project.slug, '720')} 720w, ${src(project.slug, '960')} 960w, ${src(project.slug, '1280')} 1280w`}
                sizes={sizes}
                width={1280}
                height={800}
                loading="lazy"
                decoding="async"
                alt={`${project.name} website homepage`}
                onError={() => setFailed(true)}
              />
            ) : (
              <noscript>
                <img className="frame__img" src={src(project.slug, '1280')} width={1280} height={800} alt={`${project.name} website homepage`} />
              </noscript>
            )}
          </div>
        )}
        {wantFull && !failed && (
          <img
            className="frame__full"
            src={src(project.slug, 'full')}
            alt=""
            aria-hidden="true"
            decoding="async"
            onLoad={onFullLoad}
          />
        )}
      </div>
      <span className="frame__glare" aria-hidden="true" />
      {linked && (
        <a
          className="frame__link"
          href={project.url}
          target="_blank"
          rel="noopener noreferrer"
          tabIndex={-1}
          aria-hidden="true"
        >
          <span className="frame__cursor">
            Visit
            <svg viewBox="0 0 24 24" width="14" height="14">
              <path d="M7 17 17 7M9 7h8v8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </a>
      )}
    </div>
  );
}

export function PhoneFrame({ project, className = '' }: { project: Project; className?: string }) {
  const [failed, setFailed] = useState(false);
  const mounted = useMounted();
  if (failed) return null;
  return (
    <div className={`phone ${className}`} aria-hidden="true">
      <div className="phone__screen">
        {mounted && <img
          src={src(project.slug, 'mobile')}
          srcSet={`${src(project.slug, 'mobile-240')} 240w, ${src(project.slug, 'mobile')} 420w`}
          sizes="(min-width: 1024px) 190px, 28vw"
          width={420}
          height={909}
          loading="lazy"
          decoding="async"
          alt=""
          onError={() => setFailed(true)}
        />}
      </div>
    </div>
  );
}

/** Tall, narrow frame showing the whole page; its content scrolls with the page (scroll-linked). */
export function PageStrip({ project, className = '' }: { project: Project; className?: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;
  return (
    <div className={`strip ${className}`} aria-hidden="true">
      <div className="strip__view">
        <img
          className="strip__img"
          src={src(project.slug, 'full')}
          loading="lazy"
          decoding="async"
          alt=""
          onError={() => setFailed(true)}
        />
      </div>
    </div>
  );
}
