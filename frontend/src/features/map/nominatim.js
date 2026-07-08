// Shared, timeout-guarded fetch for Nominatim (OpenStreetMap reverse-geocoding)
// requests — used by both region.js (the toolbar's live place label) and
// discovery.js (the region-boundary lookup). Bounds the request and treats a
// non-2xx (e.g. 429 rate limit) or a hung connection as a failure rather than
// letting `res.json()` throw an opaque error or the call hang indefinitely.
// Each caller builds its own query URL; this only owns the fetch's robustness.
const DEFAULT_TIMEOUT_MS = 8000;

export async function fetchNominatim(url, timeoutMs = DEFAULT_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`Nominatim ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}
