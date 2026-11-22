import { useEffect } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import Curtain from './components/Curtain';
import ContactPage from './pages/ContactPage';
import { bootPage } from './lib/motion';

export default function ContactApp() {
  useEffect(() => bootPage(), []);
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <Header page="contact" />
      <ContactPage />
      <Footer page="contact" />
      <div className="grain" aria-hidden="true" />
      <Curtain />
    </>
  );
}
