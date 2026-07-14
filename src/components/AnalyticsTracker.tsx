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

    const send = (event: "pageview" | "heartbeat") => {
      void fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event, visitorId, sessionId, path, referrer: document.referrer }),
        keepalive: true,
      }).catch(() => undefined);
    };

    if (lastTrackedPath.current !== path) {
      lastTrackedPath.current = path;
      send("pageview");
    }

    send("heartbeat");
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") send("heartbeat");
    }, 30_000);

    return () => window.clearInterval(timer);
  }, [location.pathname, location.search]);

  return null;
};

export default AnalyticsTracker;
