import { describe, expect, it } from "vitest";

import { isEmployeeHidden, normalizeEmployeeName, normalizeHiddenEmployees, parseHiddenEmployeesInput } from "@/lib/employeeVisibility";

describe("employee visibility helpers", () => {
  it("deduplicates hidden employees regardless of spacing and casing", () => {
    expect(normalizeHiddenEmployees(["  Ahmed  Ali ", "ahmed ali", "Sara"]).map(normalizeEmployeeName)).toEqual(["ahmed ali", "sara"]);
  });

  it("parses admin comma-separated input safely", () => {
    expect(parseHiddenEmployeesInput(" Ahmed Ali, , sara , Ahmed   Ali ")).toEqual(["Ahmed Ali", "sara"]);
  });

  it("matches hidden employees using normalized names", () => {
    expect(isEmployeeHidden("Ahmed   Ali", [" ahmed ali "])).toBe(true);
    expect(isEmployeeHidden("Mona", [" ahmed ali "])).toBe(false);
  });
});
