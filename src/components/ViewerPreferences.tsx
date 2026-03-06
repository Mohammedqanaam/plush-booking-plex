import { Moon, Sun, Type } from "lucide-react";
import { useEffect, useState } from "react";

const ViewerPreferences = () => {
  const [mode, setMode] = useState<"dark" | "light">("dark");
  const [fontScale, setFontScale] = useState(1);

  useEffect(() => {
    const storedMode = (localStorage.getItem("viewer_mode") as "dark" | "light" | null) || "dark";
    const storedScale = Number(localStorage.getItem("viewer_font_scale") || "1");
    setMode(storedMode);
    setFontScale(Number.isFinite(storedScale) ? storedScale : 1);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = mode;
    document.documentElement.style.fontSize = `${16 * fontScale}px`;
    localStorage.setItem("viewer_mode", mode);
    localStorage.setItem("viewer_font_scale", String(fontScale));
  }, [mode, fontScale]);

  return (
    <div className="flex items-center gap-2">
      <button className="h-8 w-8 rounded border" onClick={() => setMode(mode === "dark" ? "light" : "dark")} aria-label="تبديل الوضع">
        {mode === "dark" ? <Sun className="w-4 h-4 mx-auto" /> : <Moon className="w-4 h-4 mx-auto" />}
      </button>
      <button className="h-8 w-8 rounded border" onClick={() => setFontScale((x) => Math.max(0.9, +(x - 0.1).toFixed(1)))} aria-label="تصغير الخط"><Type className="w-3 h-3 mx-auto" /></button>
      <button className="h-8 w-8 rounded border" onClick={() => setFontScale((x) => Math.min(1.3, +(x + 0.1).toFixed(1)))} aria-label="تكبير الخط">A+</button>
    </div>
  );
};

export default ViewerPreferences;
