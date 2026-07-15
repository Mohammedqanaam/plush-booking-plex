import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

describe("protected visitor intelligence", () => {
  it("keeps the ghost route behind the administration guard", () => {
    const app = fs.readFileSync(path.join(process.cwd(), "src/App.tsx"), "utf8");
    const layout = fs.readFileSync(path.join(process.cwd(), "src/components/Layout.tsx"), "utf8");
    expect(app).toContain('path="/admin/ghost"');
    expect(app).toContain("<ProtectedRoute><AdminGhost /></ProtectedRoute>");
    expect(layout).not.toContain('/admin/ghost');
  });

  it("masks IP addresses and avoids invasive browser fingerprinting", () => {
    const analytics = fs.readFileSync(path.join(process.cwd(), "netlify/functions/analytics.ts"), "utf8");
    const tracker = fs.readFileSync(path.join(process.cwd(), "src/components/AnalyticsTracker.tsx"), "utf8");
    expect(analytics).toContain("function maskIp");
    expect(analytics).toContain('ipMode: "masked"');
    expect(analytics).toContain('fingerprinting: false');
    expect(tracker).not.toMatch(/canvas|getContext\(|webgl|geolocation/i);
  });
});
