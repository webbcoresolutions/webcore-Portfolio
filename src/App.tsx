import { useEffect } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import Backdrop from './components/Backdrop';
import Curtain from './components/Curtain';
import Hero from './sections/Hero';
import Intro from './sections/Intro';
import Projects from './sections/Projects';
import Services from './sections/Services';
import CTA from './sections/CTA';
import { bootPage } from './lib/motion';

export default function App() {
  useEffect(() => bootPage(), []);

  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <Header page="home" />
      <main id="main">
        <Hero />
        <Intro />
        <Projects />
        <Services />
        <CTA />
      </main>
      <Footer page="home" />
      <Backdrop />
      <Curtain />
    </>
  );
}
