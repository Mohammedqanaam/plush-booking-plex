import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import BookingReports from "@/pages/BookingReports";
import { api, type PublicBookingReport } from "@/lib/api";

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

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("public read-only reports", () => {
  it("shows employee aggregates inside the booking report without management controls", async () => {
    vi.spyOn(api, "getPublicBookingReport").mockResolvedValue(report);
    const { container } = render(<MemoryRouter initialEntries={["/booking-reports?section=employees"]}><BookingReports /></MemoryRouter>);

    expect(await screen.findByText("موظف تجريبي")).toBeDefined();
    expect(screen.getByText(/عرض فقط دون بيانات الضيوف/)).toBeDefined();
    expect(container.querySelector('input[type="file"]')).toBeNull();
    expect(screen.queryByText("حفظ التغييرات")).toBeNull();
  });

  it("shows the booking summary in the same report page", async () => {
    vi.spyOn(api, "getPublicBookingReport").mockResolvedValue(report);
    render(<MemoryRouter><BookingReports /></MemoryRouter>);

    expect(await screen.findByText("حالة الحجوزات")).toBeDefined();
    expect(screen.getByText("ملخص الحجوزات ونتائج الموظفين.")).toBeDefined();
    expect(screen.getByText(/عرض فقط دون بيانات الضيوف/)).toBeDefined();
  });

  it("runs a viewer-requested refresh in place without exposing internal settings", async () => {
    vi.spyOn(api, "getPublicBookingReport").mockResolvedValue(report);
    vi.spyOn(api, "requestPublicBookingSync").mockResolvedValue({
      ok: true,
      accepted: false,
      state: "fresh",
      updatedAt: report.updatedAt,
      message: "بيانات التقرير محدثة بالفعل.",
    });
    render(<MemoryRouter><BookingReports /></MemoryRouter>);

    fireEvent.click(await screen.findByRole("button", { name: "مزامنة الحجوزات" }));

    await waitFor(() => expect(api.requestPublicBookingSync).toHaveBeenCalledTimes(1));
    expect(screen.getByText("بيانات التقرير محدثة بالفعل.")).toBeDefined();
    expect(screen.queryByText(/M\.ALDOSARI|CRO_PASSWORD|CRO_USERNAME/)).toBeNull();
  });
});
