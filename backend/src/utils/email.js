const FROM_EMAIL = process.env.EMAIL_USER || 'donotreply.imprint@gmail.com';
const CONTACT_INBOX = 'donotreply.imprint@gmail.com'; // where contact-form messages land

// Email clients (Gmail especially) strip inline <svg>, so the logo must be a
// hosted raster image referenced by absolute URL. Points at the deployed
// frontend's apple-touch-icon (the fingerprint mark on its gradient tile);
// override with FRONTEND_URL if the web app moves.
const FRONTEND_URL = (process.env.FRONTEND_URL || 'https://imprint-wheat.vercel.app').replace(/\/$/, '');
const LOGO_URL = `${FRONTEND_URL}/apple-touch-icon.png`;

if (!process.env.BREVO_API_KEY) {
  console.warn('[email] WARNING: BREVO_API_KEY is not set — emails will fail');
}

// Single seam for outbound mail. Every email goes through here, so the provider
// (Brevo) and its auth/transport/error handling live in exactly one place —
// swapping providers is a one-function change. Callers supply only the
// message-specific fields (`to`, `subject`, `htmlContent`, optional `replyTo`).
async function sendEmail(payload) {
  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': process.env.BREVO_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ sender: { name: 'Imprint', email: FROM_EMAIL }, ...payload }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || `Brevo API error ${res.status}`);
  }
}

// Escapes the HTML metacharacters that matter for text interpolated into an
// email body, so user-supplied values can't inject markup.
function escapeHtml(s) {
  return String(s).replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]));
}

// The branded email shell (dark background, hosted logo header, rounded card,
// footer with privacy/contact links). Each branded email supplies only its card
// contents via `body`; the chrome lives here so it's defined — and restyled —
// in exactly one place. `eyebrow` is the small green kicker, `heading` the H1.
function renderBrandedEmail({ eyebrow, heading, body }) {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#080c14;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#080c14;padding:48px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

        <!-- Logo -->
        <tr><td style="padding-bottom:32px;text-align:center;">
          <table cellpadding="0" cellspacing="0" align="center" style="margin:0 auto;">
            <tr>
              <td style="padding-right:10px;vertical-align:middle;">
                <img src="${LOGO_URL}" width="32" height="32" alt="Imprint" style="display:block;width:32px;height:32px;border-radius:9px;border:0;outline:none;text-decoration:none;">
              </td>
              <td style="vertical-align:middle;font-size:20px;font-weight:800;color:#f0f4ff;letter-spacing:-0.5px;">
                Imprint
              </td>
            </tr>
          </table>
        </td></tr>

        <!-- Card -->
        <tr><td style="background:#0f1623;border:1px solid rgba(255,255,255,0.07);border-radius:24px;padding:48px 40px;">

          <p style="margin:0 0 8px;font-size:13px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#4fffb0;">${eyebrow}</p>
          <h1 style="margin:0 0 16px;font-size:32px;font-weight:900;letter-spacing:-1px;color:#f0f4ff;line-height:1.1;">${heading}</h1>
          ${body}

        </td></tr>

        <!-- Footer -->
        <tr><td style="padding-top:32px;text-align:center;">
          <p style="margin:0;font-size:12px;color:#3a4560;">© 2026 Imprint · <a href="${FRONTEND_URL}/privacy" style="color:#3a4560;text-decoration:underline;">Privacy</a> · <a href="${FRONTEND_URL}/contact" style="color:#3a4560;text-decoration:underline;">Contact</a></p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

async function sendApprovalEmail(to, name) {
  const displayName = name || to.split('@')[0];
  // Escape user-supplied values before interpolating into the HTML body (the
  // waitlist `name` is user-controlled). The Brevo recipient `name` field below
  // is JSON, not HTML, so it uses the raw value.
  const safeName = escapeHtml(displayName);
  const safeTo = escapeHtml(to);

  await sendEmail({
    to: [{ email: to, name: displayName }],
    subject: "You're approved — Welcome to Imprint 🗺️",
    htmlContent: renderBrandedEmail({
      eyebrow: "You're approved",
      heading: `Welcome to Imprint,<br>${safeName}.`,
      body: `
          <p style="margin:0 0 32px;font-size:16px;color:#6b7a99;line-height:1.7;">
            Your waitlist spot has been approved. You now have early access to Imprint — the app that maps every place you've ever been.
          </p>

          <!-- Divider -->
          <div style="height:1px;background:rgba(255,255,255,0.07);margin-bottom:32px;"></div>

          <p style="margin:0 0 12px;font-size:13px;font-weight:600;color:#6b7a99;text-transform:uppercase;letter-spacing:1px;">How to get started</p>
          <p style="margin:0 0 24px;font-size:14px;color:#6b7a99;line-height:1.6;">
            Create your account using <strong style="color:#f0f4ff;">exactly this email address</strong> — available on the mobile app and in your web browser:
          </p>

          <!-- Email highlight box -->
          <div style="background:#161f30;border:1px solid rgba(79,255,176,0.2);border-radius:12px;padding:20px 24px;text-align:center;margin-bottom:24px;">
            <p style="margin:0 0 4px;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#4fffb0;">Your approved email</p>
            <p style="margin:0;font-size:18px;font-weight:700;color:#f0f4ff;">${safeTo}</p>
          </div>

          <p style="margin:0 0 16px;font-size:13px;color:#6b7a99;line-height:1.6;">
            Signing up with any other email address will not work.
          </p>

          <!-- Platform note -->
          <div style="background:#161f30;border:1px solid rgba(255,255,255,0.06);border-radius:12px;padding:20px 24px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding-bottom:12px;">
                  <span style="font-size:13px;font-weight:700;color:#f0f4ff;">📱 Mobile app</span>
                  <p style="margin:4px 0 0;font-size:12px;color:#6b7a99;line-height:1.5;">Full experience — log your visited locations, track coverage, and more.</p>
                </td>
              </tr>
              <tr>
                <td style="border-top:1px solid rgba(255,255,255,0.06);padding-top:12px;">
                  <span style="font-size:13px;font-weight:700;color:#f0f4ff;">🌐 Web browser</span>
                  <p style="margin:4px 0 0;font-size:12px;color:#6b7a99;line-height:1.5;">Limited access — sign in to manage your account. Location logging requires the mobile app.</p>
                </td>
              </tr>
            </table>
          </div>`,
    }),
  });
}

// Sends the 6-character email-verification code, used by both signup and
// password reset (the copy is purpose-neutral). The code is generated and hashed
// by verificationService; this only delivers the plaintext to the inbox.
async function sendVerificationEmail(to, code) {
  // `code` is from a fixed [A-Z2-9] alphabet (not user input), but escape defensively.
  const safeCode = escapeHtml(code);

  await sendEmail({
    to: [{ email: to, name: to.split('@')[0] }],
    subject: `${code} is your Imprint verification code`,
    htmlContent: renderBrandedEmail({
      eyebrow: 'Verify your email',
      heading: "Confirm it's you",
      body: `
          <p style="margin:0 0 32px;font-size:16px;color:#6b7a99;line-height:1.7;">
            Enter this code back in Imprint to continue. It works only for this email address.
          </p>

          <!-- Code box -->
          <div style="background:#161f30;border:1px solid rgba(79,255,176,0.2);border-radius:12px;padding:24px;text-align:center;margin-bottom:24px;">
            <p style="margin:0 0 8px;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#4fffb0;">Your verification code</p>
            <p style="margin:0;font-size:34px;font-weight:800;letter-spacing:8px;color:#f0f4ff;font-family:'SFMono-Regular',Consolas,'Liberation Mono',Menlo,monospace;">${safeCode}</p>
          </div>

          <p style="margin:0;font-size:13px;color:#6b7a99;line-height:1.6;">
            This code expires in <strong style="color:#f0f4ff;">30 minutes</strong>. If you didn't request it, you can safely ignore this email.
          </p>`,
    }),
  });
}

// Delivers a contact-form submission to the Imprint inbox. The visitor's email
// is set as replyTo so we can respond directly from the received message.
async function sendContactEmail({ firstName, lastName, email, feedback, category }) {
  const fullName = `${firstName} ${lastName}`.trim();
  const cat = category || 'Uncategorized';

  await sendEmail({
    to: [{ email: CONTACT_INBOX, name: 'Imprint' }],
    replyTo: { email, name: fullName || email },
    subject: `[${cat}] New contact form submission from ${fullName || email}`,
    htmlContent: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;color:#0f1623;">
  <h2 style="margin:0 0 16px;">New contact form submission</h2>
  <p style="margin:0 0 8px;"><strong>Category:</strong> ${escapeHtml(cat)}</p>
  <p style="margin:0 0 8px;"><strong>Name:</strong> ${escapeHtml(fullName) || '—'}</p>
  <p style="margin:0 0 8px;"><strong>Email:</strong> ${escapeHtml(email)}</p>
  <p style="margin:16px 0 4px;"><strong>Feedback:</strong></p>
  <p style="margin:0;white-space:pre-wrap;">${escapeHtml(feedback)}</p>
</body>
</html>`,
  });
}

// Notifies a user that someone accepted their friend request. `to` is the
// original requester's email; `requesterName` is their display name (for the
// greeting), `accepterName` the person who just accepted.
async function sendFriendAcceptedEmail(to, requesterName, accepterName) {
  const safeRequester = escapeHtml(requesterName);
  const safeAccepter = escapeHtml(accepterName);

  await sendEmail({
    to: [{ email: to, name: requesterName }],
    subject: `${accepterName} accepted your friend request 🎉`,
    htmlContent: renderBrandedEmail({
      eyebrow: 'You have a new friend',
      heading: `You're now friends<br>with ${safeAccepter}.`,
      body: `
          <p style="margin:0 0 32px;font-size:16px;color:#6b7a99;line-height:1.7;">
            Hi ${safeRequester}, good news — <strong style="color:#f0f4ff;">${safeAccepter}</strong> accepted your friend request on Imprint. You're now connected.
          </p>

          <!-- Divider -->
          <div style="height:1px;background:rgba(255,255,255,0.07);margin-bottom:32px;"></div>

          <p style="margin:0;font-size:13px;color:#6b7a99;line-height:1.6;">
            Open Imprint to see where you've both been on the map.
          </p>`,
    }),
  });
}

module.exports = { sendApprovalEmail, sendVerificationEmail, sendContactEmail, sendFriendAcceptedEmail };
