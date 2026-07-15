import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

describe("BHG Runner", () => {
  it("publishes the runner route and dashboard entry", () => {
    const app = fs.readFileSync(path.join(process.cwd(), "src/App.tsx"), "utf8");
    const dashboard = fs.readFileSync(path.join(process.cwd(), "src/pages/Dashboard.tsx"), "utf8");
    expect(app).toContain('path="/runner"');
    expect(dashboard).toContain('to: "/runner"');
    expect(dashboard).toContain("BHG Runner");
  });

  it("includes every hotel brand and touch-friendly controls", () => {
    const game = fs.readFileSync(path.join(process.cwd(), "src/pages/BoudlRunner.tsx"), "utf8");
    expect(game).toContain('ar: "بودل"');
    expect(game).toContain('ar: "بريرا"');
    expect(game).toContain('ar: "نارسيس"');
    expect(game).toContain('ar: "عابر"');
    expect(game).toContain("onPointerDown={handleCanvasPress}");
    expect(game).toContain("bhg_runner_high_score");
  });
});
