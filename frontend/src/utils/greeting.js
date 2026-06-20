// Dashboard greeting variations. Shown as "{greeting}, {name}!". A fresh one is
// rolled on each login (refreshGreeting) and kept for the session, so it stays
// stable across navigation/reloads until the next login.
const GREETINGS = [
  'Welcome back',          // the original stays in the random pool
  'Good to see you',
  'Great to have you back',
  "Look who's back",
  'Hello again',
  'Nice to see you again',
  "Glad you're back",
  'Welcome home',
  'Long time no see',
  'Good to have you',
  'Greetings'
];

const KEY = 'imprint_greeting';

// Pick a fresh random greeting and remember it for this session. Call on login.
export function refreshGreeting() {
  const g = GREETINGS[Math.floor(Math.random() * GREETINGS.length)];
  sessionStorage.setItem(KEY, g);
  return g;
}

// The greeting chosen for this session (rolls one if none has been set yet).
export function getGreeting() {
  return sessionStorage.getItem(KEY) || refreshGreeting();
}
