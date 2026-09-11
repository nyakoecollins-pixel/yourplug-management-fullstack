# YourPlug Management — Production Architecture Reference

This document is the build spec for the real backend behind the front-end prototype (`YourPlugManagement.jsx`). The prototype demonstrates UI/UX and flow only — no auth, database, or payment provider is live in it. Nothing here should be treated as implemented until built and security-reviewed.

## 1. Suggested stack

- **API**: Node.js (NestJS or Express) or Django — either supports clean module separation per domain below.
- **Database**: PostgreSQL, with Prisma or an equivalent typed ORM.
- **Queue/background jobs**: Redis + BullMQ (or Celery on Python) for notifications, webhook processing, recurring procurement, retries.
- **File storage**: S3-compatible object storage with signed URLs, private by default.
- **Auth**: JWT access token (short-lived) + rotating refresh token, httpOnly cookie storage. bcrypt/argon2 for password hashing.
- **Frontend**: Next.js (or the existing React SPA) consuming the API — server components for public/SEO pages, client-rendered dashboards.

## 2. Core database entities

```
User            (id, role[customer|agent|admin|super_admin], email, phone, password_hash,
                 email_verified_at, phone_verified_at, mfa_enabled, failed_logins, locked_until)
Organization    (id, name, type[individual|corporate])
Department      (id, org_id, name, spend_limit)
OrgMembership   (user_id, org_id, department_id, role[employee|manager|procurement_officer|finance|admin])
Address         (id, user_id, label, recipient_name, phone, line1, line2, city, geo_lat, geo_lng)

ProcurementRequest (id, ref["YPM-YYYYMM-XXXXX"], customer_id, org_id, agent_id, status, urgency,
                    scope[local|international], budget, currency, required_by, created_at)
RequestItem     (id, request_id, name, description, quantity)
Specification   (id, request_id, field, value, source[customer|ai_inferred], confirmed boolean)
Attachment      (id, request_id, uploaded_by, file_key, mime_type, scanned_status)

Supplier        (id, name, category, contact, location, website, verified boolean,
                 reliability_score, price_score, delivery_score, warranty_score, last_verified_at)
SupplierQuote   (id, request_id, supplier_id, price, currency, delivery_estimate, warranty_terms,
                 spec_match_score, computed_score, created_by)
Negotiation     (id, quote_id, original_price, target_price, final_price, notes, savings)
Recommendation  (id, request_id, quote_id, reason, created_by)
Approval        (id, request_id, approver_id, decision, decided_at, threshold_rule_id)

Invoice         (id, number, request_id, customer_id, subtotal, service_fee, delivery_fee, tax,
                 discount, total, currency, status, due_date, payment_reference)
InvoiceItem     (id, invoice_id, description, quantity, unit_price)
Payment         (id, invoice_id, provider, provider_ref, amount, status, idempotency_key, raw_payload)
PurchaseOrder   (id, number, request_id, supplier_id, items_json, total, terms, expected_delivery)

Delivery        (id, request_id, provider, tracking_number, pickup, destination, status, fee)
TrackingEvent   (id, delivery_id, status, note, occurred_at, source)

Message         (id, request_id, sender_id, visibility[customer|internal], body, created_at)
Document        (id, request_id, type, file_key, visible_to[customer|agent|admin])
Notification    (id, user_id, channel[email|sms|whatsapp|in_app], template, payload, sent_at, read_at)

Return          (id, request_id, reason, status, evidence_key)
Refund          (id, return_id, amount, status)

AuditLog        (id, actor_id, action, object_type, object_id, before_json, after_json, ip, created_at)
```

Index every foreign key, `ProcurementRequest.status`, `ProcurementRequest.ref` (unique), `Invoice.payment_reference` (unique), and `User.email`/`User.phone` (unique).

## 3. API surface (REST, versioned `/api/v1`)

| Module | Examples |
|---|---|
| Auth | `POST /auth/register`, `POST /auth/verify-email`, `POST /auth/verify-otp`, `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`, `POST /auth/password-reset` |
| Customer | `GET /me`, `GET /me/addresses`, `PATCH /me` |
| Procurement | `POST /requests`, `GET /requests/:id`, `PATCH /requests/:id`, `POST /requests/:id/attachments` |
| AI | `POST /ai/specification` (input: free text + attachments → structured spec with `source` tags; never auto-submits) |
| Supplier | `GET /suppliers`, `POST /suppliers`, `POST /suppliers/:id/verify` |
| Quotation | `POST /requests/:id/quotes`, `POST /requests/:id/compare`, `POST /requests/:id/recommend` |
| Approval | `POST /requests/:id/approve`, `POST /requests/:id/decline` |
| Invoice | `POST /invoices`, `GET /invoices/:id/pdf`, `POST /invoices/:id/send` |
| Payment | `POST /payments/mpesa/stk-push`, `POST /webhooks/mpesa` (server-to-server only), `POST /payments/reconcile` |
| Purchase Order | `POST /purchase-orders`, `GET /purchase-orders/:id/pdf` |
| Delivery | `POST /deliveries`, `PATCH /deliveries/:id/status`, `GET /track/:ref` (public, rate-limited) |
| Admin | `GET /admin/metrics`, `GET /admin/orders`, `POST /admin/orders/:id/assign` |

Every write endpoint: server-side validation (never trust client payloads), RBAC middleware, and an `AuditLog` write for state-changing actions.

## 4. Payment integration (M-Pesa Daraja)

- Credentials (consumer key/secret, passkey, shortcode) live only in server environment variables — never shipped to the client.
- STK Push initiated server-side; the client only receives a checkout request ID to poll.
- Daraja **callback webhook** is the sole source of truth for payment confirmation — the frontend can never mark an invoice paid.
- Verify webhook signature/source IP, store the raw payload, and process with an **idempotency key** (`CheckoutRequestID`) so a retried callback cannot double-credit an invoice.
- On confirmed payment: match by `Invoice.payment_reference` → verify amount → mark `Paid` → update request status → enqueue notifications to customer + agent → write `AuditLog`.
- Unmatched transactions go to a manual reconciliation queue for admin review, never auto-discarded.

## 5. Delivery/courier abstraction

```ts
interface DeliveryProvider {
  createBooking(pickup, destination, package): Promise<{ trackingNumber, fee }>;
  getStatus(trackingNumber): Promise<TrackingEvent[]>;
  cancel(trackingNumber): Promise<void>;
}
// Implementations: UberProvider, DHLProvider, FargoProvider, G4SProvider, ManualProvider
```

All admin/agent delivery actions call the interface, never a specific provider's SDK directly, so new couriers plug in without touching calling code.

## 6. Security checklist (must-have before production)

- [ ] Argon2id or bcrypt (cost ≥ 12) password hashing; never log or store plaintext.
- [ ] Email verification token + phone OTP, both with expiry and resend rate limiting.
- [ ] Login rate limiting + progressive lockout after repeated failures.
- [ ] CSRF protection on cookie-based sessions; SameSite cookies.
- [ ] Output encoding and parameterized queries everywhere (ORM handles most of this — never string-concatenate SQL).
- [ ] File upload validation: type allowlist, size limits, virus/malware scan before storage, private bucket with signed URLs.
- [ ] TLS everywhere; encrypt sensitive columns (national ID, payment refs) at rest if stored.
- [ ] Secure headers (CSP, HSTS, X-Frame-Options, X-Content-Type-Options).
- [ ] Admin accounts require 2FA.
- [ ] Idempotency keys on all payment and purchase-order-creating endpoints.
- [ ] Structured audit log, immutable (append-only table or write-once store) for all listed events in the spec.
- [ ] Secrets in a manager (AWS Secrets Manager / Vault / platform env vars) — never committed, never in frontend bundles.
- [ ] Separate `.env` per environment (dev/staging/prod), least-privilege DB credentials per service.

## 7. Build order (matches the original brief)

**Phase 1** — auth, customer portal, request system, admin + agent dashboards, supplier management, quote comparison, approval, invoicing, M-Pesa architecture, notifications, manual delivery, audit logs.
**Phase 2** — AI assistant, supplier scoring automation, negotiation module, Uber/DHL integration, automated tracking, WhatsApp, analytics.
**Phase 3** — corporate accounts, recurring procurement, international landed-cost engine, advanced AI recommendations, enterprise approval workflows.

## 8. What the prototype does and does not cover

**Covers (clickable, with mock/demo data):** public marketing site, registration/login screens, customer dashboard, 4-step request wizard with an AI-assist mock, request detail with supplier comparison and timeline, tracking page, admin overview/orders/workspace/suppliers/agents/invoices/reports/audit views.

**Does not cover (needs the real backend above):** actual authentication and session security, real database persistence, live M-Pesa transactions, real courier tracking, file storage/malware scanning, email/SMS delivery, and role enforcement beyond the UI layer.
