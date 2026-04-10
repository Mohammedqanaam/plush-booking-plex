import { describe, expect, it } from "vitest";

import { buildEmployeeRows } from "@/lib/employeePerformance";

describe("employee performance projection", () => {
  it("hides employees from public projection without changing base totals", () => {
    const rows = buildEmployeeRows({
      stats: [
        { agent: "Ahmed", confirmed: 4, cancelled: 1, total: 5, cancelRate: 20 },
        { agent: "Mona", confirmed: 2, cancelled: 0, total: 2, cancelRate: 0 },
      ],
      hiddenEmployees: ["ahmed"],
    });

    expect(rows.find((row) => row.displayName === "Ahmed")?.hiddenFromPerformance).toBe(true);
    expect(rows.reduce((sum, row) => sum + row.adjustment.baseTotal, 0)).toBe(7);
  });

  it("deduplicates aliases and applies manual adjustments", () => {
    const rows = buildEmployeeRows({
      stats: [{ agent: "  ahmed   ali ", confirmed: 5, cancelled: 1, total: 6, cancelRate: 16.7 }],
      hiddenEmployees: [],
      aliases: { "Ahmed Ali": "أحمد علي" },
      adjustments: {
        "ahmed-ali": {
          confirmedAdjustment: -2,
          cancelledAdjustment: 1,
          totalAdjustment: -1,
        },
      },
    });

    expect(rows[0].displayName).toBe("أحمد علي");
    expect(rows[0].confirmed).toBe(3);
    expect(rows[0].cancelled).toBe(2);
    expect(rows[0].total).toBe(5);
  });
});
