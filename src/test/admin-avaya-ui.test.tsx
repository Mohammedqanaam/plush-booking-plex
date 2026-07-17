import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import AdminAvayaReports from "@/pages/AdminAvayaReports";

afterEach(() => {
  cleanup();
  sessionStorage.clear();
  vi.unstubAllGlobals();
});

describe("Avaya admin upload center", () => {
  it("shows the three required exports only to an authenticated uploader", () => {
    sessionStorage.setItem("admin_session", JSON.stringify({ username: "tester", role: "editor" }));
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ report: null, sync: { configured: true, updatedAt: null } }) }));
    render(<MemoryRouter initialEntries={["/admin/avaya-reports"]}><AdminAvayaReports /></MemoryRouter>);

    expect(screen.getByRole("heading", { name: "تقارير Avaya" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "المزامنة التلقائية" })).toBeInTheDocument();
    expect(screen.getByText("User Inbound Summary")).toBeInTheDocument();
    expect(screen.getByText("Feature Trace")).toBeInTheDocument();
    expect(screen.getByText("Agent Time Card")).toBeInTheDocument();
    expect(screen.getByText(/PDF أو XLSX/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /إنشاء التقرير الموحد/ })).toBeDisabled();
    expect(screen.getByText(/لا تُرفع ملفات الموظفين إلى الخادم/)).toBeInTheDocument();
  });

  it("loads the latest automatically synchronized report", async () => {
    sessionStorage.setItem("admin_session", JSON.stringify({ username: "tester", role: "editor" }));
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        sync: { configured: true, updatedAt: "2026-07-17T00:00:00.000Z" },
        report: {
          reportId: "report-1",
          syncedAt: "2026-07-17T00:00:00.000Z",
          rangeStart: "Start",
          rangeEnd: "End",
          warnings: [],
          sourceCounts: { inbound: 1, dnd: 1, timecard: 1 },
          sources: [],
          employees: [{
            key: "id:9999", employeeId: "9999", name: "Sample Agent(9999)", avgRingingSeconds: 5,
            answeredCalls: 20, missedCalls: 1, inboundDurationSeconds: 600, dndDurationSeconds: 0,
            loggedInDurationSeconds: 28800, dndEvents: 0, loginSessions: 1, hasInbound: true, hasDnd: true, hasTimecard: true,
          }],
        },
      }),
    }));

    render(<MemoryRouter initialEntries={["/admin/avaya-reports"]}><AdminAvayaReports /></MemoryRouter>);

    expect(await screen.findByText("مزامن تلقائياً")).toBeInTheDocument();
    expect(screen.getByText("Sample Agent")).toBeInTheDocument();
  });
});
