import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

describe("app shell and web app metadata", () => {
  it("enables app-like metadata in index.html", () => {
    const html = fs.readFileSync(path.join(process.cwd(), "index.html"), "utf8");

    expect(html).toContain('<html lang="ar" dir="rtl">');
    expect(html).toContain('name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"');
    expect(html).toContain('<link rel="manifest" href="/manifest.json">');
    expect(html).toContain('name="apple-mobile-web-app-capable" content="yes"');
  });

  it("defines safe-area and app-shell utilities", () => {
    const css = fs.readFileSync(path.join(process.cwd(), "src/index.css"), "utf8");

    expect(css).toContain(".app-shell");
    expect(css).toContain(".safe-area-top");
    expect(css).toContain(".safe-area-bottom");
  });
});
