export default function MapMockup() {
  return (
    <div className="map-container">
      <div className="map-frame">
        <div className="map-topbar">
          <div className="dot dot-r" />
          <div className="dot dot-y" />
          <div className="dot dot-g" />
          <span className="map-region-label">My Imprint</span>
        </div>
        <div className="map-body">
          <div className="world-grid" />
          <div className="map-overlay" />

          {/* County shapes */}
          <div className="county c-vt" />
          <div className="county c-la visited" />
          <div className="county c-sb" />
          <div className="county c-sd visited" />
          <div className="county c-rv" />
          <div className="county c-oc oc" />

          {/* County labels */}
          <span className="county-label" style={{ top: '8%',  left: '2%'  }}>Ventura</span>
          <span className="county-label" style={{ top: '22%', left: '22%' }}>Los Angeles</span>
          <span className="county-label" style={{ top: '22%', left: '60%' }}>San Bernardino</span>
          <span className="county-label" style={{ top: '71%', left: '58%' }}>Riverside</span>
          <span className="county-label" style={{ top: '85%', left: '10%' }}>San Diego</span>
          <span className="county-label cl-oc" style={{ top: '64%', left: '29%' }}>Orange Co.</span>

          {/* Pins — SoCal cities */}
          <div className="pin pin3" style={{ top: '30%', left: '27%' }} />  {/* Los Angeles */}
          <div className="pin"      style={{ top: '56%', left: '36%' }} />  {/* Anaheim */}
          <div className="pin pin2" style={{ top: '64%', left: '38%' }} />  {/* Irvine */}
          <div className="pin"      style={{ top: '70%', left: '30%' }} />  {/* Newport Beach */}
        </div>
        <div className="map-stats-bar">
          <div className="map-stat">
            <span className="map-stat-val">23%</span>
            <span className="map-stat-label">Orange County covered</span>
          </div>
          <div className="progress-wrap">
            <div className="progress-label">
              <span>Your Imprint</span>
              <span>23 / 100%</span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" />
            </div>
          </div>
          <div className="map-stat" style={{ textAlign: 'right' }}>
            <span className="map-stat-val">32</span>
            <span className="map-stat-label">Cities visited</span>
          </div>
        </div>
      </div>
    </div>
  );
}
