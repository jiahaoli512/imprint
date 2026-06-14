const features = [
  { icon: '🗺️', cls: 'icon-green',  title: 'Coverage Map',        desc: "See exactly what percentage of the world, each country, and each region you've explored — visualized as a heat map that grows with you." },
  { icon: '📍', cls: 'icon-blue',   title: 'Passive Tracking',     desc: 'Imprint quietly logs your location in the background. Just live your life — your map builds itself automatically.' },
  { icon: '👥', cls: 'icon-purple', title: 'Friend Comparisons',   desc: "See how your coverage stacks up against friends. Discover places they've been that you haven't — and challenge them to catch up." },
  { icon: '🏆', cls: 'icon-orange', title: 'Achievements',         desc: 'Unlock badges for hitting every continent, exploring all 50 US states, visiting UNESCO sites, and hundreds more.' },
  { icon: '✈️', cls: 'icon-pink',   title: 'Trip Recaps',          desc: 'Every trip automatically becomes a shareable recap — a beautiful visual story of where you went and what you covered.' },
  { icon: '🎯', cls: 'icon-yellow', title: 'Bucket List',          desc: 'Pin places you want to visit next. Imprint helps you plan the most efficient route to maximize coverage on your next adventure.' },
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
            <div className={`feature-icon ${f.cls}`}>{f.icon}</div>
            <h3>{f.title}</h3>
            <p>{f.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
