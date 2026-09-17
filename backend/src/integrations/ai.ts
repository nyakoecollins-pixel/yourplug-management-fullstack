// AI-assisted procurement specification extraction, via the Claude API.
// See /README-INTEGRATIONS.md for how to get an API key.
export interface ExtractedSpec {
  item: string | null;
  quantity: number | null;
  brand: string | null;
  specifications: Array<{ field: string; value: string; source: "stated" | "inferred" }>;
  missing: string[];
}

const SYSTEM_PROMPT = `You extract a structured procurement specification from a customer's free-text description of something they want to buy.

Rules, followed strictly:
- Only use information the customer actually stated, or specifications you can reasonably infer from context (e.g. "for my shop" implies commercial use).
- NEVER invent a specific number, brand, or spec the customer didn't mention or strongly imply. If you're not confident, leave it out and list it under "missing" instead.
- Every entry in "specifications" must be tagged "stated" (the customer said this) or "inferred" (you reasoned it from context) — never present an inferred value as stated.
- "missing" should list important specification fields a procurement agent would need but weren't provided (e.g. dimensions, voltage, color, preferred brand) — keep this to the 2-4 most decision-relevant gaps, not an exhaustive checklist.
- Respond with ONLY valid JSON matching this exact shape, no other text:
{"item": string|null, "quantity": number|null, "brand": string|null, "specifications": [{"field": string, "value": string, "source": "stated"|"inferred"}], "missing": [string]}`;

export async function extractSpecification(description: string): Promise<ExtractedSpec> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("AI assistant is not configured.");

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 1000,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: description }],
    }),
  });

  if (!res.ok) {
    const errBody = await res.text().catch(() => "");
    throw new Error(`AI assistant request failed (${res.status}): ${errBody.slice(0, 200)}`);
  }

  const data = (await res.json()) as any;
  const text = data.content?.find((b: any) => b.type === "text")?.text;
  if (!text) throw new Error("AI assistant returned an unexpected response.");

  let parsed: ExtractedSpec;
  try {
    // Strip stray markdown fences in case the model adds them despite instructions.
    const cleaned = text.trim().replace(/^```json\s*/i, "").replace(/```\s*$/, "");
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error("Couldn't parse the AI assistant's response.");
  }

  return {
    item: parsed.item ?? null,
    quantity: parsed.quantity ?? null,
    brand: parsed.brand ?? null,
    specifications: Array.isArray(parsed.specifications) ? parsed.specifications : [],
    missing: Array.isArray(parsed.missing) ? parsed.missing : [],
  };
}
