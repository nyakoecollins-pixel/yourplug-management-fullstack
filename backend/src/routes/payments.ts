import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { authenticate } from "../middleware/auth.js";
import { audit } from "../utils/audit.js";
import { notify } from "../utils/notify.js";
import { initiateStkPush, parseStkCallback, queryStkPush, type StkCallbackBody } from "../integrations/mpesa.js";

export const paymentsRouter = Router();

const initiateSchema = z.object({
  invoiceId: z.string(),
  phone: z.string().min(9),
});

// Customer-initiated: triggers the M-Pesa PIN prompt on their phone.
paymentsRouter.post("/mpesa/initiate", authenticate, async (req, res) => {
  const parsed = initiateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Enter a valid phone number." });

  const invoice = await prisma.invoice.findUnique({
    where: { id: parsed.data.invoiceId },
    include: { request: true },
  });
  if (!invoice) return res.status(404).json({ error: "Invoice not found." });
  if (invoice.request.customerId !== req.user!.sub) {
    return res.status(403).json({ error: "This invoice doesn't belong to you." });
  }
  if (invoice.status === "PAID") return res.status(409).json({ error: "This invoice is already paid." });

  try {
    const stk = await initiateStkPush({
      phone: parsed.data.phone,
      amount: invoice.total,
      accountReference: invoice.paymentReference,
      description: `YourPlug ${invoice.number}`,
    });

    // Idempotency key = Safaricom's own CheckoutRequestID — a retried webhook
    // for the same STK push can never create a second Payment record.
    await prisma.payment.create({
      data: {
        invoiceId: invoice.id,
        amount: invoice.total,
        phone: parsed.data.phone,
        status: "pending",
        idempotencyKey: stk.checkoutRequestId,
        merchantRequestId: stk.merchantRequestId,
        checkoutRequestId: stk.checkoutRequestId,
      },
    });
    await audit(req.user!.sub, "payment.initiated", "Invoice", invoice.id);

    res.json({ message: "Check your phone and enter your M-Pesa PIN.", checkoutRequestId: stk.checkoutRequestId });
  } catch (err: any) {
    res.status(502).json({ error: err.message || "Couldn't reach M-Pesa. Try again shortly." });
  }
});

/** Shared by both the webhook and the query-fallback path — the only two
 *  places a payment is ever allowed to move out of "pending". */
async function finalizePayment(
  checkoutRequestId: string,
  result: { success: boolean; resultDesc: string; amount?: number; mpesaReceipt?: string }
) {
  const payment = await prisma.payment.findUnique({
    where: { checkoutRequestId },
    include: { invoice: { include: { request: { include: { customer: true, agent: true } } } } },
  });
  if (!payment || payment.status !== "pending") return payment;

  if (!result.success) {
    return prisma.payment.update({
      where: { id: payment.id },
      data: { status: "failed", resultDesc: result.resultDesc },
    });
  }

  // Verify the amount actually paid matches the invoice — never trust the source blindly,
  // whether it came from the webhook or the query API.
  if (result.amount && result.amount !== payment.amount) {
    return prisma.payment.update({
      where: { id: payment.id },
      data: { status: "failed", resultDesc: `Amount mismatch: expected ${payment.amount}, got ${result.amount}` },
    });
  }

  const [updated] = await prisma.$transaction([
    prisma.payment.update({
      where: { id: payment.id },
      data: { status: "confirmed", mpesaReceipt: result.mpesaReceipt, resultDesc: result.resultDesc },
    }),
    prisma.invoice.update({ where: { id: payment.invoice.id }, data: { status: "PAID" } }),
    prisma.procurementRequest.update({
      where: { id: payment.invoice.requestId },
      data: { status: "PURCHASED" },
    }),
    prisma.requestEvent.create({
      data: { requestId: payment.invoice.requestId, label: `Payment confirmed via M-Pesa (${result.mpesaReceipt || "receipt pending"})` },
    }),
  ]);

  await audit(null, "payment.confirmed", "Invoice", payment.invoice.id);

  const customer = payment.invoice.request.customer;
  const agent = payment.invoice.request.agent;
  await notify({
    email: customer.email,
    phone: customer.phone,
    subject: `Payment received — ${payment.invoice.number}`,
    html: `<p>We've received your payment of KSh ${payment.amount.toLocaleString()} for invoice ${payment.invoice.number}. We're proceeding with your purchase.</p>`,
    smsText: `YourPlug: payment of KSh ${payment.amount.toLocaleString()} received for ${payment.invoice.number}. Proceeding with your order.`,
  });
  if (agent?.email) {
    await notify({
      email: agent.email,
      subject: `Payment confirmed — ${payment.invoice.number}`,
      html: `<p>Payment for ${payment.invoice.number} (${payment.invoice.request.item}) has been confirmed. Proceed with the purchase.</p>`,
      smsText: "",
    });
  }

  return updated;
}

// Frontend polls this while waiting for confirmation. If the webhook hasn't
// landed yet and enough time has passed, this actively asks Safaricom for
// the real status instead of waiting indefinitely — sandbox callbacks are
// known to be unreliable, and this fallback protects production too.
paymentsRouter.get("/mpesa/status/:checkoutRequestId", authenticate, async (req, res) => {
  let payment = await prisma.payment.findUnique({
    where: { checkoutRequestId: req.params.checkoutRequestId },
    include: { invoice: { include: { request: true } } },
  });
  if (!payment) return res.status(404).json({ error: "Payment not found." });
  if (payment.invoice.request.customerId !== req.user!.sub) {
    return res.status(403).json({ error: "Not your payment." });
  }

  const ageMs = Date.now() - payment.createdAt.getTime();
  if (payment.status === "pending" && ageMs > 15000) {
    try {
      const queryResult = await queryStkPush(req.params.checkoutRequestId);
      if (queryResult.resultCode !== null) {
        await finalizePayment(req.params.checkoutRequestId, {
          success: queryResult.resultCode === 0,
          resultDesc: queryResult.resultDesc,
        });
        payment = await prisma.payment.findUnique({ where: { checkoutRequestId: req.params.checkoutRequestId } }) ?? payment;
      }
    } catch (err) {
      // Query failed (e.g. rate limited) — leave status as-is, frontend will poll again.
      console.error("M-Pesa query fallback failed:", err);
    }
  }

  res.json({ status: payment.status, resultDesc: payment.resultDesc });
});

// Safaricom calls this directly — no user is logged in, so no `authenticate` middleware.
paymentsRouter.post("/mpesa/webhook", async (req, res) => {
  try {
    const body = req.body as StkCallbackBody;
    const result = parseStkCallback(body);
    await finalizePayment(result.checkoutRequestId, result);
    res.status(200).json({ received: true });
  } catch (err) {
    console.error("M-Pesa webhook error:", err);
    // Still 200 — Safaricom will keep retrying a non-200, and we don't want a
    // transient error here to spam this endpoint. The failure is logged for review.
    res.status(200).json({ received: true });
  }
});
