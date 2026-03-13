import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Outlet } from "react-router-dom";
import BottomNav from "./BottomNav";
import RiyadhClock from "./RiyadhClock";
import { api } from "@/lib/api";
import ViewerPreferences from "./ViewerPreferences";
import ScrollTopButton from "./ScrollTopButton";

const Layout = () => {
  const [siteTitle, setSiteTitle] = useState("Res");
  const [bannerText, setBannerText] = useState("");
  const location = useLocation();

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
    <div className="app-shell flex flex-col">
      {bannerText && (
        <div className="bg-primary/10 text-center py-1.5 px-4 text-xs text-primary border-b border-border/30">
          {bannerText}
        </div>
      )}

      <header className="safe-area-top sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-xl">
        <div className="flex items-center justify-between px-4 h-16 max-w-6xl mx-auto gap-2">
          <h1 className="text-lg sm:text-xl font-bold gold-text leading-none">{siteTitle}</h1>
          <div className="flex items-center gap-2"><ViewerPreferences /><RiyadhClock /></div>
        </div>
      </header>

      <main className="flex-1 pb-24 overflow-y-auto custom-scrollbar" key={location.pathname}>
        <Outlet />
      </main>

      <ScrollTopButton />
      <BottomNav />
    </div>
  );
};

export default Layout;
