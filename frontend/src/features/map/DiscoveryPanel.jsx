// Web-only discovery gauge shown to the right of the dashboard map. Renders a
// radial donut of the percentage of the current region the user has "discovered"
// (markers bucketed into grid cells). While the map is moving it shows a
// spinning ring; ~2s after the map settles the donut animates to the new value.
const R = 52;                       // donut radius (viewBox units)
const C = 2 * Math.PI * R;          // circumference
const SIZE = 132;                   // svg viewBox size

const LEVEL_LABEL = {
  city: 'City', county: 'County', state: 'State / Region',
  country: 'Country', continent: 'Continent', earth: 'Planet',
};

export default function DiscoveryPanel({ region, status, percent = 0, level }) {
  const loading = status === 'loading' || status === 'idle';
  const firstLoad = status === 'idle';     // nothing computed yet
  const error = status === 'error';
  // Show "<0.1%" for positive-but-tiny coverage rather than a flat "0%".
  const pctLabel = percent > 0 && percent < 0.1 ? '<0.1%' : `${Math.round(percent * 10) / 10}%`;
  const dashoffset = C * (1 - Math.min(percent, 100) / 100);
  const name = region || (level === 'earth' ? 'Earth' : '—');

  return (
    <div className="discovery-panel">
      <div className="discovery-title">Discovery</div>

      <div className="discovery-donut" role="img"
        aria-label={loading ? 'Calculating discovery' : `${pctLabel} of ${name} discovered`}>
        <svg viewBox={`0 0 ${SIZE} ${SIZE}`} width="132" height="132">
          <defs>
            <linearGradient id="discoveryGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="var(--accent)" />
              <stop offset="100%" stopColor="var(--accent2)" />
            </linearGradient>
          </defs>
          {/* track */}
          <circle cx={SIZE / 2} cy={SIZE / 2} r={R} fill="none"
            stroke="var(--border)" strokeWidth="10" />
          {/* progress — holds the last value (dimmed) while a new one loads, then
              eases to the new value; hidden until the first result. */}
          <circle
            className="discovery-arc"
            cx={SIZE / 2} cy={SIZE / 2} r={R} fill="none"
            stroke="url(#discoveryGrad)" strokeWidth="10" strokeLinecap="round"
            strokeDasharray={C}
            strokeDashoffset={firstLoad ? C : dashoffset}
            transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
            style={{ opacity: loading ? 0.3 : 1 }}
          />
          {/* indeterminate spinner overlaid only while loading */}
          {loading && (
            <circle
              className="discovery-spinner"
              cx={SIZE / 2} cy={SIZE / 2} r={R} fill="none"
              stroke="var(--accent)" strokeWidth="10" strokeLinecap="round"
              strokeDasharray={`${C * 0.18} ${C}`}
            />
          )}
        </svg>
        <div className="discovery-center">
          <span className={`discovery-pct${loading ? ' dim' : ''}`}>
            {firstLoad ? '' : error ? '!' : pctLabel}
          </span>
        </div>
      </div>

      <div className="discovery-meta">
        <div className="discovery-region">{name}</div>
        <div className="discovery-level">{LEVEL_LABEL[level] || ''}</div>
        {(error || loading) && (
          <div className="discovery-cells">
            {error ? "Couldn't load this region" : 'Updating…'}
          </div>
        )}
      </div>
    </div>
  );
}
