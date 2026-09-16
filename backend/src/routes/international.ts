import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { authenticate } from "../middleware/auth.js";
import { getFxRate } from "../integrations/fx.js";

export const internationalRouter = Router();

// Kenya's standard VAT rate is a matter of public tax law, not a live-fetched
// figure — it changes only when the law changes, so it's safe to hardcode with
// a clear label. Import duty varies significantly by product/HS code, so it is
// NEVER assumed — the customer must supply a rate, or we flag it explicitly as
// unknown rather than presenting a guessed number as real.
const KENYA_VAT_RATE = 0.16;

const estimateSchema = z.object({
  productName: z.string().min(1),
  originCountry: z.string().min(1),
  productCost: z.number().positive(),
  currency: z.string().length(3),
  quantity: z.number().int().positive().default(1),
  freight: z.number().nonnegative().default(0),
  insurance: z.number().nonnegative().default(0),
  dutyRatePercent: z.number().min(0).max(100).optional(), // omitted = unknown, not assumed
  clearance: z.number().nonnegative().default(0),
  otherCosts: z.number().nonnegative().default(0),
});

async function computeEstimate(input: z.infer<typeof estimateSchema>) {
  const fx = await getFxRate(input.currency.toUpperCase(), "KES");

  const productCostKes = input.productCost * input.quantity * fx.rate;
  const cifKes = productCostKes + input.freight + input.insurance; // Cost + Insurance + Freight

  const dutyKnown = input.dutyRatePercent !== undefined;
  const dutyKes = dutyKnown ? cifKes * (input.dutyRatePercent! / 100) : 0;
  const vatKes = (cifKes + dutyKes) * KENYA_VAT_RATE;

  const landedCostKes = cifKes + dutyKes + vatKes + input.clearance + input.otherCosts;

  return {
    breakdown: {
      productCostKes: Math.round(productCostKes),
      freightKes: Math.round(input.freight),
      insuranceKes: Math.round(input.insurance),
      dutyKes: dutyKnown ? Math.round(dutyKes) : null,
      vatKes: Math.round(vatKes),
      clearanceKes: Math.round(input.clearance),
      otherCostsKes: Math.round(input.otherCosts),
    },
    landedCostKes: Math.round(landedCostKes),
    fx: { rate: fx.rate, source: fx.source, timestamp: fx.timestamp },
    vatRatePercent: KENYA_VAT_RATE * 100,
    dutyRateProvided: dutyKnown,
    verification: dutyKnown
      ? "Exchange rate is live. Duty rate as provided by you — confirm against your product's actual HS code before relying on this figure. Estimated — Verification Required."
      : "Exchange rate is live. Import duty rate was not provided and is NOT assumed — this estimate excludes duty. Provide your product's duty rate (from KRA's tariff schedule) for a complete figure. Estimated — Verification Required.",
    calculatedAt: new Date().toISOString(),
  };
}

// Public — no login required to try the estimator.
internationalRouter.post("/estimate", async (req, res) => {
  const parsed = estimateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Check the values you entered.", details: parsed.error.flatten() });

  try {
    const result = await computeEstimate(parsed.data);
    res.json(result);
  } catch (err: any) {
    res.status(502).json({ error: err.message || "Couldn't calculate an estimate right now." });
  }
});

// Saving requires an account, since it's tied to the customer's history.
internationalRouter.post("/estimate/save", authenticate, async (req, res) => {
  const parsed = estimateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Check the values you entered." });

  try {
    const result = await computeEstimate(parsed.data);
    const saved = await prisma.internationalEstimate.create({
      data: {
        userId: req.user!.sub,
        productName: parsed.data.productName,
        originCountry: parsed.data.originCountry,
        productCost: parsed.data.productCost,
        currency: parsed.data.currency.toUpperCase(),
        fxRate: result.fx.rate,
        fxSource: result.fx.source,
        fxTimestamp: result.fx.timestamp,
        freight: parsed.data.freight,
        insurance: parsed.data.insurance,
        dutyRate: parsed.data.dutyRatePercent ?? 0,
        vatRate: KENYA_VAT_RATE * 100,
        clearance: parsed.data.clearance,
        otherCosts: parsed.data.otherCosts,
        landedCostKes: result.landedCostKes,
        verificationNote: result.verification,
      },
    });
    res.status(201).json({ ...result, id: saved.id });
  } catch (err: any) {
    res.status(502).json({ error: err.message || "Couldn't save this estimate right now." });
  }
});

internationalRouter.get("/estimates/mine", authenticate, async (req, res) => {
  const estimates = await prisma.internationalEstimate.findMany({
    where: { userId: req.user!.sub },
    orderBy: { createdAt: "desc" },
  });
  res.json(estimates);
});
