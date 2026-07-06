import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Capacitor } from '@capacitor/core'
import 'flag-icons/css/flag-icons.min.css'
import './index.css'
import 'leaflet/dist/leaflet.css'
import App from './App.jsx'
import { applyReduceMotion } from './features/settings/reduceMotion'

// Reflect the stored reduce-motion preference onto <html> before first paint.
applyReduceMotion();

// On native (iOS/Android), disable browser zoom so focusing an input doesn't
// auto-zoom the page (and leave it distorted on navigation). Leaflet handles
// its own map pinch-zoom independently. Web keeps pinch-zoom for accessibility.
if (Capacitor.isNativePlatform()) {
  const vp = document.querySelector('meta[name="viewport"]');
  if (vp) {
    vp.setAttribute(
      'content',
      'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover'
    );
  }

  // iOS/WKWebView doesn't apply the :active pseudo-class on tap unless a touch
  // listener is registered on the document. Without it, the button press
  // animations (transform: scale on :active) — which work on web via mouse —
  // never fire on the native app. A single empty passive touchstart listener
  // opts the whole page into touch :active feedback.
  document.addEventListener('touchstart', () => {}, { passive: true });
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
