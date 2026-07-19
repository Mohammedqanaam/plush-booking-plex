import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

describe("retired game", () => {
  it("removes the game and redirects its former routes home", () => {
    const root = process.cwd();
    const app = fs.readFileSync(path.join(root, "src/App.tsx"), "utf8");
    const dashboard = fs.readFileSync(path.join(root, "src/pages/Dashboard.tsx"), "utf8");

    expect(app).toContain('<Route path="/runner" element={<Navigate to="/" replace />} />');
    expect(app).toContain('<Route path="/relax" element={<Navigate to="/" replace />} />');
    expect(app).not.toContain("BoudlRunner");
    expect(dashboard).not.toContain('to: "/runner"');
    expect(fs.existsSync(path.join(root, "src/pages/BoudlRunner.tsx"))).toBe(false);
    expect(fs.existsSync(path.join(root, "netlify/functions/runner-leaderboard.ts"))).toBe(false);
  });
});
