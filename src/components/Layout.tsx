import { Outlet } from "react-router-dom";
import BottomNav from "./BottomNav";
import RiyadhClock from "./RiyadhClock";

const Layout = () => {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="flex items-center justify-between px-4 h-14 max-w-4xl mx-auto">
          <h1 className="text-lg font-bold gold-text">WORM-AI</h1>
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
