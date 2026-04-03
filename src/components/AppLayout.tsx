import { Outlet } from "react-router-dom";
import { AppSidebar } from "./AppSidebar";
import { MirandaFab } from "./Miranda";

export function AppLayout() {
  return (
    <div className="flex min-h-screen bg-background overflow-hidden">
      <AppSidebar />
      <main className="flex-1 min-w-0 min-h-screen overflow-auto bg-surface ml-60">
        <Outlet />
      </main>
      <MirandaFab />
    </div>
  );
}
