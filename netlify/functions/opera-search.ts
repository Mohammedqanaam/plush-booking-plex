import type { Config } from "@netlify/functions";
import { randomUUID } from "node:crypto";
import { json, validateSession } from "./_shared/security";
import {
  normalizeOperaReservations,
  readOperaConfig,
  validateOperaSearchInput,
  type OperaConfig,
  type OperaEnvironmentId,
} from "./_shared/opera";

type CachedToken = {
  token: string;
  expiresAt: number;
};

const tokenCache = new Map<string, CachedToken>();
const recentSearches = new Map<string, number>();

const canSearchOpera = (role: string) => role === "superadmin" || role === "admin";

const safeConfig = (config: OperaConfig) => ({
  id: config.id,
  label: config.label,
  uiUrl: config.uiUrl,
  configured: config.configured,
  authScheme: config.authScheme,
  hotels: config.hotels,
  missing: config.missing,
});

const tokenCacheKey = (config: OperaConfig) =>
  [config.id, config.gatewayUrl, config.clientId, config.enterpriseId, config.authScheme].join("|");

const requestOAuthToken = async (config: OperaConfig, forceRefresh = false) => {
  const cacheKey = tokenCacheKey(config);
  const cached = tokenCache.get(cacheKey);
  if (!forceRefresh && cached && cached.expiresAt > Date.now() + 120_000) return cached.token;

  const body = new URLSearchParams();
  if (config.authScheme === "resource_owner") {
    body.set("grant_type", "password");
    body.set("username", config.integrationUsername);
    body.set("password", config.integrationPassword);
  } else {
    body.set("grant_type", "client_credentials");
    body.set("scope", config.scope);
  }

  const headers = new Headers({
    "Authorization": "Basic " + Buffer.from(config.clientId + ":" + config.clientSecret).toString("base64"),
    "Content-Type": "application/x-www-form-urlencoded",
    "Accept": "application/json",
    "x-app-key": config.appKey,
  });
  if (config.authScheme === "client_credentials") headers.set("enterpriseId", config.enterpriseId);

  const response = await fetch(config.gatewayUrl + "/oauth/v1/tokens", {
    method: "POST",
    headers,
    body,
    signal: AbortSignal.timeout(20_000),
  });
  const payload = await response.json().catch(() => ({})) as Record<string, unknown>;
  const token = typeof payload.access_token === "string" ? payload.access_token : "";
  if (!response.ok || !token) {
    throw new Error("OPERA_AUTH_" + response.status);
  }

  const expiresIn = Number(payload.expires_in || 3_600);
  tokenCache.set(cacheKey, {
    token,
    expiresAt: Date.now() + Math.max(300, Number.isFinite(expiresIn) ? expiresIn : 3_600) * 1_000,
  });
  return token;
};

const callReservationSearch = async (
  config: OperaConfig,
  input: ReturnType<typeof validateOperaSearchInput> & { ok: true },
  requestId: string,
  forceTokenRefresh = false,
): Promise<Response> => {
  const token = await requestOAuthToken(config, forceTokenRefresh);
  const url = new URL(
    config.gatewayUrl + "/rsv/v1/hotels/" + encodeURIComponent(input.value.hotelId) + "/reservations",
  );
  url.searchParams.set("text", input.value.query);
  url.searchParams.set("limit", "50");
  url.searchParams.set("offset", "0");

  const optionalDates = [
    "arrivalStartDate",
    "arrivalEndDate",
    "departureStartDate",
    "departureEndDate",
  ] as const;
  for (const key of optionalDates) {
    if (input.value[key]) url.searchParams.set(key, input.value[key]);
  }

  return fetch(url, {
    method: "GET",
    headers: {
      "Authorization": "Bearer " + token,
      "Accept": "application/json",
      "x-app-key": config.appKey,
      "x-hotelid": input.value.hotelId,
      "X-Request-Id": requestId,
    },
    signal: AbortSignal.timeout(25_000),
  });
};

const searchReservations = async (
  config: OperaConfig,
  input: ReturnType<typeof validateOperaSearchInput> & { ok: true },
  requestId: string,
) => {
  let response = await callReservationSearch(config, input, requestId);
  if (response.status === 401) {
    tokenCache.delete(tokenCacheKey(config));
    response = await callReservationSearch(config, input, requestId, true);
  }
  if (!response.ok) throw new Error("OPERA_SEARCH_" + response.status);
  return response.json();
};

export default async (req: Request) => {
  const session = await validateSession(req);
  if (!session) return json({ error: "الجلسة غير صالحة." }, 401);
  if (!canSearchOpera(session.role)) return json({ error: "هذه الخاصية متاحة للمشرف فقط." }, 403);

  if (req.method === "GET") {
    return json({
      environments: [
        safeConfig(readOperaConfig("legacy")),
        safeConfig(readOperaConfig("new")),
      ],
      readOnly: true,
    });
  }

  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const now = Date.now();
  const previousSearch = recentSearches.get(session.username) || 0;
  if (now - previousSearch < 1_500) {
    return json({ error: "انتظر لحظة قبل إعادة البحث." }, 429);
  }
  recentSearches.set(session.username, now);

  const body = await req.json().catch(() => null);
  const input = validateOperaSearchInput(body);
  if (input.ok === false) return json({ error: input.error }, 400);

  const config = readOperaConfig(input.value.environment as OperaEnvironmentId);
  if (!config.configured) {
    return json({
      error: "ربط OHIP لهذه البيئة غير مكتمل.",
      missing: config.missing,
    }, 503);
  }

  if (!config.hotels.some((hotel) => hotel.id === input.value.hotelId)) {
    return json({ error: "الفندق غير مدرج ضمن الفروع المسموح بها." }, 403);
  }

  const requestId = randomUUID();
  try {
    const payload = await searchReservations(config, input, requestId);
    const normalized = normalizeOperaReservations(payload);
    console.info("OPERA reservation search", {
      requestId,
      admin: session.username,
      environment: config.id,
      hotelId: input.value.hotelId,
      resultCount: normalized.reservations.length,
    });
    return json({
      ...normalized,
      requestId,
      searchedAt: new Date().toISOString(),
      readOnly: true,
    });
  } catch (error) {
    const code = error instanceof Error ? error.message : "OPERA_UNKNOWN";
    console.error("OPERA reservation search failed", {
      requestId,
      admin: session.username,
      environment: config.id,
      hotelId: input.value.hotelId,
      code,
    });
    if (code.startsWith("OPERA_AUTH_")) {
      return json({ error: "تعذر المصادقة مع OPERA عبر OHIP. راجع مفاتيح البيئة.", requestId }, 502);
    }
    if (code.startsWith("OPERA_SEARCH_")) {
      return json({ error: "لم يكتمل البحث في OPERA. تحقق من صلاحية الفندق وواجهة الحجوزات.", requestId }, 502);
    }
    return json({ error: "تعذر الاتصال بخدمة OPERA حاليًا.", requestId }, 502);
  }
};

export const config: Config = {
  path: "/api/admin/opera-search",
};
