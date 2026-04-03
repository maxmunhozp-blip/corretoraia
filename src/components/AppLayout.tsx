import { Outlet } from "react-router-dom";
import { AppSidebar } from "./AppSidebar";
import { MirandaFab } from "./Miranda";

export function AppLayout() {
  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />
      <main className="ml-60 min-h-screen bg-surface">
        <Outlet />
      </main>
      <MirandaFab />
    </div>
  );
}
