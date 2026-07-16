import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import AdminAvayaReports from "@/pages/AdminAvayaReports";

afterEach(() => {
  cleanup();
  sessionStorage.clear();
});

describe("Avaya admin upload center", () => {
  it("shows the three required exports only to an authenticated uploader", () => {
    sessionStorage.setItem("admin_session", JSON.stringify({ username: "tester", role: "editor" }));
    render(<MemoryRouter initialEntries={["/admin/avaya-reports"]}><AdminAvayaReports /></MemoryRouter>);

    expect(screen.getByRole("heading", { name: "تقارير Avaya" })).toBeInTheDocument();
    expect(screen.getByText("User Inbound Summary")).toBeInTheDocument();
    expect(screen.getByText("Feature Trace")).toBeInTheDocument();
    expect(screen.getByText("Agent Time Card")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /إنشاء التقرير الموحد/ })).toBeDisabled();
    expect(screen.getByText(/لا تُرفع ملفات الموظفين إلى الخادم/)).toBeInTheDocument();
  });
});
