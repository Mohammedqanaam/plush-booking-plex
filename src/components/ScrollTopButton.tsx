import { ArrowUp } from "lucide-react";
import { useEffect, useState } from "react";

const ScrollTopButton = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 420);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      type="button"
      className="fixed bottom-24 left-4 z-40 h-11 w-11 rounded-full gold-gradient text-primary-foreground shadow-lg"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="العودة للأعلى"
    >
      <ArrowUp className="w-5 h-5 mx-auto" />
    </button>
  );
};

export default ScrollTopButton;
