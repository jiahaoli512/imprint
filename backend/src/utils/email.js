const nodemailer = require('nodemailer');

const FROM = process.env.EMAIL_USER || 'donotreply.imprint@gmail.com';

if (!process.env.EMAIL_PASS) {
  console.warn('[email] WARNING: EMAIL_PASS is not set — approval emails will fail');
}

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: FROM,
    pass: process.env.EMAIL_PASS,
  },
});

async function sendApprovalEmail(to, name) {
  const displayName = name || to.split('@')[0];
  const adminPassword = process.env.ADMIN_PASSWORD || 'imprint';

  await transporter.sendMail({
    from: `"Imprint" <${FROM}>`,
    to,
    subject: "You're in — Welcome to Imprint 🗺️",
    html: `
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
            <span style="display:inline-block;width:32px;height:32px;border-radius:9px;background:linear-gradient(135deg,#4fffb0,#00c9ff);text-align:center;line-height:32px;font-size:16px;">✦</span>
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

          <p style="margin:0 0 12px;font-size:13px;font-weight:600;color:#6b7a99;text-transform:uppercase;letter-spacing:1px;">Admin access</p>
          <p style="margin:0 0 16px;font-size:14px;color:#6b7a99;line-height:1.6;">Use the password below to access the admin dashboard from the Imprint site footer.</p>
          <div style="background:#161f30;border:1px solid rgba(79,255,176,0.2);border-radius:12px;padding:20px 24px;text-align:center;margin-bottom:32px;">
            <p style="margin:0 0 4px;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#4fffb0;">Password</p>
            <p style="margin:0;font-size:24px;font-weight:800;letter-spacing:4px;color:#f0f4ff;">${adminPassword}</p>
          </div>

          <p style="margin:0;font-size:13px;color:#6b7a99;line-height:1.6;">
            Keep this password private. You can change it at any time from the admin dashboard.
          </p>
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding-top:32px;text-align:center;">
          <p style="margin:0;font-size:12px;color:#3a4560;">© 2026 Imprint · <a href="#" style="color:#3a4560;text-decoration:none;">Privacy</a> · <a href="#" style="color:#3a4560;text-decoration:none;">Unsubscribe</a></p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`,
  });
}

module.exports = { sendApprovalEmail };
