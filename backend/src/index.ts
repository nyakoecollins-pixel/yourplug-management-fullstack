import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import { authRouter } from "./routes/auth.js";
import { requestsRouter } from "./routes/requests.js";
import { suppliersRouter } from "./routes/suppliers.js";
import { adminRouter } from "./routes/admin.js";
import { invoicesRouter } from "./routes/invoices.js";
import { paymentsRouter } from "./routes/payments.js";
import { meRouter } from "./routes/me.js";
import { internationalRouter } from "./routes/international.js";
import { fulfillmentRouter } from "./routes/fulfillment.js";
import { documentsRouter } from "./routes/documents.js";

const app = express();

// Render (and most PaaS platforms) sit behind a reverse proxy that sets
// X-Forwarded-For. Without this, express-rate-limit throws
// ERR_ERL_UNEXPECTED_X_FORWARDED_FOR on every request instead of rate-limiting
// correctly by real client IP. `1` trusts exactly one hop (Render's own proxy),
// which is the safe setting here — trusting further hops would let a client
// spoof their own IP via the header.
app.set("trust proxy", 1);

app.use(cors({ origin: process.env.CORS_ORIGIN || "http://localhost:5173", credentials: true }));
app.use(express.json());
app.use(cookieParser());

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 30 });
app.use("/api/auth", authLimiter, authRouter);
app.use("/api/requests", requestsRouter);
app.use("/api/suppliers", suppliersRouter);
app.use("/api/admin", adminRouter);
app.use("/api/invoices", invoicesRouter);
app.use("/api/payments", paymentsRouter);
app.use("/api/me", meRouter);
app.use("/api/international", internationalRouter);
app.use("/api", fulfillmentRouter);
app.use("/api", documentsRouter);

app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "Something went wrong on our end." });
});

const port = Number(process.env.PORT) || 4000;
app.listen(port, () => console.log(`YourPlug API listening on :${port}`));
