import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageWrapper } from "@/components/PageWrapper";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { Building2, DollarSign, Users, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const planoPrecos: Record<string, number> = {
  starter: 500,
  profissional: 990,
  business: 1790,
  enterprise: 2500,
};

export default function MasterDashboard() {
  const { data: corretoras = [] } = useQuery({
    queryKey: ["master-corretoras"],
    queryFn: async () => {
      const { data } = await supabase
        .from("corretoras")
        .select("*")
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const { data: totalUsuarios = 0 } = useQuery({
    queryKey: ["master-total-usuarios"],
    queryFn: async () => {
      const { count } = await supabase
        .from("profiles")
        .select("id", { count: "exact", head: true });
      return count ?? 0;
    },
  });

  const ativas = corretoras.filter((c: any) => c.status === "ativo");
  const mrr = ativas.reduce(
    (acc: number, c: any) => acc + (planoPrecos[c.plano] || 0),
    0
  );
  const trialsExpirando = corretoras.filter((c: any) => {
    if (c.status !== "ativo" || !c.trial_expira_em) return false;
    const diff =
      (new Date(c.trial_expira_em).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return diff <= 3 && diff > 0;
  });

  const recentes = corretoras.slice(0, 5);

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      ativo: "border-green-500 text-green-600 bg-transparent",
      trial: "border-amber-500 text-amber-600 bg-transparent",
      suspenso: "border-red-500 text-red-600 bg-transparent",
      cancelado: "border-gray-400 text-gray-500 bg-transparent",
    };
    return (
      <Badge variant="outline" className={map[status] || ""}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  return (
    <PageWrapper title="Visão Geral" subtitle="Painel de controle master">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KpiCard
          title="Corretoras Ativas"
          value={ativas.length}
          icon={Building2}
        />
        <KpiCard
          title="MRR"
          value={mrr}
          prefix="R$ "
          icon={DollarSign}
        />
        <KpiCard
          title="Usuários Totais"
          value={totalUsuarios}
          icon={Users}
        />
        <KpiCard
          title="Trials Expirando"
          value={trialsExpirando.length}
          icon={Clock}
          className={trialsExpirando.length > 0 ? "border-amber-400" : ""}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Corretoras Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          {recentes.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhuma corretora cadastrada ainda.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-2 font-medium">Corretora</th>
                    <th className="pb-2 font-medium">Plano</th>
                    <th className="pb-2 font-medium">Status</th>
                    <th className="pb-2 font-medium">Cadastro</th>
                    <th className="pb-2 font-medium text-right">MRR</th>
                  </tr>
                </thead>
                <tbody>
                  {recentes.map((c: any) => (
                    <tr key={c.id} className="border-b last:border-0">
                      <td className="py-3 font-medium">{c.nome}</td>
                      <td className="py-3 capitalize">{c.plano}</td>
                      <td className="py-3">{statusBadge(c.status)}</td>
                      <td className="py-3 text-muted-foreground">
                        {format(new Date(c.created_at), "dd/MM/yyyy", {
                          locale: ptBR,
                        })}
                      </td>
                      <td className="py-3 text-right">
                        R${" "}
                        {(planoPrecos[c.plano] || 0).toLocaleString("pt-BR", {
                          minimumFractionDigits: 2,
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </PageWrapper>
  );
}
