import type { Config } from "@netlify/functions";
import { json, validateSession } from "./_shared/security";

const DEFAULT_UNO_LOGIN_URL = "https://unolive.rategain.com/";

const env = (key: string) => (Netlify.env.get(key) || "").trim();

export const isTrustedRateGainUrl = (value: string) => {
  try {
    const url = new URL(value);
    return url.protocol === "https:"
      && (url.hostname === "rategain.com" || url.hostname.endsWith(".rategain.com"));
  } catch {
    return false;
  }
};

const readConfiguration = () => {
  const configuredLoginUrl = env("UNO_LOGIN_URL");
  const loginUrl = isTrustedRateGainUrl(configuredLoginUrl) ? configuredLoginUrl : DEFAULT_UNO_LOGIN_URL;
  const apiBaseUrl = env("UNO_API_BASE_URL");
  const healthcheckUrl = env("UNO_HEALTHCHECK_URL");
  const bearerToken = env("UNO_API_TOKEN");
  const apiKey = env("UNO_API_KEY");
  const clientId = env("UNO_CLIENT_ID");
  const clientSecret = env("UNO_CLIENT_SECRET");
  const authMode = bearerToken
    ? "bearer"
    : apiKey
      ? "api-key"
      : clientId && clientSecret
        ? "oauth-client"
        : "none";
  const trustedApiBase = isTrustedRateGainUrl(apiBaseUrl) ? apiBaseUrl : "";
  const trustedHealthcheck = isTrustedRateGainUrl(healthcheckUrl) ? healthcheckUrl : "";

  return {
    loginUrl,
    apiBaseUrl: trustedApiBase,
    healthcheckUrl: trustedHealthcheck,
    bearerToken,
    apiKey,
    authMode,
    apiConfigured: Boolean(trustedApiBase && authMode !== "none"),
    testable: Boolean((trustedHealthcheck || trustedApiBase) && (bearerToken || apiKey)),
  };
};

const publicConfiguration = (configuration: ReturnType<typeof readConfiguration>) => ({
  loginUrl: configuration.loginUrl,
  apiConfigured: configuration.apiConfigured,
  testable: configuration.testable,
  authMode: configuration.authMode,
});

export default async (req: Request) => {
  const session = await validateSession(req);
  if (!session) return json({ error: "Unauthorized" }, 401);
  if (!["superadmin", "admin"].includes(session.role)) return json({ error: "Permission Denied" }, 403);

  const configuration = readConfiguration();
  if (req.method === "GET") return json(publicConfiguration(configuration));
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const target = configuration.testable
    ? configuration.healthcheckUrl || configuration.apiBaseUrl
    : configuration.loginUrl;
  const headers = new Headers({ Accept: "application/json,text/html;q=0.9,*/*;q=0.8" });
  if (configuration.bearerToken) headers.set("Authorization", `Bearer ${configuration.bearerToken}`);
  if (configuration.apiKey) headers.set("X-API-Key", configuration.apiKey);

  try {
    const response = await fetch(target, {
      method: "GET",
      headers,
      redirect: "follow",
      signal: AbortSignal.timeout(8_000),
    });
    const apiConnected = configuration.testable && response.ok;
    const portalReachable = !configuration.testable && response.ok;
    return json({
      ...publicConfiguration(configuration),
      reachable: apiConnected || portalReachable,
      connected: apiConnected,
      checkedAt: new Date().toISOString(),
      statusCode: response.status,
    }, response.status >= 500 ? 502 : 200);
  } catch {
    return json({
      ...publicConfiguration(configuration),
      reachable: false,
      connected: false,
      checkedAt: new Date().toISOString(),
      statusCode: null,
    }, 502);
  }
};

export const config: Config = {
  path: "/api/admin/uno",
};
