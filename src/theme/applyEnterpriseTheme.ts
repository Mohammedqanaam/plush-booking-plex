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
  root.style.setProperty("--gold-glow", preset.primary);
  root.style.setProperty("--input", mode === "light" ? preset.borderLight : preset.cardDark);
  root.style.setProperty("--secondary", mode === "light" ? "220 30% 92%" : "222 35% 17%");
  root.style.setProperty("--muted", mode === "light" ? "220 24% 90%" : "222 25% 21%");
  root.style.setProperty("--muted-foreground", mode === "light" ? "220 13% 36%" : "220 13% 70%");
};
