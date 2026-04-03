import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown, Pencil, Mail, Calendar, Shield } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { UserEditModal } from "./UserEditModal";

interface UserCardProps {
  usuario: any;
  isCurrentUser: boolean;
  isMaster: boolean;
  onUpdated: () => void;
}

const roleLabel = (r: string) => {
  const map: Record<string, string> = {
    master: "Master",
    admin_corretora: "Administrador",
    gerente: "Gerente",
    vendedor: "Vendedor",
  };
  return map[r] || r;
};

const roleColor = (r: string) => {
  const map: Record<string, string> = {
    master: "border-purple-500 text-purple-600",
    admin_corretora: "border-blue-500 text-blue-600",
    gerente: "border-amber-500 text-amber-600",
    vendedor: "border-muted-foreground text-muted-foreground",
  };
  return map[r] || "border-muted-foreground text-muted-foreground";
};

export function UserCard({ usuario, isCurrentUser, isMaster, onUpdated }: UserCardProps) {
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const initials = usuario.avatar_iniciais || usuario.nome?.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase() || "??";

  return (
    <>
      <Card className="overflow-hidden">
        <Collapsible open={open} onOpenChange={setOpen}>
          <CollapsibleTrigger asChild>
            <button className="w-full flex items-center gap-4 p-4 text-left hover:bg-muted/30 transition-colors">
              {/* Avatar */}
              <div className="h-10 w-10 rounded-full bg-brand/10 text-brand flex items-center justify-center text-sm font-bold shrink-0">
                {initials}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-foreground truncate">
                    {usuario.nome}
                  </span>
                  {isCurrentUser && (
                    <Badge variant="outline" className="bg-transparent text-xs border-brand text-brand">
                      Você
                    </Badge>
                  )}
                </div>
                <span className="text-sm text-muted-foreground truncate block">
                  {usuario.cargo || "Sem cargo definido"}
                </span>
              </div>

              {/* Badges */}
              <Badge variant="outline" className={`bg-transparent shrink-0 ${roleColor(usuario.role)}`}>
                {roleLabel(usuario.role)}
              </Badge>
              <Badge
                variant="outline"
                className={`bg-transparent shrink-0 ${
                  usuario.ativo
                    ? "border-green-500 text-green-600"
                    : "border-red-500 text-red-600"
                }`}
              >
                {usuario.ativo ? "Ativo" : "Inativo"}
              </Badge>

              {/* Chevron */}
              <ChevronDown
                className={`h-4 w-4 text-muted-foreground shrink-0 transition-transform duration-200 ${
                  open ? "rotate-180" : ""
                }`}
              />
            </button>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <div className="px-4 pb-4 pt-0 border-t">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4 shrink-0" />
                  <span className="truncate">{usuario.email || "Email não disponível"}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Shield className="h-4 w-4 shrink-0" />
                  <span>Permissão: <strong className="text-foreground">{roleLabel(usuario.role)}</strong></span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4 shrink-0" />
                  <span>
                    Criado em:{" "}
                    {usuario.created_at
                      ? format(new Date(usuario.created_at), "dd/MM/yyyy", { locale: ptBR })
                      : "—"}
                  </span>
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  size="sm"
                  className="bg-brand hover:bg-brand-hover text-white"
                  onClick={() => setEditOpen(true)}
                >
                  <Pencil className="h-3.5 w-3.5 mr-1" />
                  Editar usuário
                </Button>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {editOpen && (
        <UserEditModal
          open={editOpen}
          onOpenChange={setEditOpen}
          usuario={usuario}
          isMaster={isMaster}
          onSaved={onUpdated}
        />
      )}
    </>
  );
}
