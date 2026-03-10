import { useEffect } from "react";
import { api } from "@/lib/api";
import { applyTheme, DEFAULT_PRESET, themeMap } from "@/theme/enterpriseTheme";

export default function EnterpriseThemeLoader() {
  useEffect(() => {
    let selectedPreset = themeMap[DEFAULT_PRESET];

    api
      .getSettings()
      .then((cfg) => {
        selectedPreset = themeMap[cfg.themePreset || DEFAULT_PRESET] || themeMap[DEFAULT_PRESET];
        applyTheme(selectedPreset);
      })
      .catch(() => {
        applyTheme(selectedPreset);
      });

    const root = document.documentElement;
    const hasCssSupport = typeof CSS !== "undefined";
    const supportsBackdropFilter = hasCssSupport && CSS.supports("backdrop-filter", "blur(1px)");
    const supportsWebkitTouchCallout = hasCssSupport && CSS.supports("-webkit-touch-callout", "none");
    const hasChromePaintWorklet = hasCssSupport && "paintWorklet" in CSS;
    root.classList.toggle("has-backdrop-filter", supportsBackdropFilter);
    root.classList.toggle("is-safari-engine", supportsWebkitTouchCallout && !hasChromePaintWorklet);
    root.classList.toggle("is-chrome-desktop", hasChromePaintWorklet);

    const observer = new MutationObserver(() => applyTheme(selectedPreset));
    observer.observe(root, { attributes: true, attributeFilter: ["data-theme"] });

    return () => observer.disconnect();
  }, []);

  return null;
}
