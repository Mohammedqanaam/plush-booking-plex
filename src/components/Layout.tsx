import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import BottomNav from "./BottomNav";
import RiyadhClock from "./RiyadhClock";
import { api } from "@/lib/api";

const Layout = () => {
  const [siteTitle, setSiteTitle] = useState("WORM-AI");
  const [bannerText, setBannerText] = useState("");

  useEffect(() => {
    api
      .getSettings()
      .then((data) => {
        if (data.siteTitle) setSiteTitle(data.siteTitle);
        if (data.bannerText !== undefined) setBannerText(data.bannerText);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      {bannerText && (
        <div className="bg-primary/10 text-center py-1.5 px-4 text-xs text-primary border-b border-border/30">
          {bannerText}
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="flex items-center justify-between px-4 h-14 max-w-4xl mx-auto">
          <h1 className="text-lg font-bold gold-text">{siteTitle}</h1>
          <RiyadhClock />
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 pb-20 overflow-y-auto">
        <Outlet />
      </main>

      {/* Bottom navigation */}
      <BottomNav />
    </div>
  );
};

export default Layout;
