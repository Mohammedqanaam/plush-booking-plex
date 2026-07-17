import type { Context } from "@netlify/functions";
import { json, validateSession } from "./_shared/security";

export default async (req: Request, context: Context) => {
  const store = context.blobs.getStore("complaints");

  if (req.method !== "GET") {
    return json({ error: "Method Not Allowed" }, 405);
  }

  const session = await validateSession(req);
  if (!session) return json({ error: "Unauthorized" }, 401);
  if (!["superadmin", "admin"].includes(session.role)) {
    return json({ error: "Permission Denied" }, 403);
  }

  const data = ((await store.get("items", { type: "json" })) as unknown[]) || [];

  return json(data);
};

export const config = {
  path: "/api/admin/complaints",
};
