import { useEffect, useState } from "react";

const ViewerPreferences = () => {
  const [fontScale, setFontScale] = useState(1);

  useEffect(() => {
    const storedScale = Number(localStorage.getItem("viewer_font_scale") || "1");
    setFontScale(Number.isFinite(storedScale) ? storedScale : 1);
    document.documentElement.dataset.theme = "light";
    localStorage.setItem("viewer_mode", "light");
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = "light";
    document.documentElement.style.fontSize = `${16 * fontScale}px`;
    localStorage.setItem("viewer_font_scale", String(fontScale));
  }, [fontScale]);

  return (
    <div className="flex items-center gap-1">
      <button className="h-8 min-w-8 rounded-lg border border-border/30 bg-secondary px-2 text-xs font-semibold text-muted-foreground" onClick={() => setFontScale((x) => Math.max(0.9, +(x - 0.1).toFixed(1)))} aria-label="تصغير الخط">A−</button>
      <button className="h-8 min-w-8 rounded-lg border border-border/30 bg-secondary px-2 text-xs font-semibold text-muted-foreground" onClick={() => setFontScale((x) => Math.min(1.3, +(x + 0.1).toFixed(1)))} aria-label="تكبير الخط">A+</button>
    </div>
  );
};

export default ViewerPreferences;
