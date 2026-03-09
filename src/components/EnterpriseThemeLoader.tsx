import { useEffect } from "react";
import { api } from "@/lib/api";

const themeMap: Record<string, { primary: string; accent: string; background: string }> = {
  "executive-dark-glass": { primary: "220 80% 60%", accent: "212 40% 96%", background: "222 47% 8%" },
  "luxury-lavender": { primary: "280 75% 72%", accent: "295 80% 90%", background: "255 35% 10%" },
  "hospitality-premium-gold": { primary: "42 88% 55%", accent: "35 95% 78%", background: "25 20% 10%" },
  "signature-cosmic": { primary: "284 90% 65%", accent: "190 90% 60%", background: "241 40% 7%" },
  "signature-obsidian": { primary: "272 80% 64%", accent: "43 85% 60%", background: "240 10% 5%" },
};

const EnterpriseThemeLoader = () => {
  useEffect(() => {
    api.getSettings().then((cfg) => {
      const root = document.documentElement;
      const preset = themeMap[cfg.themePreset || "signature-cosmic"];
      root.style.setProperty("--primary", preset.primary);
      root.style.setProperty("--accent", preset.accent);
      root.style.setProperty("--background", preset.background);
    }).catch(() => {});
  }, []);

  return null;
};

export default EnterpriseThemeLoader;
