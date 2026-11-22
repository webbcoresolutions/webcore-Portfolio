import { StrictMode, type ReactNode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';

/** Hydrate pre-rendered HTML in production; render from scratch in dev. */
export function mount(app: ReactNode) {
  const el = document.getElementById('root')!;
  const tree = <StrictMode>{app}</StrictMode>;
  if (el.hasChildNodes()) hydrateRoot(el, tree);
  else createRoot(el).render(tree);
}
