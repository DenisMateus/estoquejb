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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      movements: {
        Row: {
          created_at: string
          date: string
          id: string
          origem: string
          product_code: string
          product_description: string
          product_id: string
          quantity: number
          type: string
          unit: string
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          origem?: string
          product_code: string
          product_description: string
          product_id: string
          quantity: number
          type: string
          unit: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          origem?: string
          product_code?: string
          product_description?: string
          product_id?: string
          quantity?: number
          type?: string
          unit?: string
        }
        Relationships: [
          {
            foreignKeyName: "movements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      mtd_movements: {
        Row: {
          cliente_destino: string
          created_at: string
          date: string
          id: string
          mtd_product_code: string
          mtd_product_description: string
          mtd_product_id: string
          nota_fiscal: string | null
          observacao: string | null
          quantity: number
          type: string
        }
        Insert: {
          cliente_destino?: string
          created_at?: string
          date: string
          id?: string
          mtd_product_code: string
          mtd_product_description: string
          mtd_product_id: string
          nota_fiscal?: string | null
          observacao?: string | null
          quantity?: number
          type?: string
        }
        Update: {
          cliente_destino?: string
          created_at?: string
          date?: string
          id?: string
          mtd_product_code?: string
          mtd_product_description?: string
          mtd_product_id?: string
          nota_fiscal?: string | null
          observacao?: string | null
          quantity?: number
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "mtd_movements_mtd_product_id_fkey"
            columns: ["mtd_product_id"]
            isOneToOne: false
            referencedRelation: "mtd_products"
            referencedColumns: ["id"]
          },
        ]
      }
      mtd_products: {
        Row: {
          cliente: string | null
          code: string
          condicao: string | null
          created_at: string
          description: string
          id: string
          mtd_type: string
          nota_fiscal: string | null
          of_number: string | null
          portaria: string | null
          quantity: number
          status: string
        }
        Insert: {
          cliente?: string | null
          code: string
          condicao?: string | null
          created_at?: string
          description: string
          id?: string
          mtd_type: string
          nota_fiscal?: string | null
          of_number?: string | null
          portaria?: string | null
          quantity?: number
          status?: string
        }
        Update: {
          cliente?: string | null
          code?: string
          condicao?: string | null
          created_at?: string
          description?: string
          id?: string
          mtd_type?: string
          nota_fiscal?: string | null
          of_number?: string | null
          portaria?: string | null
          quantity?: number
          status?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          category: string
          code: string
          created_at: string
          description: string
          id: string
          quantity: number
          sector: string
          unit: string
          weight_per_unit: number
        }
        Insert: {
          category: string
          code: string
          created_at?: string
          description: string
          id?: string
          quantity?: number
          sector?: string
          unit: string
          weight_per_unit?: number
        }
        Update: {
          category?: string
          code?: string
          created_at?: string
          description?: string
          id?: string
          quantity?: number
          sector?: string
          unit?: string
          weight_per_unit?: number
        }
        Relationships: []
      }
      ventiladores_movements: {
        Row: {
          cliente: string
          code: string
          created_at: string
          date: string
          description: string
          id: string
          observacao: string
          of_number: string
          tipo: string
          type: string
          ventilador_id: string | null
        }
        Insert: {
          cliente?: string
          code: string
          created_at?: string
          date: string
          description: string
          id?: string
          observacao?: string
          of_number?: string
          tipo?: string
          type: string
          ventilador_id?: string | null
        }
        Update: {
          cliente?: string
          code?: string
          created_at?: string
          date?: string
          description?: string
          id?: string
          observacao?: string
          of_number?: string
          tipo?: string
          type?: string
          ventilador_id?: string | null
        }
        Relationships: []
      }
      ventiladores_pending: {
        Row: {
          cliente: string
          code: string
          created_at: string
          description: string
          id: string
          negativa: boolean
          of_number: string
          prazo_entrega: string
          priority: number
          quantidade: number
          tipo: string
        }
        Insert: {
          cliente?: string
          code: string
          created_at?: string
          description: string
          id?: string
          negativa?: boolean
          of_number?: string
          prazo_entrega?: string
          priority?: number
          quantidade?: number
          tipo?: string
        }
        Update: {
          cliente?: string
          code?: string
          created_at?: string
          description?: string
          id?: string
          negativa?: boolean
          of_number?: string
          prazo_entrega?: string
          priority?: number
          quantidade?: number
          tipo?: string
        }
        Relationships: []
      }
      ventiladores_stock: {
        Row: {
          cliente: string
          code: string
          created_at: string
          description: string
          id: string
          of_number: string
          status: string
          tipo: string
          volta_obra: boolean
        }
        Insert: {
          cliente?: string
          code: string
          created_at?: string
          description: string
          id?: string
          of_number?: string
          status?: string
          tipo?: string
          volta_obra?: boolean
        }
        Update: {
          cliente?: string
          code?: string
          created_at?: string
          description?: string
          id?: string
          of_number?: string
          status?: string
          tipo?: string
          volta_obra?: boolean
        }
        Relationships: []
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
