import { describe, expect, it } from "vitest";
import Dashboard from "@/pages/Dashboard";

describe("Dashboard module", () => {
  it("loads without syntax errors", () => {
    expect(typeof Dashboard).toBe("function");
  });
});
