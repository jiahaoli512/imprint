// Single seam for the Verifalia email-verification API (mirrors email.js's
// "one function wraps the provider" pattern — raw fetch, no SDK dependency).
// Submits a mailbox-deliverability check and short-polls for its result via
// Verifalia's classic REST API (submit -> poll-until-Completed).
const BASE_URL = 'https://api.verifalia.com/v2.7';
const POLL_INTERVAL_MS = 1000;
const POLL_TIMEOUT_MS = 8000;

if (!process.env.VERIFALIA_USERNAME || !process.env.VERIFALIA_PASSWORD) {
  console.warn('[verifalia] WARNING: VERIFALIA_USERNAME/VERIFALIA_PASSWORD not set — deliverability checks will be skipped (fail open)');
}

function authHeader() {
  const raw = `${process.env.VERIFALIA_USERNAME}:${process.env.VERIFALIA_PASSWORD}`;
  return `Basic ${Buffer.from(raw).toString('base64')}`;
}

// Submits one email and polls until Verifalia marks the job Completed (or this
// times out), returning its classification: 'Deliverable' | 'Undeliverable' |
// 'Risky' | 'Unknown'. Throws on any transport/HTTP/timeout failure — isDeliverable
// below is the only caller, and it treats every such throw as fail-open.
async function classify(email) {
  const submitRes = await fetch(`${BASE_URL}/email-validations`, {
    method: 'POST',
    headers: { Authorization: authHeader(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ entries: [{ inputData: email }] }),
  });
  if (!submitRes.ok) throw new Error(`Verifalia submit failed (${submitRes.status})`);
  let body = await submitRes.json();

  const jobId = body?.overview?.id;
  const deadline = Date.now() + POLL_TIMEOUT_MS;
  while (body?.overview?.status !== 'Completed') {
    if (!jobId) throw new Error('Verifalia response missing job id');
    if (Date.now() > deadline) throw new Error('Verifalia poll timed out');
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
    const pollRes = await fetch(`${BASE_URL}/email-validations/${jobId}`, {
      headers: { Authorization: authHeader() },
    });
    if (!pollRes.ok) throw new Error(`Verifalia poll failed (${pollRes.status})`);
    body = await pollRes.json();
  }

  const entry = body?.entries?.data?.[0];
  if (!entry) throw new Error('Verifalia returned no result entry');
  return entry.classification;
}

// Whether `email` is worth attempting to send to. Only a definitive
// 'Undeliverable' classification returns false — 'Risky'/'Unknown' (ambiguous
// results, e.g. a catch-all domain or a check the provider couldn't complete)
// and any provider failure (down, slow, credentials missing, daily free-tier
// quota exhausted) fail open (return true): this is a bounce-rate optimization,
// not a hard security gate, so a third-party outage should never block a real
// signup or password reset. The outcome is always logged, even when
// inconclusive, so bounce-rate impact can be assessed later.
async function isDeliverable(email) {
  if (!process.env.VERIFALIA_USERNAME || !process.env.VERIFALIA_PASSWORD) return true;
  try {
    const classification = await classify(email);
    if (classification !== 'Deliverable' && classification !== 'Undeliverable') {
      console.warn(`[verifalia] Ambiguous result (${classification}) for an email check — allowing through.`);
    }
    return classification !== 'Undeliverable';
  } catch (err) {
    console.error('[verifalia] Deliverability check failed, failing open:', err.message);
    return true;
  }
}

module.exports = { isDeliverable };
