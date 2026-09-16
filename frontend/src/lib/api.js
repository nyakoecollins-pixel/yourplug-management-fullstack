const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

async function request(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || "Something went wrong talking to the server.");
  }
  return data;
}

export const api = {
  register: (payload) => request("/auth/register", { method: "POST", body: JSON.stringify(payload) }),
  login: (identifier, password) =>
    request("/auth/login", { method: "POST", body: JSON.stringify({ identifier, password }) }),
  logout: () => request("/auth/logout", { method: "POST" }),
  myRequests: (token) => request("/requests/mine", { headers: { Authorization: `Bearer ${token}` } }),
  myInvoices: (token) => request("/invoices/mine", { headers: { Authorization: `Bearer ${token}` } }),
  adminMetrics: (token) => request("/admin/metrics", { headers: { Authorization: `Bearer ${token}` } }),
  allOrders: (token) => request("/requests", { headers: { Authorization: `Bearer ${token}` } }),
  allInvoices: (token) => request("/invoices", { headers: { Authorization: `Bearer ${token}` } }),
  auditLogs: (token) => request("/admin/audit-logs", { headers: { Authorization: `Bearer ${token}` } }),
  initiateMpesa: (token, invoiceId, phone) =>
    request("/payments/mpesa/initiate", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ invoiceId, phone }),
    }),
  mpesaStatus: (token, checkoutRequestId) =>
    request(`/payments/mpesa/status/${checkoutRequestId}`, { headers: { Authorization: `Bearer ${token}` } }),
  getMessages: (token, requestId) =>
    request(`/requests/${requestId}/messages`, { headers: { Authorization: `Bearer ${token}` } }),
  postMessage: (token, requestId, body, visibility = "customer") =>
    request(`/requests/${requestId}/messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ body, visibility }),
    }),
  createInvoice: (token, requestId, subtotal) =>
    request("/invoices", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(subtotal ? { requestId, subtotal } : { requestId }),
    }),
  createRequest: (token, payload) =>
    request("/requests", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    }),
  getSuppliers: (token) => request("/suppliers", { headers: { Authorization: `Bearer ${token}` } }),
  createSupplier: (token, payload) =>
    request("/suppliers", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    }),
  addQuote: (token, requestId, payload) =>
    request(`/requests/${requestId}/quotes`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    }),
  getRequest: (token, requestId) =>
    request(`/requests/${requestId}`, { headers: { Authorization: `Bearer ${token}` } }),
  getProfile: (token) => request("/me", { headers: { Authorization: `Bearer ${token}` } }),
  updateProfile: (token, payload) =>
    request("/me", {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    }),
  getLegalAcceptances: (token) => request("/me/legal-acceptances", { headers: { Authorization: `Bearer ${token}` } }),
  estimateLandedCost: (payload) =>
    request("/international/estimate", { method: "POST", body: JSON.stringify(payload) }),
  saveLandedCostEstimate: (token, payload) =>
    request("/international/estimate/save", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    }),
};
