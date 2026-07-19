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

  it("collects bookings while a generic supervisor chases through real named hotels", () => {
    const game = fs.readFileSync(path.join(process.cwd(), "src/pages/BoudlRunner.tsx"), "utf8");
    expect(game).toContain('type TrackObjectType = "booking" | "vip" | "coffee" | "call" | "cart"');
    expect(game).toContain("الشفت بدأ");
    expect(game).toContain("المشرف يقترب");
    expect(game).toContain("نارسيس الرياض");
    expect(game).toContain("بريرا النخيل");
    expect(game).toContain("عابر المونسية");
    expect(game).toContain("بودل السليمانية");
    expect(game).toContain("/images/narcissus-riyadh.png");
  });

  it("makes the 500-booking challenge winnable without advertising a phone prize", () => {
    const game = fs.readFileSync(path.join(process.cwd(), "src/pages/BoudlRunner.tsx"), "utf8");
    expect(game).toContain("const CONTEST_GOAL = 500");
    expect(game).toContain("world.bookings >= CONTEST_GOAL");
    expect(game).toContain("winChallenge()");
    expect(game).toContain("PRESSURE_THRESHOLDS = [100, 250, 400, 475]");
    expect(game).toContain("إنجاز ٥٠٠ حجز");
    expect(game).not.toMatch(/iPhone|iphone|آيفون|ايفون|runner-virtual-phone/);
  });
});
