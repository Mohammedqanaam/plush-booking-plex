import { describe, expect, it } from "vitest";
import { currentSaudiMonthRange } from "../../netlify/functions/_shared/croSync";

describe("continuous CRO sync range", () => {
  it("uses the current Riyadh month and rolls forward without a stop date", () => {
    expect(currentSaudiMonthRange(new Date("2026-07-31T20:59:59Z"))).toEqual({
      from: "2026-07-01",
      to: "2026-07-31",
    });
    expect(currentSaudiMonthRange(new Date("2026-07-31T21:00:00Z"))).toEqual({
      from: "2026-08-01",
      to: "2026-08-31",
    });
    expect(currentSaudiMonthRange(new Date("2028-02-15T00:00:00Z"))).toEqual({
      from: "2028-02-01",
      to: "2028-02-29",
    });
  });
});
