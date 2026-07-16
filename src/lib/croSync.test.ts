import { describe, expect, it } from "vitest";
import {
  calculateBookingStats,
  parseBookingCsv,
} from "../../netlify/functions/_shared/bookingCsv";
import { primaryCroFormHtml } from "../../netlify/functions/_shared/croForms";

describe("CRO report synchronization", () => {
  it("excludes CRO's export-only xform from WebForms postbacks", () => {
    const html = `
      <form id="aspnetForm">
        <input name="__VIEWSTATE" value="state" />
        <select name="dateType"><option selected value="CheckOutDate">Check Out</option></select>
      </form>
      <form id="xform"><input id="inExp" name="inExp" value="1" /></form>
    `;

    const form = primaryCroFormHtml(html);
    expect(form).toContain("__VIEWSTATE");
    expect(form).toContain("CheckOutDate");
    expect(form).not.toContain("inExp");
  });

  it("parses CRO rows and classifies every supported status", () => {
    const csv = [
      "Agent Name,St,Resv ID",
      "A,M,1",
      "B,O,2",
      "C,N,3",
      "D,I,4",
      "E,C,5",
      "F,NS,6",
      "G,X,7",
    ].join("\n");

    const bookings = parseBookingCsv(csv);
    expect(bookings).toHaveLength(7);
    expect(calculateBookingStats(bookings)).toEqual({
      total: 7,
      confirmed: 4,
      cancelled: 2,
      cancelRate: 28.6,
    });
  });

  it("keeps quoted commas inside a field", () => {
    const bookings = parseBookingCsv('Agent Name,St\n"Last, First",M');
    expect(bookings[0]["Agent Name"]).toBe("Last, First");
  });
});
