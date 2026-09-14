// Real M-Pesa Daraja (Lipa na M-Pesa Online / STK Push) integration.
// Requires a Safaricom Daraja app — see /README-INTEGRATIONS.md for how to get one.

const ENV = process.env.MPESA_ENV || "sandbox"; // "sandbox" | "production"
const BASE_URL = ENV === "production" ? "https://api.safaricom.co.ke" : "https://sandbox.safaricom.co.ke";

function timestamp(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    d.getFullYear().toString() +
    pad(d.getMonth() + 1) +
    pad(d.getDate()) +
    pad(d.getHours()) +
    pad(d.getMinutes()) +
    pad(d.getSeconds())
  );
}

async function getAccessToken(): Promise<string> {
  const key = process.env.MPESA_CONSUMER_KEY;
  const secret = process.env.MPESA_CONSUMER_SECRET;
  if (!key || !secret) throw new Error("M-Pesa credentials are not configured.");

  const auth = Buffer.from(`${key}:${secret}`).toString("base64");
  const res = await fetch(`${BASE_URL}/oauth/v1/generate?grant_type=client_credentials`, {
    headers: { Authorization: `Basic ${auth}` },
  });
  if (!res.ok) throw new Error(`M-Pesa auth failed: ${res.status}`);
  const data = (await res.json()) as { access_token: string };
  return data.access_token;
}

/** Normalizes a Kenyan phone number to the 2547XXXXXXXX format Daraja expects. */
export function normalizeKenyanPhone(input: string): string {
  const digits = input.replace(/\D/g, "");
  if (digits.startsWith("254")) return digits;
  if (digits.startsWith("0")) return "254" + digits.slice(1);
  if (digits.startsWith("7") || digits.startsWith("1")) return "254" + digits;
  return digits;
}

export interface StkPushResult {
  merchantRequestId: string;
  checkoutRequestId: string;
  responseDescription: string;
}

export async function initiateStkPush(params: {
  phone: string;
  amount: number;
  accountReference: string;
  description: string;
}): Promise<StkPushResult> {
  const shortcode = process.env.MPESA_SHORTCODE;
  const passkey = process.env.MPESA_PASSKEY;
  const callbackUrl = process.env.MPESA_CALLBACK_URL;
  if (!shortcode || !passkey || !callbackUrl) {
    throw new Error("M-Pesa shortcode, passkey, or callback URL is not configured.");
  }

  const token = await getAccessToken();
  const ts = timestamp();
  const password = Buffer.from(`${shortcode}${passkey}${ts}`).toString("base64");
  const phone = normalizeKenyanPhone(params.phone);

  const res = await fetch(`${BASE_URL}/mpesa/stkpush/v1/processrequest`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: ts,
      TransactionType: "CustomerPayBillOnline",
      Amount: Math.round(params.amount),
      PartyA: phone,
      PartyB: shortcode,
      PhoneNumber: phone,
      CallBackURL: callbackUrl,
      AccountReference: params.accountReference,
      TransactionDesc: params.description.slice(0, 20),
    }),
  });

  const data = (await res.json()) as any;
  if (!res.ok || data.errorCode) {
    throw new Error(data.errorMessage || data.ResponseDescription || "M-Pesa request failed.");
  }

  return {
    merchantRequestId: data.MerchantRequestID,
    checkoutRequestId: data.CheckoutRequestID,
    responseDescription: data.ResponseDescription,
  };
}

/** Shape of the callback Safaricom POSTs to MPESA_CALLBACK_URL. */
export interface StkCallbackBody {
  Body: {
    stkCallback: {
      MerchantRequestID: string;
      CheckoutRequestID: string;
      ResultCode: number;
      ResultDesc: string;
      CallbackMetadata?: { Item: Array<{ Name: string; Value?: string | number }> };
    };
  };
}

export function parseStkCallback(body: StkCallbackBody) {
  const cb = body.Body.stkCallback;
  const items = cb.CallbackMetadata?.Item || [];
  const find = (name: string) => items.find((i) => i.Name === name)?.Value;

  return {
    merchantRequestId: cb.MerchantRequestID,
    checkoutRequestId: cb.CheckoutRequestID,
    success: cb.ResultCode === 0,
    resultDesc: cb.ResultDesc,
    amount: Number(find("Amount")) || undefined,
    mpesaReceipt: find("MpesaReceiptNumber") as string | undefined,
    phone: find("PhoneNumber") ? String(find("PhoneNumber")) : undefined,
  };
}

/** Actively asks Safaricom for a transaction's status, instead of only
 *  waiting for their callback — sandbox callbacks are known to be
 *  unreliable, and this same fallback protects production too. */
export async function queryStkPush(checkoutRequestId: string): Promise<{
  resultCode: number | null;
  resultDesc: string;
}> {
  const shortcode = process.env.MPESA_SHORTCODE;
  const passkey = process.env.MPESA_PASSKEY;
  if (!shortcode || !passkey) throw new Error("M-Pesa shortcode/passkey not configured.");

  const token = await getAccessToken();
  const ts = timestamp();
  const password = Buffer.from(`${shortcode}${passkey}${ts}`).toString("base64");

  const res = await fetch(`${BASE_URL}/mpesa/stkpushquery/v1/query`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: ts,
      CheckoutRequestID: checkoutRequestId,
    }),
  });

  const data = (await res.json()) as any;
  // Safaricom returns errorCode 500.001.1001 while the transaction is still
  // being processed — that's not a failure, just "not resolved yet".
  if (data.errorCode) {
    return { resultCode: null, resultDesc: data.errorMessage || "Still processing" };
  }
  return {
    resultCode: data.ResultCode !== undefined ? Number(data.ResultCode) : null,
    resultDesc: data.ResultDesc || "",
  };
}
