import { Type } from "lucide-react";
import { useEffect, useState } from "react";

const ViewerPreferences = () => {
  const [fontScale, setFontScale] = useState(1);

  useEffect(() => {
    const storedScale = Number(localStorage.getItem("viewer_font_scale") || "1");
    setFontScale(Number.isFinite(storedScale) ? storedScale : 1);
    document.documentElement.dataset.theme = "dark";
    localStorage.setItem("viewer_mode", "dark");
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = "dark";
    document.documentElement.style.fontSize = `${16 * fontScale}px`;
    localStorage.setItem("viewer_font_scale", String(fontScale));
  }, [fontScale]);

  return (
    <div className="flex items-center gap-2">
      <button className="h-8 w-8 rounded border border-primary/20 bg-secondary/35" onClick={() => setFontScale((x) => Math.max(0.9, +(x - 0.1).toFixed(1)))} aria-label="تصغير الخط"><Type className="w-3 h-3 mx-auto" /></button>
      <button className="h-8 w-8 rounded border border-primary/20 bg-secondary/35 text-xs font-black" onClick={() => setFontScale((x) => Math.min(1.3, +(x + 0.1).toFixed(1)))} aria-label="تكبير الخط">A+</button>
    </div>
  );
};

export default ViewerPreferences;
