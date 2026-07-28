import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import AdminOperaSearch from "@/pages/AdminOperaSearch";
import { api, type OperaSearchStatus } from "@/lib/api";

const readyStatus: OperaSearchStatus = {
  source: "cro-archive",
  linkedSystem: "OPERA",
  readOnly: true,
  archive: {
    configured: true,
    searchAvailable: true,
    periodCount: 3,
    indexedReservations: 84,
    indexedMobiles: 72,
    earliestFrom: "2026-05-01",
    latestTo: "2026-07-31",
    updatedAt: "2026-07-17T09:00:00.000Z",
    latestPeriodPhoneColumnCount: 1,
  },
};

afterEach(() => {
  cleanup();
  sessionStorage.clear();
  vi.restoreAllMocks();
});

describe("historical booking search UI", () => {
  it("shows the archive coverage and accepts a 9-digit mobile", async () => {
    sessionStorage.setItem("admin_session", JSON.stringify({ username: "tester", role: "admin" }));
    vi.spyOn(api, "getOperaSearchStatus").mockResolvedValue(readyStatus);

    render(<MemoryRouter initialEntries={["/admin/opera-search"]}><AdminOperaSearch /></MemoryRouter>);

    expect(screen.getByRole("heading", { name: "البحث عن حجز برقم الجوال" })).toBeInTheDocument();
    expect(screen.getByPlaceholderText("5xxxxxxxx أو 05xxxxxxxx")).toHaveAttribute("inputmode", "tel");
    await waitFor(() => expect(screen.getByText("٨٤")).toBeInTheDocument());
    expect(screen.getByRole("button", { name: "بحث في كامل الأرشيف" })).toBeEnabled();
  });

  it("explains that a historical period must be archived before search", async () => {
    sessionStorage.setItem("admin_session", JSON.stringify({ username: "tester", role: "admin" }));
    vi.spyOn(api, "getOperaSearchStatus").mockResolvedValue({
      ...readyStatus,
      archive: { ...readyStatus.archive, searchAvailable: false, periodCount: 0, indexedReservations: 0, indexedMobiles: 0 },
    });

    render(<MemoryRouter><AdminOperaSearch /></MemoryRouter>);

    await waitFor(() => expect(screen.getByText(/لا توجد فترة مؤرشفة بعد/)).toBeInTheDocument());
    expect(screen.getByRole("button", { name: "بحث في كامل الأرشيف" })).toBeDisabled();
  });
});
