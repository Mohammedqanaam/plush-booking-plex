import { json, validateSession } from "./_shared/security";

const DEFAULT_CRO_LOGIN_URL = "https://res.windsurfercrs.com/cromh/login/signin.aspx?croID=51";
const DEFAULT_CRO_DASHBOARD_URL = "https://res.windsurfercrs.com/cromh/dashboards.aspx";

type CroRequest = {
  from?: string;
  to?: string;
  dryRun?: boolean;
  username?: string;
  password?: string;
};

const canExport = (role: string) => ["superadmin", "admin", "editor"].includes(role);

const readConfig = () => ({
  loginUrl: process.env.CRO_LOGIN_URL || DEFAULT_CRO_LOGIN_URL,
  dashboardUrl: process.env.CRO_DASHBOARD_URL || DEFAULT_CRO_DASHBOARD_URL,
  exportUrl: process.env.CRO_EXPORT_URL || "",
  checkoutFromField: process.env.CRO_CHECKOUT_FROM_FIELD || "",
  checkoutToField: process.env.CRO_CHECKOUT_TO_FIELD || "",
  dateFilterField: process.env.CRO_DATE_FILTER_FIELD || "",
  dateFilterValue: process.env.CRO_DATE_FILTER_VALUE || "Check Out",
  reservationsButton: process.env.CRO_RESERVATIONS_BUTTON || "",
  exportButton: process.env.CRO_EXPORT_BUTTON || "",
  dateFormat: process.env.CRO_DATE_FORMAT || "dd/MM/yyyy",
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

const readAttrs = (tag: string) => {
  const attrs: Record<string, string> = {};
  const attrPattern = /([\w:-]+)\s*=\s*(["'])(.*?)\2/gi;
  let attr: RegExpExecArray | null;
  while ((attr = attrPattern.exec(tag))) attrs[attr[1].toLowerCase()] = attr[3];
  return attrs;
};

const findSubmit = (html: string, explicit: string, labels: RegExp[]) => {
  if (explicit) return { name: explicit, value: "" };
  const inputs = html.match(/<input\b[^>]*>/gi) || [];
  for (const input of inputs) {
    const attrs = readAttrs(input);
    const type = (attrs.type || "").toLowerCase();
    const label = `${attrs.value || ""} ${attrs.name || ""} ${attrs.id || ""}`;
    if (["submit", "button", "image"].includes(type) && attrs.name && labels.some((pattern) => pattern.test(label))) {
      return { name: attrs.name, value: attrs.value || "" };
    }
  }
  const buttons = html.match(/<button\b[\s\S]*?<\/button>/gi) || [];
  for (const button of buttons) {
    const attrs = readAttrs(button);
    const text = button.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
    const label = `${text} ${attrs.value || ""} ${attrs.name || ""} ${attrs.id || ""}`;
    if (attrs.name && labels.some((pattern) => pattern.test(label))) return { name: attrs.name, value: attrs.value || text.trim() };
  }
  return null;
};

const findAnchor = (html: string, labels: RegExp[]) => {
  const anchors = html.match(/<a\b[\s\S]*?<\/a>/gi) || [];
  for (const anchor of anchors) {
    const attrs = readAttrs(anchor);
    const text = anchor.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
    if (attrs.href && labels.some((pattern) => pattern.test(`${text} ${attrs.href}`))) return attrs.href;
  }
  return "";
};

const absoluteUrl = (base: string, target: string) => new URL(target, base).toString();

const firstFormAction = (html: string, fallback: string) => {
  const actionMatch = html.match(/<form\b[^>]*\baction\s*=\s*(["'])(.*?)\1/i);
  return absoluteUrl(fallback, actionMatch?.[2] || fallback);
};

const cookieHeader = (value: string | null) => value?.split(",").map((part) => part.split(";")[0]).join("; ") || "";

const formatCroDate = (date: string, format: string) => {
  const [year, month, day] = date.split("-");
  if (!year || !month || !day) return date;
  if (format === "MM/dd/yyyy") return `${month}/${day}/${year}`;
  if (format === "yyyy-MM-dd") return date;
  return `${day}/${month}/${year}`;
};

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

const isDownloadResponse = (response: Response) => {
  const type = response.headers.get("content-type") || "";
  const disposition = response.headers.get("content-disposition") || "";
  return /attachment/i.test(disposition) || !/text\/html/i.test(type);
};

const postDashboardForm = async (url: string, cookie: string, html: string, fields: URLSearchParams) => fetch(firstFormAction(html, url), {
  method: "POST",
  redirect: "manual",
  headers: {
    "Content-Type": "application/x-www-form-urlencoded",
    "Cookie": cookie,
    "User-Agent": "RES-Dashboard-CRO-Connector/1.0",
  },
  body: fields.toString(),
});

const exportViaDashboardFlow = async (
  config: ReturnType<typeof readConfig>,
  cookie: string,
  body: CroRequest,
) => {
  const dashboard = await fetch(config.dashboardUrl, {
    redirect: "manual",
    headers: { "Cookie": cookie, "User-Agent": "RES-Dashboard-CRO-Connector/1.0" },
  });
  if (!dashboard.ok) throw new Error("تم تسجيل الدخول لكن تعذر فتح لوحة CRO.");
  const dashboardHtml = await dashboard.text();
  const fields = collectFormInputs(dashboardHtml);
  const fromField = config.checkoutFromField || findField(dashboardHtml, [/checkout.*from/i, /from.*checkout/i, /date.*from/i, /from.*date/i, /start/i]);
  const toField = config.checkoutToField || findField(dashboardHtml, [/checkout.*to/i, /to.*checkout/i, /date.*to/i, /to.*date/i, /end/i]);
  if (!fromField || !toField) {
    throw new Error("لم أستطع تحديد حقول تاريخ Check Out في CRO. اضبط CRO_CHECKOUT_FROM_FIELD و CRO_CHECKOUT_TO_FIELD من أسماء الحقول في الصفحة.");
  }
  if (body.from) fields.set(fromField, formatCroDate(body.from, config.dateFormat));
  if (body.to) fields.set(toField, formatCroDate(body.to, config.dateFormat));
  if (config.dateFilterField) fields.set(config.dateFilterField, config.dateFilterValue);

  const reservationsButton = findSubmit(dashboardHtml, config.reservationsButton, [/الحجوزات/i, /reservations?/i, /bookings?/i]);
  if (reservationsButton) fields.set(reservationsButton.name, reservationsButton.value);
  const reservations = await postDashboardForm(config.dashboardUrl, cookie, dashboardHtml, fields);
  const reservationCookie = [cookie, cookieHeader(reservations.headers.get("set-cookie"))].filter(Boolean).join("; ");
  const reservationsHtml = await reservations.text();

  const exportFields = collectFormInputs(reservationsHtml);
  const exportButton = findSubmit(reservationsHtml, config.exportButton, [/تصدير/i, /export/i, /excel/i, /xlsx/i, /csv/i]);
  if (exportButton) {
    exportFields.set(exportButton.name, exportButton.value);
    const exported = await postDashboardForm(config.dashboardUrl, reservationCookie, reservationsHtml, exportFields);
    if (isDownloadResponse(exported)) return exported;
  }

  const exportHref = findAnchor(reservationsHtml, [/تصدير/i, /export/i, /excel/i, /xlsx/i, /csv/i]);
  if (exportHref) {
    const exported = await fetch(absoluteUrl(config.dashboardUrl, exportHref), {
      headers: { "Cookie": reservationCookie, "User-Agent": "RES-Dashboard-CRO-Connector/1.0" },
    });
    if (isDownloadResponse(exported)) return exported;
  }

  throw new Error("تم فتح الحجوزات لكن لم أستطع تحديد زر التصدير. اضبط CRO_EXPORT_BUTTON حسب اسم زر التصدير في صفحة CRO.");
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
      exportConfigured: true,
      exportMode: config.exportUrl ? "direct-url" : "dashboard-flow",
      requiredEnv: ["CRO_USERNAME", "CRO_PASSWORD"],
      optionalEnv: [
        "CRO_LOGIN_URL",
        "CRO_DASHBOARD_URL",
        "CRO_EXPORT_URL",
        "CRO_CHECKOUT_FROM_FIELD",
        "CRO_CHECKOUT_TO_FIELD",
        "CRO_DATE_FILTER_FIELD",
        "CRO_RESERVATIONS_BUTTON",
        "CRO_EXPORT_BUTTON",
        "CRO_DATE_FORMAT",
      ],
    });
  }

  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  let body: CroRequest = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const requestConfig = {
    ...config,
    username: body.username?.trim() || config.username,
    password: body.password || config.password,
  };

  if (!requestConfig.username || !requestConfig.password) {
    return json({ error: "أدخل بيانات CRO أو اضبطها في Netlify environment variables." }, 412);
  }

  try {
    const login = await loginToCro(requestConfig);
    const dashboardChecked = await verifyDashboardAccess(requestConfig, login.cookie).catch(() => false);
    if (body.dryRun) {
      return json({
        ok: true,
        loginChecked: true,
        dashboardChecked,
        exportReady: true,
        exportMode: requestConfig.exportUrl ? "direct-url" : "dashboard-flow",
        message: requestConfig.exportUrl
          ? "تم اختبار تسجيل الدخول والوصول للوحة CRO. سيتم التصدير عبر رابط مباشر."
          : "تم اختبار تسجيل الدخول والوصول للوحة CRO. سيتم التصدير عبر تدفق Dashboard: Check Out ثم الحجوزات ثم تصدير.",
      });
    }

    const exported = requestConfig.exportUrl
      ? await (() => {
        const url = new URL(requestConfig.exportUrl);
        if (body.from) url.searchParams.set("from", body.from);
        if (body.to) url.searchParams.set("to", body.to);
        return fetch(url.toString(), {
          headers: {
            "Cookie": login.cookie,
            "User-Agent": "RES-Dashboard-CRO-Connector/1.0",
          },
        });
      })()
      : await exportViaDashboardFlow(requestConfig, login.cookie, body);
    if (!exported.ok) throw new Error("تعذر تنزيل ملف الحجوزات من CRO.");

    const contentType = exported.headers.get("content-type") || "text/csv; charset=utf-8";
    const extension = contentType.includes("spreadsheet") || contentType.includes("excel") ? "xlsx" : "csv";
    return new Response(await exported.arrayBuffer(), {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="cro-checkout-bookings-${body.from || "from"}-to-${body.to || "to"}.${extension}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "تعذر الاتصال بنظام CRO." }, 502);
  }
};
