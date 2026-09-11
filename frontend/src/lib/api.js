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
  adminMetrics: (token) => request("/admin/metrics", { headers: { Authorization: `Bearer ${token}` } }),
};
