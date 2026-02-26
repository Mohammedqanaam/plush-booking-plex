type AppSettings = {
  siteTitle?: string;
  bannerText?: string;
  reportMonth?: string;
  reportYear?: string;
  hiddenEmployees?: string[];
};

export type ContactRequest = {
  id: string;
  branchName: string;
  customerName: string;
  phone: string;
  note: string;
  status: "new" | "done";
  createdAt: string;
};

type ContactsResponse = {
  requests: ContactRequest[];
};

const API_BASE = "/.netlify/functions";

const getToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem("admin_token");
};

const authHeaders = (): Record<string, string> => {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
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


  async resetBookings() {
    const res = await fetch(`${API_BASE}/bookings`, {
      method: "DELETE",
      headers: authHeaders(),
    });
    if (!res.ok) throw new Error("Failed to reset bookings");
    return res.json();
  },

  async getBookings() {
    const res = await fetch(`${API_BASE}/bookings`);
    if (!res.ok) throw new Error("Failed to fetch bookings");
    return res.json();
  },

  async createContactRequest(payload: { branchName: string; customerName: string; phone: string; note?: string }) {
    const res = await fetch(`${API_BASE}/contacts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || "Failed to submit request");
    }
    return res.json() as Promise<{ request: ContactRequest }>;
  },

  async getContactRequests() {
    const res = await fetch(`${API_BASE}/contacts`, {
      headers: authHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch contact requests");
    return res.json() as Promise<ContactsResponse>;
  },

  async updateContactRequestStatus(id: string, status: "new" | "done") {
    const res = await fetch(`${API_BASE}/contacts`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ id, status }),
    });
    if (!res.ok) throw new Error("Failed to update contact request");
    return res.json() as Promise<{ request: ContactRequest }>;
  },

  async getSettings(): Promise<AppSettings> {
    try {
      const res = await fetch(`${API_BASE}/settings`);
      if (!res.ok) return { siteTitle: "Worm-AI", bannerText: "" };
      return res.json();
    } catch {
      return { siteTitle: "Worm-AI", bannerText: "" };
    }
  },

  async updateSettings(settings: AppSettings) {
    const res = await fetch(`${API_BASE}/settings`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify(settings),
    });
    if (!res.ok) throw new Error("Failed to update settings");
    return res.json();
  },
};
