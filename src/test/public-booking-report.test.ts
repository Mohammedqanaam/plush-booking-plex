import { describe, expect, it } from "vitest";
import { buildPublicBookingReport, normalizeEmployeeId } from "../../netlify/functions/_shared/bookingReport";

describe("public booking report", () => {
  it("returns aggregate employee metrics without exposing guest records", () => {
    const aliId = normalizeEmployeeId("Ali Agent");
    const report = buildPublicBookingReport(
      [
        { "Agent name": "Ali Agent", Status: "M", "Guest Name": "Private Guest", Mobile: "0500000000" },
        { "Agent name": "Ali Agent", Status: "C", "Guest Name": "Another Guest", Mobile: "0511111111" },
        { "Agent name": "Sara Agent", Status: "N", "Guest Name": "Hidden Guest" },
        { "Agent name": "Ali Agent", Status: "UNKNOWN", Notes: "Private note" },
      ],
      {
        reportMonth: "يوليو",
        reportYear: "2026",
        hiddenEmployees: ["Sara Agent"],
        employeeDisplayNames: { [aliId]: "علي" },
        employeeAdjustments: { [aliId]: { confirmedAdjustment: 1 } },
      },
      "2026-07-14T08:00:00.000Z",
    );

    expect(report.summary).toMatchObject({
      uploadedRecords: 4,
      classifiedTotal: 3,
      confirmed: 2,
      cancelled: 1,
      ignored: 1,
      employeeCount: 1,
    });
    expect(report.period.label).toBe("يوليو / 2026");
    expect(report.employees).toEqual([
      expect.objectContaining({ name: "علي", confirmed: 2, cancelled: 1, total: 3 }),
    ]);

    const serialized = JSON.stringify(report);
    expect(serialized).not.toContain("Private Guest");
    expect(serialized).not.toContain("0500000000");
    expect(serialized).not.toContain("Private note");
    expect(serialized).not.toContain("Sara Agent");
  });

  it("keeps an empty report safe and well-formed", () => {
    const report = buildPublicBookingReport([]);
    expect(report.summary.classifiedTotal).toBe(0);
    expect(report.summary.confirmationRate).toBe(0);
    expect(report.employees).toEqual([]);
  });
});
