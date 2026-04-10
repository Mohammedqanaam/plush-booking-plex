import { employeeKeyFromName } from "@/lib/employeePerformance";

export const normalizeEmployeeName = (value: string) => value.replace(/\s+/g, " ").trim().toLowerCase();

export const normalizeHiddenEmployees = (names: string[]) => {
  const seen = new Set<string>();

  return names
    .map((name) => name.replace(/\s+/g, " ").trim())
    .filter((name) => {
      if (!name) return false;
      const normalized = employeeKeyFromName(name);
      if (seen.has(normalized)) return false;
      seen.add(normalized);
      return true;
    });
};

export const parseHiddenEmployeesInput = (value: string) =>
  normalizeHiddenEmployees(value.split(","));

export const isEmployeeHidden = (employeeName: string, hiddenEmployees: string[]) => {
  const employeeKey = employeeKeyFromName(employeeName);
  return hiddenEmployees.some((name) => employeeKeyFromName(name) === employeeKey);
};
