import { describe, expect, it } from "vitest";
import {
  detectReservationReportSource,
  mergeReservationReports,
  normalizeReservationStatus,
  parseReservationReportFile,
  type ParsedReservationReport,
} from "@/lib/reservationReportMerger";
import * as XLSX from "@e965/xlsx";

describe("reservation report merger", () => {
  it("recognizes UNO and CRO exports", () => {
    expect(detectReservationReportSource("completed-reservations-20260731.xls", [{ "Created By": "Agent", "Reservation Status": "Confirmed", "Property Name": "Boudl" }])).toBe("UNO");
    expect(detectReservationReportSource("cro-july.csv", [{ "Agent name": "Agent", "All stute": "N" }])).toBe("CRO");
  });

  it("normalizes UNO text statuses to the approved reservation status codes", () => {
    expect(normalizeReservationStatus("Confirmed")).toBe("N");
    expect(normalizeReservationStatus("Modified")).toBe("M");
    expect(normalizeReservationStatus("Cancelled")).toBe("C");
    expect(normalizeReservationStatus("No Show")).toBe("NS");
  });

  it("reads a real legacy XLS workbook like the UNO completed-reservations export", async () => {
    const sheet = XLSX.utils.aoa_to_sheet([
      ["UNO Completed Reservations"],
      ["Booking Number", "Created By", "Reservation Status", "Property Name"],
      ["UNO-9001", "Agent UNO", "Confirmed", "Boudl Test"],
    ]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, sheet, "Reservations");
    const bytes = XLSX.write(workbook, { type: "array", bookType: "xls" });
    const file = new File([bytes], "completed-reservations-20260731.xls", { type: "application/vnd.ms-excel" });

    const parsed = await parseReservationReportFile(file);
    expect(parsed.source).toBe("UNO");
    expect(parsed.rows).toHaveLength(1);
    expect(parsed.rows[0]["Booking Number"]).toBe("UNO-9001");
  });

  it("merges more than two UNO/CRO reports and removes duplicate reservation numbers", () => {
    const reports: ParsedReservationReport[] = [
      {
        fileName: "cro-1.csv",
        source: "CRO",
        rows: [
          { "Reservation Number": "R-100", "Agent name": "Agent A", Status: "N", Hotel: "Boudl A" },
          { "Reservation Number": "R-101", "Agent name": "Agent B", Status: "M", Hotel: "Boudl B" },
        ],
      },
      {
        fileName: "completed-reservations-1.xls",
        source: "UNO",
        rows: [
          { "Booking Number": "R-100", "Created By": "Agent A", "Reservation Status": "Confirmed", "Property Name": "Boudl A" },
          { "Booking Number": "R-102", "Created By": "Agent C", "Reservation Status": "Cancelled", "Property Name": "Boudl C" },
        ],
      },
      {
        fileName: "cro-2.csv",
        source: "CRO",
        rows: [
          { "Confirmation Number": "R-103", "Agent Name": "Agent D", "Booking Status": "NS" },
        ],
      },
    ];

    const result = mergeReservationReports(reports);
    expect(result.stats.files).toBe(3);
    expect(result.stats.inputRows).toBe(5);
    expect(result.stats.uniqueRows).toBe(4);
    expect(result.stats.duplicatesRemoved).toBe(1);
    expect(result.stats.confirmed).toBe(2);
    expect(result.stats.cancelled).toBe(2);
    expect(result.rows.find((row) => row["Reservation Number"] === "R-100")?.Source).toBe("CRO + UNO");
  });

  it("flags a cross-system status conflict and prefers a cancellation when no newer timestamp exists", () => {
    const result = mergeReservationReports([
      { fileName: "cro.csv", source: "CRO", rows: [{ "Reservation Number": "R-200", "Agent name": "Agent", Status: "N" }] },
      { fileName: "uno.xls", source: "UNO", rows: [{ "Booking Number": "R-200", "Created By": "Agent", "Reservation Status": "Cancelled" }] },
    ]);

    expect(result.stats.statusConflicts).toBe(1);
    expect(result.rows[0].Status).toBe("C");
    expect(result.rows[0].Conflict).toBe("YES");
  });
});
