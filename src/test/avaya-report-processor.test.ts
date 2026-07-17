import { describe, expect, it } from "vitest";
import ExcelJS from "exceljs";
import {
  analyzeAvayaFiles,
  analyzeAvayaWorkbookInputs,
  createAvayaExportWorkbook,
  durationToSeconds,
  employeeIdentity,
  employeeRiskLevel,
  formatDuration,
} from "@/lib/avayaReportProcessor";

const workbookFile = async (workbook: ExcelJS.Workbook, name: string) => {
  const buffer = await workbook.xlsx.writeBuffer();
  return {
    name,
    size: buffer.byteLength,
    arrayBuffer: async () => buffer,
  } as File;
};

describe("Avaya report processor", () => {
  it("normalizes employee identifiers and durations", () => {
    expect(employeeIdentity(" Sample Agent(9999) ")).toEqual({ name: "Sample Agent(9999)", employeeId: "9999", key: "id:9999" });
    expect(durationToSeconds("0:30:00")).toBe(1800);
    expect(formatDuration(1800)).toBe("0:30:00");
  });

  it("merges the three Avaya exports into the expected employee result", async () => {
    const inbound = new ExcelJS.Workbook();
    const inboundSheet = inbound.addWorksheet("NO SUB GROUP");
    inboundSheet.addRows([
      ["User Inbound Summary"],
      ["Tuesday, July 14, 2026 8:00:00 AM", "Wednesday, July 15, 2026 7:59:59 AM"],
      ["User", "Total Calls", "Total Call Duration", "Total Ringing Duration", "Avg Ringing Duration", "Total Talking Duration", "Avg Talking Duration", "Answered Calls", "Percent Answered", "Missed Calls"],
      ["Sample Agent(9999)", 52, "2:10:00", "0:08:40", "0:00:10", "1:50:00", "0:02:07", 40, 0.769, 12],
    ]);

    const dnd = new ExcelJS.Workbook();
    const dndSheet = dnd.addWorksheet("Sample Agent(9999)");
    dndSheet.addRows([
      ["Agent Realtime Feature Trace new"],
      ["Sample Agent(9999)"],
      ["Tuesday, July 14, 2026 8:00:00 AM", "Wednesday, July 15, 2026 7:59:59 AM"],
      ["Feature", "Feature Type", "Start Time", "End Time", "Duration"],
      ["Feature ID: 1", "Do Not Disturb", "start", "end", "0:10:00"],
      ["Feature ID: 2", "Do Not Disturb", "start", "end", "0:20:00"],
    ]);

    const timecard = new ExcelJS.Workbook();
    const timecardSheet = timecard.addWorksheet("Sample Agent(9999)");
    timecardSheet.addRows([
      ["Agent Time Card"],
      ["Sample Agent(9999)"],
      ["Tuesday, July 14, 2026 8:00:00 AM", "Wednesday, July 15, 2026 7:59:59 AM"],
      ["Feature", "Logged In", "Logged Out", "Duration"],
      ["Feature ID: 1", "start", "end", "8:15:00"],
    ]);

    const result = await analyzeAvayaFiles([
      await workbookFile(timecard, "Agent_Time_Card.xlsx"),
      await workbookFile(inbound, "User_Inbound_Summary.xlsx"),
      await workbookFile(dnd, "Agent_Realtime_Feature_Trace_new.xlsx"),
    ]);
    const automatedResult = await analyzeAvayaWorkbookInputs([
      { name: "Agent_Time_Card.xlsx", bytes: new Uint8Array(await timecard.xlsx.writeBuffer()) },
      { name: "User_Inbound_Summary.xlsx", bytes: new Uint8Array(await inbound.xlsx.writeBuffer()) },
      { name: "Agent_Realtime_Feature_Trace_new.xlsx", bytes: new Uint8Array(await dnd.xlsx.writeBuffer()) },
    ]);

    expect(result.warnings).toEqual([]);
    expect(result.sourceCounts).toEqual({ inbound: 1, dnd: 1, timecard: 1 });
    expect(result.employees).toHaveLength(1);
    expect(result.employees[0]).toMatchObject({
      employeeId: "9999",
      avgRingingSeconds: 10,
      answeredCalls: 40,
      missedCalls: 12,
      dndDurationSeconds: 1800,
      loggedInDurationSeconds: 29700,
      dndEvents: 2,
      loginSessions: 1,
    });
    expect(automatedResult).toEqual(result);
    expect(employeeRiskLevel(result.employees[0])).toBe("review");
  });

  it("exports a branded left-to-right central reservation call report", async () => {
    const workbook = await createAvayaExportWorkbook({
      rangeStart: "Start",
      rangeEnd: "End",
      warnings: [],
      sourceCounts: { inbound: 1, dnd: 1, timecard: 1 },
      employees: [{
        key: "id:9999", employeeId: "9999", name: "Sample Agent(9999)", avgRingingSeconds: 10,
        answeredCalls: 40, missedCalls: 12, inboundDurationSeconds: 7800, dndDurationSeconds: 1800,
        loggedInDurationSeconds: 29700, dndEvents: 2, loginSessions: 1, hasInbound: true, hasDnd: true, hasTimecard: true,
      }],
    }, new Uint8Array([0xff, 0xd8, 0xff, 0xd9]));
    const sheet = workbook.getWorksheet("تقرير المكالمات")!;

    expect(sheet.views[0].rightToLeft).toBe(false);
    expect(sheet.getCell("A6").value).toBe("تقرير مكالمات الحجز المركزي");
    expect(sheet.getRow(8).getCell(1).value).toBe("User");
    expect(sheet.getImages()).toHaveLength(1);
    expect((await workbook.xlsx.writeBuffer()).byteLength).toBeGreaterThan(0);
  });
});
