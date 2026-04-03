import { format } from "date-fns";

export function fmtCurrency(value?: number): string {
  if (typeof value !== "number" || Number.isNaN(value)) return "—";
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function fmtPercent(value?: number): string {
  if (typeof value !== "number" || Number.isNaN(value)) return "—";
  return `${value.toFixed(1)}%`;
}

export function safeText(value?: string | number | null): string {
  if (value === null || value === undefined || value === "") return "—";
  return String(value);
}

export function fmtDate(value?: string, pattern = "dd/MM/yyyy HH:mm") {
  const date = value ? new Date(value) : new Date();
  return Number.isNaN(date.getTime()) ? format(new Date(), pattern) : format(date, pattern);
}

export interface OperatorProduct {
  operadora: string;
  produto: string;
  headline: string;
}

export interface DadosProposta {
  cliente_nome: string;
  empresa?: string;
  cnpj?: string;
  vidas?: number;
  valor_estimado?: number;
  valor_atual?: number;
  economia_mensal?: number;
  percentual_economia?: number;
  operadora?: string;
  produto?: string;
  status?: string;
  responsavel?: string;
  observacoes?: string;
  acomodacao?: string;
  odontologico?: string;
  compra_carencia?: string;
  idades?: string;
  created_at?: string;
  vigencia?: string;
  corretora_nome?: string;
  corretora_cnpj?: string;
  corretora_telefone?: string;
  corretora_email?: string;
  corretora_logo_url?: string;
  corretora_cidade?: string;
}

export function splitOperatorProduct(dados: DadosProposta): OperatorProduct {
  const rawOperadora = (dados.operadora || "").trim();
  const rawProduto = (dados.produto || "").trim();

  if (rawOperadora.includes("—") && (!rawProduto || rawOperadora.includes(rawProduto))) {
    const [operadora, produto] = rawOperadora.split("—").map((item) => item.trim());
    return {
      operadora: operadora || rawOperadora,
      produto: rawProduto || produto || rawProduto,
      headline: rawOperadora,
    };
  }

  return {
    operadora: rawOperadora,
    produto: rawProduto,
    headline: [rawOperadora, rawProduto].filter(Boolean).join(" — ") || "Proposta personalizada",
  };
}

export function getEconomy(dados: DadosProposta): number | undefined {
  return dados.economia_mensal ?? (
    typeof dados.valor_atual === "number" && typeof dados.valor_estimado === "number"
      ? dados.valor_atual - dados.valor_estimado
      : undefined
  );
}
