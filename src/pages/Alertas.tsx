import { useState } from "react";
import { PageWrapper } from "@/components/PageWrapper";
import { AlertTriangle, Info, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

const borderColors: Record<string, string> = {
  alto: "border-l-[#955251]",
  medio: "border-l-[#D97706]",
  baixo: "border-l-border",
};

export default function Alertas() {
  const [filtro, setFiltro] = useState("all");
  const queryClient = useQueryClient();

  const { data: alertas, isLoading } = useQuery({
    queryKey: ["alertas", filtro],
    queryFn: async () => {
      let query = supabase
        .from("alertas")
        .select("*, clientes:cliente_id(nome)")
        .eq("resolvido", false)
        .order("created_at", { ascending: false });

      if (filtro !== "all") {
        const tipoMap: Record<string, string> = {
          inadimplencia: "inadimplencia",
          cancelamento: "cancelamento",
          proposta: "proposta_parada",
          contrato: "contrato",
        };
        if (tipoMap[filtro]) query = query.eq("tipo", tipoMap[filtro]);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  const resolver = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("alertas").update({ resolvido: true }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alertas"] });
      toast.success("Alerta resolvido");
    },
  });

  return (
    <PageWrapper title="">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">Alertas</h1>
        <Select value={filtro} onValueChange={setFiltro}>
          <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="inadimplencia">Inadimplência</SelectItem>
            <SelectItem value="cancelamento">Cancelamento</SelectItem>
            <SelectItem value="proposta">Proposta parada</SelectItem>
            <SelectItem value="contrato">Contrato</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-lg border border-border bg-card p-4 flex gap-4">
              <Skeleton className="h-5 w-5 rounded mt-0.5" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-3 w-2/3" />
                <Skeleton className="h-3 w-1/4" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {(alertas || []).map((a, i) => {
            const Icon = a.nivel === "baixo" ? Info : AlertTriangle;
            const isAlto = a.nivel === "alto";
            const clienteNome = (a.clientes as any)?.nome || "—";
            return (
              <div
                key={a.id}
                className={`rounded-lg border border-border bg-card p-4 border-l-4 ${borderColors[a.nivel] || "border-l-border"} flex items-start gap-4 opacity-0`}
                style={{ animation: `staggerIn 0.4s ease-out ${i * 80}ms forwards${isAlto ? ", alertPulse 3s ease-in-out infinite" : ""}` }}
              >
                <div className="mt-0.5"><Icon className="h-5 w-5 text-muted-foreground" /></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-foreground">{a.titulo}</span>
                    <span className="text-xs text-muted-foreground">•</span>
                    <span className="text-xs text-muted-foreground capitalize">{a.nivel}</span>
                  </div>
                  <p className="text-sm text-foreground mb-1">{a.descricao}</p>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">Cliente: <span className="font-medium text-foreground">{clienteNome}</span></span>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(a.created_at), { addSuffix: true, locale: ptBR })}
                    </span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="shrink-0 text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => resolver.mutate(a.id)}
                >
                  Resolver
                </Button>
              </div>
            );
          })}
          {(!alertas || alertas.length === 0) && (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Bell className="h-12 w-12 mb-3 text-border" />
              <p className="text-sm">Nenhum alerta pendente</p>
            </div>
          )}
        </div>
      )}
    </PageWrapper>
  );
}
