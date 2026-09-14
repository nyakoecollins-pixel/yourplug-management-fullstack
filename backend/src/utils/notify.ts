import { sendEmail } from "../integrations/email.js";
import { sendSms } from "../integrations/sms.js";

interface NotifyOptions {
  email?: string;
  phone?: string;
  subject: string;
  html: string;
  smsText: string;
}

/** Sends both channels where an address is available. Never throws — a notification
 *  failure should never break the procurement flow that triggered it. */
export async function notify({ email, phone, subject, html, smsText }: NotifyOptions) {
  const results: Record<string, boolean> = {};
  if (email) {
    const r = await sendEmail(email, subject, html);
    results.email = r.ok;
  }
  if (phone) {
    const r = await sendSms(phone, smsText);
    results.sms = r.ok;
  }
  return results;
}
