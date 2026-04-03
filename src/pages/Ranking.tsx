import { useState } from "react";
import { PageWrapper } from "@/components/PageWrapper";
import { Trophy, TrendingUp, TrendingDown } from "lucide-react";
import { useCountUp } from "@/hooks/useCountUp";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { rankingVendedores } from "@/data/mock";

function TopCard({ v, index }: { v: typeof rankingVendedores[0]; index: number }) {
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {rankingVendedores.slice(0, 3).map((v, i) => (
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
              <TableHead>Variação</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rankingVendedores.map((v, i) => (
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
                <TableCell>
                  <div className="flex items-center gap-1">
                    {v.variacao >= 0 ? (
                      <>
                        <TrendingUp className="h-4 w-4 text-emerald-600" />
                        <span className="text-sm text-emerald-600">+{v.variacao}%</span>
                      </>
                    ) : (
                      <>
                        <TrendingDown className="h-4 w-4 text-red-500" />
                        <span className="text-sm text-red-500">{v.variacao}%</span>
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </PageWrapper>
  );
}
