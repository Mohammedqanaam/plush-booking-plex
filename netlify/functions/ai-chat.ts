import { json, validateSession } from "./_shared/security";


function extractReply(data: unknown): string {
  if (!data || typeof data !== "object") return String(data ?? "");
  const d = data as Record<string, unknown>;

  // MCP JSON-RPC result format
  if (d.result && typeof d.result === "object") {
    const r = d.result as Record<string, unknown>;
    if (Array.isArray(r.content)) {
      const textItems = (r.content as Array<{ type: string; text?: string }>).filter(
        (c) => c.type === "text" && c.text,
      );
      if (textItems.length) return textItems.map((c) => c.text).join("\n");
    }
    if (typeof r.text === "string") return r.text;
  }

  // n8n chat webhook / plain output
  if (typeof d.output === "string") return d.output;
  if (typeof d.text === "string") return d.text;
  if (typeof d.message === "string") return d.message;
  if (typeof d.content === "string") return d.content;
  if (typeof d.response === "string") return d.response;

  return JSON.stringify(data);
}

export default async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204 });
  }

  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const session = await validateSession(req);
  if (!session) return json({ error: "Unauthorized" }, 401);

  const n8nMcpUrl = Netlify.env.get("N8N_MCP_URL")?.trim();
  if (!n8nMcpUrl) return json({ error: "AI service is not configured" }, 503);

  let body: { message?: string; sessionId?: string; history?: Array<{ role: string; content: string }> };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid request body" }, 400);
  }

  const message = String(body.message || "").trim();
  if (!message) return json({ error: "message is required" }, 400);

  const sessionId = String(body.sessionId || `session_${crypto.randomUUID()}`);

  // Build an MCP JSON-RPC tools/call request (primary format for n8n MCP Server Trigger)
  const mcpRequest = {
    jsonrpc: "2.0",
    method: "tools/call",
    params: {
      name: "chat",
      arguments: {
        chatInput: message,
        sessionId,
        ...(Array.isArray(body.history) && body.history.length
          ? { history: body.history }
          : {}),
      },
    },
    id: sessionId,
  };

  try {
    const res = await fetch(n8nMcpUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json, text/event-stream",
      },
      body: JSON.stringify(mcpRequest),
    });

    if (!res.ok) {
      return json({ error: `Upstream error: ${res.status}` }, 502);
    }

    const contentType = res.headers.get("Content-Type") || "";

    if (contentType.includes("text/event-stream")) {
      // Parse streamed SSE data lines and return the last meaningful payload
      const text = await res.text();
      const dataLines = text
        .split("\n")
        .filter((l) => l.startsWith("data:"))
        .map((l) => l.replace(/^data:\s*/, "").trim())
        .filter(Boolean);

      if (dataLines.length) {
        const lastLine = dataLines[dataLines.length - 1];
        try {
          const parsed = JSON.parse(lastLine);
          return json({ reply: extractReply(parsed), sessionId });
        } catch (parseErr) {
          console.error("[ai-chat] SSE JSON parse failure:", parseErr, "raw:", lastLine);
          return json({ reply: lastLine, sessionId });
        }
      }
      return json({ reply: text.trim(), sessionId });
    }

    const data = await res.json();
    return json({ reply: extractReply(data), sessionId });
  } catch (err) {
    console.error("[ai-chat] Upstream request failed:", err);
    return json({ error: "Failed to reach AI service" }, 502);
  }
};
