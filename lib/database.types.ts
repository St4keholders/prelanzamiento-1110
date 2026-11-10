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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      bonus_plays: {
        Row: {
          deadline_at: string
          duration_ms: number | null
          finished_at: string | null
          guessed_letters: string[]
          id: string
          lost_reason: string | null
          participant_id: string
          round_id: string
          started_at: string
          status: string
          win_code: string | null
          wrong_count: number
        }
        Insert: {
          deadline_at: string
          duration_ms?: number | null
          finished_at?: string | null
          guessed_letters?: string[]
          id?: string
          lost_reason?: string | null
          participant_id: string
          round_id: string
          started_at?: string
          status?: string
          win_code?: string | null
          wrong_count?: number
        }
        Update: {
          deadline_at?: string
          duration_ms?: number | null
          finished_at?: string | null
          guessed_letters?: string[]
          id?: string
          lost_reason?: string | null
          participant_id?: string
          round_id?: string
          started_at?: string
          status?: string
          win_code?: string | null
          wrong_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "bonus_plays_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bonus_plays_round_id_fkey"
            columns: ["round_id"]
            isOneToOne: false
            referencedRelation: "bonus_rounds"
            referencedColumns: ["id"]
          },
        ]
      }
      bonus_rounds: {
        Row: {
          category: string
          closes_at: string
          eligible_date: string
          id: string
          max_errors: number
          opens_at: string
          time_limit_seconds: number
          word: string
        }
        Insert: {
          category: string
          closes_at: string
          eligible_date: string
          id: string
          max_errors?: number
          opens_at: string
          time_limit_seconds?: number
          word: string
        }
        Update: {
          category?: string
          closes_at?: string
          eligible_date?: string
          id?: string
          max_errors?: number
          opens_at?: string
          time_limit_seconds?: number
          word?: string
        }
        Relationships: [
          {
            foreignKeyName: "bonus_rounds_eligible_date_fkey"
            columns: ["eligible_date"]
            isOneToOne: false
            referencedRelation: "daily_words"
            referencedColumns: ["game_date"]
          },
        ]
      }
      daily_words: {
        Row: {
          category: string
          game_date: string
          max_errors: number
          starts_at: string
          time_limit_seconds: number
          word: string
        }
        Insert: {
          category: string
          game_date: string
          max_errors?: number
          starts_at: string
          time_limit_seconds?: number
          word: string
        }
        Update: {
          category?: string
          game_date?: string
          max_errors?: number
          starts_at?: string
          time_limit_seconds?: number
          word?: string
        }
        Relationships: []
      }
      participants: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          last_seen_at: string
          phone: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name: string
          id?: string
          last_seen_at?: string
          phone: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          last_seen_at?: string
          phone?: string
        }
        Relationships: []
      }
      plays: {
        Row: {
          deadline_at: string
          duration_ms: number | null
          finished_at: string | null
          game_date: string
          guessed_letters: string[]
          id: string
          lost_reason: string | null
          participant_id: string
          started_at: string
          status: string
          win_code: string | null
          wrong_count: number
        }
        Insert: {
          deadline_at: string
          duration_ms?: number | null
          finished_at?: string | null
          game_date: string
          guessed_letters?: string[]
          id?: string
          lost_reason?: string | null
          participant_id: string
          started_at?: string
          status?: string
          win_code?: string | null
          wrong_count?: number
        }
        Update: {
          deadline_at?: string
          duration_ms?: number | null
          finished_at?: string | null
          game_date?: string
          guessed_letters?: string[]
          id?: string
          lost_reason?: string | null
          participant_id?: string
          started_at?: string
          status?: string
          win_code?: string | null
          wrong_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "plays_game_date_fkey"
            columns: ["game_date"]
            isOneToOne: false
            referencedRelation: "daily_words"
            referencedColumns: ["game_date"]
          },
          {
            foreignKeyName: "plays_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_day_summary: {
        Args: never
        Returns: {
          category: string
          game_date: string
          lost_errors: number
          lost_timeout: number
          playing: number
          started: number
          won: number
          word: string
        }[]
      }
      admin_participants: {
        Args: { p_limit?: number; p_offset?: number; p_search?: string }
        Returns: {
          created_at: string
          days_played: number
          days_won: number
          email: string
          full_name: string
          id: string
          last_seen_at: string
          phone: string
          phone_dup_count: number
          total_count: number
        }[]
      }
      admin_results: {
        Args: {
          p_date?: string
          p_limit?: number
          p_offset?: number
          p_search?: string
        }
        Returns: {
          duration_ms: number
          email: string
          finished_at: string
          full_name: string
          game_date: string
          guessed_letters: string[]
          lost_reason: string
          phone: string
          play_id: string
          started_at: string
          status: string
          total_count: number
          win_code: string
          wrong_count: number
        }[]
      }
      ahd_current_date: { Args: { p_now?: string }; Returns: string }
      ahd_normalize: { Args: { p_text: string }; Returns: string }
      ahd_win_code: { Args: never; Returns: string }
      ahd_word_letters: { Args: { p_word: string }; Returns: string[] }
      apply_guess: {
        Args: {
          p_date: string
          p_letter: string
          p_now?: string
          p_participant: string
        }
        Returns: {
          deadline_at: string
          duration_ms: number | null
          finished_at: string | null
          game_date: string
          guessed_letters: string[]
          id: string
          lost_reason: string | null
          participant_id: string
          started_at: string
          status: string
          win_code: string | null
          wrong_count: number
        }
        SetofOptions: {
          from: "*"
          to: "plays"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      bonus_apply_guess: {
        Args: {
          p_letter: string
          p_now?: string
          p_participant: string
          p_round: string
        }
        Returns: {
          deadline_at: string
          duration_ms: number | null
          finished_at: string | null
          guessed_letters: string[]
          id: string
          lost_reason: string | null
          participant_id: string
          round_id: string
          started_at: string
          status: string
          win_code: string | null
          wrong_count: number
        }
        SetofOptions: {
          from: "*"
          to: "bonus_plays"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      bonus_refresh_play: {
        Args: { p_now?: string; p_participant: string; p_round: string }
        Returns: {
          deadline_at: string
          duration_ms: number | null
          finished_at: string | null
          guessed_letters: string[]
          id: string
          lost_reason: string | null
          participant_id: string
          round_id: string
          started_at: string
          status: string
          win_code: string | null
          wrong_count: number
        }[]
        SetofOptions: {
          from: "*"
          to: "bonus_plays"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      bonus_start_play: {
        Args: { p_now?: string; p_participant: string; p_round: string }
        Returns: {
          deadline_at: string
          duration_ms: number | null
          finished_at: string | null
          guessed_letters: string[]
          id: string
          lost_reason: string | null
          participant_id: string
          round_id: string
          started_at: string
          status: string
          win_code: string | null
          wrong_count: number
        }
        SetofOptions: {
          from: "*"
          to: "bonus_plays"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      expire_plays: { Args: { p_now?: string }; Returns: number }
      refresh_play: {
        Args: { p_date: string; p_now?: string; p_participant: string }
        Returns: {
          deadline_at: string
          duration_ms: number | null
          finished_at: string | null
          game_date: string
          guessed_letters: string[]
          id: string
          lost_reason: string | null
          participant_id: string
          started_at: string
          status: string
          win_code: string | null
          wrong_count: number
        }[]
        SetofOptions: {
          from: "*"
          to: "plays"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      start_play: {
        Args: { p_date: string; p_now?: string; p_participant: string }
        Returns: {
          deadline_at: string
          duration_ms: number | null
          finished_at: string | null
          game_date: string
          guessed_letters: string[]
          id: string
          lost_reason: string | null
          participant_id: string
          started_at: string
          status: string
          win_code: string | null
          wrong_count: number
        }
        SetofOptions: {
          from: "*"
          to: "plays"
          isOneToOne: true
          isSetofReturn: false
        }
      }
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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

