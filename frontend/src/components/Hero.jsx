import { useNavigate } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import MapMockup from './MapMockup';

export default function Hero({ waitlistCount }) {
  const navigate = useNavigate();

  return (
    <section className="hero">
      <div className="hero-glow" />
      <div className="hero-glow2" />

      <div className="badge"><Sparkles size={12} strokeWidth={2.5} /> Now in Beta</div>

      <h1>How much of the<br /><span>world have you seen?</span></h1>

      <p>
        Imprint maps every place you've ever been — turning your travels into a living
        portrait of your world. See your coverage, explore what's left, and share the journey.
      </p>

      <div className="hero-auth-btns">
        <button className="btn btn-primary" onClick={() => navigate('/signup')}>Sign Up</button>
        <button className="btn btn-ghost" onClick={() => navigate('/login')}>Log In</button>
      </div>

      <MapMockup />

      <div className="social-proof">
        <div className="avatars">
          <div className="avatar av1">A</div>
          <div className="avatar av2">K</div>
          <div className="avatar av3">M</div>
          <div className="avatar av4">J</div>
        </div>
        <span className="social-text">
          <strong>{waitlistCount.toLocaleString()}+ explorers</strong> already mapping their world
        </span>
      </div>
    </section>
  );
}
