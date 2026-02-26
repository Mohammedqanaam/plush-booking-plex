import { useState, useEffect } from "react";

const RiyadhClock = () => {
  const [time, setTime] = useState("");

  useEffect(() => {
    const update = () => {
      const now = new Date().toLocaleTimeString("ar-SA", {
        timeZone: "Asia/Riyadh",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      });
      setTime(now);
    };

    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex items-center gap-2 text-lavender-soft drop-shadow-[0_0_10px_rgba(167,139,250,0.45)]">
      <span className="inline-block w-2 h-2 rounded-full bg-lavender-glow animate-pulse" />
      <span className="text-[13px] font-medium text-foreground/90">الرياض</span>
      <span dir="ltr" className="font-semibold tabular-nums tracking-wide text-[15px] text-white/95">
        {time}
      </span>
    </div>
  );
};

export default RiyadhClock;
