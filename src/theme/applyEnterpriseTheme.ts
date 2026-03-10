import type { ThemeVars } from "@/theme/enterpriseThemeTypes";

export const applyTheme = (preset: ThemeVars) => {
  const root = document.documentElement;
  const mode = root.dataset.theme === "light" ? "light" : "dark";

  root.style.setProperty("--background", mode === "light" ? preset.backgroundLight : preset.backgroundDark);
  root.style.setProperty("--foreground", mode === "light" ? preset.foregroundLight : preset.foregroundDark);
  root.style.setProperty("--card", mode === "light" ? preset.cardLight : preset.cardDark);
  root.style.setProperty("--card-foreground", mode === "light" ? preset.cardForegroundLight : preset.cardForegroundDark);
  root.style.setProperty("--primary", preset.primary);
  root.style.setProperty("--accent", preset.accent);
  root.style.setProperty("--border", mode === "light" ? preset.borderLight : preset.borderDark);
  root.style.setProperty("--ring", preset.ring);
  root.style.setProperty("--gold", preset.primary);
  root.style.setProperty("--gold-glow", preset.accent);
};
