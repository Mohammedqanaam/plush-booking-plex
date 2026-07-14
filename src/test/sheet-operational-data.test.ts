import { describe, expect, it } from "vitest";
import { branches } from "@/data/branches";
import { branchRecords } from "@/data/knowledge";
import { sheetHallContacts, sheetMealInfo, sheetOperationalHotels } from "@/data/sheetOperationalData";

describe("Google Sheet operational data integration", () => {
  it("loads the current visible hotel-information sources", () => {
    expect(sheetOperationalHotels).toHaveLength(54);
    expect(sheetMealInfo).toHaveLength(12);
    expect(sheetHallContacts).toHaveLength(12);
  });

  it("uses sheet service data in the public branch directory", () => {
    expect(branches.length).toBeGreaterThanOrEqual(54);
    expect(branches.find((branch) => branch.name === "بودل جابر")?.services.breakfast).toContain("منيو خدمة الغرف");
  });

  it("prioritizes sheet data over stale embedded seasonal values", () => {
    const qurtubah = branchRecords.find((branch) => branch.branch === "بريرا قرطبة");
    expect(qurtubah?.breakfastInfo).toContain("6:30");
    expect(qurtubah?.breakfastInfo).toContain("89 ريال");
    expect(qurtubah?.hallPhone).toContain("0592301850");
  });
});
