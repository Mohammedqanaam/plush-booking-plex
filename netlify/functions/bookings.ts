import { getStore } from "@netlify/blobs";
import { json, validateSession } from "./_shared/security";
import { buildPublicBookingReport } from "./_shared/bookingReport";
import { BookingCsvError, saveBookingCsv } from "./_shared/bookingCsv";

export default async (req: Request) => {
  const method = req.method;
  const store = getStore("bookings");

  if (method === "GET") {
    try {
      const bookings = ((await store.get("data", { type: "json" })) as Record<string, string>[]) || [];
      const stats = ((await store.get("stats", { type: "json" })) as Record<string, unknown> | null) || {
        total: 0,
        confirmed: 0,
        cancelled: 0,
        cancelRate: 0,
      };

      const requestUrl = new URL(req.url);
      if (requestUrl.searchParams.get("view") === "summary") {
        const settingsStore = getStore("settings");
        const settings = ((await settingsStore.get("site", { type: "json" })) as Record<string, unknown> | null) || {};
        return json(buildPublicBookingReport(bookings, settings, typeof stats.updatedAt === "string" ? stats.updatedAt : null));
      }

      const session = await validateSession(req);
      if (!session) return json({ error: "Unauthorized" }, 401);
      return json({ bookings, stats });
    } catch {
      return json({ error: "Unable to load booking data" }, 500);
    }
  }

  const session = await validateSession(req);
  if (!session) return json({ error: "Unauthorized" }, 401);


  if (method === "DELETE") {
    if (!["superadmin", "admin"].includes(session.role)) {
      return json({ error: "Permission Denied" }, 403);
    }

    await store.setJSON("data", []);
    await store.setJSON("stats", { total: 0, confirmed: 0, cancelled: 0, cancelRate: 0, updatedAt: new Date().toISOString() });

    return json({ ok: true });
  }

  if (method === "POST") {
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
    if (new TextEncoder().encode(csvText).byteLength > 5 * 1024 * 1024) {
      return json({ error: "CSV exceeds the 5 MB limit" }, 413);
    }

    try {
      const stats = await saveBookingCsv(csvText);
      return json({ ok: true, stats });
    } catch (error) {
      if (error instanceof BookingCsvError) return json({ error: error.message }, error.status);
      return json({ error: "Unable to save booking data" }, 500);
    }
  }

  return json({ error: "Method not allowed" }, 405);
};
