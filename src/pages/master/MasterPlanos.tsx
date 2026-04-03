import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageWrapper } from "@/components/PageWrapper";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";

export default function MasterPlanos() {
  const { data: planos = [] } = useQuery({
    queryKey: ["master-planos"],
    queryFn: async () => {
      const { data } = await supabase
        .from("planos")
        .select("*")
        .order("preco", { ascending: true });
      return data ?? [];
    },
  });

  const { data: corretoras = [] } = useQuery({
    queryKey: ["master-corretoras"],
    queryFn: async () => {
      const { data } = await supabase.from("corretoras").select("plano");
      return data ?? [];
    },
  });

  const planoCounts: Record<string, number> = {};
  corretoras.forEach((c: any) => {
    planoCounts[c.plano] = (planoCounts[c.plano] || 0) + 1;
  });

  return (
    <PageWrapper title="Planos" subtitle="Planos disponíveis no sistema">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {planos.map((p: any) => {
          const recursos = Array.isArray(p.recursos) ? p.recursos : [];
          return (
            <Card key={p.id} className="relative">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{p.nome}</CardTitle>
                  <Badge variant="outline" className="bg-transparent">
                    {planoCounts[p.slug] || 0} corretoras
                  </Badge>
                </div>
                <div className="mt-2">
                  <span className="text-3xl font-bold text-brand">
                    R$ {Number(p.preco).toLocaleString("pt-BR")}
                  </span>
                  <span className="text-sm text-muted-foreground">/mês</span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground mb-3">
                  {p.max_usuarios
                    ? `Até ${p.max_usuarios} usuários`
                    : "Usuários ilimitados"}
                  {p.max_propostas
                    ? ` • ${p.max_propostas} propostas`
                    : " • Propostas ilimitadas"}
                </div>
                <ul className="space-y-2">
                  {recursos.map((r: string, i: number) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-sm"
                    >
                      <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </PageWrapper>
  );
}
