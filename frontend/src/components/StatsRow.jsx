// Stats grounded in what Imprint actually tracks — passport counts, trail
// resolution, and the planet itself — rather than generic geography trivia.
const stats = [
  { num: '195+', desc: 'Country passports to stamp' },
  { num: '7',    desc: 'Continents to discover' },
  { num: '∞',    desc: 'Stories to find' },
];

export default function StatsRow() {
  return (
    <div className="stats-row" id="stats">
      {stats.map((s) => (
        <div className="stat-item" key={s.desc}>
          <div className="stat-num">{s.num}</div>
          <div className="stat-desc">{s.desc}</div>
        </div>
      ))}
    </div>
  );
}
