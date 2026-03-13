import { describe, expect, it } from "vitest";
import seed from "@/data/knowledge_bank_seed.json";
import { hotelBranches } from "@/data/hotels";
import { masterHotels } from "@/data/hotelMasterData";
import { branchInventoryByBrand, branchRecords } from "@/data/knowledge";

const normalize = (value: string) => value
  .replace(/[أإآ]/g, "ا")
  .replace(/ى/g, "ي")
  .replace(/ة/g, "ه")
  .replace(/\s+/g, " ")
  .trim()
  .replace("قرطبه", "قرطبة")
  .replace("نارسس", "نارسيس");

describe("knowledge inventory completeness", () => {
  it("contains all brands", () => {
    expect(branchInventoryByBrand.Braira.length).toBeGreaterThan(0);
    expect(branchInventoryByBrand.Boudl.length).toBeGreaterThan(0);
    expect(branchInventoryByBrand.Aber.length).toBeGreaterThan(0);
    expect(branchInventoryByBrand.Narcissus.length).toBeGreaterThan(0);
  });

  it("covers branches listed in operational sources", () => {
    const sourceNames = new Set<string>();
    hotelBranches.forEach((row) => sourceNames.add(normalize(row.name)));
    masterHotels.forEach((row) => sourceNames.add(normalize(row.name)));
    seed.branches.forEach((row) => sourceNames.add(normalize(row.branch)));

    const inventory = new Set(branchRecords.map((row) => normalize(row.branch)));
    const missing = [...sourceNames].filter((name) => !inventory.has(name));
    expect(missing).toEqual([]);
  });
});
