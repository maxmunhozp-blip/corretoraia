import { Outlet, Navigate } from "react-router-dom";
import { MasterSidebar } from "./MasterSidebar";
import { useAuth } from "@/contexts/AuthContext";
import { useImpersonation } from "@/contexts/ImpersonationContext";
import { X } from "lucide-react";

export function MasterLayout() {
  const { profile } = useAuth();
  const { impersonating, corretora, stopImpersonation } = useImpersonation();

  if (profile?.role !== "master") {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <MasterSidebar />
      {impersonating && corretora && (
        <div className="fixed top-0 left-60 right-0 z-40 bg-amber-500 text-amber-950 px-4 py-2 flex items-center justify-between text-sm font-medium">
          <span>
            Você está visualizando <strong>{corretora.nome}</strong> em modo
            leitura — suas ações não afetam os dados
          </span>
          <button
            onClick={stopImpersonation}
            className="flex items-center gap-1 bg-amber-600 hover:bg-amber-700 text-white px-3 py-1 rounded-md text-xs font-semibold transition-colors"
          >
            <X className="h-3 w-3" />
            Sair da visualização
          </button>
        </div>
      )}
      <main
        className={`ml-60 min-h-screen bg-surface ${
          impersonating ? "pt-10" : ""
        }`}
      >
        <Outlet />
      </main>
    </div>
  );
}
