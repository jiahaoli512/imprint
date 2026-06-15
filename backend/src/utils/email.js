const FROM_EMAIL = process.env.EMAIL_USER || 'donotreply.imprint@gmail.com';

if (!process.env.BREVO_API_KEY) {
  console.warn('[email] WARNING: BREVO_API_KEY is not set — approval emails will fail');
}

async function sendApprovalEmail(to, name) {
  const displayName = name || to.split('@')[0];

  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': process.env.BREVO_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      sender: { name: 'Imprint', email: FROM_EMAIL },
      to: [{ email: to, name: displayName }],
      subject: "You're approved — Welcome to Imprint 🗺️",
      htmlContent: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#080c14;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#080c14;padding:48px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

        <!-- Logo -->
        <tr><td style="padding-bottom:32px;text-align:center;">
          <span style="display:inline-flex;align-items:center;gap:10px;font-size:20px;font-weight:800;color:#f0f4ff;letter-spacing:-0.5px;">
            <span style="display:inline-flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:9px;background:linear-gradient(135deg,#4fffb0,#00c9ff);">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#080c14" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 10a2 2 0 0 0-2 2c0 1.02-.1 2.51-.26 4"/><path d="M14 13.12c0 2.38 0 6.38-1 8.88"/><path d="M17.29 21.02c.12-.6.43-2.3.5-3.02"/><path d="M2 12a10 10 0 0 1 18-6"/><path d="M2 17h2"/><path d="M2 12h1"/><path d="M6.45 7.51 7 6"/><path d="M10 6a6 6 0 0 1 4 1.13"/><path d="M17.4 12.24a6 6 0 0 0-.1-1.24"/><path d="M22 12c0 .66-.04 1.3-.1 1.93"/><path d="M4.6 11.1A10 10 0 0 0 4 12v2"/></svg>
            </span>
            Imprint
          </span>
        </td></tr>

        <!-- Card -->
        <tr><td style="background:#0f1623;border:1px solid rgba(255,255,255,0.07);border-radius:24px;padding:48px 40px;">

          <p style="margin:0 0 8px;font-size:13px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#4fffb0;">You're approved</p>
          <h1 style="margin:0 0 16px;font-size:32px;font-weight:900;letter-spacing:-1px;color:#f0f4ff;line-height:1.1;">Welcome to Imprint,<br>${displayName}.</h1>
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
            <p style="margin:0;font-size:18px;font-weight:700;color:#f0f4ff;">${to}</p>
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
          </div>

        </td></tr>

        <!-- Footer -->
        <tr><td style="padding-top:32px;text-align:center;">
          <p style="margin:0;font-size:12px;color:#3a4560;">© 2026 Imprint · <a href="#" style="color:#3a4560;text-decoration:none;">Privacy</a></p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`,
    }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || `Brevo API error ${res.status}`);
  }
}

module.exports = { sendApprovalEmail };
