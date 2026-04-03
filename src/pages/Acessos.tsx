import { useState } from "react";
import { PageWrapper } from "@/components/PageWrapper";
import { Eye, EyeOff, ExternalLink, Phone, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { operadoras } from "@/data/mock";

function OperadoraCard({ op, index }: { op: typeof operadoras[0]; index: number }) {
  const [showSenha, setShowSenha] = useState(false);

  return (
    <div
      className="rounded-lg border border-border bg-card p-5 flex flex-col gap-4 opacity-0"
      style={{ animation: `staggerIn 0.4s ease-out ${index * 80}ms forwards` }}
    >
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-brand flex items-center justify-center text-sm font-bold text-brand-foreground">
          {op.logo}
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-foreground">{op.nome}</p>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Phone className="h-3 w-3" />
            {op.suporte}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <div>
          <p className="text-xs text-muted-foreground mb-0.5">Login</p>
          <p className="text-sm text-foreground font-mono bg-surface rounded px-2 py-1">{op.login}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-0.5">Senha</p>
          <div className="flex items-center gap-2">
            <p className="flex-1 text-sm text-foreground font-mono bg-surface rounded px-2 py-1">
              {showSenha ? op.senha : "••••••••"}
            </p>
            <button
              onClick={() => setShowSenha(!showSenha)}
              className="p-1 rounded hover:bg-surface transition-colors"
            >
              {showSenha ? (
                <EyeOff className="h-4 w-4 text-muted-foreground" />
              ) : (
                <Eye className="h-4 w-4 text-muted-foreground" />
              )}
            </button>
          </div>
        </div>
      </div>

      <a
        href={op.url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center justify-center gap-2 rounded-md border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-surface transition-colors duration-200"
      >
        <ExternalLink className="h-4 w-4" />
        Acessar portal
      </a>
    </div>
  );
}

export default function Acessos() {
  return (
    <PageWrapper title="">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">Acessos</h1>
        <Button className="bg-brand text-brand-foreground hover:bg-brand-hover">
          <Plus className="h-4 w-4 mr-2" />
          Adicionar operadora
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {operadoras.map((op, i) => (
          <OperadoraCard key={op.nome} op={op} index={i} />
        ))}
      </div>
    </PageWrapper>
  );
}
