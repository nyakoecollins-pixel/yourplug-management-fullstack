// Real SMS sending via Africa's Talking. See /README-INTEGRATIONS.md for account setup.

const AT_ENV = process.env.AT_ENV || "sandbox"; // "sandbox" | "production"
const AT_BASE_URL = AT_ENV === "production"
  ? "https://api.africastalking.com/version1/messaging"
  : "https://api.sandbox.africastalking.com/version1/messaging";

export async function sendSms(to: string, message: string): Promise<{ ok: boolean; detail: string }> {
  const apiKey = process.env.AT_API_KEY;
  const username = process.env.AT_USERNAME;
  if (!apiKey || !username) {
    console.log(`[sms:not-configured] to ${to}: ${message}`);
    return { ok: false, detail: "SMS provider not configured" };
  }

  try {
    const body = new URLSearchParams({ username, to, message });
    if (process.env.AT_SENDER_ID) body.set("from", process.env.AT_SENDER_ID);

    const res = await fetch(AT_BASE_URL, {
      method: "POST",
      headers: {
        apiKey,
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body,
    });
    const data = (await res.json()) as any;
    const recipient = data?.SMSMessageData?.Recipients?.[0];
    if (!res.ok || !recipient || recipient.status !== "Success") {
      const detail = recipient?.status || data?.SMSMessageData?.Message || "Unknown SMS error";
      console.error(`[sms:failed] to ${to}: ${detail}`);
      return { ok: false, detail };
    }
    return { ok: true, detail: "sent" };
  } catch (err: any) {
    console.error(`[sms:error] to ${to}:`, err.message);
    return { ok: false, detail: err.message };
  }
}
