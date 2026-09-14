// Real email sending via SMTP. Works with Gmail (app password), SendGrid, Resend, Mailgun, or any SMTP provider.
// See /README-INTEGRATIONS.md for setup.
import nodemailer from "nodemailer";

let transporter: ReturnType<typeof nodemailer.createTransport> | null = null;

function getTransporter() {
  if (transporter) return transporter;
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT) || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) return null;

  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
  return transporter;
}

export async function sendEmail(to: string, subject: string, html: string): Promise<{ ok: boolean; detail: string }> {
  const t = getTransporter();
  if (!t) {
    console.log(`[email:not-configured] to ${to} — subject: ${subject}`);
    return { ok: false, detail: "Email provider not configured" };
  }
  try {
    await t.sendMail({
      from: process.env.SMTP_FROM || `"YourPlug Management" <no-reply@yourplug.co.ke>`,
      to,
      subject,
      html,
    });
    return { ok: true, detail: "sent" };
  } catch (err: any) {
    console.error(`[email:error] to ${to}:`, err.message);
    return { ok: false, detail: err.message };
  }
}
