import { describe, expect, it } from "vitest";
import KnowledgeBank from "@/pages/KnowledgeBank";
import BookingReports from "@/pages/BookingReports";
import Branches from "@/pages/Branches";
import EnterpriseThemeLoader from "@/components/EnterpriseThemeLoader";
import AdminBranches from "@/pages/AdminBranches";
import AdminKnowledgeBank from "@/pages/AdminKnowledgeBank";
import AdminWarnings from "@/pages/AdminWarnings";
import AdminGhost from "@/pages/AdminGhost";
import AdminUno from "@/pages/AdminUno";

describe("new page modules added in PR #86", () => {
  it("KnowledgeBank loads without syntax errors", () => {
    expect(typeof KnowledgeBank).toBe("function");
  });

  it("BookingReports loads without syntax errors", () => {
    expect(typeof BookingReports).toBe("function");
  });

  it("Branches loads without syntax errors", () => {
    expect(typeof Branches).toBe("function");
  });

  it("EnterpriseThemeLoader loads without syntax errors", () => {
    expect(typeof EnterpriseThemeLoader).toBe("function");
  });

  it("AdminBranches loads without syntax errors", () => {
    expect(typeof AdminBranches).toBe("function");
  });

  it("AdminKnowledgeBank loads without syntax errors", () => {
    expect(typeof AdminKnowledgeBank).toBe("function");
  });

  it("AdminWarnings loads without syntax errors", () => {
    expect(typeof AdminWarnings).toBe("function");
  });

  it("AdminGhost loads without syntax errors", () => {
    expect(typeof AdminGhost).toBe("function");
  });

  it("AdminUno loads without syntax errors", () => {
    expect(typeof AdminUno).toBe("function");
  });

});
