import { Router } from "express";
import { z } from "zod";
import { authenticate } from "../middleware/auth.js";
import { extractSpecification } from "../integrations/ai.js";

export const aiRouter = Router();
aiRouter.use(authenticate);

const extractSchema = z.object({ description: z.string().min(3).max(2000) });

aiRouter.post("/extract-specification", async (req, res) => {
  const parsed = extractSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Describe what you need first." });

  try {
    const result = await extractSpecification(parsed.data.description);
    res.json(result);
  } catch (err: any) {
    res.status(502).json({ error: err.message || "Couldn't reach the AI assistant right now." });
  }
});
