import { describe, expect, it } from "vitest";
import { avayaTimestamp, durationToSeconds, employeeIdentity, summarizeTimecardSessions } from "@/lib/avayaReportProcessor";
import { parseAvayaPdfPages, type AvayaPdfPage, type AvayaPdfTextItem } from "@/lib/avayaPdfParser";

const item = (text: string, x: number, y: number): AvayaPdfTextItem => ({ text, x, y });
const helpers = { employeeIdentity, durationToSeconds, avayaTimestamp, summarizeTimecardSessions };

describe("Avaya PDF parser", () => {
  it("reads the inbound employee row from the positioned PDF text layer", () => {
    const page: AvayaPdfPage = {
      width: 612,
      items: [
        item("User Inbound Summary", 36, 730),
        item("Wednesday, July 15, 2026 8:00:00 AM", 36, 710),
        item("Thursday, July 16, 2026 7:59:59 AM", 36, 700),
        item("Sample", 40, 520), item("Agent(9999)", 75, 520),
        item("52", 177, 520), item("2:10:00", 216, 520),
        item("0:00:10", 308, 520), item("40", 454, 520), item("12", 548, 520),
      ],
    };

    const parsed = parseAvayaPdfPages([page], helpers);
    expect(parsed.kind).toBe("inbound");
    expect(parsed.rangeStart).toBe("Wednesday, July 15, 2026 8:00:00 AM");
    expect(parsed.entries).toEqual([expect.objectContaining({
      employeeId: "9999",
      avgRingingSeconds: 10,
      answeredCalls: 40,
      missedCalls: 12,
      inboundDurationSeconds: 7800,
    })]);
  });

  it("keeps the current employee across PDF pages and totals duration events", () => {
    const first: AvayaPdfPage = {
      width: 612,
      items: [
        item("Agent Realtime Feature Trace new", 180, 730),
        item("Wednesday, July 15, 2026 8:00:00 AM", 36, 710),
        item("Thursday, July 16, 2026 7:59:59 AM", 36, 700),
        item("Sample Agent(9999)", 36, 650),
        item("Feature ID: 1", 40, 620), item("Do Not Disturb", 180, 620), item("0:10:00", 530, 620),
      ],
    };
    const second: AvayaPdfPage = {
      width: 612,
      items: [
        item("Feature ID: 2", 40, 680), item("Do Not Disturb", 180, 680), item("0:20:00", 530, 680),
      ],
    };

    const parsed = parseAvayaPdfPages([first, second], helpers);
    expect(parsed.kind).toBe("dnd");
    expect(parsed.entries).toEqual([expect.objectContaining({ employeeId: "9999", seconds: 1800, events: 2 })]);
  });

  it("derives one shift from reconnecting time-card sessions", () => {
    const page: AvayaPdfPage = {
      width: 612,
      items: [
        item("Agent Time Card", 220, 730),
        item("Wednesday, July 15, 2026 8:00:00 AM", 36, 710),
        item("Thursday, July 16, 2026 7:59:59 AM", 36, 700),
        item("Sample Agent(9999)", 36, 650),
        item("Feature ID: 1", 40, 620), item("Jul 15, 2026 8:00:00 AM", 170, 620), item("Jul 15, 2026 12:00:00 PM", 330, 620), item("4:00:00", 530, 620),
        item("Feature ID: 2", 40, 590), item("Jul 15, 2026 12:15:00 PM", 170, 590), item("Jul 15, 2026 4:30:00 PM", 330, 590), item("4:15:00", 530, 590),
      ],
    };

    const parsed = parseAvayaPdfPages([page], helpers);
    expect(parsed.kind).toBe("timecard");
    expect(parsed.entries).toEqual([expect.objectContaining({
      employeeId: "9999",
      seconds: 29700,
      events: 2,
      shiftStartTimestamp: Date.UTC(2026, 6, 15, 8, 0, 0),
      shiftEndTimestamp: Date.UTC(2026, 6, 15, 16, 30, 0),
      disconnectedDurationSeconds: 900,
      reconnectionCount: 1,
    })]);
  });
});
