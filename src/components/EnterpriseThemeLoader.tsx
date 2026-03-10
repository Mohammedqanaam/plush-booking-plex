import { useEffect } from "react";
import { api } from "@/lib/api";

type ThemeVars = {
  primary: string;
  accent: string;
  backgroundDark: string;
  backgroundLight: string;
  cardDark: string;
  cardLight: string;
};

const DEFAULT_PRESET = "signature-cosmic";

const themeMap: Record<string, ThemeVars> = {
  "executive-dark-glass": {
    primary: "220 80% 60%",
    accent: "212 40% 96%",
    backgroundDark: "222 47% 8%",
    backgroundLight: "0 0% 98%",
    cardDark: "222 35% 11%",
    cardLight: "0 0% 100%",
  },
  "luxury-lavender": {
    primary: "280 75% 72%",
    accent: "295 80% 90%",
    backgroundDark: "255 35% 10%",
    backgroundLight: "280 35% 98%",
    cardDark: "255 28% 14%",
    cardLight: "0 0% 100%",
  },
  "hospitality-premium-gold": {
    primary: "42 88% 55%",
    accent: "35 95% 78%",
    backgroundDark: "25 20% 10%",
    backgroundLight: "40 60% 97%",
    cardDark: "25 22% 14%",
    cardLight: "0 0% 100%",
  },
  "signature-cosmic": {
    primary: "284 90% 65%",
    accent: "190 90% 60%",
    backgroundDark: "241 40% 7%",
    backgroundLight: "270 55% 98%",
    cardDark: "241 30% 11%",
    cardLight: "0 0% 100%",
  },
  "signature-obsidian": {
    primary: "272 80% 64%",
    accent: "43 85% 60%",
    backgroundDark: "240 10% 5%",
    backgroundLight: "0 0% 97%",
    cardDark: "240 12% 9%",
    cardLight: "0 0% 100%",
  },
};

const applyPreset = (preset: ThemeVars) => {
  const root = document.documentElement;
  const mode = root.dataset.theme === "light" ? "light" : "dark";

  root.style.setProperty("--primary", preset.primary);
  root.style.setProperty("--accent", preset.accent);
  root.style.setProperty("--gold", preset.primary);
  root.style.setProperty("--gold-glow", preset.accent);
  root.style.setProperty("--background", mode === "light" ? preset.backgroundLight : preset.backgroundDark);
  root.style.setProperty("--card", mode === "light" ? preset.cardLight : preset.cardDark);
};

export default function EnterpriseThemeLoader() {
  useEffect(() => {
    let selectedPreset = themeMap[DEFAULT_PRESET];

    api
      .getSettings()
      .then((cfg) => {
        selectedPreset = themeMap[cfg.themePreset || DEFAULT_PRESET] || themeMap[DEFAULT_PRESET];
        applyPreset(selectedPreset);
      })
      .catch(() => {
        applyPreset(selectedPreset);
      });

    const root = document.documentElement;
    const observer = new MutationObserver(() => applyPreset(selectedPreset));
    observer.observe(root, { attributes: true, attributeFilter: ["data-theme"] });

    return () => observer.disconnect();
  }, []);

  return null;
}
