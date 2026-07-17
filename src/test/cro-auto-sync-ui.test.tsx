import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { readFileSync } from "node:fs";
import AdminCroExport from "@/pages/AdminCroExport";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("CRO automatic synchronization", () => {
  it("uses the Netlify half-hour schedule", () => {
    const scheduled = readFileSync("netlify/functions/cro-sync-scheduled.ts", "utf8");
    const shared = readFileSync("netlify/functions/_shared/croSync.ts", "utf8");
    expect(scheduled).toContain('schedule: "*/30 * * * *"');
    expect(shared).toContain('schedule: "*/30 * * * *"');
  });

  it("shows the professional sync icon and 30-minute status", async () => {
    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith("/cro-export")) {
        return new Response(JSON.stringify({ configured: true, exportConfigured: true, requiredEnv: [] }), { status: 200 });
      }
      return new Response(JSON.stringify({
        status: { state: "success", finishedAt: "2026-07-17T09:00:00.000Z" },
        automation: { configured: true, from: "2026-07-01", to: "2026-07-31", schedule: "*/30 * * * *" },
      }), { status: 200 });
    }));

    render(<MemoryRouter><AdminCroExport /></MemoryRouter>);

    expect(screen.getByRole("img", { name: "أيقونة مزامنة الحجوزات" })).toBeInTheDocument();
    await waitFor(() => expect(screen.getAllByText(/كل 30 دقيقة/).length).toBeGreaterThan(0));
    expect(screen.getByRole("button", { name: /أرشفة فترة سابقة/ })).toBeEnabled();
  });
});
