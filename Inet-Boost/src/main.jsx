import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import Header from './components/Header.jsx';
import Hero from './components/Hero.jsx';
import Features from './components/Features.jsx';
import Pricing from './components/Pricing.jsx';
import HowItWorks from './components/HowItWorks.jsx';
import Referral from './components/Referral.jsx';
import FAQ from './components/FAQ.jsx';
import FinalCTA from './components/FinalCTA.jsx';
import Footer from './components/Footer.jsx';

function App() {
  const [lang, setLang] = useState('en');
  return (
    <>
      <Header lang={lang} setLang={setLang} />
      <main>
        <Hero lang={lang} />
        <Features lang={lang} />
        <Pricing lang={lang} />
        <HowItWorks lang={lang} />
        <Referral lang={lang} />
        <FAQ lang={lang} />
        <FinalCTA lang={lang} />
      </main>
      <Footer />
    </>
  );
}

createRoot(document.getElementById('root')).render(<App />);
