import { describe, expect, it } from "vitest";
import { processBookings } from "@/lib/bookingProcessor";

describe("processBookings", () => {
  it("sorts employees by confirmed bookings descending", () => {
    const rows = [
      { "Agent name": "Agent A", Status: "C" },
      { "Agent name": "Agent A", Status: "C" },
      { "Agent name": "Agent A", Status: "OK" },
      { "Agent name": "Agent B", Status: "OK" },
      { "Agent name": "Agent B", Status: "OK" },
    ];

    const result = processBookings(rows);

    expect(result[0].agent).toBe("Agent B");
    expect(result[0].confirmed).toBe(2);
    expect(result[1].agent).toBe("Agent A");
    expect(result[1].confirmed).toBe(1);
  });

  it("supports filtering confirmed bookings by specific statuses", () => {
    const rows = [
      { "Agent name": "Agent A", Status: "M" },
      { "Agent name": "Agent A", Status: "N" },
      { "Agent name": "Agent A", Status: "C" },
      { "Agent name": "Agent B", Status: "M" },
      { "Agent name": "Agent B", Status: "OK" },
    ];

    const result = processBookings(rows, { confirmedStatuses: ["M"] });

    expect(result.find((row) => row.agent === "Agent A")).toMatchObject({ confirmed: 1, cancelled: 1, total: 2 });
    expect(result.find((row) => row.agent === "Agent B")).toMatchObject({ confirmed: 1, cancelled: 0, total: 1 });
  });
});
