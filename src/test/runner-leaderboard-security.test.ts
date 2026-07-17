import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

describe("runner entertainment leaderboard", () => {
  const api = fs.readFileSync(path.join(process.cwd(), "netlify/functions/runner-leaderboard.ts"), "utf8");
  const game = fs.readFileSync(path.join(process.cwd(), "src/pages/BoudlRunner.tsx"), "utf8");

  it("validates and rate-limits public score submissions", () => {
    expect(api).toContain("cleanName");
    expect(api).toContain("maximumPlausibleScore");
    expect(api).toContain("Score could not be verified");
    expect(api).toContain("windowLimit: 30");
    expect(api).toContain("playerId");
  });

  it("isolates preview scores from the production leaderboard", () => {
    expect(api).toContain('context.deploy.context === "production"');
    expect(api).toContain('consistency: "strong"');
    expect(api).toContain("getDeployStore");
    expect(api).toContain("context.deploy.id");
  });

  it("keeps the leaderboard clearly entertainment-only", () => {
    expect(game).toContain("متصدرو الشفت");
    expect(game).toContain("ترتيب ترفيهي داخل اللعبة");
    expect(game).toContain("لا يُستخدم لاعتماد مكافآت أو إجراءات وظيفية");
  });
});
