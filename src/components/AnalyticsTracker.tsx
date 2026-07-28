import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

const ENDPOINT = "/.netlify/functions/analytics";

function getId(storage: Storage, key: string) {
  const existing = storage.getItem(key);
  if (existing) return existing;
  const value = crypto.randomUUID();
  storage.setItem(key, value);
  return value;
}

const AnalyticsTracker = () => {
  const location = useLocation();
  const lastTrackedPath = useRef("");

  useEffect(() => {
    const visitorId = getId(localStorage, "res_analytics_visitor");
    const sessionId = getId(sessionStorage, "res_analytics_session");
    const path = `${location.pathname}${location.search}`;

    const connection = (navigator as Navigator & {
      connection?: { effectiveType?: string; downlink?: number; saveData?: boolean };
      deviceMemory?: number;
      standalone?: boolean;
    }).connection;
    const browserInfo = {
      language: navigator.language,
      languages: Array.from(navigator.languages || []).slice(0, 5),
      screen: `${window.screen.width}×${window.screen.height}@${window.devicePixelRatio || 1}`,
      viewport: `${window.innerWidth}×${window.innerHeight}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      platform: navigator.platform || "",
      connection: connection?.effectiveType || "",
      downlink: connection?.downlink,
      saveData: connection?.saveData === true,
      memory: (navigator as Navigator & { deviceMemory?: number }).deviceMemory,
      cpuCores: navigator.hardwareConcurrency,
      touchPoints: navigator.maxTouchPoints,
      isPwa: window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true,
    };

    const send = (event: "pageview" | "heartbeat") => {
      void fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event, visitorId, sessionId, path, referrer: document.referrer, ...browserInfo }),
        keepalive: true,
      }).catch(() => undefined);
    };

    const firstEvent = lastTrackedPath.current !== path ? "pageview" : "heartbeat";
    lastTrackedPath.current = path;
    const idleWindow = window as Window & {
      requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };
    const idleId = idleWindow.requestIdleCallback
      ? idleWindow.requestIdleCallback(() => send(firstEvent), { timeout: 1_500 })
      : window.setTimeout(() => send(firstEvent), 250);
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") send("heartbeat");
    }, 30_000);

    return () => {
      window.clearInterval(timer);
      if (idleWindow.cancelIdleCallback && idleWindow.requestIdleCallback) idleWindow.cancelIdleCallback(idleId);
      else window.clearTimeout(idleId);
    };
  }, [location.pathname, location.search]);

  return null;
};

export default AnalyticsTracker;
