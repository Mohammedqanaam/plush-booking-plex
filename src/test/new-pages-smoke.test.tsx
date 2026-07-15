import { describe, expect, it } from "vitest";
import KnowledgeBank from "@/pages/KnowledgeBank";
import UploadCenter from "@/pages/UploadCenter";
import BookingReports from "@/pages/BookingReports";
import Branches from "@/pages/Branches";
import OperationsSettings from "@/pages/OperationsSettings";
import EnterpriseThemeLoader from "@/components/EnterpriseThemeLoader";
import AdminBranches from "@/pages/AdminBranches";
import AdminKnowledgeBank from "@/pages/AdminKnowledgeBank";
import AdminWarnings from "@/pages/AdminWarnings";

describe("new page modules added in PR #86", () => {
  it("KnowledgeBank loads without syntax errors", () => {
    expect(typeof KnowledgeBank).toBe("function");
  });

  it("UploadCenter loads without syntax errors", () => {
    expect(typeof UploadCenter).toBe("function");
  });

  it("BookingReports loads without syntax errors", () => {
    expect(typeof BookingReports).toBe("function");
  });

  it("Branches loads without syntax errors", () => {
    expect(typeof Branches).toBe("function");
  });

  it("OperationsSettings loads without syntax errors", () => {
    expect(typeof OperationsSettings).toBe("function");
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
});
