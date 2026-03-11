import { BottomTabs } from "@/components/layout/BottomTabs";
import { Outlet, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

export function AppShell() {
  const location = useLocation();
  const isMessagesPage = location.pathname === "/messages";

  return (
    <div
      className={cn("min-h-screen text-foreground", !isMessagesPage && "bg-background")}
      style={isMessagesPage ? { backgroundColor: "#F0EEE9" } : undefined}
    >
      <main className="px-4 pb-20 pt-6">
        <Outlet />
      </main>
      <BottomTabs />
    </div>
  );
}
