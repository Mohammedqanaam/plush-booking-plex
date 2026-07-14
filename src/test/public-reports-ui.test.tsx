import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Employees from "@/pages/Employees";
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
  it("shows employee aggregates without management controls", async () => {
    vi.spyOn(api, "getPublicBookingReport").mockResolvedValue(report);
    const { container } = render(<MemoryRouter><Employees /></MemoryRouter>);

    expect(await screen.findByText("موظف تجريبي")).toBeDefined();
    expect(screen.getByText(/وضع مشاهدة للزوار/)).toBeDefined();
    expect(container.querySelector('input[type="file"]')).toBeNull();
    expect(screen.queryByText("حفظ التغييرات")).toBeNull();
  });

  it("keeps booking reports distinct from employee performance", async () => {
    vi.spyOn(api, "getPublicBookingReport").mockResolvedValue(report);
    render(<MemoryRouter><BookingReports /></MemoryRouter>);

    expect(await screen.findByText("توزيع الحالات")).toBeDefined();
    expect(screen.getByText("ملخص الحالات والأعداد دون بيانات الضيوف.")).toBeDefined();
    expect(screen.getByText(/السجلات التفصيلية وأدوات الرفع محمية/)).toBeDefined();
  });
});
