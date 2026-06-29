import { Gauge, Footprints, Stamp, Flag, Trophy, Users } from 'lucide-react';

// Features that reflect what's actually in the app today: the live discovery
// gauge, native passive tracking, the country + U.S. state passport badges, the
// milestone gallery, and exploring other travelers' profiles.
const features = [
  { icon: Gauge,      cls: 'icon-green',  title: 'Discovery Gauge',     desc: "A live gauge fills in as you move, showing the exact percentage you've uncovered." },
  { icon: Footprints, cls: 'icon-blue',   title: 'Passive Tracking',    desc: 'On the mobile app, Imprint quietly logs your trail in the background. Just live your life — your map builds itself and marks your every journey; no check-ins needed.' },
  { icon: Stamp,      cls: 'icon-orange', title: 'Country Passports',   desc: 'Collect a stamp for 195+ countries. Each flag unlocks automatically the moment your map first touches that country.' },
  { icon: Flag,       cls: 'icon-pink',   title: 'State Flags',         desc: 'Earn a flag for every U.S. state and D.C. as you explore them — 51 in all, lit up the instant you set foot inside.' },
  { icon: Trophy,     cls: 'icon-yellow', title: 'Milestones',          desc: 'Flex to your friends with growing badge gallery, scroll through the endless categories Imprint offers.' },
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
