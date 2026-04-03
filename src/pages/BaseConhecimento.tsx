import { useState } from "react";
import { PageWrapper } from "@/components/PageWrapper";
import { Upload, Globe, Search, BookOpen, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useBaseConhecimento } from "@/hooks/useBaseConhecimento";
import { DocumentoCard } from "@/components/base-conhecimento/DocumentoCard";
import { UploadDocumentoModal } from "@/components/base-conhecimento/UploadDocumentoModal";
import { UploadPastaModal } from "@/components/base-conhecimento/UploadPastaModal";
import { BuscarInternetModal } from "@/components/base-conhecimento/BuscarInternetModal";

export default function BaseConhecimento() {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("todos");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [pastaOpen, setPastaOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const { data: documentos, isLoading } = useBaseConhecimento({ search, categoria: activeTab });

  return (
    <PageWrapper title="">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">Base de Conhecimento</h1>
        <div className="flex items-center gap-2">
          <Button onClick={() => setUploadOpen(true)} className="bg-brand text-brand-foreground hover:bg-brand-hover">
            <Upload className="h-4 w-4 mr-2" /> Upload
          </Button>
          <Button onClick={() => setPastaOpen(true)} variant="outline" className="border-brand text-brand hover:bg-brand-light">
            <FolderOpen className="h-4 w-4 mr-2" /> Upload de Pasta
          </Button>
          <Button variant="outline" onClick={() => setSearchOpen(true)} className="border-brand text-brand hover:bg-brand-light">
            <Globe className="h-4 w-4 mr-2" /> Buscar na internet
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-5">
        <TabsList className="bg-surface">
          <TabsTrigger value="todos">Todos</TabsTrigger>
          <TabsTrigger value="regras_comerciais">Regras Comerciais</TabsTrigger>
          <TabsTrigger value="tabela_preco">Tabelas de Preço</TabsTrigger>
          <TabsTrigger value="rede_credenciada">Rede Credenciada</TabsTrigger>
          <TabsTrigger value="pesquisas_web">Pesquisas Web</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="relative max-w-md mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Pesquisar na base de conhecimento..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="rounded-lg border border-border bg-card p-4 space-y-3">
              <Skeleton className="h-10 w-10 rounded-md" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
              <Skeleton className="h-3 w-1/3" />
            </div>
          ))}
        </div>
      ) : documentos && documentos.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {documentos.map((doc, i) => (
            <DocumentoCard key={doc.id} doc={doc as any} index={i} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <BookOpen className="h-16 w-16 mb-4 text-border" />
          <p className="text-base font-medium">Nenhum documento nesta categoria</p>
          <p className="text-sm mt-1">Faça upload de documentos ou busque na internet</p>
        </div>
      )}

      <UploadDocumentoModal open={uploadOpen} onOpenChange={setUploadOpen} />
      <UploadPastaModal open={pastaOpen} onOpenChange={setPastaOpen} />
      <BuscarInternetModal open={searchOpen} onOpenChange={setSearchOpen} />
    </PageWrapper>
  );
}
