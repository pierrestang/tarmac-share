import { BottomTabs } from "@/components/layout/BottomTabs";
import { Outlet } from "react-router-dom";

export function AppShell() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="px-3 pb-20 pt-6">
        <Outlet />
      </main>
      <BottomTabs />
    </div>
  );
}
