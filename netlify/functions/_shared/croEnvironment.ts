export const croEnvironmentValue = (key: string) => (
  Netlify.env.get(key) || process.env[key] || ""
).trim();

export const croEnvironmentReady = () => (
  croEnvironmentValue("CRO_ENV_PROBE") === "ready-20260716"
);
