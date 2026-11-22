/** Brand curtain used for page-to-page transitions (see goToPage / revealPage). */
export default function Curtain() {
  return (
    <div className="curtain" aria-hidden="true">
      <div className="curtain__inner">
        <img src="/brand/logo-400.webp" srcSet="/brand/logo-400.webp 400w, /brand/logo-800.webp 800w" sizes="280px" alt="" width={800} height={196} loading="lazy" decoding="async" />
        <span className="curtain__line" />
      </div>
    </div>
  );
}
