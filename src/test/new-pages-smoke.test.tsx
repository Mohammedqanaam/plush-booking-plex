import { describe, expect, it } from "vitest";
import KnowledgeBank from "@/pages/KnowledgeBank";
import UploadCenter from "@/pages/UploadCenter";
import Employees from "@/pages/Employees";
import Policies from "@/pages/Policies";
import Branches from "@/pages/Branches";
import OperationsSettings from "@/pages/OperationsSettings";
import EnterpriseThemeLoader from "@/components/EnterpriseThemeLoader";

describe("new page modules added in PR #86", () => {
  it("KnowledgeBank loads without syntax errors", () => {
    expect(typeof KnowledgeBank).toBe("function");
  });

  it("UploadCenter loads without syntax errors", () => {
    expect(typeof UploadCenter).toBe("function");
  });

  it("Employees loads without syntax errors", () => {
    expect(typeof Employees).toBe("function");
  });

  it("Policies loads without syntax errors", () => {
    expect(typeof Policies).toBe("function");
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
});
