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
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <span className="inline-block w-2 h-2 rounded-full bg-success animate-pulse" />
      <span>الرياض</span>
      <span className="font-mono tabular-nums text-foreground">{time}</span>
    </div>
  );
};

export default RiyadhClock;
