import { useEffect } from "react";
import { api } from "@/lib/api";
import { applyTheme, DEFAULT_PRESET, themePresets } from "@/theme/enterpriseTheme";

export default function EnterpriseThemeLoader() {
  useEffect(() => {
    let selectedPreset = themePresets[DEFAULT_PRESET];
    const root = document.documentElement;

    api
      .getSettings()
      .then((cfg) => {
        selectedPreset = themePresets[cfg.themePreset || DEFAULT_PRESET] || themePresets[DEFAULT_PRESET];
        applyTheme(selectedPreset);
      })
      .catch(() => {
        applyTheme(selectedPreset);
      });

    const supportsBackdropFilter = CSS.supports("backdrop-filter", "blur(1px)");
    const supportsWebkitTouchCallout = CSS.supports("-webkit-touch-callout", "none");
    const hasChromePaintWorklet = typeof CSS !== "undefined" && "paintWorklet" in CSS;
    root.classList.toggle("has-backdrop-filter", supportsBackdropFilter);
    root.classList.toggle("is-safari-engine", supportsWebkitTouchCallout && !hasChromePaintWorklet);
    root.classList.toggle("is-chrome-desktop", hasChromePaintWorklet);

    const observer = new MutationObserver(() => applyTheme(selectedPreset));
    observer.observe(root, { attributes: true, attributeFilter: ["data-theme"] });

    return () => observer.disconnect();
  }, []);

  return null;
}
