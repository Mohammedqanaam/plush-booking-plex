import { getStore } from "@netlify/blobs";
import { createHmac } from "node:crypto";
import type { Config, Context } from "@netlify/functions";

function getSecret(): string {
  return Netlify.env.get("ADMIN_SECRET") || "worm-ai-default-secret-2026";
}

function getAuthSession(
  req: Request
): { username: string; role: string } | null {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  try {
    const token = authHeader.slice(7);
    const parts = token.split(".");
    if (parts.length !== 2) return null;
    const [payload, sig] = parts;
    const expected = createHmac("sha256", getSecret())
      .update(payload)
      .digest("hex");
    if (sig !== expected) return null;
    return JSON.parse(Buffer.from(payload, "base64url").toString());
  } catch {
    return null;
  }
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (inQuotes) {
      if (char === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ",") {
        result.push(current);
        current = "";
      } else {
        current += char;
      }
    }
  }
  result.push(current);
  return result;
}

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];
  const headers = parseCSVLine(lines[0]);
  return lines.slice(1).map((line) => {
    const values = parseCSVLine(line);
    const record: Record<string, string> = {};
    headers.forEach((h, i) => {
      record[h.trim()] = (values[i] || "").trim();
    });
    return record;
  });
}

function categorizeStatus(
  status: string
): "confirmed" | "cancelled" | "not_confirmed" {
  const s = status.trim().toUpperCase();
  if (s === "N" || s === "M" || s === "CONFIRMED") return "confirmed";
  if (s === "C" || s === "NS") return "cancelled";
  return "not_confirmed";
}

function calculateStats(records: Record<string, string>[]) {
  let total = 0;
  let confirmed = 0;
  let cancelled = 0;
  const employeeMap = new Map<
    string,
    { name: string; total: number; confirmed: number; cancelled: number }
  >();

  for (const record of records) {
    const name = String(
      record["Employee Name"] ||
        record["EmployeeName"] ||
        record["employee_name"] ||
        record["Employee"] ||
        record["employee"] ||
        ""
    ).trim();

    const status = String(
      record["Status"] ||
        record["status"] ||
        record["Booking Status"] ||
        record["BookingStatus"] ||
        ""
    );

    const category = categorizeStatus(status);
    total++;
    if (category === "confirmed") confirmed++;
    if (category === "cancelled") cancelled++;

    if (name) {
      const current = employeeMap.get(name) || {
        name,
        total: 0,
        confirmed: 0,
        cancelled: 0,
      };
      current.total++;
      if (category === "confirmed") current.confirmed++;
      if (category === "cancelled") current.cancelled++;
      employeeMap.set(name, current);
    }
  }

  const employees = Array.from(employeeMap.values())
    .sort((a, b) => b.total - a.total)
    .slice(0, 40)
    .map((emp) => ({
      ...emp,
      cancelRate: emp.total ? (emp.cancelled / emp.total) * 100 : 0,
    }));

  return {
    total,
    confirmed,
    cancelled,
    cancelRate: total ? (cancelled / total) * 100 : 0,
    employees,
  };
}

export default async (req: Request, context: Context) => {
  const store = getStore({ name: "bookings", consistency: "strong" });

  if (req.method === "GET") {
    const stats = await store.get("stats", { type: "json" });
    return Response.json({ stats: stats || null });
  }

  if (req.method === "POST") {
    const session = getAuthSession(req);
    if (!session) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!["superadmin", "admin", "editor"].includes(session.role)) {
      return Response.json({ error: "Permission denied" }, { status: 403 });
    }

    let body: { csv?: string };
    try {
      body = await req.json();
    } catch {
      return Response.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const { csv } = body;
    if (!csv || typeof csv !== "string") {
      return Response.json(
        { error: "No CSV data provided" },
        { status: 400 }
      );
    }

    const records = parseCSV(csv);
    if (records.length === 0) {
      return Response.json(
        { error: "No valid records found in CSV" },
        { status: 400 }
      );
    }

    const stats = calculateStats(records);
    await store.setJSON("records", records);
    await store.setJSON("stats", stats);

    return Response.json({ stats, recordCount: records.length });
  }

  return Response.json({ error: "Method not allowed" }, { status: 405 });
};

export const config: Config = {
  path: "/api/bookings",
};
