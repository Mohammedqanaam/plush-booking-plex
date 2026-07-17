import type { AvayaFileKind, AvayaReportResult } from "@/lib/avayaReportProcessor";

export type EmployeeAdjustment = {
  confirmedAdjustment?: number;
  cancelledAdjustment?: number;
  adjustmentReason?: string;
  notes?: string;
  updatedBy?: string;
  updatedAt?: string;
};

export type AppSettings = {
  siteTitle?: string;
  bannerText?: string;
  reportMonth?: string;
  reportYear?: string;
  hiddenEmployees?: string[];
  employeeDisplayNames?: Record<string, string>;
  complaintEmail?: string;
  complaintEmailWebhook?: string;
  complaintWhatsappNumber?: string;
  themePreset?: string;
  employeeAdjustments?: Record<string, EmployeeAdjustment>;
};

export type PublicBookingReport = {
  generatedAt: string;
  updatedAt: string | null;
  period: { month: string; year: string; label: string };
  summary: {
    uploadedRecords: number;
    classifiedTotal: number;
    confirmed: number;
    cancelled: number;
    ignored: number;
    employeeCount: number;
    confirmationRate: number;
    cancelRate: number;
  };
  employees: Array<{
    id: string;
    name: string;
    confirmed: number;
    cancelled: number;
    total: number;
    confirmationRate: number;
  }>;
};

export type ContactRequest = {
  id: string;
  requestNo: string;
  brand: string;
  branchName: string;
  guestName: string;
  guestPhone: string;
  reason: string;
  status: "new" | "done";
  createdAt: string;
};

export type DiscountItem = {
  id: string;
  brand: "Boudl" | "Braira" | "Narcissus" | "Aber";
  title: string;
  percentage: number;
  active: boolean;
  startsAt?: string;
  endsAt?: string;
  notes?: string;
  createdAt: string;
};

export type ComplaintStatus = "open" | "under_review" | "closed";

export type ComplaintRecord = {
  complaintNo: string;
  brand: string;
  branch: string;
  mainCategory: string;
  subCategory: string;
  priority: string;
  guestName: string;
  bookingMobile: string;
  contactMobile: string;
  suiteNumber: string;
  checkInDate: string;
  notes: string;
  status: ComplaintStatus;
  createdAt: string;
};

export type AnalyticsSummary = {
  rangeDays: number;
  generatedAt: string;
  totalViews: number;
  uniqueVisitors: number;
  sessions: number;
  onlineCount: number;
  todayViews: number;
  todayVisitors: number;
  devices: Record<string, number>;
  browsers: Record<string, number>;
  operatingSystems: Record<string, number>;
  pages: Record<string, number>;
  referrers: Record<string, number>;
  trend: Array<{ date: string; views: number; visitors: number }>;
  online: Array<{
    visitorId: string;
    device: string;
    browser: string;
    os: string;
    country: string;
    city: string;
    path: string;
    lastSeen: string;
    ipMasked?: string;
    browserVersion?: string;
    osVersion?: string;
    region?: string;
    language?: string;
    screen?: string;
    timezone?: string;
    connection?: string;
  }>;
};

export type GhostVisitor = {
  visitorId: string;
  views: number;
  sessionCount: number;
  pages: Record<string, number>;
  device: string;
  browser: string;
  browserVersion: string;
  os: string;
  osVersion: string;
  ipMasked: string;
  country: string;
  city: string;
  region: string;
  geoTimezone: string;
  referrer: string;
  firstSeen: string;
  lastSeen: string;
  language?: string;
  languages?: string[];
  screen?: string;
  viewport?: string;
  timezone?: string;
  platform?: string;
  connection?: string;
  downlink?: number;
  saveData?: boolean;
  memory?: number;
  cpuCores?: number;
  touchPoints?: number;
  isPwa?: boolean;
};

export type GhostAnalyticsSummary = AnalyticsSummary & {
  recentVisitors: GhostVisitor[];
  privacy: { ipMode: "masked"; preciseLocation: false; fingerprinting: false };
};

export type CroExportStatus = {
  loginUrl: string;
  dashboardUrl?: string;
  configured: boolean;
  exportConfigured: boolean;
  requiredEnv: string[];
  optionalEnv?: string[];
};

export type BookingPhoneArchiveStatus = {
  configured: boolean;
  searchAvailable: boolean;
  periodCount: number;
  indexedReservations: number;
  indexedMobiles: number;
  earliestFrom: string | null;
  latestTo: string | null;
  updatedAt: string | null;
  latestPeriodPhoneColumnCount: number;
};

export type OperaSearchStatus = {
  source: "cro-archive";
  linkedSystem: "OPERA";
  readOnly: true;
  archive: BookingPhoneArchiveStatus;
};

export type OperaReservationSummary = {
  confirmationNumber: string;
  reservationId: string;
  guestName: string;
  status: string;
  bookedDate: string;
  arrivalDate: string;
  departureDate: string;
  hotelId: string;
  hotelName: string;
  roomType: string;
  roomNumber: string;
  numberOfRooms: number | null;
  archivedFrom: string;
  archivedTo: string;
};

export type OperaSearchRequest = {
  mobile: string;
};

export type OperaSearchResponse = {
  source: "cro-archive";
  linkedSystem: "OPERA";
  reservations: OperaReservationSummary[];
  totalResults: number;
  requestId: string;
  searchedAt: string;
  readOnly: true;
  archive: BookingPhoneArchiveStatus;
};

export type SyncedAvayaReport = AvayaReportResult & {
  reportId: string;
  syncedAt: string;
  sources: Array<{
    kind: AvayaFileKind;
    fileName: string;
    sha256: string;
    size: number;
    uploadedAt: string;
  }>;
};

export type AvayaSyncStatus = {
  report: SyncedAvayaReport | null;
  sync: {
    configured: boolean;
    updatedAt: string | null;
  };
};

const API_BASE = "/.netlify/functions";
const OPERA_SEARCH_API = "/api/admin/opera-search";
const AVAYA_SYNC_API = "/api/avaya/sync";

const getToken = (): string | null => (typeof window === "undefined" ? null : sessionStorage.getItem("admin_token"));

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
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || "فشل تسجيل الدخول");
    const data = await res.json();
    sessionStorage.setItem("admin_token", data.token);
    sessionStorage.setItem("admin_session", JSON.stringify({ username: data.username, role: data.role }));
    return data;
  },

  async validateSession() {
    const token = getToken();
    if (!token) return null;
    const res = await fetch(`${API_BASE}/auth`, { headers: authHeaders() });
    if (!res.ok) return null;
    return res.json();
  },

  async logout() {
    await fetch(`${API_BASE}/auth`, { method: "DELETE", headers: authHeaders() }).catch(() => null);
    sessionStorage.removeItem("admin_token");
    sessionStorage.removeItem("admin_session");
  },

  async getUsers() {
    const res = await fetch(`${API_BASE}/users`, { headers: authHeaders() });
    if (!res.ok) throw new Error("تعذر تحميل المستخدمين");
    return res.json();
  },

  async createUser(username: string, password: string, role: string) {
    const res = await fetch(`${API_BASE}/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ username, password, role }),
    });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || "تعذر إنشاء المستخدم");
    return res.json();
  },

  async changePassword(currentPassword: string, newPassword: string) {
    const res = await fetch(`${API_BASE}/users`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || "تعذر تغيير كلمة المرور");
    return res.json();
  },

  async deleteUser(username: string) {
    const res = await fetch(`${API_BASE}/users`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ username }),
    });
    if (!res.ok) throw new Error("تعذر حذف المستخدم");
    return res.json();
  },

  async getAnalytics(days: 7 | 30 | 90 = 30) {
    const res = await fetch(`${API_BASE}/analytics?days=${days}`, { headers: authHeaders() });
    if (!res.ok) throw new Error("تعذر تحميل إحصائيات الموقع");
    return res.json() as Promise<AnalyticsSummary>;
  },

  async getGhostAnalytics(days: 7 | 30 | 90 = 30) {
    const res = await fetch(`${API_BASE}/analytics?days=${days}&detail=ghost`, { headers: authHeaders() });
    if (!res.ok) throw new Error("تعذر تحميل سجل الزوار المحمي");
    return res.json() as Promise<GhostAnalyticsSummary>;
  },

  async getCroExportStatus() {
    const res = await fetch(`${API_BASE}/cro-export`, { headers: authHeaders() });
    if (!res.ok) throw new Error("تعذر تحميل حالة ربط CRO");
    return res.json() as Promise<CroExportStatus>;
  },

  async testCroLogin() {
    const res = await fetch(`${API_BASE}/cro-export`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ dryRun: true }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "تعذر اختبار تسجيل الدخول في CRO");
    return data as Promise<{ ok: boolean; message: string; exportReady: boolean; dashboardChecked?: boolean }>;
  },

  async exportCroBookings(from: string, to: string) {
    const res = await fetch(`${API_BASE}/cro-export`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ from, to }),
    });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || "تعذر تصدير الحجوزات من CRO");
    return res.blob();
  },

  async getOperaSearchStatus() {
    const res = await fetch(OPERA_SEARCH_API, { headers: authHeaders() });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "تعذر تحميل حالة أرشيف الحجوزات");
    return data as OperaSearchStatus;
  },

  async getLatestAvayaReport() {
    const res = await fetch(AVAYA_SYNC_API, { headers: authHeaders(), cache: "no-store" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "تعذر تحميل آخر مزامنة من Avaya");
    return data as AvayaSyncStatus;
  },

  async searchOperaReservations(payload: OperaSearchRequest) {
    const res = await fetch(OPERA_SEARCH_API, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "تعذر البحث في الحجوزات");
    return data as OperaSearchResponse;
  },

  async uploadBookings(csvText: string) {
    const res = await fetch(`${API_BASE}/bookings`, {
      method: "POST",
      headers: { "Content-Type": "text/csv", ...authHeaders() },
      body: csvText,
    });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || "فشل رفع الملف");
    return res.json();
  },

  async resetBookings() {
    const res = await fetch(`${API_BASE}/bookings`, { method: "DELETE", headers: authHeaders() });
    if (!res.ok) throw new Error("تعذر تصفير البيانات");
    return res.json();
  },

  async getBookings() {
    const res = await fetch(`${API_BASE}/bookings`, { headers: authHeaders() });
    if (!res.ok) throw new Error("تعذر تحميل البيانات");
    return res.json();
  },

  async getPublicBookingReport() {
    const res = await fetch(`${API_BASE}/bookings?view=summary`);
    if (!res.ok) throw new Error("تعذر تحميل التقرير");
    return res.json() as Promise<PublicBookingReport>;
  },

  async createContactRequest(payload: { brand: string; branchName: string; guestName: string; guestPhone: string; reason: string }) {
    const res = await fetch(`${API_BASE}/contacts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("تعذر إرسال الطلب");
    return res.json() as Promise<{ request: ContactRequest }>;
  },

  async getContactRequests() {
    const res = await fetch(`${API_BASE}/contacts`, { headers: authHeaders() });
    if (!res.ok) throw new Error("تعذر تحميل الطلبات");
    return res.json() as Promise<{ requests: ContactRequest[] }>;
  },

  async updateContactRequestStatus(id: string, status: "new" | "done") {
    const res = await fetch(`${API_BASE}/contacts`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ id, status }),
    });
    if (!res.ok) throw new Error("تعذر تحديث الحالة");
    return res.json();
  },

  async getSettings(): Promise<AppSettings> {
    const res = await fetch(`${API_BASE}/settings`, { headers: authHeaders() }).catch(() => null);
    if (!res || !res.ok) return { siteTitle: "Res", bannerText: "" };
    return res.json();
  },

  async updateSettings(settings: AppSettings) {
    const res = await fetch(`${API_BASE}/settings`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify(settings),
    });
    if (!res.ok) throw new Error("تعذر حفظ الإعدادات");
    return res.json();
  },

  async submitComplaint(payload: Record<string, unknown>) {
    const res = await fetch(`${API_BASE}/complaints`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("تعذر إرسال الشكوى");
    return res.json();
  },

  async listComplaints() {
    const res = await fetch(`${API_BASE}/complaints`, { headers: authHeaders() });
    if (!res.ok) throw new Error("تعذر تحميل الشكاوى");
    return res.json() as Promise<{ complaints: ComplaintRecord[] }>;
  },

  async updateComplaint(payload: { complaintNo: string; status: ComplaintStatus }) {
    const res = await fetch(`${API_BASE}/complaints`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("تعذر تحديث الشكوى");
    return res.json();
  },

  async listDiscounts() {
    const res = await fetch(`${API_BASE}/discounts`);
    if (!res.ok) throw new Error("تعذر تحميل الخصومات");
    return res.json() as Promise<{ discounts: DiscountItem[] }>;
  },

  async createDiscount(payload: Partial<DiscountItem>) {
    const res = await fetch(`${API_BASE}/discounts`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("تعذر إنشاء الخصم");
    return res.json();
  },

  async updateDiscount(payload: Partial<DiscountItem> & { id: string }) {
    const res = await fetch(`${API_BASE}/discounts`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("تعذر تحديث الخصم");
    return res.json();
  },

  async deleteDiscount(id: string) {
    const res = await fetch(`${API_BASE}/discounts`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ id }),
    });
    if (!res.ok) throw new Error("تعذر حذف الخصم");
    return res.json();
  },

  async sendChatMessage(
    message: string,
    sessionId?: string,
    history?: Array<{ role: string; content: string }>,
  ): Promise<{ reply: string; sessionId?: string }> {
    const res = await fetch(`${API_BASE}/ai-chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ message, sessionId, history }),
    });
    if (!res.ok) throw new Error("تعذر الوصول إلى المساعد الذكي");
    return res.json();
  },
};
