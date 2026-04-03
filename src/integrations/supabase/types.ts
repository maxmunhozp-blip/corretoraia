export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      alertas: {
        Row: {
          cliente_id: string | null
          corretora_id: string | null
          created_at: string
          descricao: string | null
          id: string
          nivel: string
          resolvido: boolean
          tipo: string
          titulo: string
        }
        Insert: {
          cliente_id?: string | null
          corretora_id?: string | null
          created_at?: string
          descricao?: string | null
          id?: string
          nivel: string
          resolvido?: boolean
          tipo: string
          titulo: string
        }
        Update: {
          cliente_id?: string | null
          corretora_id?: string | null
          created_at?: string
          descricao?: string | null
          id?: string
          nivel?: string
          resolvido?: boolean
          tipo?: string
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "alertas_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alertas_corretora_id_fkey"
            columns: ["corretora_id"]
            isOneToOne: false
            referencedRelation: "corretoras"
            referencedColumns: ["id"]
          },
        ]
      }
      atividades: {
        Row: {
          autor_id: string | null
          corretora_id: string | null
          created_at: string
          descricao: string
          entidade_id: string | null
          entidade_tipo: string | null
          id: string
          tipo: string
        }
        Insert: {
          autor_id?: string | null
          corretora_id?: string | null
          created_at?: string
          descricao: string
          entidade_id?: string | null
          entidade_tipo?: string | null
          id?: string
          tipo: string
        }
        Update: {
          autor_id?: string | null
          corretora_id?: string | null
          created_at?: string
          descricao?: string
          entidade_id?: string | null
          entidade_tipo?: string | null
          id?: string
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "atividades_autor_id_fkey"
            columns: ["autor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "atividades_corretora_id_fkey"
            columns: ["corretora_id"]
            isOneToOne: false
            referencedRelation: "corretoras"
            referencedColumns: ["id"]
          },
        ]
      }
      base_conhecimento: {
        Row: {
          adicionado_por: string | null
          arquivo_url: string | null
          categoria: string
          conteudo_extraido: string | null
          corretora_id: string | null
          created_at: string
          descricao: string | null
          erro_mensagem: string | null
          fonte_url: string | null
          id: string
          operadora_id: string | null
          status: string
          tipo: string
          titulo: string
        }
        Insert: {
          adicionado_por?: string | null
          arquivo_url?: string | null
          categoria: string
          conteudo_extraido?: string | null
          corretora_id?: string | null
          created_at?: string
          descricao?: string | null
          erro_mensagem?: string | null
          fonte_url?: string | null
          id?: string
          operadora_id?: string | null
          status?: string
          tipo: string
          titulo: string
        }
        Update: {
          adicionado_por?: string | null
          arquivo_url?: string | null
          categoria?: string
          conteudo_extraido?: string | null
          corretora_id?: string | null
          created_at?: string
          descricao?: string | null
          erro_mensagem?: string | null
          fonte_url?: string | null
          id?: string
          operadora_id?: string | null
          status?: string
          tipo?: string
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "base_conhecimento_adicionado_por_fkey"
            columns: ["adicionado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "base_conhecimento_corretora_id_fkey"
            columns: ["corretora_id"]
            isOneToOne: false
            referencedRelation: "corretoras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "base_conhecimento_operadora_id_fkey"
            columns: ["operadora_id"]
            isOneToOne: false
            referencedRelation: "operadoras"
            referencedColumns: ["id"]
          },
        ]
      }
      clientes: {
        Row: {
          corretora_id: string | null
          created_at: string
          email: string | null
          empresa: string | null
          id: string
          nome: string
          observacoes: string | null
          operadora_id: string | null
          responsavel_id: string | null
          status: string
          telefone: string | null
          tipo: string | null
          updated_at: string
          valor_mensalidade: number | null
          vidas: number
        }
        Insert: {
          corretora_id?: string | null
          created_at?: string
          email?: string | null
          empresa?: string | null
          id?: string
          nome: string
          observacoes?: string | null
          operadora_id?: string | null
          responsavel_id?: string | null
          status?: string
          telefone?: string | null
          tipo?: string | null
          updated_at?: string
          valor_mensalidade?: number | null
          vidas?: number
        }
        Update: {
          corretora_id?: string | null
          created_at?: string
          email?: string | null
          empresa?: string | null
          id?: string
          nome?: string
          observacoes?: string | null
          operadora_id?: string | null
          responsavel_id?: string | null
          status?: string
          telefone?: string | null
          tipo?: string | null
          updated_at?: string
          valor_mensalidade?: number | null
          vidas?: number
        }
        Relationships: [
          {
            foreignKeyName: "clientes_corretora_id_fkey"
            columns: ["corretora_id"]
            isOneToOne: false
            referencedRelation: "corretoras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clientes_operadora_id_fkey"
            columns: ["operadora_id"]
            isOneToOne: false
            referencedRelation: "operadoras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clientes_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      configuracoes: {
        Row: {
          chave: string
          created_at: string
          id: string
          valor: string | null
        }
        Insert: {
          chave: string
          created_at?: string
          id?: string
          valor?: string | null
        }
        Update: {
          chave?: string
          created_at?: string
          id?: string
          valor?: string | null
        }
        Relationships: []
      }
      corretoras: {
        Row: {
          assinatura_fim: string | null
          assinatura_inicio: string | null
          cidade: string | null
          cnpj: string | null
          created_at: string | null
          email: string
          estado: string | null
          id: string
          logo_url: string | null
          max_usuarios: number | null
          nome: string
          onboarding_completo: boolean | null
          plano: string | null
          site: string | null
          status: string | null
          telefone: string | null
          trial_expira_em: string | null
          updated_at: string | null
        }
        Insert: {
          assinatura_fim?: string | null
          assinatura_inicio?: string | null
          cidade?: string | null
          cnpj?: string | null
          created_at?: string | null
          email: string
          estado?: string | null
          id?: string
          logo_url?: string | null
          max_usuarios?: number | null
          nome: string
          onboarding_completo?: boolean | null
          plano?: string | null
          site?: string | null
          status?: string | null
          telefone?: string | null
          trial_expira_em?: string | null
          updated_at?: string | null
        }
        Update: {
          assinatura_fim?: string | null
          assinatura_inicio?: string | null
          cidade?: string | null
          cnpj?: string | null
          created_at?: string | null
          email?: string
          estado?: string | null
          id?: string
          logo_url?: string | null
          max_usuarios?: number | null
          nome?: string
          onboarding_completo?: boolean | null
          plano?: string | null
          site?: string | null
          status?: string | null
          telefone?: string | null
          trial_expira_em?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      documentos: {
        Row: {
          arquivo_path: string | null
          categoria: string
          created_at: string
          descricao: string | null
          fonte_url: string | null
          id: string
          operadora_id: string | null
          status: string
          tipo_arquivo: string | null
          titulo: string
          updated_at: string
        }
        Insert: {
          arquivo_path?: string | null
          categoria?: string
          created_at?: string
          descricao?: string | null
          fonte_url?: string | null
          id?: string
          operadora_id?: string | null
          status?: string
          tipo_arquivo?: string | null
          titulo: string
          updated_at?: string
        }
        Update: {
          arquivo_path?: string | null
          categoria?: string
          created_at?: string
          descricao?: string | null
          fonte_url?: string | null
          id?: string
          operadora_id?: string | null
          status?: string
          tipo_arquivo?: string | null
          titulo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "documentos_operadora_id_fkey"
            columns: ["operadora_id"]
            isOneToOne: false
            referencedRelation: "operadoras"
            referencedColumns: ["id"]
          },
        ]
      }
      gestao_executivos: {
        Row: {
          ativo: boolean
          cargo: string
          created_at: string
          email: string | null
          empresa: string | null
          foto_url: string | null
          id: string
          linkedin: string | null
          nome: string
          observacoes: string | null
          telefone: string | null
          tipo: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          cargo?: string
          created_at?: string
          email?: string | null
          empresa?: string | null
          foto_url?: string | null
          id?: string
          linkedin?: string | null
          nome: string
          observacoes?: string | null
          telefone?: string | null
          tipo?: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          cargo?: string
          created_at?: string
          email?: string | null
          empresa?: string | null
          foto_url?: string | null
          id?: string
          linkedin?: string | null
          nome?: string
          observacoes?: string | null
          telefone?: string | null
          tipo?: string
          updated_at?: string
        }
        Relationships: []
      }
      miranda_conversas: {
        Row: {
          corretora_id: string | null
          created_at: string
          id: string
          titulo: string
          updated_at: string
          user_id: string
        }
        Insert: {
          corretora_id?: string | null
          created_at?: string
          id?: string
          titulo?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          corretora_id?: string | null
          created_at?: string
          id?: string
          titulo?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "miranda_conversas_corretora_id_fkey"
            columns: ["corretora_id"]
            isOneToOne: false
            referencedRelation: "corretoras"
            referencedColumns: ["id"]
          },
        ]
      }
      miranda_mensagens: {
        Row: {
          content: string
          conversa_id: string
          created_at: string
          id: string
          role: string
        }
        Insert: {
          content: string
          conversa_id: string
          created_at?: string
          id?: string
          role: string
        }
        Update: {
          content?: string
          conversa_id?: string
          created_at?: string
          id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "miranda_mensagens_conversa_id_fkey"
            columns: ["conversa_id"]
            isOneToOne: false
            referencedRelation: "miranda_conversas"
            referencedColumns: ["id"]
          },
        ]
      }
      operadoras: {
        Row: {
          ativo: boolean
          created_at: string
          id: string
          login_portal: string | null
          logo_letra: string | null
          nome: string
          senha_portal: string | null
          telefone_suporte: string | null
          url_portal: string | null
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          id?: string
          login_portal?: string | null
          logo_letra?: string | null
          nome: string
          senha_portal?: string | null
          telefone_suporte?: string | null
          url_portal?: string | null
        }
        Update: {
          ativo?: boolean
          created_at?: string
          id?: string
          login_portal?: string | null
          logo_letra?: string | null
          nome?: string
          senha_portal?: string | null
          telefone_suporte?: string | null
          url_portal?: string | null
        }
        Relationships: []
      }
      planos: {
        Row: {
          ativo: boolean | null
          id: string
          max_propostas: number | null
          max_usuarios: number | null
          nome: string
          preco: number
          recursos: Json | null
          slug: string
        }
        Insert: {
          ativo?: boolean | null
          id?: string
          max_propostas?: number | null
          max_usuarios?: number | null
          nome: string
          preco: number
          recursos?: Json | null
          slug: string
        }
        Update: {
          ativo?: boolean | null
          id?: string
          max_propostas?: number | null
          max_usuarios?: number | null
          nome?: string
          preco?: number
          recursos?: Json | null
          slug?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          ativo: boolean
          avatar_iniciais: string | null
          cargo: string | null
          corretora_id: string | null
          created_at: string
          foto_url: string | null
          id: string
          nome: string
          role: string
          ultimo_acesso: string | null
        }
        Insert: {
          ativo?: boolean
          avatar_iniciais?: string | null
          cargo?: string | null
          corretora_id?: string | null
          created_at?: string
          foto_url?: string | null
          id: string
          nome: string
          role?: string
          ultimo_acesso?: string | null
        }
        Update: {
          ativo?: boolean
          avatar_iniciais?: string | null
          cargo?: string | null
          corretora_id?: string | null
          created_at?: string
          foto_url?: string | null
          id?: string
          nome?: string
          role?: string
          ultimo_acesso?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_corretora_id_fkey"
            columns: ["corretora_id"]
            isOneToOne: false
            referencedRelation: "corretoras"
            referencedColumns: ["id"]
          },
        ]
      }
      propostas: {
        Row: {
          cliente_nome: string
          corretora_id: string | null
          created_at: string
          empresa: string | null
          id: string
          observacoes: string | null
          operadora_id: string | null
          responsavel_id: string | null
          status: string
          updated_at: string
          valor_estimado: number | null
          vidas: number
        }
        Insert: {
          cliente_nome: string
          corretora_id?: string | null
          created_at?: string
          empresa?: string | null
          id?: string
          observacoes?: string | null
          operadora_id?: string | null
          responsavel_id?: string | null
          status?: string
          updated_at?: string
          valor_estimado?: number | null
          vidas?: number
        }
        Update: {
          cliente_nome?: string
          corretora_id?: string | null
          created_at?: string
          empresa?: string | null
          id?: string
          observacoes?: string | null
          operadora_id?: string | null
          responsavel_id?: string | null
          status?: string
          updated_at?: string
          valor_estimado?: number | null
          vidas?: number
        }
        Relationships: [
          {
            foreignKeyName: "propostas_corretora_id_fkey"
            columns: ["corretora_id"]
            isOneToOne: false
            referencedRelation: "corretoras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "propostas_operadora_id_fkey"
            columns: ["operadora_id"]
            isOneToOne: false
            referencedRelation: "operadoras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "propostas_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      propostas_interativas: {
        Row: {
          aceita_em: string | null
          alternativas: Json | null
          cliente_email: string | null
          cliente_empresa: string | null
          cliente_nome: string
          cliente_telefone: string | null
          corretora_id: string | null
          created_at: string | null
          criado_por: string | null
          dados: Json
          formato_padrao: string | null
          id: string
          plano_atual: Json | null
          primeira_visualizacao_em: string | null
          slug: string
          status: string | null
          ultima_visualizacao_em: string | null
          valida_ate: string | null
          visualizacoes: number | null
        }
        Insert: {
          aceita_em?: string | null
          alternativas?: Json | null
          cliente_email?: string | null
          cliente_empresa?: string | null
          cliente_nome: string
          cliente_telefone?: string | null
          corretora_id?: string | null
          created_at?: string | null
          criado_por?: string | null
          dados?: Json
          formato_padrao?: string | null
          id?: string
          plano_atual?: Json | null
          primeira_visualizacao_em?: string | null
          slug: string
          status?: string | null
          ultima_visualizacao_em?: string | null
          valida_ate?: string | null
          visualizacoes?: number | null
        }
        Update: {
          aceita_em?: string | null
          alternativas?: Json | null
          cliente_email?: string | null
          cliente_empresa?: string | null
          cliente_nome?: string
          cliente_telefone?: string | null
          corretora_id?: string | null
          created_at?: string | null
          criado_por?: string | null
          dados?: Json
          formato_padrao?: string | null
          id?: string
          plano_atual?: Json | null
          primeira_visualizacao_em?: string | null
          slug?: string
          status?: string | null
          ultima_visualizacao_em?: string | null
          valida_ate?: string | null
          visualizacoes?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "propostas_interativas_corretora_id_fkey"
            columns: ["corretora_id"]
            isOneToOne: false
            referencedRelation: "corretoras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "propostas_interativas_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ranking_vendedores: {
        Row: {
          ativo: boolean
          avatar_iniciais: string | null
          cargo: string
          conversao: number
          created_at: string
          foto_url: string | null
          id: string
          meta_mensal: number
          nome: string
          propostas_ativas: number
          receita_gerada: number
          updated_at: string
          vendas: number
        }
        Insert: {
          ativo?: boolean
          avatar_iniciais?: string | null
          cargo?: string
          conversao?: number
          created_at?: string
          foto_url?: string | null
          id?: string
          meta_mensal?: number
          nome: string
          propostas_ativas?: number
          receita_gerada?: number
          updated_at?: string
          vendas?: number
        }
        Update: {
          ativo?: boolean
          avatar_iniciais?: string | null
          cargo?: string
          conversao?: number
          created_at?: string
          foto_url?: string | null
          id?: string
          meta_mensal?: number
          nome?: string
          propostas_ativas?: number
          receita_gerada?: number
          updated_at?: string
          vendas?: number
        }
        Relationships: []
      }
      solicitacao_comentarios: {
        Row: {
          autor_id: string
          conteudo: string
          created_at: string
          id: string
          solicitacao_id: string
        }
        Insert: {
          autor_id: string
          conteudo: string
          created_at?: string
          id?: string
          solicitacao_id: string
        }
        Update: {
          autor_id?: string
          conteudo?: string
          created_at?: string
          id?: string
          solicitacao_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "solicitacao_comentarios_autor_id_fkey"
            columns: ["autor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "solicitacao_comentarios_solicitacao_id_fkey"
            columns: ["solicitacao_id"]
            isOneToOne: false
            referencedRelation: "solicitacoes"
            referencedColumns: ["id"]
          },
        ]
      }
      solicitacao_votos: {
        Row: {
          created_at: string
          id: string
          solicitacao_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          solicitacao_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          solicitacao_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "solicitacao_votos_solicitacao_id_fkey"
            columns: ["solicitacao_id"]
            isOneToOne: false
            referencedRelation: "solicitacoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "solicitacao_votos_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      solicitacoes: {
        Row: {
          autor_id: string | null
          created_at: string
          descricao: string
          id: string
          prioridade: string
          setor: string
          status: string
          titulo: string
          updated_at: string
        }
        Insert: {
          autor_id?: string | null
          created_at?: string
          descricao: string
          id?: string
          prioridade?: string
          setor: string
          status?: string
          titulo: string
          updated_at?: string
        }
        Update: {
          autor_id?: string | null
          created_at?: string
          descricao?: string
          id?: string
          prioridade?: string
          setor?: string
          status?: string
          titulo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "solicitacoes_autor_id_fkey"
            columns: ["autor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_corretora_id: { Args: { _user_id: string }; Returns: string }
      get_user_role: { Args: { _user_id: string }; Returns: string }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
