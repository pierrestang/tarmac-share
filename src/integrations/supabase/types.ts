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
      app_settings: {
        Row: {
          key: string
          value: boolean
        }
        Insert: {
          key: string
          value?: boolean
        }
        Update: {
          key?: string
          value?: boolean
        }
        Relationships: []
      }
      conversation_ratings: {
        Row: {
          comment: string
          conversation_id: string
          id: string
          rated_profile_id: string
          rater_id: string
          score: number
          was_useful: boolean
        }
        Insert: {
          comment?: string
          conversation_id: string
          id?: string
          rated_profile_id: string
          rater_id: string
          score: number
          was_useful?: boolean
        }
        Update: {
          comment?: string
          conversation_id?: string
          id?: string
          rated_profile_id?: string
          rater_id?: string
          score?: number
          was_useful?: boolean
        }
        Relationships: []
      }
      conversations: {
        Row: {
          closed_by: string[]
          created_at: number
          demande_id: string
          id: string
          participants: string[]
          updated_at: number
        }
        Insert: {
          closed_by?: string[]
          created_at?: number
          demande_id: string
          id?: string
          participants?: string[]
          updated_at?: number
        }
        Update: {
          closed_by?: string[]
          created_at?: number
          demande_id?: string
          id?: string
          participants?: string[]
          updated_at?: number
        }
        Relationships: []
      }
      demandes: {
        Row: {
          created_at: number
          from_profile_id: string
          from_trajet_id: string
          id: string
          snapshot: Json | null
          status: string
          to_profile_id: string
          to_trajet_id: string
          type: string
          updated_at: number
          was_cancelled: boolean
        }
        Insert: {
          created_at?: number
          from_profile_id: string
          from_trajet_id: string
          id?: string
          snapshot?: Json | null
          status?: string
          to_profile_id: string
          to_trajet_id: string
          type: string
          updated_at?: number
          was_cancelled?: boolean
        }
        Update: {
          created_at?: number
          from_profile_id?: string
          from_trajet_id?: string
          id?: string
          snapshot?: Json | null
          status?: string
          to_profile_id?: string
          to_trajet_id?: string
          type?: string
          updated_at?: number
          was_cancelled?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "demandes_from_profile_id_fkey"
            columns: ["from_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "demandes_from_trajet_id_fkey"
            columns: ["from_trajet_id"]
            isOneToOne: false
            referencedRelation: "trajets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "demandes_to_profile_id_fkey"
            columns: ["to_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "demandes_to_trajet_id_fkey"
            columns: ["to_trajet_id"]
            isOneToOne: false
            referencedRelation: "trajets"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: number
          id: string
          sender_id: string
          type: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: number
          id?: string
          sender_id: string
          type?: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: number
          id?: string
          sender_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: number
          demande_id: string
          id: string
          message: string
          profile_id: string
          read: boolean
          related_profile_id: string
          title: string
          type: string
        }
        Insert: {
          created_at?: number
          demande_id: string
          id?: string
          message: string
          profile_id: string
          read?: boolean
          related_profile_id: string
          title: string
          type: string
        }
        Update: {
          created_at?: number
          demande_id?: string
          id?: string
          message?: string
          profile_id?: string
          read?: boolean
          related_profile_id?: string
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: number
          description: string
          first_name: string
          id: string
          last_name: string
          photo: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: number
          description?: string
          first_name: string
          id?: string
          last_name: string
          photo?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: number
          description?: string
          first_name?: string
          id?: string
          last_name?: string
          photo?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      trajets: {
        Row: {
          additional_info: string
          baggage_large: number
          baggage_medium: number
          baggage_small: number
          companions: number
          created_at: number
          date: string
          departure_station: string
          departure_station_lat: number | null
          departure_station_lng: number | null
          departure_time: string
          desired_departure: string
          destination: string
          destination_lat: number | null
          destination_lng: number | null
          id: string
          is_republished: boolean
          profile_id: string
        }
        Insert: {
          additional_info?: string
          baggage_large?: number
          baggage_medium?: number
          baggage_small?: number
          companions?: number
          created_at?: number
          date: string
          departure_station: string
          departure_station_lat?: number | null
          departure_station_lng?: number | null
          departure_time: string
          desired_departure?: string
          destination: string
          destination_lat?: number | null
          destination_lng?: number | null
          id?: string
          is_republished?: boolean
          profile_id: string
        }
        Update: {
          additional_info?: string
          baggage_large?: number
          baggage_medium?: number
          baggage_small?: number
          companions?: number
          created_at?: number
          date?: string
          departure_station?: string
          departure_station_lat?: number | null
          departure_station_lng?: number | null
          departure_time?: string
          desired_departure?: string
          destination?: string
          destination_lat?: number | null
          destination_lng?: number | null
          id?: string
          is_republished?: boolean
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trajets_profile_id_fkey"
            columns: ["profile_id"]
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
      get_matched_trajet_ids: { Args: never; Returns: string[] }
      get_my_profile_id: { Args: never; Returns: string }
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
