import { useState, useEffect } from 'react';
import { ChevronUp } from 'lucide-react';
import { api } from '../api/client';
import Nav from '../components/Nav';
import Hero from '../components/Hero';
import StatsRow from '../components/StatsRow';
import Features from '../components/Features';
import HowItWorks from '../components/HowItWorks';
import CTA from '../components/CTA';

export default function Home() {
  const [waitlistCount, setWaitlistCount] = useState(2400);
  const [showTop, setShowTop] = useState(false); // scroll-to-top affordance

  useEffect(() => {
    api.waitlistCount()
      .then((d) => setWaitlistCount(d.count))
      .catch(() => {});
  }, []);

  // Reveal the scroll-to-top button once the page is scrolled past the hero
  // (same affordance as the badges modal / privacy page).
  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 400);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  return (
    <div className="home-page">
      <Nav />
      <Hero waitlistCount={waitlistCount} onJoin={setWaitlistCount} />
      <StatsRow />
      <Features />
      <HowItWorks />
      <CTA onJoin={setWaitlistCount} />

      {showTop && (
        <button className="icon-btn scrolltop-fab" onClick={scrollToTop} aria-label="Scroll to top">
          <ChevronUp size={20} />
        </button>
      )}
    </div>
  );
}
