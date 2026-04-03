import {
  LayoutDashboard,
  Building2,
  Users,
  CreditCard,
  DollarSign,
  Settings,
  LogOut,
  ArrowLeft,
} from "lucide-react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";

const masterNavItems = [
  { title: "Visão Geral", url: "/master", icon: LayoutDashboard },
  { title: "Corretoras", url: "/master/corretoras", icon: Building2 },
  { title: "Usuários", url: "/master/usuarios", icon: Users },
  { title: "Planos", url: "/master/planos", icon: CreditCard },
  { title: "Financeiro", url: "/master/financeiro", icon: DollarSign },
  { title: "Configurações", url: "/master/configuracoes", icon: Settings },
];

export function MasterSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  const displayName = profile?.nome ?? "Master";
  const initials = profile?.avatar_iniciais ?? "MA";

  return (
    <aside className="fixed left-0 top-0 h-screen w-60 bg-[#18181B] flex flex-col z-50">
      <div className="flex items-center gap-2 px-5 py-5">
        <span className="text-xl font-bold text-white">CORA</span>
        <Badge className="bg-brand text-white border-0 text-[10px] px-1.5 py-0">
          MASTER
        </Badge>
      </div>

      <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
        {masterNavItems.map((item) => {
          const active =
            item.url === "/master"
              ? location.pathname === "/master"
              : location.pathname.startsWith(item.url);
          return (
            <NavLink
              key={item.url}
              to={item.url}
              className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                active
                  ? "bg-white/10 text-white"
                  : "text-white/60 hover:bg-white/5 hover:text-white/80"
              }`}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              <span>{item.title}</span>
            </NavLink>
          );
        })}

        <div className="my-4 border-t border-white/10" />

        <NavLink
          to="/dashboard"
          className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-white/40 hover:bg-white/5 hover:text-white/60 transition-all"
        >
          <ArrowLeft className="h-4 w-4 shrink-0" />
          <span>Voltar ao sistema</span>
        </NavLink>
      </nav>

      <div className="border-t border-white/10 px-4 py-4 flex items-center gap-3">
        <div className="h-9 w-9 rounded-full bg-brand flex items-center justify-center text-white text-sm font-semibold">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-sm font-medium text-white block truncate">
            {displayName}
          </span>
          <span className="text-xs text-white/50 block truncate">
            Administrador Master
          </span>
        </div>
        <button
          onClick={handleLogout}
          title="Sair"
          className="p-1.5 rounded-md hover:bg-white/10 transition-colors"
        >
          <LogOut className="h-4 w-4 text-white/50" />
        </button>
      </div>
    </aside>
  );
}
