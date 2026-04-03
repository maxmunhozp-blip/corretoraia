import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfMonth, subWeeks, startOfWeek, format, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";

export function useDashboardKpis() {
  return useQuery({
    queryKey: ["dashboard-kpis"],
    queryFn: async () => {
      const now = new Date();
      const monthStart = startOfMonth(now).toISOString();

      const [{ count: totalPropostas }, { count: aprovadas }, { count: aprovadasMes }, { data: aprovadasValues }, { count: ativas }] = await Promise.all([
        supabase.from("propostas").select("*", { count: "exact", head: true }),
        supabase.from("propostas").select("*", { count: "exact", head: true }).eq("status", "aprovada"),
        supabase.from("propostas").select("*", { count: "exact", head: true }).eq("status", "aprovada").gte("updated_at", monthStart),
        supabase.from("propostas").select("valor_estimado").eq("status", "aprovada"),
        supabase.from("propostas").select("*", { count: "exact", head: true }).not("status", "in", '("cancelada","aprovada")'),
      ]);

      const total = totalPropostas || 0;
      const aprov = aprovadas || 0;
      const vendasMes = aprovadasMes || 0;
      const propostasAtivas = ativas || 0;
      const valores = (aprovadasValues || []).map((v) => Number(v.valor_estimado) || 0);
      const ticketMedio = valores.length > 0 ? Math.round(valores.reduce((a, b) => a + b, 0) / valores.length) : 0;
      const taxaConversao = total > 0 ? Math.round((aprov / total) * 100) : 0;

      return { vendasMes, propostasAtivas, ticketMedio, taxaConversao };
    },
  });
}

export function useHealthStatus(taxaConversao: number) {
  return useQuery({
    queryKey: ["health-status", taxaConversao],
    queryFn: async () => {
      const { count } = await supabase
        .from("alertas")
        .select("*", { count: "exact", head: true })
        .eq("nivel", "alto")
        .eq("resolvido", false);
      const alertasAlto = count || 0;

      if (taxaConversao < 40 || alertasAlto > 3) return { status: "Crítico" as const, alertasAlto };
      if (taxaConversao <= 55 || (alertasAlto >= 1 && alertasAlto <= 3)) return { status: "Atenção" as const, alertasAlto };
      return { status: "Saudável" as const, alertasAlto };
    },
    enabled: taxaConversao >= 0,
  });
}

export function useSalesWeekly() {
  return useQuery({
    queryKey: ["sales-weekly"],
    queryFn: async () => {
      const eightWeeksAgo = subWeeks(new Date(), 8).toISOString();
      const { data } = await supabase
        .from("propostas")
        .select("updated_at")
        .eq("status", "aprovada")
        .gte("updated_at", eightWeeksAgo);

      const weeks: Record<string, number> = {};
      for (let i = 7; i >= 0; i--) {
        const weekStart = startOfWeek(subWeeks(new Date(), i), { weekStartsOn: 1 });
        const label = `Sem ${format(weekStart, "dd/MM")}`;
        weeks[label] = 0;
      }

      (data || []).forEach((p) => {
        const d = new Date(p.updated_at);
        const weekStart = startOfWeek(d, { weekStartsOn: 1 });
        const label = `Sem ${format(weekStart, "dd/MM")}`;
        if (label in weeks) weeks[label]++;
      });

      return Object.entries(weeks).map(([semana, vendas]) => ({ semana, vendas }));
    },
  });
}

export function useProposalsDaily() {
  return useQuery({
    queryKey: ["proposals-daily"],
    queryFn: async () => {
      const thirtyDaysAgo = subDays(new Date(), 30).toISOString();
      const { data: all } = await supabase
        .from("propostas")
        .select("created_at, status, updated_at")
        .gte("created_at", thirtyDaysAgo);

      const days: Record<string, { criadas: number; fechadas: number }> = {};
      for (let i = 6; i >= 0; i--) {
        const d = subDays(new Date(), i);
        const label = format(d, "dd/MM");
        days[label] = { criadas: 0, fechadas: 0 };
      }

      (all || []).forEach((p) => {
        const createdLabel = format(new Date(p.created_at), "dd/MM");
        if (createdLabel in days) days[createdLabel].criadas++;
        if (p.status === "aprovada") {
          const closedLabel = format(new Date(p.updated_at), "dd/MM");
          if (closedLabel in days) days[closedLabel].fechadas++;
        }
      });

      return Object.entries(days).map(([dia, vals]) => ({ dia, ...vals }));
    },
  });
}

export function useRecentActivities() {
  return useQuery({
    queryKey: ["recent-activities"],
    queryFn: async () => {
      const { data } = await supabase
        .from("atividades")
        .select("*, profiles:autor_id(nome)")
        .order("created_at", { ascending: false })
        .limit(10);
      return data || [];
    },
  });
}

export function usePendingAlerts() {
  return useQuery({
    queryKey: ["pending-alerts"],
    queryFn: async () => {
      const { data } = await supabase
        .from("alertas")
        .select("*, clientes:cliente_id(nome)")
        .eq("resolvido", false)
        .order("created_at", { ascending: false })
        .limit(3);
      return data || [];
    },
  });
}
