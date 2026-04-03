import { useState } from "react";
import { PageWrapper } from "@/components/PageWrapper";
import { Trophy, TrendingUp, TrendingDown } from "lucide-react";
import { useCountUp } from "@/hooks/useCountUp";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Vendedor {
  pos: number;
  nome: string;
  vendas: number;
  receita: number;
  conversao: number;
  propostasAtivas: number;
  variacao: number; // positive = up
}

const vendedores: Vendedor[] = [
  { pos: 1, nome: "Ana Lima", vendas: 18, receita: 28400, conversao: 74, propostasAtivas: 5, variacao: 12 },
  { pos: 2, nome: "Carlos Melo", vendas: 14, receita: 19200, conversao: 61, propostasAtivas: 4, variacao: 8 },
  { pos: 3, nome: "Pedro Costa", vendas: 9, receita: 11800, conversao: 58, propostasAtivas: 3, variacao: -3 },
  { pos: 4, nome: "Juliana Reis", vendas: 7, receita: 9400, conversao: 52, propostasAtivas: 2, variacao: 5 },
  { pos: 5, nome: "Rafael Souza", vendas: 5, receita: 6200, conversao: 45, propostasAtivas: 3, variacao: -7 },
  { pos: 6, nome: "Beatriz Alves", vendas: 3, receita: 3800, conversao: 40, propostasAtivas: 1, variacao: 2 },
];

function TopCard({ v, index }: { v: Vendedor; index: number }) {
  const vendasAnimated = useCountUp(v.vendas, 1000, index * 100);
  const receitaAnimated = useCountUp(v.receita, 1200, index * 100);
  const conversaoAnimated = useCountUp(v.conversao, 1000, index * 100);

  const isFirst = v.pos === 1;

  return (
    <div
      className={`rounded-lg border bg-card p-5 flex flex-col gap-3 opacity-0 ${
        isFirst ? "border-brand" : "border-border"
      }`}
      style={{ animation: `staggerIn 0.4s ease-out ${index * 100}ms forwards` }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl font-bold text-foreground">{v.pos}º</span>
          <div>
            <p className="text-sm font-semibold text-foreground">{v.nome}</p>
          </div>
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
          <p className="text-lg font-bold text-foreground">{vendasAnimated}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Receita</p>
          <p className="text-lg font-bold text-foreground">
            R$ {receitaAnimated.toLocaleString("pt-BR")}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Conversão</p>
          <p className="text-lg font-bold text-foreground">{conversaoAnimated}%</p>
        </div>
      </div>
    </div>
  );
}

export default function Ranking() {
  const [periodo, setPeriodo] = useState("mes");

  return (
    <PageWrapper title="">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">Ranking de Vendedores</h1>
        <Select value={periodo} onValueChange={setPeriodo}>
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="mes">Este mês</SelectItem>
            <SelectItem value="trimestre">Este trimestre</SelectItem>
            <SelectItem value="ano">Este ano</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Top 3 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {vendedores.slice(0, 3).map((v, i) => (
          <TopCard key={v.nome} v={v} index={i} />
        ))}
      </div>

      {/* Full table */}
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
            {vendedores.map((v, i) => (
              <TableRow
                key={v.nome}
                className="hover:bg-surface transition-colors duration-150 opacity-0"
                style={{ animation: `staggerIn 0.35s ease-out ${(i + 3) * 60}ms forwards` }}
              >
                <TableCell className="font-semibold text-foreground">{v.pos}º</TableCell>
                <TableCell className="font-medium text-foreground">{v.nome}</TableCell>
                <TableCell>{v.vendas}</TableCell>
                <TableCell>R$ {v.receita.toLocaleString("pt-BR")}</TableCell>
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
