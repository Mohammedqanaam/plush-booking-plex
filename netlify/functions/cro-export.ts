import { json, validateSession } from "./_shared/security";

const DEFAULT_CRO_LOGIN_URL = "https://res.windsurfercrs.com/cromh/login/signin.aspx?croID=51";
const DEFAULT_CRO_DASHBOARD_URL = "https://res.windsurfercrs.com/cromh/dashboards.aspx";

type CroRequest = {
  from?: string;
  to?: string;
  dryRun?: boolean;
};

const canExport = (role: string) => ["superadmin", "admin", "editor"].includes(role);

const readConfig = () => ({
  loginUrl: process.env.CRO_LOGIN_URL || DEFAULT_CRO_LOGIN_URL,
  dashboardUrl: process.env.CRO_DASHBOARD_URL || DEFAULT_CRO_DASHBOARD_URL,
  exportUrl: process.env.CRO_EXPORT_URL || "",
  username: process.env.CRO_USERNAME || "",
  password: process.env.CRO_PASSWORD || "",
});

const collectFormInputs = (html: string) => {
  const fields = new URLSearchParams();
  const inputPattern = /<input\b[^>]*>/gi;
  const attrPattern = /([\w:-]+)\s*=\s*(["'])(.*?)\2/gi;
  for (const input of html.match(inputPattern) || []) {
    const attrs: Record<string, string> = {};
    let attr: RegExpExecArray | null;
    while ((attr = attrPattern.exec(input))) attrs[attr[1].toLowerCase()] = attr[3];
    if (attrs.name) fields.set(attrs.name, attrs.value || "");
  }
  return fields;
};

const findField = (html: string, candidates: RegExp[]) => {
  const names = [...html.matchAll(/\bname\s*=\s*(["'])(.*?)\1/gi)].map((match) => match[2]);
  return names.find((name) => candidates.some((pattern) => pattern.test(name))) || "";
};

const absoluteUrl = (base: string, target: string) => new URL(target, base).toString();

const cookieHeader = (value: string | null) => value?.split(",").map((part) => part.split(";")[0]).join("; ") || "";

const loginToCro = async (config: ReturnType<typeof readConfig>) => {
  const first = await fetch(config.loginUrl, {
    redirect: "manual",
    headers: { "User-Agent": "RES-Dashboard-CRO-Connector/1.0" },
  });
  const html = await first.text();
  const cookie = cookieHeader(first.headers.get("set-cookie"));
  const fields = collectFormInputs(html);
  const usernameField = findField(html, [/user/i, /login/i, /email/i, /txt.*name/i]);
  const passwordField = findField(html, [/pass/i, /pwd/i]);
  if (!usernameField || !passwordField) {
    throw new Error("تعذر تحديد حقول تسجيل الدخول في صفحة CRO.");
  }

  fields.set(usernameField, config.username);
  fields.set(passwordField, config.password);

  const actionMatch = html.match(/<form\b[^>]*\baction\s*=\s*(["'])(.*?)\1/i);
  const loginPostUrl = absoluteUrl(config.loginUrl, actionMatch?.[2] || config.loginUrl);
  const login = await fetch(loginPostUrl, {
    method: "POST",
    redirect: "manual",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Cookie": cookie,
      "User-Agent": "RES-Dashboard-CRO-Connector/1.0",
    },
    body: fields.toString(),
  });
  const loginCookie = [cookie, cookieHeader(login.headers.get("set-cookie"))].filter(Boolean).join("; ");
  const ok = login.status >= 300 && login.status < 400 || login.ok;
  if (!ok) throw new Error("فشل تسجيل الدخول في CRO. تحقق من بيانات الحساب أو حماية الجلسة.");
  return { cookie: loginCookie };
};

const verifyDashboardAccess = async (config: ReturnType<typeof readConfig>, cookie: string) => {
  const response = await fetch(config.dashboardUrl, {
    redirect: "manual",
    headers: {
      "Cookie": cookie,
      "User-Agent": "RES-Dashboard-CRO-Connector/1.0",
    },
  });
  return response.ok || (response.status >= 300 && response.status < 400);
};

export default async (req: Request) => {
  const session = await validateSession(req);
  if (!session) return json({ error: "Unauthorized" }, 401);
  if (!canExport(session.role)) return json({ error: "Permission Denied" }, 403);

  const config = readConfig();
  if (req.method === "GET") {
    return json({
      loginUrl: config.loginUrl,
      dashboardUrl: config.dashboardUrl,
      configured: Boolean(config.username && config.password),
      exportConfigured: Boolean(config.exportUrl),
      requiredEnv: ["CRO_USERNAME", "CRO_PASSWORD", "CRO_EXPORT_URL"],
      optionalEnv: ["CRO_LOGIN_URL", "CRO_DASHBOARD_URL"],
    });
  }

  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  if (!config.username || !config.password) {
    return json({ error: "CRO credentials are not configured in Netlify environment variables." }, 412);
  }

  let body: CroRequest = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  try {
    const login = await loginToCro(config);
    const dashboardChecked = await verifyDashboardAccess(config, login.cookie).catch(() => false);
    if (body.dryRun || !config.exportUrl) {
      return json({
        ok: true,
        loginChecked: true,
        dashboardChecked,
        exportReady: Boolean(config.exportUrl),
        message: config.exportUrl
          ? "تم اختبار تسجيل الدخول والوصول للوحة CRO. يمكن تشغيل التصدير."
          : "تم تسجيل الدخول والوصول للوحة CRO، لكن رابط التصدير الداخلي CRO_EXPORT_URL غير مضبوط.",
      });
    }

    const url = new URL(config.exportUrl);
    if (body.from) url.searchParams.set("from", body.from);
    if (body.to) url.searchParams.set("to", body.to);
    const exported = await fetch(url.toString(), {
      headers: {
        "Cookie": login.cookie,
        "User-Agent": "RES-Dashboard-CRO-Connector/1.0",
      },
    });
    if (!exported.ok) throw new Error("تعذر تنزيل ملف الحجوزات من CRO.");

    const contentType = exported.headers.get("content-type") || "text/csv; charset=utf-8";
    return new Response(await exported.arrayBuffer(), {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="cro-bookings-${new Date().toISOString().slice(0, 10)}.csv"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "تعذر الاتصال بنظام CRO." }, 502);
  }
};
