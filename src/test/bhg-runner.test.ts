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

  it("uses a third-person lane runner with touch-friendly controls", () => {
    const game = fs.readFileSync(path.join(process.cwd(), "src/pages/BoudlRunner.tsx"), "utf8");
    expect(game).toContain('ar: "بودل"');
    expect(game).toContain('ar: "بريرا"');
    expect(game).toContain('ar: "نارسيس"');
    expect(game).toContain('ar: "عابر"');
    expect(game).toContain("type Lane = -1 | 0 | 1");
    expect(game).toContain("onPointerDown={handlePointerDown}");
    expect(game).toContain("onPointerUp={handlePointerUp}");
    expect(game).toContain("bhg_runner_high_score");
  });

  it("collects bookings while Sadiq chases through real named hotels", () => {
    const game = fs.readFileSync(path.join(process.cwd(), "src/pages/BoudlRunner.tsx"), "utf8");
    expect(game).toContain('type TrackObjectType = "booking" | "call" | "cart"');
    expect(game).toContain("صادق وراك");
    expect(game).toContain("نارسيس الرياض");
    expect(game).toContain("بريرا النخيل");
    expect(game).toContain("عابر المونسية");
    expect(game).toContain("بودل السليمانية");
    expect(game).toContain("/images/narcissus-riyadh.png");
  });
});
