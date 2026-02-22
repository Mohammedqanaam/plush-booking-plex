import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import BottomNav from "./BottomNav";
import RiyadhClock from "./RiyadhClock";

const Layout = () => {
  const [siteTitle, setSiteTitle] = useState("WORM-AI");
  const [bannerText, setBannerText] = useState("");

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data.settings?.siteTitle) setSiteTitle(data.settings.siteTitle);
        if (data.settings?.bannerText) setBannerText(data.settings.bannerText);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      {bannerText && (
        <div className="bg-primary/10 border-b border-primary/20 px-4 py-2 text-center">
          <p className="text-xs text-primary font-medium">{bannerText}</p>
        </div>
      )}

      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="flex items-center justify-between px-4 h-14 max-w-4xl mx-auto">
          <h1 className="text-lg font-bold gold-text">{siteTitle}</h1>
          <RiyadhClock />
        </div>
      </header>

      <main className="flex-1 pb-20 overflow-y-auto">
        <Outlet />
      </main>

      <BottomNav />
    </div>
  );
};

export default Layout;
