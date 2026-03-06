import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

describe("dashboard mobile stats layout", () => {
  it("renders KPI labels as badge chips and mobile agent cards", () => {
    const source = fs.readFileSync(path.join(process.cwd(), "src/pages/Dashboard.tsx"), "utf8");

    expect(source).toContain("grid grid-cols-2 lg:grid-cols-4");
    expect(source).toContain("inline-flex items-center gap-1 rounded-full bg-primary/10");
    expect(source).toContain("sm:hidden space-y-2");
    expect(source).toContain("hidden sm:block overflow-x-auto");
  });
});
