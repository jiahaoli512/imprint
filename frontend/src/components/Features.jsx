import { Gauge, Footprints, Users } from 'lucide-react';

// Narrowed to the three most representative features of the app: the live
// discovery gauge, native passive tracking, and exploring other travelers'
// profiles.
const features = [
  { icon: Gauge,      cls: 'icon-green',  title: 'Discovery Gauge',     desc: "A live gauge fills in as you move, showing the exact percentage you've uncovered." },
  { icon: Footprints, cls: 'icon-blue',   title: 'Passive Tracking Milestones', desc: 'On the mobile app, Imprint quietly logs your trail in the background — your map builds itself and unlocks milestones as you go, no check-ins needed.' },
  { icon: Users,      cls: 'icon-purple', title: 'Explore Travelers',   desc: 'Search for other explorers and visit their profiles and maps to see just how far they’ve roamed.' },
];

export default function Features() {
  return (
    <section className="section" id="features">
      <div className="section-tag">Features</div>
      <h2 className="section-title">More than a travel tracker.</h2>
      <p className="section-sub">
        Imprint goes beyond pinning locations — it gives you a living, breathing map of your {"life's"} journey.
      </p>
      <div className="features-grid">
        {features.map((f) => (
          <div className="feature-card" key={f.title}>
            <div className={`feature-icon ${f.cls}`}><f.icon size={22} strokeWidth={2} /></div>
            <h3>{f.title}</h3>
            <p>{f.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
