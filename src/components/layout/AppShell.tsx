import { BottomTabs } from "@/components/layout/BottomTabs";
import { Outlet, useLocation } from "react-router-dom";

export function AppShell() {
  const location = useLocation();
  const isMessagesPage = location.pathname === "/messages";

  return (
    <div
      className="min-h-screen text-foreground"
      style={{ backgroundColor: isMessagesPage ? "#F0EEE9" : undefined }}
      {...(!isMessagesPage ? { className: "min-h-screen bg-background text-foreground" } : {})}
    >
      <main className="px-4 pb-20 pt-6">
        <Outlet />
      </main>
      <BottomTabs />
    </div>
  );
}
