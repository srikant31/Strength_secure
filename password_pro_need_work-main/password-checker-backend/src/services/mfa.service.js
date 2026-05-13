import nodemailer from 'nodemailer';
import { logger } from '../utils/logger.js';

/* ── SMTP Transporter ──────────────────────────────────────────────────── */
let transporter;

function getTransporter() {
  if (transporter) return transporter;

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  logger.info(`SMTP Transporter initialized (host: ${process.env.SMTP_HOST})`);
  return transporter;
}

const FROM = `"SecureVault Security" <${process.env.SMTP_USER || 'security@securevault.com'}>`;

/* ── Helpers ───────────────────────────────────────────────────────────── */
export function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6 digits
}

/* ── Send OTP Email ────────────────────────────────────────────────────── */
export async function sendOtpEmail(to, otp) {
  const mail = getTransporter();
  const info = await mail.sendMail({
    from: FROM,
    to,
    subject: 'Your SecureVault Login OTP',
    text: `Your OTP for SecureVault is: ${otp}. It will expire in 10 minutes.`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:24px;">
        <h2 style="color:#00e5a0;">SecureVault</h2>
        <p>Your one-time password is:</p>
        <div style="font-size:32px;font-weight:bold;letter-spacing:0.3em;padding:16px;background:#f4f4f4;border-radius:8px;text-align:center;">${otp}</div>
        <p style="color:#888;font-size:13px;margin-top:16px;">This code expires in 10 minutes. If you didn't request this, please ignore this email.</p>
      </div>
    `,
  });
  logger.info(`OTP Email sent to ${to}. MessageId: ${info.messageId}`);
}

/* ── Send Welcome Email ────────────────────────────────────────────────── */
export async function sendWelcomeEmail(to, username) {
  const mail = getTransporter();
  const info = await mail.sendMail({
    from: FROM,
    to,
    subject: 'Welcome to SecureVault!',
    text: `Hello ${username},\n\nWelcome to SecureVault! Your account has been securely registered.`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:24px;">
        <h2 style="color:#00e5a0;">Welcome to SecureVault, ${username}!</h2>
        <p>Your account has been securely registered. You can now:</p>
        <ul>
          <li>Check password strength</li>
          <li>Store passwords in your vault</li>
          <li>Monitor for data breaches</li>
        </ul>
        <p style="color:#888;font-size:13px;">Stay safe out there!</p>
      </div>
    `,
  });
  logger.info(`Welcome Email sent to ${to}. MessageId: ${info.messageId}`);
}

/* ── Send Login Alert Email ────────────────────────────────────────────── */
async function getLocation(ip) {
  try {
    if (!ip || ip === '::1' || ip === '127.0.0.1' || ip.startsWith('::ffff:127')) {
      return 'Localhost (Development)';
    }
    const res = await fetch(`http://ip-api.com/json/${ip}?fields=status,city,regionName,country`);
    const data = await res.json();
    if (data.status === 'success') {
      return `${data.city}, ${data.regionName}, ${data.country}`;
    }
  } catch (_) { /* silent fail */ }
  return 'Location unavailable';
}

export async function sendLoginAlertEmail(to, meta = {}) {
  const { ip = '', userAgent = 'Unknown' } = meta;
  const now = new Date();
  const location = await getLocation(ip);
  const dateStr = now.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });

  const mail = getTransporter();
  const info = await mail.sendMail({
    from: FROM,
    to,
    subject: 'New Login to SecureVault',
    text: `A new login was detected.\n\nDate: ${dateStr}\nTime: ${timeStr}\nLocation: ${location}\nDevice: ${userAgent}\n\nIf this was not you, secure your account immediately.`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:24px;">
        <h2 style="color:#00e5a0;">New Login Detected</h2>
        <p>A new login was detected on your SecureVault account.</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0;">
          <tr><td style="padding:8px;color:#888;">Date</td><td style="padding:8px;font-weight:600;">${dateStr}</td></tr>
          <tr><td style="padding:8px;color:#888;">Time</td><td style="padding:8px;font-weight:600;">${timeStr}</td></tr>
          <tr><td style="padding:8px;color:#888;">Location</td><td style="padding:8px;font-weight:600;">${location}</td></tr>
          <tr><td style="padding:8px;color:#888;">Device</td><td style="padding:8px;font-weight:600;">${userAgent}</td></tr>
        </table>
        <p style="color:#ef4444;">If this was not you, please <a href="${process.env.CLIENT_ORIGIN || 'http://localhost:5173'}/forgot-password">secure your account immediately</a>.</p>
      </div>
    `,
  });
  logger.info(`Login Alert Email sent to ${to}. MessageId: ${info.messageId}`);
}

/* ── Send Password Reset Email ─────────────────────────────────────────── */
export async function sendPasswordResetEmail(to, authUrl) {
  const mail = getTransporter();
  const info = await mail.sendMail({
    from: FROM,
    to,
    subject: 'SecureVault Password Reset',
    text: `You requested a password reset. Click here: ${authUrl}\nIf you did not request this, ignore this email.`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:24px;">
        <h2 style="color:#00e5a0;">Password Reset</h2>
        <p>You requested a password reset for your SecureVault account.</p>
        <a href="${authUrl}" style="display:inline-block;padding:12px 28px;background:#00e5a0;color:#000;font-weight:700;text-decoration:none;border-radius:8px;margin:16px 0;">Reset My Password</a>
        <p style="color:#888;font-size:13px;">This link expires in 1 hour. If you didn't request this, please ignore this email.</p>
      </div>
    `,
  });
  logger.info(`Password Reset Email sent to ${to}. MessageId: ${info.messageId}`);
}
