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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      athlete_stats: {
        Row: {
          athlete_id: string
          created_at: string
          id: string
          season: string
          stat_name: string
          stat_value: number
          updated_at: string
        }
        Insert: {
          athlete_id: string
          created_at?: string
          id?: string
          season: string
          stat_name: string
          stat_value: number
          updated_at?: string
        }
        Update: {
          athlete_id?: string
          created_at?: string
          id?: string
          season?: string
          stat_name?: string
          stat_value?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "athlete_stats_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
        ]
      }
      athletes: {
        Row: {
          act_score: number | null
          bio: string | null
          created_at: string
          gpa: number | null
          graduation_year: number | null
          height_inches: number | null
          high_school: string | null
          highlights_url: string | null
          id: string
          parent_id: string | null
          position: string | null
          sat_score: number | null
          sport: string
          updated_at: string
          user_id: string
          weight_lbs: number | null
        }
        Insert: {
          act_score?: number | null
          bio?: string | null
          created_at?: string
          gpa?: number | null
          graduation_year?: number | null
          height_inches?: number | null
          high_school?: string | null
          highlights_url?: string | null
          id?: string
          parent_id?: string | null
          position?: string | null
          sat_score?: number | null
          sport: string
          updated_at?: string
          user_id: string
          weight_lbs?: number | null
        }
        Update: {
          act_score?: number | null
          bio?: string | null
          created_at?: string
          gpa?: number | null
          graduation_year?: number | null
          height_inches?: number | null
          high_school?: string | null
          highlights_url?: string | null
          id?: string
          parent_id?: string | null
          position?: string | null
          sat_score?: number | null
          sport?: string
          updated_at?: string
          user_id?: string
          weight_lbs?: number | null
        }
        Relationships: []
      }
      badges: {
        Row: {
          created_at: string
          criteria: string | null
          description: string | null
          icon_url: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          criteria?: string | null
          description?: string | null
          icon_url?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          criteria?: string | null
          description?: string | null
          icon_url?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      college_match_prefs: {
        Row: {
          academic_priorities: string[] | null
          athlete_id: string
          created_at: string
          id: string
          max_distance_miles: number | null
          max_enrollment: number | null
          max_tuition: number | null
          min_enrollment: number | null
          preferred_divisions: string[] | null
          preferred_states: string[] | null
          updated_at: string
        }
        Insert: {
          academic_priorities?: string[] | null
          athlete_id: string
          created_at?: string
          id?: string
          max_distance_miles?: number | null
          max_enrollment?: number | null
          max_tuition?: number | null
          min_enrollment?: number | null
          preferred_divisions?: string[] | null
          preferred_states?: string[] | null
          updated_at?: string
        }
        Update: {
          academic_priorities?: string[] | null
          athlete_id?: string
          created_at?: string
          id?: string
          max_distance_miles?: number | null
          max_enrollment?: number | null
          max_tuition?: number | null
          min_enrollment?: number | null
          preferred_divisions?: string[] | null
          preferred_states?: string[] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "college_match_prefs_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: true
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
        ]
      }
      college_matches: {
        Row: {
          academic_fit: number | null
          athlete_id: string
          athletic_fit: number | null
          created_at: string
          financial_fit: number | null
          id: string
          is_saved: boolean | null
          match_score: number | null
          notes: string | null
          school_id: string
          updated_at: string
        }
        Insert: {
          academic_fit?: number | null
          athlete_id: string
          athletic_fit?: number | null
          created_at?: string
          financial_fit?: number | null
          id?: string
          is_saved?: boolean | null
          match_score?: number | null
          notes?: string | null
          school_id: string
          updated_at?: string
        }
        Update: {
          academic_fit?: number | null
          athlete_id?: string
          athletic_fit?: number | null
          created_at?: string
          financial_fit?: number | null
          id?: string
          is_saved?: boolean | null
          match_score?: number | null
          notes?: string | null
          school_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "college_matches_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "college_matches_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          created_at: string
          description: string | null
          duration_minutes: number | null
          id: string
          is_published: boolean | null
          thumbnail_url: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_published?: boolean | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_published?: boolean | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      evaluations: {
        Row: {
          athlete_id: string
          coach_id: string | null
          completed_at: string | null
          created_at: string
          feedback: string | null
          id: string
          purchased_at: string
          rating: number | null
          status: Database["public"]["Enums"]["evaluation_status"]
          updated_at: string
        }
        Insert: {
          athlete_id: string
          coach_id?: string | null
          completed_at?: string | null
          created_at?: string
          feedback?: string | null
          id?: string
          purchased_at?: string
          rating?: number | null
          status?: Database["public"]["Enums"]["evaluation_status"]
          updated_at?: string
        }
        Update: {
          athlete_id?: string
          coach_id?: string | null
          completed_at?: string | null
          created_at?: string
          feedback?: string | null
          id?: string
          purchased_at?: string
          rating?: number | null
          status?: Database["public"]["Enums"]["evaluation_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "evaluations_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
        ]
      }
      lessons: {
        Row: {
          content: string | null
          created_at: string
          duration_minutes: number | null
          id: string
          module_id: string
          order_index: number
          title: string
          updated_at: string
          video_url: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string
          duration_minutes?: number | null
          id?: string
          module_id: string
          order_index: number
          title: string
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string
          duration_minutes?: number | null
          id?: string
          module_id?: string
          order_index?: number
          title?: string
          updated_at?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lessons_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      media_assets: {
        Row: {
          athlete_id: string | null
          created_at: string
          description: string | null
          file_size: number | null
          id: string
          media_type: string
          thumbnail_url: string | null
          title: string
          updated_at: string
          url: string
          user_id: string
        }
        Insert: {
          athlete_id?: string | null
          created_at?: string
          description?: string | null
          file_size?: number | null
          id?: string
          media_type: string
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          url: string
          user_id: string
        }
        Update: {
          athlete_id?: string | null
          created_at?: string
          description?: string | null
          file_size?: number | null
          id?: string
          media_type?: string
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          url?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "media_assets_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
        ]
      }
      memberships: {
        Row: {
          auto_renew: boolean | null
          created_at: string
          end_date: string | null
          id: string
          plan: Database["public"]["Enums"]["subscription_plan"]
          start_date: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          auto_renew?: boolean | null
          created_at?: string
          end_date?: string | null
          id?: string
          plan?: Database["public"]["Enums"]["subscription_plan"]
          start_date?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          auto_renew?: boolean | null
          created_at?: string
          end_date?: string | null
          id?: string
          plan?: Database["public"]["Enums"]["subscription_plan"]
          start_date?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      modules: {
        Row: {
          course_id: string
          created_at: string
          description: string | null
          id: string
          order_index: number
          title: string
          updated_at: string
        }
        Insert: {
          course_id: string
          created_at?: string
          description?: string | null
          id?: string
          order_index: number
          title: string
          updated_at?: string
        }
        Update: {
          course_id?: string
          created_at?: string
          description?: string | null
          id?: string
          order_index?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "modules_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean | null
          link: string | null
          message: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          link?: string | null
          message: string
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          link?: string | null
          message?: string
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          currency: string
          id: string
          membership_id: string | null
          payment_method: string
          status: Database["public"]["Enums"]["payment_status"]
          transaction_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          id?: string
          membership_id?: string | null
          payment_method: string
          status?: Database["public"]["Enums"]["payment_status"]
          transaction_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          membership_id?: string | null
          payment_method?: string
          status?: Database["public"]["Enums"]["payment_status"]
          transaction_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: false
            referencedRelation: "memberships"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      questions: {
        Row: {
          correct_answer: string
          created_at: string
          id: string
          options: Json
          order_index: number
          question_text: string
          quiz_id: string
          updated_at: string
        }
        Insert: {
          correct_answer: string
          created_at?: string
          id?: string
          options: Json
          order_index: number
          question_text: string
          quiz_id: string
          updated_at?: string
        }
        Update: {
          correct_answer?: string
          created_at?: string
          id?: string
          options?: Json
          order_index?: number
          question_text?: string
          quiz_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "questions_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_attempts: {
        Row: {
          answers: Json
          completed_at: string
          created_at: string
          id: string
          passed: boolean
          quiz_id: string
          score: number
          user_id: string
        }
        Insert: {
          answers: Json
          completed_at?: string
          created_at?: string
          id?: string
          passed: boolean
          quiz_id: string
          score: number
          user_id: string
        }
        Update: {
          answers?: Json
          completed_at?: string
          created_at?: string
          id?: string
          passed?: boolean
          quiz_id?: string
          score?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_attempts_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quizzes: {
        Row: {
          created_at: string
          id: string
          lesson_id: string
          passing_score: number | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          lesson_id: string
          passing_score?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          lesson_id?: string
          passing_score?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quizzes_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: true
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      rankings: {
        Row: {
          athlete_id: string
          composite_score: number | null
          created_at: string
          id: string
          last_calculated: string
          national_rank: number | null
          overall_rank: number | null
          position_rank: number | null
          state_rank: number | null
          updated_at: string
        }
        Insert: {
          athlete_id: string
          composite_score?: number | null
          created_at?: string
          id?: string
          last_calculated?: string
          national_rank?: number | null
          overall_rank?: number | null
          position_rank?: number | null
          state_rank?: number | null
          updated_at?: string
        }
        Update: {
          athlete_id?: string
          composite_score?: number | null
          created_at?: string
          id?: string
          last_calculated?: string
          national_rank?: number | null
          overall_rank?: number | null
          position_rank?: number | null
          state_rank?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rankings_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
        ]
      }
      schools: {
        Row: {
          acceptance_rate: number | null
          athletic_website_url: string | null
          avg_act: number | null
          avg_sat: number | null
          conference: string | null
          created_at: string
          division: string | null
          enrollment: number | null
          id: string
          location_city: string | null
          location_state: string | null
          name: string
          tuition: number | null
          updated_at: string
          website_url: string | null
        }
        Insert: {
          acceptance_rate?: number | null
          athletic_website_url?: string | null
          avg_act?: number | null
          avg_sat?: number | null
          conference?: string | null
          created_at?: string
          division?: string | null
          enrollment?: number | null
          id?: string
          location_city?: string | null
          location_state?: string | null
          name: string
          tuition?: number | null
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          acceptance_rate?: number | null
          athletic_website_url?: string | null
          avg_act?: number | null
          avg_sat?: number | null
          conference?: string | null
          created_at?: string
          division?: string | null
          enrollment?: number | null
          id?: string
          location_city?: string | null
          location_state?: string | null
          name?: string
          tuition?: number | null
          updated_at?: string
          website_url?: string | null
        }
        Relationships: []
      }
      social_posts: {
        Row: {
          athlete_id: string | null
          content: string
          created_at: string
          id: string
          is_draft: boolean | null
          media_url: string | null
          published_at: string | null
          updated_at: string
          user_id: string
          watermark_applied: boolean | null
        }
        Insert: {
          athlete_id?: string | null
          content: string
          created_at?: string
          id?: string
          is_draft?: boolean | null
          media_url?: string | null
          published_at?: string | null
          updated_at?: string
          user_id: string
          watermark_applied?: boolean | null
        }
        Update: {
          athlete_id?: string | null
          content?: string
          created_at?: string
          id?: string
          is_draft?: boolean | null
          media_url?: string | null
          published_at?: string | null
          updated_at?: string
          user_id?: string
          watermark_applied?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "social_posts_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
        ]
      }
      user_badges: {
        Row: {
          badge_id: string
          earned_at: string
          id: string
          user_id: string
        }
        Insert: {
          badge_id: string
          earned_at?: string
          id?: string
          user_id: string
        }
        Update: {
          badge_id?: string
          earned_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "athlete" | "parent" | "coach" | "recruiter" | "admin"
      evaluation_status: "pending" | "in_progress" | "completed"
      payment_status: "pending" | "completed" | "failed" | "refunded"
      subscription_plan: "free" | "annual" | "monthly"
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
    Enums: {
      app_role: ["athlete", "parent", "coach", "recruiter", "admin"],
      evaluation_status: ["pending", "in_progress", "completed"],
      payment_status: ["pending", "completed", "failed", "refunded"],
      subscription_plan: ["free", "annual", "monthly"],
    },
  },
} as const
