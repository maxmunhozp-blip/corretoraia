export interface CorretoraInfo {
  nome: string;
  logo_url?: string;
  telefone?: string;
  email?: string;
  site?: string;
  cidade?: string;
  estado?: string;
  cor_primaria?: string;
  cor_secundaria?: string;
}

export interface Beneficiario {
  nome: string;
  idade: number;
  valores: Record<string, number>;
}

export interface PlanoOfertado {
  nome: string;
  operadora: string;
  valor_mensal: number;
  acomodacao: string;
  abrangencia: string;
  coparticipacao: boolean;
  reembolso: boolean;
  medicina_preventiva: boolean;
  minimo_vidas?: number;
  inicio_cobertura?: string;
  recomendado?: boolean;
  descricao?: string;
  hospitais?: Hospital[];
}

export interface Hospital {
  cidade: string;
  nome: string;
  servicos: string;
}

export interface PlanoAtual {
  nome: string;
  operadora: string;
  valor_mensal: number;
  acomodacao?: string;
  abrangencia?: string;
  coparticipacao?: boolean;
  vidas?: number;
}

export interface PropostaCompleta {
  cliente_nome: string;
  cliente_empresa?: string;
  cliente_email?: string;
  cliente_telefone?: string;
  vidas?: number;
  valida_ate?: string;
  corretora: CorretoraInfo;
  plano_atual?: PlanoAtual;
  alternativas: PlanoOfertado[];
  beneficiarios?: Beneficiario[];
}
