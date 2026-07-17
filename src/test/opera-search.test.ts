import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  buildPeriodPhoneEntries,
  extractSaudiMobiles,
  findPhoneColumns,
  mobileLookupKey,
  normalizeSaudiMobile,
} from "../../netlify/functions/_shared/croPhoneSearch";
import operaSearch from "../../netlify/functions/opera-search";

describe("CRO historical reservation phone search", () => {
  it("accepts a Saudi mobile with or without the leading zero", () => {
    expect(normalizeSaudiMobile("566000111")).toBe("966566000111");
    expect(normalizeSaudiMobile("0566000111")).toBe("966566000111");
    expect(normalizeSaudiMobile("+966 56 600 0111")).toBe("966566000111");
    expect(normalizeSaudiMobile("٥٦٦٠٠٠١١١")).toBe("966566000111");
  });

  it("produces the same private lookup key for local and international formats", () => {
    const secret = "unit-test-search-secret";
    expect(mobileLookupKey("566000111", secret)).toBe(mobileLookupKey("+966566000111", secret));
    expect(mobileLookupKey("566000111", secret)).not.toContain("566000111");
  });

  it("indexes only deliberate phone fields and never leaks the raw mobile", () => {
    const records = [{
      Hotel: "Braira Test",
      Mobile: "0566000111",
      "Confirmation Number": "CONF-100",
      "Guest Name": "Test Guest",
      "Check In": "2026-07-01",
      "Check Out": "2026-07-03",
    }];

    expect(findPhoneColumns(records)).toEqual(["Mobile"]);
    expect(extractSaudiMobiles(records[0].Mobile)).toEqual(["966566000111"]);

    const built = buildPeriodPhoneEntries(records, {
      key: "2026-07-01_2026-07-05",
      from: "2026-07-01",
      to: "2026-07-05",
    }, "unit-test-search-secret");

    expect(built.indexedReservations).toBe(1);
    expect(Object.keys(built.entries)).toHaveLength(1);
    expect(JSON.stringify(built)).not.toContain("566000111");
    expect(JSON.stringify(built)).not.toContain("0566000111");
  });

  it("keeps the endpoint admin-only and free from stored OPERA credentials", () => {
    const source = readFileSync("netlify/functions/opera-search.ts", "utf8");
    expect(source).toContain("validateSession(req)");
    expect(source).toContain('role === "superadmin" || role === "admin"');
    expect(source).toContain('path: "/api/admin/opera-search"');
    expect(source).not.toContain("integrationPassword");
  });

  it("rejects an anonymous request before opening the archive", async () => {
    const response = await operaSearch(new Request("https://example.com/api/admin/opera-search"));
    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({ error: "الجلسة غير صالحة." });
  });
});
