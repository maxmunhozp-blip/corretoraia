import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageWrapper } from "@/components/PageWrapper";
import { Trophy, TrendingUp, TrendingDown, Users, Monitor } from "lucide-react";
import { useCountUp } from "@/hooks/useCountUp";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfMonth, startOfQuarter, startOfYear } from "date-fns";

interface RankingEntry {
  vendedorId: string;
  nome: string;
  vendas: number;
  receitaGerada: number;
  conversao: number;
  propostasAtivas: number;
  pos: number;
}

function useRanking(periodo: string) {
  return useQuery({
    queryKey: ["ranking", periodo],
    queryFn: async () => {
      // Determine date filter
      const now = new Date();
      let desde: Date;
      if (periodo === "trimestre") desde = startOfQuarter(now);
      else if (periodo === "ano") desde = startOfYear(now);
      else desde = startOfMonth(now);

      // Fetch all profiles (vendedores)
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, nome")
        .eq("ativo", true);

      // Fetch all propostas in period
      const { data: propostas } = await supabase
        .from("propostas")
        .select("responsavel_id, status, valor_estimado, created_at")
        .gte("created_at", desde.toISOString());

      if (!profiles || !propostas) return [];

      const ranking: RankingEntry[] = profiles.map((p) => {
        const mine = propostas.filter((pr) => pr.responsavel_id === p.id);
        const aprovadas = mine.filter((pr) => pr.status === "aprovada");
        const ativas = mine.filter((pr) => !["cancelada", "aprovada"].includes(pr.status));
        const receita = aprovadas.reduce((sum, pr) => sum + (Number(pr.valor_estimado) || 0), 0);
        const conversao = mine.length > 0 ? Math.round((aprovadas.length / mine.length) * 100) : 0;

        return {
          vendedorId: p.id,
          nome: p.nome,
          vendas: aprovadas.length,
          receitaGerada: receita,
          conversao,
          propostasAtivas: ativas.length,
          pos: 0,
        };
      });

      // Sort by vendas desc, then receita
      ranking.sort((a, b) => b.vendas - a.vendas || b.receitaGerada - a.receitaGerada);
      ranking.forEach((r, i) => { r.pos = i + 1; });

      return ranking;
    },
  });
}

function TopCard({ v, index }: { v: RankingEntry; index: number }) {
  const vendasAnim = useCountUp(v.vendas, 1000, index * 100);
  const receitaAnim = useCountUp(v.receitaGerada, 1200, index * 100);
  const convAnim = useCountUp(v.conversao, 1000, index * 100);
  const isFirst = v.pos === 1;

  return (
    <div
      className={`rounded-lg border bg-card p-5 flex flex-col gap-3 opacity-0 ${isFirst ? "border-brand" : "border-border"}`}
      style={{ animation: `staggerIn 0.4s ease-out ${index * 100}ms forwards` }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl font-bold text-foreground">{v.pos}º</span>
          <p className="text-sm font-semibold text-foreground">{v.nome}</p>
        </div>
        {isFirst && (
          <div className="h-9 w-9 rounded-md bg-brand-light flex items-center justify-center">
            <Trophy className="h-4 w-4 text-brand" />
          </div>
        )}
      </div>
      <div className="grid grid-cols-3 gap-4 pt-2">
        <div>
          <p className="text-xs text-muted-foreground">Vendas</p>
          <p className="text-lg font-bold text-foreground">{vendasAnim}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Receita</p>
          <p className="text-lg font-bold text-foreground">R$ {receitaAnim.toLocaleString("pt-BR")}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Conversão</p>
          <p className="text-lg font-bold text-foreground">{convAnim}%</p>
        </div>
      </div>
    </div>
  );
}

export default function Ranking() {
  const [periodo, setPeriodo] = useState("mes");
  const { data: ranking, isLoading } = useRanking(periodo);

  return (
    <PageWrapper title="">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">Ranking de Vendedores</h1>
        <Select value={periodo} onValueChange={setPeriodo}>
          <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="mes">Este mês</SelectItem>
            <SelectItem value="trimestre">Este trimestre</SelectItem>
            <SelectItem value="ano">Este ano</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="rounded-lg border border-border bg-card p-5 space-y-3">
                <Skeleton className="h-6 w-1/3" />
                <div className="grid grid-cols-3 gap-4">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                </div>
              </div>
            ))}
          </div>
          <div className="rounded-lg border border-border bg-card p-4 space-y-3">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
          </div>
        </>
      ) : ranking && ranking.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {ranking.slice(0, 3).map((v, i) => (
              <TopCard key={v.vendedorId} v={v} index={i} />
            ))}
          </div>

          <div className="rounded-lg border border-border bg-card overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-surface hover:bg-surface">
                  <TableHead className="w-16">Posição</TableHead>
                  <TableHead>Vendedor</TableHead>
                  <TableHead>Vendas</TableHead>
                  <TableHead>Receita gerada</TableHead>
                  <TableHead>Conversão</TableHead>
                  <TableHead>Propostas ativas</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ranking.map((v, i) => (
                  <TableRow
                    key={v.vendedorId}
                    className="hover:bg-surface transition-colors duration-150 opacity-0"
                    style={{ animation: `staggerIn 0.35s ease-out ${(i + 3) * 60}ms forwards` }}
                  >
                    <TableCell className="font-semibold text-foreground">{v.pos}º</TableCell>
                    <TableCell className="font-medium text-foreground">{v.nome}</TableCell>
                    <TableCell>{v.vendas}</TableCell>
                    <TableCell>R$ {v.receitaGerada.toLocaleString("pt-BR")}</TableCell>
                    <TableCell>{v.conversao}%</TableCell>
                    <TableCell>{v.propostasAtivas}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <Users className="h-12 w-12 mb-3 text-border" />
          <p className="text-sm">Nenhum vendedor com dados no período</p>
        </div>
      )}
    </PageWrapper>
  );
}
