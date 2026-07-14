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
    expect(branches).toHaveLength(54);
    expect(new Set(branches.map((branch) => branch.name)).size).toBe(branches.length);
    expect(branches.find((branch) => branch.name === "بودل جابر")?.services.breakfast).toContain("منيو خدمة الغرف");
  });

  it("publishes corrected canonical branch names", () => {
    const names = branches.map((branch) => branch.name);
    expect(names).toContain("بريرا قرطبة");
    expect(names).toContain("بودل الشاطئ");
    expect(names).toContain("بودل مكة أجياد");
    expect(names).toContain("نارسيس الحمراء");
    expect(names.some((name) => /قرطبه|الحمراءء|مكة اجياد/.test(name))).toBe(false);
  });

  it("prioritizes sheet data over stale embedded seasonal values", () => {
    const qurtubah = branchRecords.find((branch) => branch.branch === "بريرا قرطبة");
    expect(qurtubah?.breakfastInfo).toContain("6:30");
    expect(qurtubah?.breakfastInfo).toContain("89 ريال");
    expect(qurtubah?.hallPhone).toContain("0592301850");
  });

  it("keeps internal room types visibly separated for verification", () => {
    const rass = branchRecords.find((branch) => branch.branch === "بريرا الرس");
    expect(rass?.roomTypes.length).toBeGreaterThan(0);
    expect(rass?.roomSource).toBe("internal");
  });
});
