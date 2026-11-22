/** Build-time renderer: produces the static HTML that each page ships with. */
import { StrictMode } from 'react';
import { renderToString } from 'react-dom/server';
import App from './App';
import ContactApp from './ContactApp';

export function render(page: 'home' | 'contact') {
  return renderToString(<StrictMode>{page === 'home' ? <App /> : <ContactApp />}</StrictMode>);
}
