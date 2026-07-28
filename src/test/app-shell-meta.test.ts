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
    expect(html).toContain('<title>داش بورد الحجز المركزي</title>');
    expect(html).toContain('property="og:title" content="داش بورد الحجز المركزي"');
    expect(html).toContain('property="og:site_name" content="مجموعة بودل للضيافة"');
    expect(html).toContain('property="og:image" content="https://www.res-dashbord.com/bhg-hospitality-group.jpg?v=20260716"');
    expect(html).not.toContain("Worm-AI");
    expect(html).not.toContain("Lovable");
  });

  it("defines safe-area and app-shell utilities", () => {
    const css = fs.readFileSync(path.join(process.cwd(), "src/index.css"), "utf8");

    expect(css).toContain(".app-shell");
    expect(css).toContain(".safe-area-top");
    expect(css).toContain(".safe-area-bottom");
  });

  it("keeps a visible administration login entry in the public shell", () => {
    const layout = fs.readFileSync(path.join(process.cwd(), "src/components/Layout.tsx"), "utf8");
    expect(layout).toContain('to="/admin/login"');
    expect(layout).toContain('aria-label="دخول الإدارة"');
    expect(layout).not.toContain("bannerText");
    expect(layout).not.toContain("آخر تحديث اليوم");
  });

  it("keeps page headings concise", () => {
    const pageHeader = fs.readFileSync(path.join(process.cwd(), "src/components/PageHeader.tsx"), "utf8");
    expect(pageHeader).not.toContain("{subtitle ?");
  });

  it("adds the Boudl Hospitality Group logo to the public page footer", () => {
    const footer = fs.readFileSync(path.join(process.cwd(), "src/components/BrandFooter.tsx"), "utf8");
    expect(footer).toContain('/bhg-hospitality-group.jpg');
    expect(footer).toContain('مجموعة بودل للضيافة');
    expect(fs.existsSync(path.join(process.cwd(), "public/bhg-hospitality-group.jpg"))).toBe(true);
  });

  it("defines an A4 print layout for employee warnings", () => {
    const css = fs.readFileSync(path.join(process.cwd(), "src/index.css"), "utf8");
    expect(css).toContain("@media print");
    expect(css).toContain("size: A4 portrait");
    expect(css).toContain(".warning-print-only");
    expect(css).toContain("max-height: 296mm");
    expect(css).toContain("overflow: hidden !important");
    expect(css).toContain("page-break-inside: avoid");
  });
});
