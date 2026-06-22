const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Rejects if `promise` doesn't settle within `ms` (0 disables). The underlying
// work isn't aborted — the result is just ignored — which is fine for the
// idempotent GETs this guards.
function withTimeout(promise, ms) {
  if (!ms) return promise;
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => { const e = new Error('Request timed out'); e.timeout = true; reject(e); }, ms)
    ),
  ]);
}

// Retries an async fn on *transient* failures — network errors, 5xx, and
// timeouts — with linear backoff. Client errors (4xx: auth/not-found/validation)
// are thrown immediately since they won't self-heal. Built for the Render free
// tier's cold starts, where the first request(s) after idle can 502 or hang
// while the server spins up; a couple of retries let the UI recover on its own
// instead of rendering empty until the user navigates away and back.
export async function retry(fn, { attempts = 4, delayMs = 1000, timeoutMs = 15000 } = {}) {
  let lastErr;
  for (let i = 0; i < attempts; i++) {
    try {
      return await withTimeout(Promise.resolve(fn()), timeoutMs);
    } catch (e) {
      lastErr = e;
      if (typeof e?.status === 'number' && e.status >= 400 && e.status < 500) throw e;
      if (i < attempts - 1) await sleep(delayMs * (i + 1));
    }
  }
  throw lastErr;
}
