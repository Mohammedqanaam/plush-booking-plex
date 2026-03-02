const API_BASE = "/.netlify/functions";

const getToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem("admin_token");
};

const authHeaders = (): Record<string, string> => {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const logApiError = async (source: string, message: string, context?: unknown) => {
  try {
    await fetch(`${API_BASE}/errors`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ source, message, context }),
    });
  } catch {
    // no-op logging fallback
  }
};

export const api = {
  async login(username: string, password: string) {
    const res = await fetch(`${API_BASE}/auth`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || "Login failed");
    }
    const data = await res.json();
    sessionStorage.setItem("admin_token", data.token);
    sessionStorage.setItem(
      "admin_session",
      JSON.stringify({ username: data.username, role: data.role })
    );
    return data;
  },

  async validateSession() {
    const token = getToken();
    if (!token) return null;
    try {
      const res = await fetch(`${API_BASE}/auth`, {
        headers: authHeaders(),
      });
      if (!res.ok) {
        sessionStorage.removeItem("admin_token");
        sessionStorage.removeItem("admin_session");
        return null;
      }
      return await res.json();
    } catch {
      return null;
    }
  },

  async logout() {
    try {
      await fetch(`${API_BASE}/auth`, {
        method: "DELETE",
        headers: authHeaders(),
      });
    } catch {}
    sessionStorage.removeItem("admin_token");
    sessionStorage.removeItem("admin_session");
  },

  async getUsers() {
    const res = await fetch(`${API_BASE}/users`, {
      headers: authHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch users");
    return res.json();
  },

  async createUser(username: string, password: string, role: string) {
    const res = await fetch(`${API_BASE}/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ username, password, role }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || "Failed to create user");
    }
    return res.json();
  },

  async deleteUser(username: string) {
    const res = await fetch(`${API_BASE}/users`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ username }),
    });
    if (!res.ok) throw new Error("Failed to delete user");
    return res.json();
  },

  async uploadBookings(csvText: string) {
    const res = await fetch(`${API_BASE}/bookings`, {
      method: "POST",
      headers: { "Content-Type": "text/csv", ...authHeaders() },
      body: csvText,
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || "Upload failed");
    }
    return res.json();
  },

  async getBookings() {
    const res = await fetch(`${API_BASE}/bookings`);
    if (!res.ok) throw new Error("Failed to fetch bookings");
    return res.json();
  },

  async getSettings() {
    try {
      const res = await fetch(`${API_BASE}/settings`);
      if (!res.ok) return { siteTitle: "WORM-AI", bannerText: "" };
      return res.json();
    } catch {
      return { siteTitle: "WORM-AI", bannerText: "" };
    }
  },

  async updateSettings(settings: { siteTitle?: string; bannerText?: string; enterprise?: unknown }) {
    const res = await fetch(`${API_BASE}/settings`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify(settings),
    });
    if (!res.ok) throw new Error("Failed to update settings");
    return res.json();
  },

  async submitComplaint(payload: Record<string, unknown>) {
    const res = await fetch(`${API_BASE}/complaints`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const message = await res.text();
      await logApiError("complaints.submit", message, payload);
      throw new Error("Complaint submission failed");
    }
    return res.json();
  },

  async listDiscounts() {
    const res = await fetch(`${API_BASE}/discounts`, { headers: authHeaders() });
    if (!res.ok) {
      await logApiError("discounts.list", `status-${res.status}`);
      throw new Error("Failed to fetch discounts");
    }
    return res.json();
  },

  async createDiscount(payload: Record<string, unknown>) {
    const res = await fetch(`${API_BASE}/discounts`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      await logApiError("discounts.create", `status-${res.status}`, payload);
      throw new Error("Failed to create discount");
    }
    return res.json();
  },

  async updateDiscount(payload: Record<string, unknown>) {
    const res = await fetch(`${API_BASE}/discounts`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      await logApiError("discounts.update", `status-${res.status}`, payload);
      throw new Error("Failed to update discount");
    }
    return res.json();
  },

  async deleteDiscount(id: string) {
    const res = await fetch(`${API_BASE}/discounts`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ id }),
    });
    if (!res.ok) {
      await logApiError("discounts.delete", `status-${res.status}`, { id });
      throw new Error("Failed to delete discount");
    }
    return res.json();
  },

  async getErrors() {
    const res = await fetch(`${API_BASE}/errors`, { headers: authHeaders() });
    if (!res.ok) throw new Error("Failed to fetch errors");
    return res.json();
  },
};
