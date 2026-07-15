import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Branches from "@/pages/Branches";
import KnowledgeBank from "@/pages/KnowledgeBank";
import UploadCenter from "@/pages/UploadCenter";
import fs from "node:fs";
import path from "node:path";

describe("public pages are read-only", () => {
  it("shows read-only guidance in branches page", () => {
    render(<MemoryRouter><Branches /></MemoryRouter>);
    expect(screen.getByText(/هذه الصفحة للعرض فقط/)).toBeDefined();
  });

  it("shows read-only guidance in knowledge bank page", () => {
    render(<MemoryRouter><KnowledgeBank /></MemoryRouter>);
    expect(screen.getByText(/الصفحة للعرض فقط/)).toBeDefined();
  });

  it("does not render upload file input in public upload center", () => {
    const { container } = render(<MemoryRouter><UploadCenter /></MemoryRouter>);
    expect(container.querySelector('input[type="file"]')).toBeNull();
    expect(screen.getByText(/رفع البيانات أو إعادة تعيينها متاح للمستخدمين المخولين/)).toBeDefined();
  });

  it("keeps one public booking report and redirects the old employee route", () => {
    const app = fs.readFileSync(path.join(process.cwd(), "src/App.tsx"), "utf8");
    expect(app).toContain('<Route path="/employees" element={<Navigate to="/booking-reports?section=employees" replace />} />');
    expect(app).toContain('<Route path="/booking-reports" element={<BookingReports />} />');
    expect(app).not.toContain('const Employees = lazy');
  });

  it("removes the policies page and redirects its old route home", () => {
    const app = fs.readFileSync(path.join(process.cwd(), "src/App.tsx"), "utf8");
    const dashboard = fs.readFileSync(path.join(process.cwd(), "src/pages/Dashboard.tsx"), "utf8");
    expect(app).toContain('<Route path="/policies" element={<Navigate to="/" replace />} />');
    expect(app).not.toContain('const Policies = lazy');
    expect(dashboard).not.toContain('to: "/policies"');
  });
});
