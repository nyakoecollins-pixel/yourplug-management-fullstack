import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { authenticate } from "../middleware/auth.js";
import { audit } from "../utils/audit.js";
import { notify } from "../utils/notify.js";
import { initiateStkPush, parseStkCallback, type StkCallbackBody } from "../integrations/mpesa.js";

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

// Frontend polls this while waiting for the callback below to land.
paymentsRouter.get("/mpesa/status/:checkoutRequestId", authenticate, async (req, res) => {
  const payment = await prisma.payment.findUnique({
    where: { checkoutRequestId: req.params.checkoutRequestId },
    include: { invoice: { include: { request: true } } },
  });
  if (!payment) return res.status(404).json({ error: "Payment not found." });
  if (payment.invoice.request.customerId !== req.user!.sub) {
    return res.status(403).json({ error: "Not your payment." });
  }
  res.json({ status: payment.status, resultDesc: payment.resultDesc });
});

// Safaricom calls this directly — no user is logged in, so no `authenticate` middleware.
// This is the ONLY thing that is ever allowed to mark a payment confirmed.
paymentsRouter.post("/mpesa/webhook", async (req, res) => {
  try {
    const body = req.body as StkCallbackBody;
    const result = parseStkCallback(body);

    const payment = await prisma.payment.findUnique({
      where: { checkoutRequestId: result.checkoutRequestId },
      include: { invoice: { include: { request: { include: { customer: true, agent: true } } } } },
    });

    // Always 200 an unrecognized or already-processed callback so Safaricom doesn't retry forever.
    if (!payment) return res.status(200).json({ received: true });
    if (payment.status !== "pending") return res.status(200).json({ received: true, alreadyProcessed: true });

    if (!result.success) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: "failed", resultDesc: result.resultDesc },
      });
      return res.status(200).json({ received: true });
    }

    // Verify the amount actually paid matches the invoice — never trust the callback blindly.
    if (result.amount && result.amount !== payment.amount) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: "failed", resultDesc: `Amount mismatch: expected ${payment.amount}, got ${result.amount}` },
      });
      return res.status(200).json({ received: true });
    }

    await prisma.$transaction([
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

    res.status(200).json({ received: true });
  } catch (err) {
    console.error("M-Pesa webhook error:", err);
    // Still 200 — Safaricom will keep retrying a non-200, and we don't want a
    // transient error here to spam this endpoint. The failure is logged for review.
    res.status(200).json({ received: true });
  }
});
