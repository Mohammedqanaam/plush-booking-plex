import { getStore } from "@netlify/blobs";

type Session = { username: string; role: string };

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

async function validateSession(req: Request): Promise<Session | null> {
  const authHeader = req.headers.get("Authorization");
  const token = authHeader?.replace("Bearer ", "").trim();
  if (!token) return null;

  const sessionStore = getStore({ name: "sessions", consistency: "strong" });
  try {
    return (await sessionStore.get(`sess_${token}`, { type: "json" })) as Session | null;
  } catch {
    return null;
  }
}

const normalizeKey = (value: string) =>
  value
    .replace(/^\uFEFF/, "")
    .toLowerCase()
    .replace(/[\u064B-\u0652]/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/[\s_\-\/]+/g, "")
    .trim();

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2) return [];

  const parseRow = (line: string): string[] => {
    const fields: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === "," && !inQuotes) {
        fields.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    fields.push(current.trim());
    return fields;
  };

  const headers = parseRow(lines[0]).map((header) => header.replace(/^\uFEFF/, "").trim());

  return lines
    .slice(1)
    .filter((line) => line.trim())
    .map((line) => {
      const values = parseRow(line);
      const record: Record<string, string> = {};
      headers.forEach((header, index) => {
        record[header] = values[index] || "";
      });
      return record;
    });
}

function getRecordValue(record: Record<string, string>, keys: string[]): string {
  for (const key of keys) {
    if (record[key] && String(record[key]).trim()) return String(record[key]);
  }

  const normalizedTargets = keys.map(normalizeKey);
  for (const [rawKey, rawValue] of Object.entries(record)) {
    if (!String(rawValue).trim()) continue;
    const normalized = normalizeKey(rawKey);

    if (normalizedTargets.includes(normalized)) return String(rawValue);

    if (
      normalizedTargets.some(
        (target) => normalized.includes(target) || target.includes(normalized),
      )
    ) {
      return String(rawValue);
    }
  }

  return "";
}

function classifyStatus(status: string): "confirmed" | "cancelled" | "not_confirmed" {
  const s = status.trim().toUpperCase();
  if (s === "C" || s === "NS") return "cancelled";
  return "confirmed";
}

function getBookingStatus(record: Record<string, string>): string {
  return getRecordValue(record, [
    "Status",
    "status",
    "Booking Status",
    "BookingStatus",
    "حالة الحجز",
    "الحالة",
  ]);
}

function calculateStats(bookings: Record<string, string>[]) {
  let confirmed = 0;
  let cancelled = 0;

  bookings.forEach((booking) => {
    const category = classifyStatus(getBookingStatus(booking));
    if (category === "confirmed") confirmed++;
    else if (category === "cancelled") cancelled++;
  });

  const total = bookings.length;
  return {
    total,
    confirmed,
    cancelled,
    cancelRate: total ? parseFloat(((cancelled / total) * 100).toFixed(1)) : 0,
  };
}

export default async (req: Request) => {
  const method = req.method;
  const store = getStore("bookings");

  if (method === "GET") {
    try {
      const bookings = ((await store.get("data", { type: "json" })) as Record<string, string>[]) || [];
      const stats = (await store.get("stats", { type: "json" })) || {
        total: 0,
        confirmed: 0,
        cancelled: 0,
        cancelRate: 0,
      };
      return json({ bookings, stats });
    } catch {
      return json({
        bookings: [],
        stats: { total: 0, confirmed: 0, cancelled: 0, cancelRate: 0 },
      });
    }
  }


  if (method === "DELETE") {
    const session = await validateSession(req);
    if (!session) return json({ error: "Unauthorized" }, 401);

    if (!["superadmin", "admin"].includes(session.role)) {
      return json({ error: "Permission Denied" }, 403);
    }

    await store.setJSON("data", []);
    await store.setJSON("stats", { total: 0, confirmed: 0, cancelled: 0, cancelRate: 0 });

    return json({ ok: true });
  }

  if (method === "POST") {
    const session = await validateSession(req);
    if (!session) return json({ error: "Unauthorized" }, 401);

    if (!["superadmin", "admin", "editor"].includes(session.role)) {
      return json({ error: "Permission Denied" }, 403);
    }

    let csvText: string;
    try {
      csvText = await req.text();
    } catch {
      return json({ error: "Failed to read request body" }, 400);
    }

    if (!csvText.trim()) {
      return json({ error: "Empty CSV" }, 400);
    }

    const bookings = parseCSV(csvText);
    if (bookings.length === 0) {
      return json({ error: "No valid data found in CSV" }, 400);
    }

    const stats = calculateStats(bookings);
    await store.setJSON("data", bookings);
    await store.setJSON("stats", stats);

    return json({ ok: true, stats });
  }

  return json({ error: "Method not allowed" }, 405);
};
