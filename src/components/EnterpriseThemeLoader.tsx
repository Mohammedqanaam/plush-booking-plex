import { useEffect } from "react";
import { enterpriseApi } from "@/lib/enterpriseApi";

const EnterpriseThemeLoader = () => {
  useEffect(() => {
    enterpriseApi
      .getEnterpriseConfig()
      .then((cfg) => {
        const root = document.documentElement;
        if (cfg?.theme?.primary) root.style.setProperty("--primary", cfg.theme.primary);
        if (cfg?.theme?.accent) root.style.setProperty("--accent", cfg.theme.accent);
        if (cfg?.theme?.background) root.style.setProperty("--background", cfg.theme.background);
        if (cfg?.theme?.radius) root.style.setProperty("--radius", cfg.theme.radius);
        if (cfg?.theme?.font) root.style.setProperty("font-family", cfg.theme.font);
      })
      .catch(() => {});
  }, []);

  return null;
};

export default EnterpriseThemeLoader;
