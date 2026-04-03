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
        ]
      }
      atividades: {
        Row: {
          autor_id: string | null
          created_at: string
          descricao: string
          entidade_id: string | null
          entidade_tipo: string | null
          id: string
          tipo: string
        }
        Insert: {
          autor_id?: string | null
          created_at?: string
          descricao: string
          entidade_id?: string | null
          entidade_tipo?: string | null
          id?: string
          tipo: string
        }
        Update: {
          autor_id?: string | null
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
        ]
      }
      base_conhecimento: {
        Row: {
          adicionado_por: string | null
          arquivo_url: string | null
          categoria: string
          conteudo_extraido: string | null
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
      profiles: {
        Row: {
          ativo: boolean
          avatar_iniciais: string | null
          cargo: string | null
          created_at: string
          id: string
          nome: string
          role: string
        }
        Insert: {
          ativo?: boolean
          avatar_iniciais?: string | null
          cargo?: string | null
          created_at?: string
          id: string
          nome: string
          role?: string
        }
        Update: {
          ativo?: boolean
          avatar_iniciais?: string | null
          cargo?: string | null
          created_at?: string
          id?: string
          nome?: string
          role?: string
        }
        Relationships: []
      }
      propostas: {
        Row: {
          cliente_nome: string
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
      [_ in never]: never
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
