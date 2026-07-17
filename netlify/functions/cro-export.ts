import { json, validateSession } from "./_shared/security";
import { primaryCroFormHtml } from "./_shared/croForms";
import { croEnvironmentValue } from "./_shared/croEnvironment";

const DEFAULT_CRO_LOGIN_URL = "https://res.windsurfercrs.com/cromh/login/signin.aspx?croID=51";
const DEFAULT_CRO_DASHBOARD_URL = "https://res.windsurfercrs.com/cromh/dashboards.aspx";
const BROWSER_USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36";
const HTML_ACCEPT = "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8";

export type CroRequest = {
  from?: string;
  to?: string;
  dryRun?: boolean;
  archiveOnly?: boolean;
  username?: string;
  password?: string;
};

const canExport = (role: string) => ["superadmin", "admin", "editor"].includes(role);

const readConfig = () => ({
  loginUrl: croEnvironmentValue("CRO_LOGIN_URL") || DEFAULT_CRO_LOGIN_URL,
  dashboardUrl: croEnvironmentValue("CRO_DASHBOARD_URL") || DEFAULT_CRO_DASHBOARD_URL,
  exportUrl: croEnvironmentValue("CRO_EXPORT_URL"),
  checkoutFromField: croEnvironmentValue("CRO_CHECKOUT_FROM_FIELD"),
  checkoutToField: croEnvironmentValue("CRO_CHECKOUT_TO_FIELD"),
  dateFilterField: croEnvironmentValue("CRO_DATE_FILTER_FIELD"),
  dateFilterValue: croEnvironmentValue("CRO_DATE_FILTER_VALUE") || "CheckOutDate",
  reservationsButton: croEnvironmentValue("CRO_RESERVATIONS_BUTTON"),
  exportButton: croEnvironmentValue("CRO_EXPORT_BUTTON"),
  dateFormat: croEnvironmentValue("CRO_DATE_FORMAT") || "yyyy/MM/dd",
  username: croEnvironmentValue("CRO_USERNAME"),
  password: croEnvironmentValue("CRO_PASSWORD"),
});

const decodeHtmlAttribute = (value: string) => value
  .replace(/&#(\d+);/g, (_, code: string) => String.fromCharCode(Number(code)))
  .replace(/&#x([\da-f]+);/gi, (_, code: string) => String.fromCharCode(Number.parseInt(code, 16)))
  .replace(/&quot;/gi, '"')
  .replace(/&#39;|&apos;/gi, "'")
  .replace(/&lt;/gi, "<")
  .replace(/&gt;/gi, ">")
  .replace(/&amp;/gi, "&");

const readAttrs = (tag: string) => {
  const attrs: Record<string, string> = {};
  const attrPattern = /([\w:-]+)\s*=\s*(["'])(.*?)\2/gi;
  let attr: RegExpExecArray | null;
  while ((attr = attrPattern.exec(tag))) attrs[attr[1].toLowerCase()] = decodeHtmlAttribute(attr[3]);
  return attrs;
};

const hasBooleanAttr = (tag: string, name: string) => new RegExp(`\\s${name}(?:\\s|=|>|/)`, "i").test(tag);

const optionLabel = (option: string) => decodeHtmlAttribute(option.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());

const collectFormInputs = (html: string) => {
  const formHtml = primaryCroFormHtml(html);
  const fields = new URLSearchParams();

  for (const input of formHtml.match(/<input\b[^>]*>/gi) || []) {
    const attrs = readAttrs(input);
    const type = (attrs.type || "text").toLowerCase();
    if (!attrs.name || hasBooleanAttr(input, "disabled")) continue;
    if (["submit", "button", "image", "reset", "file"].includes(type)) continue;
    if (["checkbox", "radio"].includes(type) && !hasBooleanAttr(input, "checked")) continue;
    fields.append(attrs.name, attrs.value || "");
  }

  for (const textarea of formHtml.match(/<textarea\b[\s\S]*?<\/textarea>/gi) || []) {
    const openingTag = textarea.match(/^<textarea\b[^>]*>/i)?.[0] || textarea;
    const attrs = readAttrs(openingTag);
    if (!attrs.name || hasBooleanAttr(openingTag, "disabled")) continue;
    const value = textarea.replace(/^<textarea\b[^>]*>/i, "").replace(/<\/textarea>$/i, "");
    fields.append(attrs.name, decodeHtmlAttribute(value));
  }

  for (const select of formHtml.match(/<select\b[\s\S]*?<\/select>/gi) || []) {
    const openingTag = select.match(/^<select\b[^>]*>/i)?.[0] || select;
    const attrs = readAttrs(openingTag);
    if (!attrs.name || hasBooleanAttr(openingTag, "disabled")) continue;
    const options = select.match(/<option\b[\s\S]*?<\/option>/gi) || [];
    const selected = options.filter((option) => hasBooleanAttr(option.match(/^<option\b[^>]*>/i)?.[0] || option, "selected"));
    const successful = selected.length ? selected : options.slice(0, 1);
    for (const option of successful) {
      const optionAttrs = readAttrs(option.match(/^<option\b[^>]*>/i)?.[0] || option);
      fields.append(attrs.name, optionAttrs.value ?? optionLabel(option));
      if (!hasBooleanAttr(openingTag, "multiple")) break;
    }
  }

  return fields;
};

const collectSelectValues = (html: string) => {
  const values: Array<{ name: string; value: string; label: string; selectLabel: string }> = [];
  const selects = html.match(/<select\b[\s\S]*?<\/select>/gi) || [];
  for (const select of selects) {
    const openingTag = select.match(/^<select\b[^>]*>/i)?.[0] || select;
    const selectAttrs = readAttrs(openingTag);
    if (!selectAttrs.name) continue;
    const selectLabel = `${selectAttrs.name} ${selectAttrs.id || ""}`;
    for (const option of select.match(/<option\b[\s\S]*?<\/option>/gi) || []) {
      const attrs = readAttrs(option.match(/^<option\b[^>]*>/i)?.[0] || option);
      values.push({
        name: selectAttrs.name,
        value: attrs.value ?? optionLabel(option),
        label: optionLabel(option),
        selectLabel,
      });
    }
  }
  return values;
};

const setSelectByOptionText = (fields: URLSearchParams, html: string, optionText: RegExp, selectHint?: RegExp) => {
  const option = collectSelectValues(html).find((item) => (
    optionText.test(item.label) && (!selectHint || selectHint.test(`${item.name} ${item.selectLabel}`))
  ));
  if (option) fields.set(option.name, option.value);
  return option?.name || "";
};

const findField = (html: string, candidates: RegExp[]) => {
  const names = (html.match(/<(?:input|textarea)\b[^>]*>/gi) || [])
    .map((tag) => readAttrs(tag).name)
    .filter(Boolean);
  return names.find((name) => candidates.some((pattern) => pattern.test(name))) || "";
};

const findFieldNearText = (html: string, text: RegExp) => {
  const normalized = html.replace(/\s+/g, " ");
  const match = text.exec(normalized);
  if (!match || typeof match.index !== "number") return "";
  const window = normalized.slice(match.index, match.index + 900);
  const field = window.match(/<(?:input|textarea)\b[^>]*\bname\s*=\s*(["'])(.*?)\1/i);
  return field?.[2] || "";
};

const findSubmit = (html: string, explicit: string, labels: RegExp[]) => {
  if (explicit) return { name: explicit, value: "" };
  for (const input of html.match(/<input\b[^>]*>/gi) || []) {
    const attrs = readAttrs(input);
    const type = (attrs.type || "").toLowerCase();
    const label = `${attrs.value || ""} ${attrs.name || ""} ${attrs.id || ""}`;
    if (["submit", "button", "image"].includes(type) && attrs.name && labels.some((pattern) => pattern.test(label))) {
      return { name: attrs.name, value: attrs.value || "" };
    }
  }
  for (const button of html.match(/<button\b[\s\S]*?<\/button>/gi) || []) {
    const openingTag = button.match(/^<button\b[^>]*>/i)?.[0] || button;
    const attrs = readAttrs(openingTag);
    const text = optionLabel(button);
    const label = `${text} ${attrs.value || ""} ${attrs.name || ""} ${attrs.id || ""}`;
    if (attrs.name && labels.some((pattern) => pattern.test(label))) return { name: attrs.name, value: attrs.value || text };
  }
  return null;
};

const findAnchor = (html: string, labels: RegExp[]) => {
  for (const anchor of html.match(/<a\b[\s\S]*?<\/a>/gi) || []) {
    const openingTag = anchor.match(/^<a\b[^>]*>/i)?.[0] || anchor;
    const attrs = readAttrs(openingTag);
    const text = optionLabel(anchor);
    if (attrs.href && labels.some((pattern) => pattern.test(`${text} ${attrs.href}`))) return attrs.href;
  }
  return "";
};

const absoluteUrl = (base: string, target: string) => new URL(target, base).toString();

const firstFormAction = (html: string, fallback: string) => {
  const form = html.match(/<form\b[^>]*>/i)?.[0] || "";
  return absoluteUrl(fallback, readAttrs(form).action || fallback);
};

const responseCookies = (response: Response) => {
  const headers = response.headers as Headers & { getSetCookie?: () => string[] };
  const combined = headers.get("set-cookie");
  const values = typeof headers.getSetCookie === "function"
    ? headers.getSetCookie()
    : combined?.split(/,(?=\s*[^;,=\s]+=)/g) || [];
  return values.map((value) => value.split(";")[0].trim()).filter(Boolean).join("; ");
};

const mergeCookies = (...cookies: Array<string | null | undefined>) => {
  const jar = new Map<string, string>();
  for (const cookie of cookies) {
    for (const part of (cookie || "").split(";").map((item) => item.trim()).filter(Boolean)) {
      const [name, ...rest] = part.split("=");
      if (name && rest.length) jar.set(name, `${name}=${rest.join("=")}`);
    }
  }
  return Array.from(jar.values()).join("; ");
};

const fetchCro = async (
  url: string,
  init: RequestInit,
  cookie: string,
  maxRedirects = 6,
): Promise<{ response: Response; cookie: string; url: string }> => {
  let currentUrl = url;
  let currentCookie = cookie;
  const initialHeaders = new Headers(init.headers);
  initialHeaders.set("Accept", initialHeaders.get("Accept") || HTML_ACCEPT);
  initialHeaders.set("User-Agent", BROWSER_USER_AGENT);
  if (currentCookie) initialHeaders.set("Cookie", currentCookie);
  let response = await fetch(currentUrl, { ...init, redirect: "manual", headers: initialHeaders });

  for (let index = 0; index < maxRedirects && response.status >= 300 && response.status < 400; index += 1) {
    currentCookie = mergeCookies(currentCookie, responseCookies(response));
    const location = response.headers.get("location");
    if (!location) break;
    const previousUrl = currentUrl;
    currentUrl = absoluteUrl(currentUrl, location);
    response = await fetch(currentUrl, {
      method: "GET",
      redirect: "manual",
      headers: {
        "Accept": HTML_ACCEPT,
        "Cookie": currentCookie,
        "Referer": previousUrl,
        "User-Agent": BROWSER_USER_AGENT,
      },
    });
  }

  currentCookie = mergeCookies(currentCookie, responseCookies(response));
  return { response, cookie: currentCookie, url: currentUrl };
};

const formatCroDate = (date: string, format: string) => {
  const [year, month, day] = date.split("-");
  if (!year || !month || !day) return date;
  if (format === "MM/dd/yyyy") return `${month}/${day}/${year}`;
  if (format === "dd/MM/yyyy") return `${day}/${month}/${year}`;
  if (format === "yyyy-MM-dd") return date;
  return `${year}/${month}/${day}`;
};

const loginToCro = async (config: ReturnType<typeof readConfig>) => {
  const first = await fetchCro(config.loginUrl, { method: "GET" }, "");
  const html = await first.response.text();
  const fields = collectFormInputs(html);
  const usernameField = findField(html, [/^txUsn$/i, /usn/i, /user/i, /login/i, /email/i, /txt.*name/i]);
  const passwordField = findField(html, [/^txPwd$/i, /pass/i, /pwd/i]);
  const loginButton = findSubmit(html, "", [/^login\b/i, /sign[\s-]?in/i]);
  if (!usernameField || !passwordField || !loginButton) {
    throw new Error("تعذر تحديد حقول تسجيل الدخول أو زر الدخول في صفحة CRO.");
  }

  fields.set(usernameField, config.username);
  fields.set(passwordField, config.password);
  fields.set(loginButton.name, loginButton.value);

  const loginPostUrl = firstFormAction(html, config.loginUrl);
  const login = await fetchCro(loginPostUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Origin": new URL(config.loginUrl).origin,
      "Referer": config.loginUrl,
    },
    body: fields.toString(),
  }, first.cookie);
  const loginHtml = await login.response.text();
  const loginPath = new URL(login.url).pathname;
  const stillOnLogin = /signin|login/i.test(loginPath) || /\bid\s*=\s*["']txPwd["']/i.test(loginHtml);
  if (!login.response.ok || stillOnLogin) {
    throw new Error("رفض CRO تسجيل الدخول. تحقق من بيانات الحساب أو حالة الحساب.");
  }
  return { cookie: login.cookie };
};

const verifyDashboardAccess = async (config: ReturnType<typeof readConfig>, cookie: string) => {
  const { response, url } = await fetchCro(config.dashboardUrl, { method: "GET" }, cookie);
  const html = await response.text();
  return response.ok && !/signin|login/i.test(new URL(url).pathname) && !/\bid\s*=\s*["']txPwd["']/i.test(html);
};

const isDownloadResponse = (response: Response) => {
  const type = response.headers.get("content-type") || "";
  const disposition = response.headers.get("content-disposition") || "";
  return /attachment/i.test(disposition) || /csv|excel|spreadsheet|octet-stream|application\/zip/i.test(type);
};

const checkedDownload = async (response: Response, from?: string, to?: string) => {
  if (!response.ok) throw new Error("تعذر تنزيل ملف الحجوزات من CRO.");
  const payload = await response.arrayBuffer();
  if (payload.byteLength === 0) {
    throw new Error(`أعاد CRO ملف تصدير فارغًا للفترة ${from || "المحددة"} إلى ${to || "المحددة"}. لم يتم استبدال التقرير الحالي.`);
  }
  return new Response(payload, {
    status: 200,
    headers: {
      "Content-Type": response.headers.get("content-type") || "text/csv; charset=utf-8",
      "Content-Disposition": response.headers.get("content-disposition") || "attachment",
    },
  });
};

const postDashboardForm = async (url: string, cookie: string, html: string, fields: URLSearchParams) => fetchCro(
  firstFormAction(html, url),
  {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Origin": new URL(url).origin,
      "Referer": url,
    },
    body: fields.toString(),
  },
  cookie,
);

const exportViaDashboardFlow = async (
  config: ReturnType<typeof readConfig>,
  cookie: string,
  body: CroRequest,
) => {
  const dashboardResult = await fetchCro(config.dashboardUrl, { method: "GET" }, cookie);
  if (!dashboardResult.response.ok || /signin|login/i.test(new URL(dashboardResult.url).pathname)) {
    throw new Error("تم تسجيل الدخول لكن تعذر فتح لوحة CRO من اتصال السيرفر.");
  }
  const dashboardHtml = await dashboardResult.response.text();
  const fields = collectFormInputs(dashboardHtml);
  const fromField = config.checkoutFromField
    || findField(dashboardHtml, [/\$dt1$/i, /checkout.*from/i, /from.*checkout/i, /date.*from/i, /from.*date/i, /start/i])
    || findFieldNearText(dashboardHtml, /date\s*from/i);
  const toField = config.checkoutToField
    || findField(dashboardHtml, [/\$dt2$/i, /checkout.*to/i, /to.*checkout/i, /date.*to/i, /to.*date/i, /end/i])
    || findFieldNearText(dashboardHtml, /date\s*to/i);
  if (!fromField || !toField) {
    throw new Error("تعذر تحديد حقلي تاريخ Check-Out في لوحة CRO.");
  }

  if (body.from) fields.set(fromField, formatCroDate(body.from, config.dateFormat));
  if (body.to) fields.set(toField, formatCroDate(body.to, config.dateFormat));
  const dateFilterField = config.dateFilterField
    || setSelectByOptionText(fields, dashboardHtml, /check[\s-]*out/i, /report|date|run|ddlDateType/i);
  if (!dateFilterField) throw new Error("تعذر تحديد خيار Check-Out Date في لوحة CRO.");
  fields.set(dateFilterField, config.dateFilterValue === "Check Out" ? "CheckOutDate" : config.dateFilterValue);

  const reservationsButton = findSubmit(dashboardHtml, config.reservationsButton, [/الحجوزات/i, /reservations?/i, /bookings?/i]);
  if (!reservationsButton) throw new Error("تعذر تحديد زر Reservation في لوحة CRO.");
  fields.set(reservationsButton.name, reservationsButton.value);

  const reservations = await postDashboardForm(config.dashboardUrl, dashboardResult.cookie, dashboardHtml, fields);
  if (isDownloadResponse(reservations.response)) {
    return checkedDownload(reservations.response, body.from, body.to);
  }

  const reservationsHtml = await reservations.response.text();
  const exportFields = collectFormInputs(reservationsHtml);
  const exportButton = findSubmit(reservationsHtml, config.exportButton, [/تصدير/i, /export/i, /excel/i, /xlsx/i, /csv/i]);
  if (exportButton) {
    exportFields.set(exportButton.name, exportButton.value);
    const exported = await postDashboardForm(config.dashboardUrl, reservations.cookie, reservationsHtml, exportFields);
    if (isDownloadResponse(exported.response)) return checkedDownload(exported.response, body.from, body.to);
  }

  const exportHref = findAnchor(reservationsHtml, [/تصدير/i, /export/i, /excel/i, /xlsx/i, /csv/i]);
  if (exportHref) {
    const exported = await fetchCro(absoluteUrl(config.dashboardUrl, exportHref), { method: "GET" }, reservations.cookie);
    if (isDownloadResponse(exported.response)) return checkedDownload(exported.response, body.from, body.to);
  }

  throw new Error("تم تنفيذ تقرير الحجوزات، لكن لم يظهر ملف أو زر تصدير صالح من CRO.");
};

const validIsoDate = (value?: string) => !value || /^\d{4}-\d{2}-\d{2}$/.test(value);

const requestConfigFor = (body: CroRequest) => {
  const config = readConfig();
  return {
    ...config,
    username: body.username?.trim() || config.username,
    password: body.password || config.password,
  };
};

const exportWithSession = async (
  requestConfig: ReturnType<typeof readConfig>,
  cookie: string,
  body: CroRequest,
) => requestConfig.exportUrl
  ? await (async () => {
    const url = new URL(requestConfig.exportUrl);
    if (body.from) url.searchParams.set("from", body.from);
    if (body.to) url.searchParams.set("to", body.to);
    const result = await fetchCro(url.toString(), { method: "GET" }, cookie);
    if (!isDownloadResponse(result.response)) throw new Error("رابط التصدير المباشر لم يُرجع ملفًا صالحًا.");
    return checkedDownload(result.response, body.from, body.to);
  })()
  : exportViaDashboardFlow(requestConfig, cookie, body);

export const downloadCroBookings = async (body: CroRequest) => {
  if (!validIsoDate(body.from) || !validIsoDate(body.to) || (body.from && body.to && body.from > body.to)) {
    throw new Error("نطاق التاريخ غير صالح. اختر تاريخ بداية ونهاية صحيحين.");
  }

  const requestConfig = requestConfigFor(body);
  if (!requestConfig.username || !requestConfig.password) {
    throw new Error("بيانات CRO غير مضبوطة للمزامنة التلقائية.");
  }

  const login = await loginToCro(requestConfig);
  return exportWithSession(requestConfig, login.cookie, body);
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

  if (!validIsoDate(body.from) || !validIsoDate(body.to) || (body.from && body.to && body.from > body.to)) {
    return json({ error: "نطاق التاريخ غير صالح. اختر تاريخ بداية ونهاية صحيحين." }, 400);
  }

  const requestConfig = requestConfigFor(body);

  if (!requestConfig.username || !requestConfig.password) {
    return json({ error: "أدخل بيانات CRO أو اضبطها في Netlify environment variables." }, 412);
  }

  try {
    const login = await loginToCro(requestConfig);
    const dashboardChecked = await verifyDashboardAccess(requestConfig, login.cookie).catch(() => false);
    if (body.dryRun) {
      if (!dashboardChecked) {
        return json({
          ok: false,
          loginChecked: true,
          dashboardChecked: false,
          exportReady: false,
          exportMode: requestConfig.exportUrl ? "direct-url" : "dashboard-flow",
          error: "تم تسجيل الدخول، لكن تعذر فتح لوحة CRO من اتصال Netlify.",
        }, 502);
      }
      return json({
        ok: true,
        loginChecked: true,
        dashboardChecked: true,
        exportReady: true,
        exportMode: requestConfig.exportUrl ? "direct-url" : "dashboard-flow",
        message: requestConfig.exportUrl
          ? "تم التحقق من تسجيل الدخول والوصول إلى CRO."
          : "تم التحقق من الدخول إلى CRO، وسيستخدم التصدير Check-Out Date ثم Reservation ثم Export.",
      });
    }

    const exported = await exportWithSession(requestConfig, login.cookie, body);

    const payload = await exported.arrayBuffer();
    if (payload.byteLength === 0) throw new Error("أعاد CRO ملفًا فارغًا؛ لم يتم اعتماد العملية كتصدير ناجح.");
    const contentType = exported.headers.get("content-type") || "text/csv; charset=utf-8";
    const sourceName = exported.headers.get("content-disposition") || "";
    const extension = /xlsx|spreadsheet/i.test(`${contentType} ${sourceName}`)
      ? "xlsx"
      : /\.xls\b|application\/vnd\.ms-excel/i.test(`${contentType} ${sourceName}`) ? "xls" : "csv";
    return new Response(payload, {
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
