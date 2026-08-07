import { useEffect } from "react";

export default function EnterpriseThemeLoader() {
  useEffect(() => {
    const root = document.documentElement;
    const hasCssSupport = typeof CSS !== "undefined";
    const supportsBackdropFilter = hasCssSupport && CSS.supports("backdrop-filter", "blur(1px)");
    const supportsWebkitTouchCallout = hasCssSupport && CSS.supports("-webkit-touch-callout", "none");
    const hasChromePaintWorklet = hasCssSupport && "paintWorklet" in CSS;
    root.classList.toggle("has-backdrop-filter", supportsBackdropFilter);
    root.classList.toggle("is-safari-engine", supportsWebkitTouchCallout && !hasChromePaintWorklet);
    root.classList.toggle("is-chrome-desktop", hasChromePaintWorklet);
  }, []);

  return null;
}
