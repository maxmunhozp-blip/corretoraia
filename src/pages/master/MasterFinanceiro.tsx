import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageWrapper } from "@/components/PageWrapper";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { DollarSign, TrendingUp, Building2, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const planoPrecos: Record<string, number> = {
  starter: 500,
  profissional: 990,
  business: 1790,
  enterprise: 2500,
};

export default function MasterFinanceiro() {
  const { data: corretoras = [] } = useQuery({
    queryKey: ["master-corretoras"],
    queryFn: async () => {
      const { data } = await supabase.from("corretoras").select("*");
      return data ?? [];
    },
  });

  const ativas = corretoras.filter((c: any) => c.status === "ativo");
  const mrr = ativas.reduce(
    (sum: number, c: any) => sum + (planoPrecos[c.plano] || 0),
    0
  );
  const arr = mrr * 12;
  const inadimplentes = corretoras.filter(
    (c: any) => c.status === "suspenso"
  ).length;

  const planoDist = Object.entries(planoPrecos).map(([slug, preco]) => {
    const count = ativas.filter((c: any) => c.plano === slug).length;
    return { nome: slug, count, total: count * preco };
  });

  return (
    <PageWrapper title="Financeiro" subtitle="Visão financeira consolidada">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KpiCard title="MRR" value={mrr} prefix="R$ " icon={DollarSign} />
        <KpiCard title="ARR" value={arr} prefix="R$ " icon={TrendingUp} />
        <KpiCard
          title="Corretoras Pagantes"
          value={ativas.length}
          icon={Building2}
        />
        <KpiCard
          title="Inadimplentes"
          value={inadimplentes}
          icon={AlertCircle}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Distribuição por Plano</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {planoDist.map((p) => (
              <div key={p.nome} className="flex items-center justify-between">
                <div>
                  <span className="font-medium capitalize">{p.nome}</span>
                  <span className="text-sm text-muted-foreground ml-2">
                    ({p.count} corretoras)
                  </span>
                </div>
                <span className="font-semibold">
                  R${" "}
                  {p.total.toLocaleString("pt-BR", {
                    minimumFractionDigits: 2,
                  })}
                  /mês
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </PageWrapper>
  );
}
