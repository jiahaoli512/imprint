const steps = [
  { num: '01', title: 'Download Imprint',    desc: 'Available on iOS and Android. Sign up in seconds — no manual input needed to get started.' },
  { num: '02', title: 'Explore the world',   desc: 'Imprint runs quietly in the background, logging every city, region, country, and continent you visit as you live your life.' },
  { num: '03', title: 'Watch your map grow', desc: 'Open the app to see your coverage expand in real time. Compare, compete, and get inspired by friends to see more.' },
  { num: '04', title: 'Share your imprint',  desc: 'Export your map, badges, and trip recap as a beautiful card to share with friends on any platform.' },
];

export default function HowItWorks() {
  return (
    <div className="how-section" id="how">
      <div className="how-inner">
        <div className="section-tag">How it works</div>
        <h2 className="section-title">Start leaving your<br />mark today.</h2>
        <div className="steps">
          {steps.map((s) => (
            <div className="step" key={s.num}>
              <div className="step-num">{s.num}</div>
              <h3>{s.title}</h3>
              <p>{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
