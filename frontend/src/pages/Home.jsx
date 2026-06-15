import { useState, useEffect } from 'react';
import { api } from '../api/client';
import Nav from '../components/Nav';
import Hero from '../components/Hero';
import StatsRow from '../components/StatsRow';
import Features from '../components/Features';
import HowItWorks from '../components/HowItWorks';
import CTA from '../components/CTA';
import Footer from '../components/Footer';

export default function Home() {
  const [waitlistCount, setWaitlistCount] = useState(2400);

  useEffect(() => {
    api.waitlistCount()
      .then((d) => setWaitlistCount(d.count))
      .catch(() => {});
  }, []);

  return (
    <div className="home-page">
      <Nav />
      <Hero waitlistCount={waitlistCount} onJoin={setWaitlistCount} />
      <StatsRow />
      <Features />
      <HowItWorks />
      <CTA onJoin={setWaitlistCount} />
      <Footer />
    </div>
  );
}
