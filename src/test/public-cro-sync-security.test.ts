import { describe, expect, it } from "vitest";
import fs from "node:fs";

describe("public booking report synchronization", () => {
  const endpoint = fs.readFileSync("netlify/functions/cro-sync-public.ts", "utf8");
  const page = fs.readFileSync("src/pages/BookingReports.tsx", "utf8");
  const client = fs.readFileSync("src/lib/api.ts", "utf8");

  it("accepts only a same-site signal and applies public rate limiting", () => {
    expect(endpoint).toContain('req.headers.get("x-report-sync") === "booking-reports"');
    expect(endpoint).toContain('req.headers.get("sec-fetch-site") !== "cross-site"');
    expect(endpoint).toContain("windowLimit: 5");
    expect(endpoint).toContain("PUBLIC_SYNC_COOLDOWN_MS");
  });

  it("uses server-side automatic settings and sends no credentials from the browser", () => {
    expect(endpoint).toContain("automaticCroConfig()");
    expect(endpoint).toContain('croEnvironmentValue("CRO_SYNC_SECRET")');
    expect(client).not.toMatch(/requestPublicBookingSync\([\s\S]*?username/);
    expect(client).not.toMatch(/requestPublicBookingSync\([\s\S]*?password/);
    expect(page).not.toMatch(/M\.ALDOSARI|CRO_USERNAME|CRO_PASSWORD/);
  });
});
