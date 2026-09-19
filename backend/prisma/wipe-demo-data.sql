-- One-time wipe of all demo data. Run this ONCE, manually, against your
-- production database — it is never run automatically by the app.
-- CASCADE handles foreign keys, so table order doesn't matter here.
TRUNCATE TABLE
  "AuditLog", "Payment", "Invoice", "PurchaseOrder", "Delivery",
  "SupplierQuote", "RequestEvent", "Message", "Document",
  "InternationalEstimate", "LegalAcceptance", "VerificationCode", "RefreshToken",
  "ProcurementRequest", "Supplier", "Organization", "User"
CASCADE;
