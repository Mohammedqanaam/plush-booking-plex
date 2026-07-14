const API_BASE = "/.netlify/functions";

const getToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem("admin_token");
};

const authHeaders = (): Record<string, string> => {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

async function logApiError(source: string, message: string, context?: string) {
  try {
    await fetch(`${API_BASE}/error-logs`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ source, message, context }),
    });
  } catch {
    // fire-and-forget logging; swallow to avoid masking the original error
  }
}

export const enterpriseApi = {
  async getComplaints() {
    const res = await fetch(`${API_BASE}/complaints`, { headers: authHeaders() });
    if (!res.ok) {
      await logApiError("complaints:get", "failed", String(res.status));
      throw new Error("Failed to fetch complaints");
    }
    return res.json();
  },
  async createComplaint(payload: Record<string, unknown>) {
    const res = await fetch(`${API_BASE}/complaints`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      await logApiError("complaints:create", "failed", String(res.status));
      throw new Error("Failed to submit complaint");
    }
    return res.json();
  },

  async getDiscounts() {
    const res = await fetch(`${API_BASE}/discounts`);
    if (!res.ok) {
      await logApiError("discounts:get", "failed", String(res.status));
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
      await logApiError("discounts:create", "failed", String(res.status));
      throw new Error("Failed to create discount");
    }
    return res.json();
  },

  async getEnterpriseConfig() {
    const res = await fetch(`${API_BASE}/enterprise-config`);
    if (!res.ok) throw new Error("Failed to fetch config");
    return res.json();
  },
  async updateEnterpriseConfig(payload: Record<string, unknown>) {
    const res = await fetch(`${API_BASE}/enterprise-config`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      await logApiError("enterprise-config:update", "failed", String(res.status));
      throw new Error("Failed to update config");
    }
    return res.json();
  },

  async getErrorLogs() {
    const res = await fetch(`${API_BASE}/error-logs`, { headers: authHeaders() });
    if (!res.ok) throw new Error("Failed to fetch logs");
    return res.json();
  },
};
