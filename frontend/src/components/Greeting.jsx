import { useRef } from 'react';
import WaveText from './WaveText';
import { getGreeting } from '../utils/greeting';
import { useFitText } from '../utils/useFitText';

const MIN_FONT = 14; // don't shrink below this (readability floor)

// The animated dashboard greeting: "{greeting}, {name}!". The greeting phrase
// and the name are each non-breaking units, giving the 3-tier behaviour:
//   1. they sit on one line when they fit;
//   2. otherwise the name drops to its own line (the space between them wraps);
//   3. if a unit alone is still wider than a line, the whole greeting font
//      shrinks until it fits (down to MIN_FONT).
// Tiers 1-2 are natural wrapping; tier 3 is useFitText shrinking only when a
// segment overflows (singleLine: false keeps the line wrapping in tiers 1-2).
export default function Greeting({ name, suffix = null }) {
  const greeting = getGreeting();
  const pRef = useRef(null);
  useFitText(pRef, [greeting, name], { min: MIN_FONT, singleLine: false });

  return (
    <p className="dashboard-welcome" ref={pRef}>
      <span className="greet-seg">
        <WaveText text={`${greeting},`} italicLen={greeting.length} />
      </span>{' '}
      <span className="greet-seg">
        <WaveText text={`${name}!`} startIndex={greeting.length + 1} />
      </span>
      {suffix}
    </p>
  );
}
