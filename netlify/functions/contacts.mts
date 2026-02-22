import { getStore } from "@netlify/blobs";
import { createHmac } from "node:crypto";
import type { Config, Context } from "@netlify/functions";

interface ContactRequest {
  id: string;
  branchName: string;
  customerName: string;
  phone: string;
  note: string;
  status: "new" | "done";
  createdAt: string;
}

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

export default async (req: Request, context: Context) => {
  const store = getStore({ name: "contacts", consistency: "strong" });

  if (req.method === "GET") {
    const session = getAuthSession(req);
    if (!session) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!["superadmin", "admin"].includes(session.role)) {
      return Response.json({ error: "Permission denied" }, { status: 403 });
    }
    const contacts =
      ((await store.get("all", { type: "json" })) as ContactRequest[]) || [];
    return Response.json({ contacts });
  }

  if (req.method === "POST") {
    let body: Record<string, string>;
    try {
      body = await req.json();
    } catch {
      return Response.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const { action } = body;

    if (action === "submit") {
      const { branchName, customerName, phone, note } = body;
      if (!branchName || !customerName || !phone) {
        return Response.json(
          { error: "Missing required fields" },
          { status: 400 }
        );
      }

      const contacts =
        ((await store.get("all", { type: "json" })) as ContactRequest[]) || [];
      const newContact: ContactRequest = {
        id: Date.now().toString(),
        branchName,
        customerName,
        phone,
        note: note || "",
        status: "new",
        createdAt: new Date().toISOString(),
      };
      contacts.unshift(newContact);
      await store.setJSON("all", contacts);
      return Response.json({ success: true });
    }

    if (action === "update") {
      const session = getAuthSession(req);
      if (!session) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (!["superadmin", "admin"].includes(session.role)) {
        return Response.json(
          { error: "Permission denied" },
          { status: 403 }
        );
      }

      const { id, status } = body;
      if (!id) {
        return Response.json({ error: "Missing contact ID" }, { status: 400 });
      }

      const contacts =
        ((await store.get("all", { type: "json" })) as ContactRequest[]) || [];
      const index = contacts.findIndex((c) => c.id === id);
      if (index >= 0) {
        contacts[index].status = (status as "new" | "done") || "done";
        await store.setJSON("all", contacts);
      }
      return Response.json({ success: true });
    }

    return Response.json({ error: "Invalid action" }, { status: 400 });
  }

  return Response.json({ error: "Method not allowed" }, { status: 405 });
};

export const config: Config = {
  path: "/api/contacts",
};
