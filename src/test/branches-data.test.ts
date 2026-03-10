import { describe, expect, it } from "vitest";
import { branches } from "@/data/branches";
import { branchDataReview } from "@/data/branchDataReview";

describe("branch data normalization", () => {
  it("normalizes multi-contact sales numbers into structured contacts", () => {
    const royal = branches.find((branch) => branch.id === "nr-royal");
    expect(royal).toBeDefined();
    expect(royal?.contacts.some((contact) => contact.value === "+966583053045")).toBe(true);
    expect(royal?.contacts.some((contact) => contact.value === "+966559654930")).toBe(true);
  });

  it("marks temporary service outages as conflicting", () => {
    const wadi = branches.find((branch) => branch.id === "bd-wadi");
    expect(wadi?.verificationStatus).toBe("conflicting");
  });

  it("exposes explicit missing/conflicting/manual review buckets in branch report", () => {
    const reportItem = branchDataReview.branches.find((item) => item.branch === "بريرا النخيل");
    expect(reportItem).toBeDefined();
    expect(Array.isArray(reportItem?.missing)).toBe(true);
    expect(Array.isArray(reportItem?.conflicting)).toBe(true);
    expect(Array.isArray(reportItem?.needs_manual_review)).toBe(true);
  });
});
