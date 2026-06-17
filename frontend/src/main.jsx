import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Capacitor } from '@capacitor/core'
import './index.css'
import 'leaflet/dist/leaflet.css'
import App from './App.jsx'

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
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
