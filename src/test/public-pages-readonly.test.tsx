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

  it("exposes employee and booking reports without the admin guard", () => {
    const app = fs.readFileSync(path.join(process.cwd(), "src/App.tsx"), "utf8");
    expect(app).toContain('<Route path="/employees" element={<Employees />} />');
    expect(app).toContain('<Route path="/booking-reports" element={<BookingReports />} />');
    expect(app).not.toContain('<Route path="/employees" element={<ProtectedRoute>');
  });
});
