import {
  Activity,
  LayoutDashboard,
  FileText,
  Users,
  Trophy,
  Bell,
  BookOpen,
  Lock,
  Settings,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { useLocation } from "react-router-dom";

const navItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Propostas", url: "/propostas", icon: FileText },
  { title: "Clientes", url: "/clientes", icon: Users },
  { title: "Ranking", url: "/ranking", icon: Trophy },
  { title: "Alertas", url: "/alertas", icon: Bell },
  { title: "Base de Conhecimento", url: "/base-conhecimento", icon: BookOpen },
  { title: "Acessos", url: "/acessos", icon: Lock },
  { title: "Configurações", url: "/configuracoes", icon: Settings },
];

export function AppSidebar() {
  const location = useLocation();

  return (
    <aside className="fixed left-0 top-0 h-screen w-60 border-r border-border bg-background flex flex-col z-50">
      {/* Logo */}
      <div className="flex items-center gap-2 px-5 py-5">
        <Activity className="h-6 w-6 text-brand" />
        <span className="text-xl font-bold text-foreground">Cora</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const active = location.pathname === item.url || location.pathname === "/" && item.url === "/dashboard";
          return (
            <NavLink
              key={item.url}
              to={item.url}
              className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                active
                  ? "bg-brand-light text-brand"
                  : "text-muted-foreground hover:bg-surface hover:translate-x-0.5"
              }`}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              <span>{item.title}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-border px-4 py-4 flex items-center gap-3">
        <div className="h-9 w-9 rounded-full bg-brand-light flex items-center justify-center text-brand text-sm font-semibold">
          MM
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-medium text-foreground">Max Munhoz</span>
          <span className="text-xs text-muted-foreground">Diretor</span>
        </div>
      </div>
    </aside>
  );
}
