/**
 * Email Delivery Service for Eduline Publishers Quiz System
 * Priority: 1. Resend (RESEND_API_KEY) → 2. SMTP → 3. Console fallback
 * Sender: onboarding@resend.dev (for Resend testing without custom domain)
 */

async function sendOtpEmail(email, otp) {
  const resendApiKey = process.env.RESEND_API_KEY || process.env.EMAIL_PROVIDER_API_KEY;

  // Determine from address — use Resend's free sandbox sender unless a custom domain is configured
  const fromEmail = process.env.EMAIL_FROM || 'Eduline Quiz Portal <onboarding@resend.dev>';

  const subject = '🔑 Your Eduline Quiz Portal Verification OTP';

  const textBody = `Hello,

Your one-time verification code for the Eduline Publishers Quiz Portal is:

  ${otp}

This OTP is valid for 10 minutes. Do not share it with anyone.

If you did not request this, you can safely ignore this email.

Regards,
Eduline Publishers Team`;

  const htmlBody = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; background: #f0f4f8; padding: 32px 16px; color: #1e293b; }
      .wrapper { max-width: 520px; margin: 0 auto; }
      .card { background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
      .header { background: linear-gradient(135deg, #d97706 0%, #ea580c 100%); padding: 28px 32px; text-align: center; }
      .header-logo { font-size: 22px; font-weight: 900; color: #ffffff; letter-spacing: 1px; text-transform: uppercase; }
      .header-sub { font-size: 12px; color: rgba(255,255,255,0.85); margin-top: 4px; font-weight: 500; }
      .body { padding: 36px 32px; }
      .greeting { font-size: 16px; color: #334155; line-height: 1.5; margin-bottom: 20px; }
      .otp-box { background: #fffbeb; border: 2px dashed #f59e0b; border-radius: 14px; padding: 28px; text-align: center; margin: 24px 0; }
      .otp-label { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #92400e; margin-bottom: 12px; }
      .otp-code { font-family: 'Courier New', monospace; font-size: 42px; font-weight: 900; letter-spacing: 10px; color: #b45309; line-height: 1; }
      .otp-validity { font-size: 12px; color: #78716c; margin-top: 12px; font-weight: 600; }
      .note { font-size: 13px; color: #64748b; line-height: 1.7; background: #f8fafc; border-left: 3px solid #e2e8f0; padding: 12px 16px; border-radius: 0 8px 8px 0; margin: 20px 0; }
      .sign { font-size: 14px; font-weight: 600; color: #334155; margin-top: 24px; }
      .footer { padding: 20px 32px; background: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center; font-size: 11px; color: #94a3b8; }
    </style>
  </head>
  <body>
    <div class="wrapper">
      <div class="card">
        <div class="header">
          <div class="header-logo">EDULINE PUBLISHERS</div>
          <div class="header-sub">Student Quiz Portal — Email Verification</div>
        </div>
        <div class="body">
          <p class="greeting">Hello,<br><br>
          Your one-time verification code for the <strong>Eduline Publishers Quiz Portal</strong> registration is ready.</p>

          <div class="otp-box">
            <div class="otp-label">Your OTP Code</div>
            <div class="otp-code">${otp}</div>
            <div class="otp-validity">⏱ Valid for 10 minutes only</div>
          </div>

          <div class="note">
            🔒 <strong>Security Notice:</strong> Never share this code with anyone. Eduline Publishers staff will never ask for your OTP.
          </div>

          <p class="sign">Best regards,<br><strong>Eduline Publishers Team</strong></p>
        </div>
        <div class="footer">
          © ${new Date().getFullYear()} Eduline Publishers. All rights reserved.<br>
          This is an automated message — please do not reply.
        </div>
      </div>
    </div>
  </body>
</html>`;

  // ──────────────────────────────────────────────────────
  // 1. GMAIL SMTP (easiest & free for any email recipient)
  // ──────────────────────────────────────────────────────
  const gmailUser = process.env.GMAIL_USER || (process.env.SMTP_USER && process.env.SMTP_USER.includes('@gmail.com') ? process.env.SMTP_USER : null);
  const gmailPass = process.env.GMAIL_APP_PASSWORD || process.env.GMAIL_PASS || (gmailUser ? process.env.SMTP_PASS : null);

  if (gmailUser && gmailPass) {
    try {
      const nodemailer = require('nodemailer');
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: gmailUser.trim(),
          pass: gmailPass.trim().replace(/\s+/g, ''), // strip spaces if copied from Google App Password
        },
      });

      const senderFrom = process.env.EMAIL_FROM || `Eduline Quiz Portal <${gmailUser.trim()}>`;
      const info = await transporter.sendMail({
        from: senderFrom,
        to: email,
        subject,
        text: textBody,
        html: htmlBody,
      });

      console.log(`✅ [Email] OTP sent successfully via Gmail to ${email} (ID: ${info.messageId})`);
      return { success: true, provider: 'gmail_smtp', messageId: info.messageId };
    } catch (gmailErr) {
      console.warn(`⚠️ [Email] Gmail SMTP error:`, gmailErr.message);
    }
  }

  // ──────────────────────────────────────────────────────
  // 2. Custom SMTP (Hostinger, Brevo, SendGrid, Amazon SES)
  // ──────────────────────────────────────────────────────
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    try {
      const nodemailer = require('nodemailer');
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true' || Number(process.env.SMTP_PORT) === 465,
        auth: {
          user: process.env.SMTP_USER.trim(),
          pass: process.env.SMTP_PASS.trim(),
        },
      });

      const senderFrom = process.env.EMAIL_FROM || `Eduline Quiz Portal <${process.env.SMTP_USER.trim()}>`;
      const info = await transporter.sendMail({
        from: senderFrom,
        to: email,
        subject,
        text: textBody,
        html: htmlBody,
      });

      console.log(`✅ [Email] OTP sent via SMTP to ${email} (ID: ${info.messageId})`);
      return { success: true, provider: 'smtp', messageId: info.messageId };
    } catch (smtpError) {
      console.warn(`⚠️ [Email] SMTP failed:`, smtpError.message);
    }
  }

  // ──────────────────────────────────────────────────────
  // 3. RESEND API
  // ──────────────────────────────────────────────────────
  if (resendApiKey && resendApiKey.trim()) {
    try {
      let resendResult = null;
      try {
        const { Resend } = require('resend');
        const resend = new Resend(resendApiKey.trim());
        const { data, error } = await resend.emails.send({
          from: fromEmail,
          to: [email],
          subject,
          text: textBody,
          html: htmlBody,
        });
        if (error) throw new Error(error.message || 'Resend SDK error');
        resendResult = data;
        console.log(`✅ [Email] OTP sent via Resend SDK to ${email} (ID: ${resendResult?.id})`);
        return { success: true, provider: 'resend_sdk', id: resendResult?.id };
      } catch (sdkErr) {
        if (!sdkErr.message?.includes('Resend SDK error')) {
          const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${resendApiKey.trim()}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from: fromEmail,
              to: [email],
              subject,
              text: textBody,
              html: htmlBody,
            }),
          });
          const resData = await response.json().catch(() => ({}));
          if (response.ok) {
            console.log(`✅ [Email] OTP sent via Resend fetch to ${email} (ID: ${resData.id})`);
            return { success: true, provider: 'resend_fetch', id: resData.id };
          }
          console.warn(`⚠️ [Email] Resend API error:`, resData);
        } else {
          throw sdkErr;
        }
      }
    } catch (resendError) {
      console.warn(`⚠️ [Email] Resend failed:`, resendError.message);
    }
  }

  // ──────────────────────────────────────────────────────
  // 4. Console Fallback (Development & Testing)
  // ──────────────────────────────────────────────────────
  console.log('────────────────────────────────────────────────────────');
  console.log(`📧 [EMAIL OTP DISPATCHED] To: ${email}`);
  console.log(`🔑 OTP CODE: [ ${otp} ] (Expires in 10 minutes)`);
  console.log('────────────────────────────────────────────────────────');
  return { success: true, provider: 'console_fallback' };
}

module.exports = { sendOtpEmail };
