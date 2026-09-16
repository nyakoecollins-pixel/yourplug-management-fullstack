// Live currency conversion via open.er-api.com — free, no API key required,
// covers KES and ~160 other currencies. See https://www.exchangerate-api.com/docs/free
export interface FxResult {
  rate: number;
  source: string;
  timestamp: Date;
}

export async function getFxRate(fromCurrency: string, toCurrency: string): Promise<FxResult> {
  const res = await fetch(`https://open.er-api.com/v6/latest/${encodeURIComponent(fromCurrency)}`);
  if (!res.ok) throw new Error("Couldn't reach the exchange rate provider.");

  const data = (await res.json()) as any;
  if (data.result !== "success" || !data.rates?.[toCurrency]) {
    throw new Error(`No exchange rate available for ${fromCurrency} to ${toCurrency}.`);
  }

  return {
    rate: data.rates[toCurrency],
    source: "open.er-api.com (reference rates)",
    timestamp: new Date(data.time_last_update_utc || Date.now()),
  };
}
