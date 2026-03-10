import { useEffect } from "react";
import { api } from "@/lib/api";
import { applyTheme, DEFAULT_PRESET, themePresets } from "@/theme/enterpriseTheme";

export default function EnterpriseThemeLoader() {
  useEffect(() => {
    let selectedPreset = themePresets[DEFAULT_PRESET];

    api
      .getSettings()
      .then((cfg) => {
        selectedPreset = themePresets[cfg.themePreset || DEFAULT_PRESET] || themePresets[DEFAULT_PRESET];
        applyTheme(selectedPreset);
      })
      .catch(() => {
        applyTheme(selectedPreset);
      });

    const root = document.documentElement;
    const observer = new MutationObserver(() => applyTheme(selectedPreset));
    observer.observe(root, { attributes: true, attributeFilter: ["data-theme"] });

    return () => observer.disconnect();
  }, []);

  return null;
}
