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
});
