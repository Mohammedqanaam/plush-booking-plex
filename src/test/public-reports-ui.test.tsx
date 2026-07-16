import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import BookingReports from "@/pages/BookingReports";
import { api, type PublicBookingReport, type PublicCroSyncStatus } from "@/lib/api";

const report: PublicBookingReport = {
  generatedAt: "2026-07-14T08:00:00.000Z",
  updatedAt: "2026-07-14T07:00:00.000Z",
  period: { month: "يوليو", year: "2026", label: "يوليو / 2026" },
  summary: {
    uploadedRecords: 12,
    classifiedTotal: 10,
    confirmed: 8,
    cancelled: 2,
    ignored: 2,
    employeeCount: 1,
    confirmationRate: 80,
    cancelRate: 20,
  },
  employees: [{ id: "agent", name: "موظف تجريبي", confirmed: 8, cancelled: 2, total: 10, confirmationRate: 80 }],
};

const syncReady: PublicCroSyncStatus = {
  available: true,
  state: "idle",
  active: false,
  message: "يمكن طلب تحديث بيانات الحجوزات.",
  from: "2026-07-01",
  to: "2026-07-31",
  updatedAt: report.updatedAt,
  nextAllowedAt: null,
  stats: null,
};

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("public read-only reports", () => {
  it("shows employee aggregates inside the booking report without management controls", async () => {
    vi.spyOn(api, "getPublicBookingReport").mockResolvedValue(report);
    vi.spyOn(api, "getPublicCroSyncStatus").mockResolvedValue(syncReady);
    const { container } = render(<MemoryRouter initialEntries={["/booking-reports?section=employees"]}><BookingReports /></MemoryRouter>);

    expect(await screen.findByText("موظف تجريبي")).toBeDefined();
    expect(screen.getByText(/عرض فقط دون بيانات الضيوف/)).toBeDefined();
    expect(container.querySelector('input[type="file"]')).toBeNull();
    expect(screen.queryByText("حفظ التغييرات")).toBeNull();
  });

  it("shows the booking summary in the same report page", async () => {
    vi.spyOn(api, "getPublicBookingReport").mockResolvedValue(report);
    vi.spyOn(api, "getPublicCroSyncStatus").mockResolvedValue(syncReady);
    render(<MemoryRouter><BookingReports /></MemoryRouter>);

    expect(await screen.findByText("حالة الحجوزات")).toBeDefined();
    expect(screen.getByText("ملخص الحجوزات ونتائج الموظفين.")).toBeDefined();
    expect(screen.getByText(/عرض فقط دون بيانات الضيوف/)).toBeDefined();
  });

  it("lets a visitor request a protected background synchronization", async () => {
    vi.spyOn(api, "getPublicBookingReport").mockResolvedValue(report);
    vi.spyOn(api, "getPublicCroSyncStatus").mockResolvedValue(syncReady);
    const request = vi.spyOn(api, "requestPublicCroSync").mockResolvedValue({
      ...syncReady,
      ok: true,
      state: "queued",
      active: true,
      message: "تم استلام طلب التحديث.",
    });

    render(<MemoryRouter><BookingReports /></MemoryRouter>);
    fireEvent.click(await screen.findByRole("button", { name: "مزامنة الحجوزات" }));

    expect(request).toHaveBeenCalledTimes(1);
    expect(await screen.findByText("تم استلام طلب التحديث.")).toBeDefined();
    expect(screen.getByText(/دون إظهار بيانات الدخول/)).toBeDefined();
  });
});
