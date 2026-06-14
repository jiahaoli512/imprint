const stats = [
  { num: '195', desc: "Countries to discover" },
  { num: '510M', desc: "km² of Earth's surface" },
  { num: '∞', desc: "Stories to find" },
];

export default function StatsRow() {
  return (
    <div className="stats-row" id="stats">
      {stats.map((s) => (
        <div className="stat-item" key={s.num}>
          <div className="stat-num">{s.num}</div>
          <div className="stat-desc">{s.desc}</div>
        </div>
      ))}
    </div>
  );
}
