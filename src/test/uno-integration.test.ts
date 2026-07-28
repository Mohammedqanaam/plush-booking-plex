import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { isTrustedRateGainUrl } from "../../netlify/functions/uno-connection";

describe("UNO integration boundary", () => {
  it("allows only HTTPS RateGain endpoints", () => {
    expect(isTrustedRateGainUrl("https://unolive.rategain.com/")).toBe(true);
    expect(isTrustedRateGainUrl("https://api.rategain.com/uno")).toBe(true);
    expect(isTrustedRateGainUrl("http://unolive.rategain.com/")).toBe(false);
    expect(isTrustedRateGainUrl("https://rategain.com.attacker.example/")).toBe(false);
    expect(isTrustedRateGainUrl("https://example.com/")).toBe(false);
  });

  it("keeps UNO credentials server-side", () => {
    const root = process.cwd();
    const page = fs.readFileSync(path.join(root, "src/pages/AdminUno.tsx"), "utf8");
    const fn = fs.readFileSync(path.join(root, "netlify/functions/uno-connection.ts"), "utf8");
    const app = fs.readFileSync(path.join(root, "src/App.tsx"), "utf8");

    expect(app).toContain('path="/admin/uno"');
    expect(page).not.toContain("UNO_API_TOKEN");
    expect(page).not.toContain("UNO_API_KEY");
    expect(fn).toContain('Netlify.env.get(key)');
    expect(fn).toContain('path: "/api/admin/uno"');
  });
});
