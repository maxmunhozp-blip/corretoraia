import {
  Activity,
  LayoutDashboard,
  FileText,
  Users,
  Trophy,
  Bell,
  BookOpen,
  Lock,
  Code2,
  Settings,
  Building2,
  LogOut,
  Sparkles,
} from "lucide-react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const navItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Propostas", url: "/propostas", icon: FileText },
  { title: "Clientes", url: "/clientes", icon: Users },
  { title: "Ranking", url: "/ranking", icon: Trophy },
  { title: "Alertas", url: "/alertas", icon: Bell },
  { title: "Base de Conhecimento", url: "/base-conhecimento", icon: BookOpen },
  { title: "Acessos", url: "/acessos", icon: Lock },
  { title: "Desenvolvimento", url: "/desenvolvimento", icon: Code2 },
  { title: "Gestão", url: "/gestao", icon: Building2 },
  { title: "Configurações", url: "/configuracoes", icon: Settings },
];

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  const displayName = profile?.nome ?? "Usuário";
  const displayCargo = profile?.cargo ?? "Vendedor";
  const initials = profile?.avatar_iniciais ?? displayName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <aside className="fixed left-0 top-0 h-screen w-60 border-r border-border bg-background flex flex-col z-50">
      <div className="flex items-center gap-2 px-5 py-5">
        <Activity className="h-6 w-6 text-brand" />
        <span className="text-xl font-bold text-foreground">Cora</span>
      </div>

      <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const active = location.pathname === item.url;
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

      <div className="border-t border-border px-4 py-4 flex items-center gap-3">
        <div className="h-9 w-9 rounded-full bg-brand-light flex items-center justify-center text-brand text-sm font-semibold">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-sm font-medium text-foreground block truncate">{displayName}</span>
          <span className="text-xs text-muted-foreground block truncate">{displayCargo}</span>
        </div>
        <button
          onClick={handleLogout}
          title="Sair"
          className="p-1.5 rounded-md hover:bg-surface transition-colors"
        >
          <LogOut className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>
    </aside>
  );
}
