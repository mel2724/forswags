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
      admin_sessions: {
        Row: {
          admin_user_id: string
          created_at: string
          ended_at: string | null
          expires_at: string
          id: string
          impersonated_user_id: string
        }
        Insert: {
          admin_user_id: string
          created_at?: string
          ended_at?: string | null
          expires_at?: string
          id?: string
          impersonated_user_id: string
        }
        Update: {
          admin_user_id?: string
          created_at?: string
          ended_at?: string | null
          expires_at?: string
          id?: string
          impersonated_user_id?: string
        }
        Relationships: []
      }
      ai_usage_alerts: {
        Row: {
          alert_message: string
          alert_type: string
          created_at: string
          current_value: number
          id: string
          resolved: boolean | null
          resolved_at: string | null
          threshold_value: number
        }
        Insert: {
          alert_message: string
          alert_type: string
          created_at?: string
          current_value: number
          id?: string
          resolved?: boolean | null
          resolved_at?: string | null
          threshold_value: number
        }
        Update: {
          alert_message?: string
          alert_type?: string
          created_at?: string
          current_value?: number
          id?: string
          resolved?: boolean | null
          resolved_at?: string | null
          threshold_value?: number
        }
        Relationships: []
      }
      ai_usage_logs: {
        Row: {
          created_at: string
          error_message: string | null
          function_name: string
          id: string
          ip_address: string | null
          model_used: string
          request_type: string
          session_id: string | null
          status: string
          tokens_estimated: number | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          function_name: string
          id?: string
          ip_address?: string | null
          model_used: string
          request_type: string
          session_id?: string | null
          status: string
          tokens_estimated?: number | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          error_message?: string | null
          function_name?: string
          id?: string
          ip_address?: string | null
          model_used?: string
          request_type?: string
          session_id?: string | null
          status?: string
          tokens_estimated?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      alumni: {
        Row: {
          available_for_calls: boolean | null
          bio: string | null
          company: string | null
          created_at: string
          graduation_year: number
          id: string
          linkedin_url: string | null
          position: string | null
          professional_role: string | null
          school_id: string | null
          sport: string
          updated_at: string
          user_id: string
          willing_to_mentor: boolean | null
        }
        Insert: {
          available_for_calls?: boolean | null
          bio?: string | null
          company?: string | null
          created_at?: string
          graduation_year: number
          id?: string
          linkedin_url?: string | null
          position?: string | null
          professional_role?: string | null
          school_id?: string | null
          sport: string
          updated_at?: string
          user_id: string
          willing_to_mentor?: boolean | null
        }
        Update: {
          available_for_calls?: boolean | null
          bio?: string | null
          company?: string | null
          created_at?: string
          graduation_year?: number
          id?: string
          linkedin_url?: string | null
          position?: string | null
          professional_role?: string | null
          school_id?: string | null
          sport?: string
          updated_at?: string
          user_id?: string
          willing_to_mentor?: boolean | null
        }
        Relationships: []
      }
      alumni_connections: {
        Row: {
          alumni_id: string
          athlete_id: string
          created_at: string
          id: string
          message: string | null
          status: string
          updated_at: string
        }
        Insert: {
          alumni_id: string
          athlete_id: string
          created_at?: string
          id?: string
          message?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          alumni_id?: string
          athlete_id?: string
          created_at?: string
          id?: string
          message?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "alumni_connections_alumni_id_fkey"
            columns: ["alumni_id"]
            isOneToOne: false
            referencedRelation: "alumni"
            referencedColumns: ["id"]
          },
        ]
      }
      archived_media: {
        Row: {
          archived_at: string
          archived_reason: string
          athlete_id: string | null
          content_type: string | null
          file_name: string
          file_size: number | null
          id: string
          is_deleted: boolean | null
          media_type: string
          metadata: Json | null
          original_media_id: string
          replaced_by_media_id: string | null
          storage_bucket: string
          storage_path: string
          user_id: string
          version_number: number
        }
        Insert: {
          archived_at?: string
          archived_reason: string
          athlete_id?: string | null
          content_type?: string | null
          file_name: string
          file_size?: number | null
          id?: string
          is_deleted?: boolean | null
          media_type: string
          metadata?: Json | null
          original_media_id: string
          replaced_by_media_id?: string | null
          storage_bucket: string
          storage_path: string
          user_id: string
          version_number?: number
        }
        Update: {
          archived_at?: string
          archived_reason?: string
          athlete_id?: string | null
          content_type?: string | null
          file_name?: string
          file_size?: number | null
          id?: string
          is_deleted?: boolean | null
          media_type?: string
          metadata?: Json | null
          original_media_id?: string
          replaced_by_media_id?: string | null
          storage_bucket?: string
          storage_path?: string
          user_id?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "fk_original_media"
            columns: ["original_media_id"]
            isOneToOne: false
            referencedRelation: "media_assets"
            referencedColumns: ["id"]
          },
        ]
      }
      athlete_of_week: {
        Row: {
          athlete_id: string
          auto_generated: boolean | null
          created_at: string
          created_by: string | null
          generated_copy: string
          id: string
          selection_criteria: string
          selection_rationale: string
          suggested_hashtags: string[] | null
          week_end_date: string
          week_start_date: string
        }
        Insert: {
          athlete_id: string
          auto_generated?: boolean | null
          created_at?: string
          created_by?: string | null
          generated_copy: string
          id?: string
          selection_criteria: string
          selection_rationale: string
          suggested_hashtags?: string[] | null
          week_end_date: string
          week_start_date: string
        }
        Update: {
          athlete_id?: string
          auto_generated?: boolean | null
          created_at?: string
          created_by?: string | null
          generated_copy?: string
          id?: string
          selection_criteria?: string
          selection_rationale?: string
          suggested_hashtags?: string[] | null
          week_end_date?: string
          week_start_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "athlete_of_week_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
        ]
      }
      athlete_promotion_history: {
        Row: {
          athlete_id: string
          created_at: string
          id: string
          last_athlete_of_week: string | null
          last_featured_date: string | null
          total_features: number | null
          updated_at: string
        }
        Insert: {
          athlete_id: string
          created_at?: string
          id?: string
          last_athlete_of_week?: string | null
          last_featured_date?: string | null
          total_features?: number | null
          updated_at?: string
        }
        Update: {
          athlete_id?: string
          created_at?: string
          id?: string
          last_athlete_of_week?: string | null
          last_featured_date?: string | null
          total_features?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "athlete_promotion_history_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: true
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
        ]
      }
      athlete_stats: {
        Row: {
          athlete_id: string
          category: string | null
          created_at: string
          id: string
          is_highlighted: boolean | null
          metrics: Json | null
          season: string
          source: string | null
          stat_name: string
          stat_value: number
          unit: string | null
          updated_at: string
          verified: boolean | null
        }
        Insert: {
          athlete_id: string
          category?: string | null
          created_at?: string
          id?: string
          is_highlighted?: boolean | null
          metrics?: Json | null
          season: string
          source?: string | null
          stat_name: string
          stat_value: number
          unit?: string | null
          updated_at?: string
          verified?: boolean | null
        }
        Update: {
          athlete_id?: string
          category?: string | null
          created_at?: string
          id?: string
          is_highlighted?: boolean | null
          metrics?: Json | null
          season?: string
          source?: string | null
          stat_name?: string
          stat_value?: number
          unit?: string | null
          updated_at?: string
          verified?: boolean | null
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
          academic_achievements: string | null
          act_score: number | null
          analysis_notified_at: string | null
          analysis_requested_at: string | null
          athletic_awards: string[] | null
          being_recruited: boolean | null
          bench_press_max: number | null
          bio: string | null
          camps_attended: string[] | null
          challenges_overcome: string | null
          claim_token: string | null
          claim_token_expires_at: string | null
          club_team_name: string | null
          commitment_date: string | null
          commitment_status: string | null
          committed: boolean | null
          committed_school: string | null
          committed_school_id: string | null
          community_involvement: string | null
          consent_expires_at: string | null
          consent_ip_address: string | null
          consent_timestamp: string | null
          consent_verified_by: string | null
          converted_at: string | null
          converted_to_alumni: boolean | null
          created_at: string
          date_of_birth: string | null
          dominant_hand: string | null
          favorite_subject: string | null
          filled_out_by: string | null
          five_year_goals: string | null
          forty_yard_dash: number | null
          gpa: number | null
          graduation_year: number | null
          has_honors_ap_ib: boolean | null
          height_in: number | null
          high_school: string | null
          highlights_url: string | null
          honors_courses: string | null
          hudl_profile_url: string | null
          id: string
          import_batch_id: string | null
          imported_at: string | null
          instagram_handle: string | null
          is_imported: boolean | null
          is_parent_verified: boolean | null
          jersey_number: string | null
          key_stats: Json | null
          leadership_roles: string | null
          legal_situations: boolean | null
          legal_situations_explanation: string | null
          maxpreps_profile_url: string | null
          message_to_coaches: string | null
          motivation: string | null
          ncaa_eligibility_number: string | null
          nickname: string | null
          notable_performances: string | null
          offer_schools: string[] | null
          parent_email: string | null
          parent_id: string | null
          parent_verification_sent_at: string | null
          parent_verified_at: string | null
          personal_description: string | null
          position: string | null
          profile_claimed: boolean | null
          profile_completion_pct: number | null
          profile_photo_url: string | null
          public_profile_consent: boolean | null
          received_offers: boolean | null
          recruiting_schools: string[] | null
          role_model: string | null
          sat_score: number | null
          secondary_sports: string[] | null
          signing_day_date: string | null
          sport: string
          squat_max: number | null
          team_logo_url: string | null
          tier_based_visibility: boolean | null
          tiktok_handle: string | null
          twitter_handle: string | null
          upcoming_camps: string[] | null
          updated_at: string
          user_id: string
          username: string | null
          vertical_jump: number | null
          visibility: string | null
          weight_lb: number | null
        }
        Insert: {
          academic_achievements?: string | null
          act_score?: number | null
          analysis_notified_at?: string | null
          analysis_requested_at?: string | null
          athletic_awards?: string[] | null
          being_recruited?: boolean | null
          bench_press_max?: number | null
          bio?: string | null
          camps_attended?: string[] | null
          challenges_overcome?: string | null
          claim_token?: string | null
          claim_token_expires_at?: string | null
          club_team_name?: string | null
          commitment_date?: string | null
          commitment_status?: string | null
          committed?: boolean | null
          committed_school?: string | null
          committed_school_id?: string | null
          community_involvement?: string | null
          consent_expires_at?: string | null
          consent_ip_address?: string | null
          consent_timestamp?: string | null
          consent_verified_by?: string | null
          converted_at?: string | null
          converted_to_alumni?: boolean | null
          created_at?: string
          date_of_birth?: string | null
          dominant_hand?: string | null
          favorite_subject?: string | null
          filled_out_by?: string | null
          five_year_goals?: string | null
          forty_yard_dash?: number | null
          gpa?: number | null
          graduation_year?: number | null
          has_honors_ap_ib?: boolean | null
          height_in?: number | null
          high_school?: string | null
          highlights_url?: string | null
          honors_courses?: string | null
          hudl_profile_url?: string | null
          id?: string
          import_batch_id?: string | null
          imported_at?: string | null
          instagram_handle?: string | null
          is_imported?: boolean | null
          is_parent_verified?: boolean | null
          jersey_number?: string | null
          key_stats?: Json | null
          leadership_roles?: string | null
          legal_situations?: boolean | null
          legal_situations_explanation?: string | null
          maxpreps_profile_url?: string | null
          message_to_coaches?: string | null
          motivation?: string | null
          ncaa_eligibility_number?: string | null
          nickname?: string | null
          notable_performances?: string | null
          offer_schools?: string[] | null
          parent_email?: string | null
          parent_id?: string | null
          parent_verification_sent_at?: string | null
          parent_verified_at?: string | null
          personal_description?: string | null
          position?: string | null
          profile_claimed?: boolean | null
          profile_completion_pct?: number | null
          profile_photo_url?: string | null
          public_profile_consent?: boolean | null
          received_offers?: boolean | null
          recruiting_schools?: string[] | null
          role_model?: string | null
          sat_score?: number | null
          secondary_sports?: string[] | null
          signing_day_date?: string | null
          sport: string
          squat_max?: number | null
          team_logo_url?: string | null
          tier_based_visibility?: boolean | null
          tiktok_handle?: string | null
          twitter_handle?: string | null
          upcoming_camps?: string[] | null
          updated_at?: string
          user_id: string
          username?: string | null
          vertical_jump?: number | null
          visibility?: string | null
          weight_lb?: number | null
        }
        Update: {
          academic_achievements?: string | null
          act_score?: number | null
          analysis_notified_at?: string | null
          analysis_requested_at?: string | null
          athletic_awards?: string[] | null
          being_recruited?: boolean | null
          bench_press_max?: number | null
          bio?: string | null
          camps_attended?: string[] | null
          challenges_overcome?: string | null
          claim_token?: string | null
          claim_token_expires_at?: string | null
          club_team_name?: string | null
          commitment_date?: string | null
          commitment_status?: string | null
          committed?: boolean | null
          committed_school?: string | null
          committed_school_id?: string | null
          community_involvement?: string | null
          consent_expires_at?: string | null
          consent_ip_address?: string | null
          consent_timestamp?: string | null
          consent_verified_by?: string | null
          converted_at?: string | null
          converted_to_alumni?: boolean | null
          created_at?: string
          date_of_birth?: string | null
          dominant_hand?: string | null
          favorite_subject?: string | null
          filled_out_by?: string | null
          five_year_goals?: string | null
          forty_yard_dash?: number | null
          gpa?: number | null
          graduation_year?: number | null
          has_honors_ap_ib?: boolean | null
          height_in?: number | null
          high_school?: string | null
          highlights_url?: string | null
          honors_courses?: string | null
          hudl_profile_url?: string | null
          id?: string
          import_batch_id?: string | null
          imported_at?: string | null
          instagram_handle?: string | null
          is_imported?: boolean | null
          is_parent_verified?: boolean | null
          jersey_number?: string | null
          key_stats?: Json | null
          leadership_roles?: string | null
          legal_situations?: boolean | null
          legal_situations_explanation?: string | null
          maxpreps_profile_url?: string | null
          message_to_coaches?: string | null
          motivation?: string | null
          ncaa_eligibility_number?: string | null
          nickname?: string | null
          notable_performances?: string | null
          offer_schools?: string[] | null
          parent_email?: string | null
          parent_id?: string | null
          parent_verification_sent_at?: string | null
          parent_verified_at?: string | null
          personal_description?: string | null
          position?: string | null
          profile_claimed?: boolean | null
          profile_completion_pct?: number | null
          profile_photo_url?: string | null
          public_profile_consent?: boolean | null
          received_offers?: boolean | null
          recruiting_schools?: string[] | null
          role_model?: string | null
          sat_score?: number | null
          secondary_sports?: string[] | null
          signing_day_date?: string | null
          sport?: string
          squat_max?: number | null
          team_logo_url?: string | null
          tier_based_visibility?: boolean | null
          tiktok_handle?: string | null
          twitter_handle?: string | null
          upcoming_camps?: string[] | null
          updated_at?: string
          user_id?: string
          username?: string | null
          vertical_jump?: number | null
          visibility?: string | null
          weight_lb?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "athletes_committed_school_id_fkey"
            columns: ["committed_school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "athletes_user_id_profiles_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          id: string
          ip_address: string | null
          metadata: Json | null
          resource_id: string | null
          resource_type: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          resource_id?: string | null
          resource_type: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          resource_id?: string | null
          resource_type?: string
          user_agent?: string | null
          user_id?: string | null
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
      chat_conversations: {
        Row: {
          id: string
          last_message_at: string | null
          nickname: string | null
          session_id: string
          started_at: string | null
          user_id: string | null
        }
        Insert: {
          id?: string
          last_message_at?: string | null
          nickname?: string | null
          session_id: string
          started_at?: string | null
          user_id?: string | null
        }
        Update: {
          id?: string
          last_message_at?: string | null
          nickname?: string | null
          session_id?: string
          started_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string | null
          id: string
          role: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string | null
          id?: string
          role: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string | null
          id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chat_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      chatbot_config: {
        Row: {
          coach_name: string
          id: string
          knowledge_base: string | null
          personality_traits: Json | null
          sports_nicknames: string[] | null
          system_prompt: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          coach_name?: string
          id?: string
          knowledge_base?: string | null
          personality_traits?: Json | null
          sports_nicknames?: string[] | null
          system_prompt?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          coach_name?: string
          id?: string
          knowledge_base?: string | null
          personality_traits?: Json | null
          sports_nicknames?: string[] | null
          system_prompt?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      coach_applications: {
        Row: {
          admin_notes: string | null
          certifications: string | null
          coaching_background: string
          created_at: string
          email: string
          experience_years: number | null
          facebook_handle: string | null
          full_name: string
          id: string
          instagram_handle: string | null
          phone: string | null
          resume_url: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          specializations: string[] | null
          status: string
          tiktok_handle: string | null
          twitter_handle: string | null
          updated_at: string
          why_mentor: string
        }
        Insert: {
          admin_notes?: string | null
          certifications?: string | null
          coaching_background: string
          created_at?: string
          email: string
          experience_years?: number | null
          facebook_handle?: string | null
          full_name: string
          id?: string
          instagram_handle?: string | null
          phone?: string | null
          resume_url?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          specializations?: string[] | null
          status?: string
          tiktok_handle?: string | null
          twitter_handle?: string | null
          updated_at?: string
          why_mentor: string
        }
        Update: {
          admin_notes?: string | null
          certifications?: string | null
          coaching_background?: string
          created_at?: string
          email?: string
          experience_years?: number | null
          facebook_handle?: string | null
          full_name?: string
          id?: string
          instagram_handle?: string | null
          phone?: string | null
          resume_url?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          specializations?: string[] | null
          status?: string
          tiktok_handle?: string | null
          twitter_handle?: string | null
          updated_at?: string
          why_mentor?: string
        }
        Relationships: []
      }
      coach_contacts: {
        Row: {
          athlete_id: string
          coach_email: string | null
          coach_name: string
          coach_phone: string | null
          coach_type: string
          created_at: string
          id: string
          system_coach_id: string | null
          updated_at: string
        }
        Insert: {
          athlete_id: string
          coach_email?: string | null
          coach_name: string
          coach_phone?: string | null
          coach_type: string
          created_at?: string
          id?: string
          system_coach_id?: string | null
          updated_at?: string
        }
        Update: {
          athlete_id?: string
          coach_email?: string | null
          coach_name?: string
          coach_phone?: string | null
          coach_type?: string
          created_at?: string
          id?: string
          system_coach_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "coach_contacts_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coach_contacts_system_coach_id_fkey"
            columns: ["system_coach_id"]
            isOneToOne: false
            referencedRelation: "coach_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      coach_profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          certifications: string | null
          created_at: string
          experience_years: number | null
          full_name: string
          id: string
          is_active: boolean | null
          specializations: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          certifications?: string | null
          created_at?: string
          experience_years?: number | null
          full_name: string
          id?: string
          is_active?: boolean | null
          specializations?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          certifications?: string | null
          created_at?: string
          experience_years?: number | null
          full_name?: string
          id?: string
          is_active?: boolean | null
          specializations?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      college_match_prefs: {
        Row: {
          academic_priorities: string[] | null
          academic_support_needed: boolean | null
          athlete_id: string
          athletic_scholarships_important: boolean | null
          backup_career_plan: string | null
          campus_culture_important: boolean | null
          campus_setting_preference: string | null
          competition_level: string | null
          consider_private_schools: boolean | null
          conversation_completed: boolean | null
          conversation_data: Json | null
          created_at: string
          current_gpa: number | null
          current_stats: string | null
          fafsa_eligible: boolean | null
          faith_based_preference: boolean | null
          financial_aid_needed: boolean | null
          id: string
          location_preference: string | null
          major_interests: string | null
          max_distance_miles: number | null
          max_enrollment: number | null
          max_tuition: number | null
          min_enrollment: number | null
          playing_time_preference: string | null
          position: string | null
          preferred_divisions: string[] | null
          preferred_states: string[] | null
          prestige_important: boolean | null
          school_focus_preference: string | null
          school_size_preference: string | null
          sport: string | null
          test_scores: string | null
          updated_at: string
          weather_preference: string | null
          willing_to_work: boolean | null
        }
        Insert: {
          academic_priorities?: string[] | null
          academic_support_needed?: boolean | null
          athlete_id: string
          athletic_scholarships_important?: boolean | null
          backup_career_plan?: string | null
          campus_culture_important?: boolean | null
          campus_setting_preference?: string | null
          competition_level?: string | null
          consider_private_schools?: boolean | null
          conversation_completed?: boolean | null
          conversation_data?: Json | null
          created_at?: string
          current_gpa?: number | null
          current_stats?: string | null
          fafsa_eligible?: boolean | null
          faith_based_preference?: boolean | null
          financial_aid_needed?: boolean | null
          id?: string
          location_preference?: string | null
          major_interests?: string | null
          max_distance_miles?: number | null
          max_enrollment?: number | null
          max_tuition?: number | null
          min_enrollment?: number | null
          playing_time_preference?: string | null
          position?: string | null
          preferred_divisions?: string[] | null
          preferred_states?: string[] | null
          prestige_important?: boolean | null
          school_focus_preference?: string | null
          school_size_preference?: string | null
          sport?: string | null
          test_scores?: string | null
          updated_at?: string
          weather_preference?: string | null
          willing_to_work?: boolean | null
        }
        Update: {
          academic_priorities?: string[] | null
          academic_support_needed?: boolean | null
          athlete_id?: string
          athletic_scholarships_important?: boolean | null
          backup_career_plan?: string | null
          campus_culture_important?: boolean | null
          campus_setting_preference?: string | null
          competition_level?: string | null
          consider_private_schools?: boolean | null
          conversation_completed?: boolean | null
          conversation_data?: Json | null
          created_at?: string
          current_gpa?: number | null
          current_stats?: string | null
          fafsa_eligible?: boolean | null
          faith_based_preference?: boolean | null
          financial_aid_needed?: boolean | null
          id?: string
          location_preference?: string | null
          major_interests?: string | null
          max_distance_miles?: number | null
          max_enrollment?: number | null
          max_tuition?: number | null
          min_enrollment?: number | null
          playing_time_preference?: string | null
          position?: string | null
          preferred_divisions?: string[] | null
          preferred_states?: string[] | null
          prestige_important?: boolean | null
          school_focus_preference?: string | null
          school_size_preference?: string | null
          sport?: string | null
          test_scores?: string | null
          updated_at?: string
          weather_preference?: string | null
          willing_to_work?: boolean | null
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
          generated_at: string | null
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
          generated_at?: string | null
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
          generated_at?: string | null
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
      college_offers: {
        Row: {
          athlete_id: string
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          created_at: string
          documents: Json | null
          id: string
          negotiation_notes: string | null
          notes: string | null
          offer_date: string
          offer_type: string
          response_deadline: string | null
          scholarship_amount: number | null
          school_id: string
          status: string
          updated_at: string
        }
        Insert: {
          athlete_id: string
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          documents?: Json | null
          id?: string
          negotiation_notes?: string | null
          notes?: string | null
          offer_date?: string
          offer_type: string
          response_deadline?: string | null
          scholarship_amount?: number | null
          school_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          athlete_id?: string
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          documents?: Json | null
          id?: string
          negotiation_notes?: string | null
          notes?: string | null
          offer_date?: string
          offer_type?: string
          response_deadline?: string | null
          scholarship_amount?: number | null
          school_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "college_offers_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      college_recommendations: {
        Row: {
          athlete_id: string
          created_at: string | null
          id: string
          recommendations: Json
          updated_at: string | null
        }
        Insert: {
          athlete_id: string
          created_at?: string | null
          id?: string
          recommendations: Json
          updated_at?: string | null
        }
        Update: {
          athlete_id?: string
          created_at?: string | null
          id?: string
          recommendations?: Json
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "college_recommendations_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: true
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
        ]
      }
      connected_accounts: {
        Row: {
          account_name: string
          connected_at: string
          encrypted_access_token: string
          encrypted_refresh_token: string | null
          expires_at: string | null
          id: string
          platform: string
          updated_at: string
          user_id: string
        }
        Insert: {
          account_name: string
          connected_at?: string
          encrypted_access_token: string
          encrypted_refresh_token?: string | null
          expires_at?: string | null
          id?: string
          platform: string
          updated_at?: string
          user_id: string
        }
        Update: {
          account_name?: string
          connected_at?: string
          encrypted_access_token?: string
          encrypted_refresh_token?: string | null
          expires_at?: string | null
          id?: string
          platform?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      consent_renewal_notifications: {
        Row: {
          athlete_id: string
          created_at: string
          email_sent_at: string | null
          expires_at: string
          id: string
          notification_type: string
          parent_email: string
          sent_at: string
        }
        Insert: {
          athlete_id: string
          created_at?: string
          email_sent_at?: string | null
          expires_at: string
          id?: string
          notification_type: string
          parent_email: string
          sent_at?: string
        }
        Update: {
          athlete_id?: string
          created_at?: string
          email_sent_at?: string | null
          expires_at?: string
          id?: string
          notification_type?: string
          parent_email?: string
          sent_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "consent_renewal_notifications_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_form_submissions: {
        Row: {
          email: string
          id: string
          ip_address: string
          submitted_at: string
          success: boolean | null
          user_agent: string | null
        }
        Insert: {
          email: string
          id?: string
          ip_address: string
          submitted_at?: string
          success?: boolean | null
          user_agent?: string | null
        }
        Update: {
          email?: string
          id?: string
          ip_address?: string
          submitted_at?: string
          success?: boolean | null
          user_agent?: string | null
        }
        Relationships: []
      }
      course_bookmarks: {
        Row: {
          content: string
          created_at: string | null
          id: string
          lesson_id: string
          timestamp_seconds: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          lesson_id: string
          timestamp_seconds?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          lesson_id?: string
          timestamp_seconds?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_bookmarks_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_bookmarks_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "playbook_video_analytics"
            referencedColumns: ["lesson_id"]
          },
        ]
      }
      course_certificates: {
        Row: {
          certificate_url: string | null
          course_id: string
          created_at: string | null
          id: string
          issued_at: string | null
          user_id: string
        }
        Insert: {
          certificate_url?: string | null
          course_id: string
          created_at?: string | null
          id?: string
          issued_at?: string | null
          user_id: string
        }
        Update: {
          certificate_url?: string | null
          course_id?: string
          created_at?: string | null
          id?: string
          issued_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_certificates_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      course_progress: {
        Row: {
          completed_at: string | null
          completed_lessons: Json | null
          course_id: string
          created_at: string | null
          id: string
          progress_percentage: number | null
          started_at: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          completed_lessons?: Json | null
          course_id: string
          created_at?: string | null
          id?: string
          progress_percentage?: number | null
          started_at?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          completed_lessons?: Json | null
          course_id?: string
          created_at?: string | null
          id?: string
          progress_percentage?: number | null
          started_at?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_progress_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
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
      data_export_requests: {
        Row: {
          completed_at: string | null
          created_at: string
          error_message: string | null
          expires_at: string | null
          export_url: string | null
          id: string
          status: string
          storage_path: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          expires_at?: string | null
          export_url?: string | null
          id?: string
          status?: string
          storage_path?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          expires_at?: string | null
          export_url?: string | null
          id?: string
          status?: string
          storage_path?: string | null
          user_id?: string
        }
        Relationships: []
      }
      email_engagement: {
        Row: {
          clicked_url: string | null
          created_at: string
          event_type: string
          id: string
          ip_address: string | null
          recipient_email: string
          scheduled_email_id: string
          user_agent: string | null
        }
        Insert: {
          clicked_url?: string | null
          created_at?: string
          event_type: string
          id?: string
          ip_address?: string | null
          recipient_email: string
          scheduled_email_id: string
          user_agent?: string | null
        }
        Update: {
          clicked_url?: string | null
          created_at?: string
          event_type?: string
          id?: string
          ip_address?: string | null
          recipient_email?: string
          scheduled_email_id?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_engagement_scheduled_email_id_fkey"
            columns: ["scheduled_email_id"]
            isOneToOne: false
            referencedRelation: "scheduled_emails"
            referencedColumns: ["id"]
          },
        ]
      }
      email_templates: {
        Row: {
          available_variables: Json | null
          content: string
          created_at: string
          description: string | null
          id: string
          subject: string
          template_key: string
          updated_at: string
        }
        Insert: {
          available_variables?: Json | null
          content: string
          created_at?: string
          description?: string | null
          id?: string
          subject: string
          template_key: string
          updated_at?: string
        }
        Update: {
          available_variables?: Json | null
          content?: string
          created_at?: string
          description?: string | null
          id?: string
          subject?: string
          template_key?: string
          updated_at?: string
        }
        Relationships: []
      }
      engagement_metrics: {
        Row: {
          action_type: string
          content_id: string
          content_type: string
          created_at: string
          id: string
          metadata: Json | null
          user_id: string
        }
        Insert: {
          action_type: string
          content_id: string
          content_type: string
          created_at?: string
          id?: string
          metadata?: Json | null
          user_id: string
        }
        Update: {
          action_type?: string
          content_id?: string
          content_type?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      evaluation_annotations: {
        Row: {
          annotation_type: string
          created_at: string
          data: Json
          evaluation_id: string
          id: string
          timestamp_ms: number
          updated_at: string
        }
        Insert: {
          annotation_type: string
          created_at?: string
          data: Json
          evaluation_id: string
          id?: string
          timestamp_ms: number
          updated_at?: string
        }
        Update: {
          annotation_type?: string
          created_at?: string
          data?: Json
          evaluation_id?: string
          id?: string
          timestamp_ms?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "evaluation_annotations_evaluation_id_fkey"
            columns: ["evaluation_id"]
            isOneToOne: false
            referencedRelation: "evaluations"
            referencedColumns: ["id"]
          },
        ]
      }
      evaluation_criteria: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          max_score: number
          name: string
          order_index: number
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          id?: string
          max_score?: number
          name: string
          order_index?: number
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          max_score?: number
          name?: string
          order_index?: number
        }
        Relationships: []
      }
      evaluations: {
        Row: {
          admin_assigned: boolean | null
          athlete_id: string
          cancellation_reason: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          claimed_at: string | null
          coach_id: string | null
          completed_at: string | null
          created_at: string
          feedback: string | null
          id: string
          is_reevaluation: boolean | null
          last_evaluation_date: string | null
          previous_evaluation_id: string | null
          purchased_at: string
          rating: number | null
          refund_id: string | null
          requested_coach_id: string | null
          scores: Json | null
          status: Database["public"]["Enums"]["evaluation_status"]
          stripe_payment_intent_id: string | null
          updated_at: string
          video_url: string | null
        }
        Insert: {
          admin_assigned?: boolean | null
          athlete_id: string
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          claimed_at?: string | null
          coach_id?: string | null
          completed_at?: string | null
          created_at?: string
          feedback?: string | null
          id?: string
          is_reevaluation?: boolean | null
          last_evaluation_date?: string | null
          previous_evaluation_id?: string | null
          purchased_at?: string
          rating?: number | null
          refund_id?: string | null
          requested_coach_id?: string | null
          scores?: Json | null
          status?: Database["public"]["Enums"]["evaluation_status"]
          stripe_payment_intent_id?: string | null
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          admin_assigned?: boolean | null
          athlete_id?: string
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          claimed_at?: string | null
          coach_id?: string | null
          completed_at?: string | null
          created_at?: string
          feedback?: string | null
          id?: string
          is_reevaluation?: boolean | null
          last_evaluation_date?: string | null
          previous_evaluation_id?: string | null
          purchased_at?: string
          rating?: number | null
          refund_id?: string | null
          requested_coach_id?: string | null
          scores?: Json | null
          status?: Database["public"]["Enums"]["evaluation_status"]
          stripe_payment_intent_id?: string | null
          updated_at?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "evaluations_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evaluations_previous_evaluation_id_fkey"
            columns: ["previous_evaluation_id"]
            isOneToOne: false
            referencedRelation: "evaluations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evaluations_refund_id_fkey"
            columns: ["refund_id"]
            isOneToOne: false
            referencedRelation: "refunds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evaluations_requested_coach_id_fkey"
            columns: ["requested_coach_id"]
            isOneToOne: false
            referencedRelation: "coach_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      external_rankings: {
        Row: {
          athlete_name: string
          commitment_date: string | null
          committed_school_logo_url: string | null
          committed_school_name: string | null
          created_at: string
          external_athlete_id: string | null
          graduation_year: number | null
          height_feet: number | null
          height_inches: number | null
          high_school: string | null
          id: string
          image_url: string | null
          last_updated: string
          overall_rank: number | null
          position: string | null
          position_rank: number | null
          profile_url: string | null
          rating: number | null
          source: string
          sport: string
          state: string | null
          state_rank: number | null
          weight: number | null
        }
        Insert: {
          athlete_name: string
          commitment_date?: string | null
          committed_school_logo_url?: string | null
          committed_school_name?: string | null
          created_at?: string
          external_athlete_id?: string | null
          graduation_year?: number | null
          height_feet?: number | null
          height_inches?: number | null
          high_school?: string | null
          id?: string
          image_url?: string | null
          last_updated?: string
          overall_rank?: number | null
          position?: string | null
          position_rank?: number | null
          profile_url?: string | null
          rating?: number | null
          source: string
          sport: string
          state?: string | null
          state_rank?: number | null
          weight?: number | null
        }
        Update: {
          athlete_name?: string
          commitment_date?: string | null
          committed_school_logo_url?: string | null
          committed_school_name?: string | null
          created_at?: string
          external_athlete_id?: string | null
          graduation_year?: number | null
          height_feet?: number | null
          height_inches?: number | null
          high_school?: string | null
          id?: string
          image_url?: string | null
          last_updated?: string
          overall_rank?: number | null
          position?: string | null
          position_rank?: number | null
          profile_url?: string | null
          rating?: number | null
          source?: string
          sport?: string
          state?: string | null
          state_rank?: number | null
          weight?: number | null
        }
        Relationships: []
      }
      hashtag_performance: {
        Row: {
          clicks: number | null
          created_at: string | null
          engagements: number | null
          hashtag: string
          id: string
          impressions: number | null
          last_used_at: string | null
          platform: string
          post_id: string | null
          used_count: number | null
          user_id: string
        }
        Insert: {
          clicks?: number | null
          created_at?: string | null
          engagements?: number | null
          hashtag: string
          id?: string
          impressions?: number | null
          last_used_at?: string | null
          platform: string
          post_id?: string | null
          used_count?: number | null
          user_id: string
        }
        Update: {
          clicks?: number | null
          created_at?: string | null
          engagements?: number | null
          hashtag?: string
          id?: string
          impressions?: number | null
          last_used_at?: string | null
          platform?: string
          post_id?: string | null
          used_count?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hashtag_performance_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "scheduled_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_quizzes: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          lesson_id: string
          passing_score: number | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          lesson_id: string
          passing_score?: number | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          lesson_id?: string
          passing_score?: number | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lesson_quizzes_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_quizzes_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "playbook_video_analytics"
            referencedColumns: ["lesson_id"]
          },
        ]
      }
      lessons: {
        Row: {
          content: string | null
          created_at: string
          description: string | null
          duration_minutes: number | null
          external_link: string | null
          id: string
          is_scorm_content: boolean | null
          module_id: string
          order_index: number
          scorm_package_url: string | null
          scorm_version: string | null
          thumbnail_url: string | null
          title: string
          updated_at: string
          video_url: string | null
          view_count: number | null
        }
        Insert: {
          content?: string | null
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          external_link?: string | null
          id?: string
          is_scorm_content?: boolean | null
          module_id: string
          order_index: number
          scorm_package_url?: string | null
          scorm_version?: string | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          video_url?: string | null
          view_count?: number | null
        }
        Update: {
          content?: string | null
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          external_link?: string | null
          id?: string
          is_scorm_content?: boolean | null
          module_id?: string
          order_index?: number
          scorm_package_url?: string | null
          scorm_version?: string | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          video_url?: string | null
          view_count?: number | null
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
          archived_at: string | null
          athlete_id: string | null
          created_at: string
          description: string | null
          display_order: number | null
          file_size: number | null
          id: string
          is_archived: boolean | null
          media_type: string
          season: string | null
          thumbnail_url: string | null
          title: string
          updated_at: string
          url: string
          user_id: string
          version_number: number | null
        }
        Insert: {
          archived_at?: string | null
          athlete_id?: string | null
          created_at?: string
          description?: string | null
          display_order?: number | null
          file_size?: number | null
          id?: string
          is_archived?: boolean | null
          media_type: string
          season?: string | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          url: string
          user_id: string
          version_number?: number | null
        }
        Update: {
          archived_at?: string | null
          athlete_id?: string | null
          created_at?: string
          description?: string | null
          display_order?: number | null
          file_size?: number | null
          id?: string
          is_archived?: boolean | null
          media_type?: string
          season?: string | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          url?: string
          user_id?: string
          version_number?: number | null
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
      membership_renewal_reminders: {
        Row: {
          created_at: string
          id: string
          membership_id: string
          reminder_type: string
          sent_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          membership_id: string
          reminder_type: string
          sent_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          membership_id?: string
          reminder_type?: string
          sent_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "membership_renewal_reminders_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: false
            referencedRelation: "memberships"
            referencedColumns: ["id"]
          },
        ]
      }
      memberships: {
        Row: {
          archived_data: Json | null
          auto_renew: boolean | null
          billing_interval: string | null
          created_at: string
          downgraded_at: string | null
          end_date: string | null
          id: string
          payment_failed_at: string | null
          plan: Database["public"]["Enums"]["subscription_plan"]
          start_date: string
          status: string
          stripe_subscription_id: string | null
          tier: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          archived_data?: Json | null
          auto_renew?: boolean | null
          billing_interval?: string | null
          created_at?: string
          downgraded_at?: string | null
          end_date?: string | null
          id?: string
          payment_failed_at?: string | null
          plan?: Database["public"]["Enums"]["subscription_plan"]
          start_date?: string
          status?: string
          stripe_subscription_id?: string | null
          tier?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          archived_data?: Json | null
          auto_renew?: boolean | null
          billing_interval?: string | null
          created_at?: string
          downgraded_at?: string | null
          end_date?: string | null
          id?: string
          payment_failed_at?: string | null
          plan?: Database["public"]["Enums"]["subscription_plan"]
          start_date?: string
          status?: string
          stripe_subscription_id?: string | null
          tier?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      mfa_backup_codes: {
        Row: {
          code_hash: string
          created_at: string
          id: string
          used_at: string | null
          user_id: string
        }
        Insert: {
          code_hash: string
          created_at?: string
          id?: string
          used_at?: string | null
          user_id: string
        }
        Update: {
          code_hash?: string
          created_at?: string
          id?: string
          used_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      module_certificates: {
        Row: {
          certificate_url: string | null
          course_id: string
          created_at: string
          emailed_at: string | null
          id: string
          issued_at: string
          module_id: string
          user_id: string
        }
        Insert: {
          certificate_url?: string | null
          course_id: string
          created_at?: string
          emailed_at?: string | null
          id?: string
          issued_at?: string
          module_id: string
          user_id: string
        }
        Update: {
          certificate_url?: string | null
          course_id?: string
          created_at?: string
          emailed_at?: string | null
          id?: string
          issued_at?: string
          module_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "module_certificates_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "module_certificates_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
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
      next_steps_tasks: {
        Row: {
          completed_at: string
          created_at: string
          id: string
          task_key: string
          user_id: string
        }
        Insert: {
          completed_at?: string
          created_at?: string
          id?: string
          task_key: string
          user_id: string
        }
        Update: {
          completed_at?: string
          created_at?: string
          id?: string
          task_key?: string
          user_id?: string
        }
        Relationships: []
      }
      notification_campaigns: {
        Row: {
          campaign_id: string
          clicked_count: number | null
          created_at: string | null
          id: string
          link: string | null
          message: string
          sent_at: string | null
          sent_count: number | null
          target_user_types: string[]
          title: string
          type: string
          viewed_count: number | null
        }
        Insert: {
          campaign_id: string
          clicked_count?: number | null
          created_at?: string | null
          id?: string
          link?: string | null
          message: string
          sent_at?: string | null
          sent_count?: number | null
          target_user_types: string[]
          title: string
          type: string
          viewed_count?: number | null
        }
        Update: {
          campaign_id?: string
          clicked_count?: number | null
          created_at?: string | null
          id?: string
          link?: string | null
          message?: string
          sent_at?: string | null
          sent_count?: number | null
          target_user_types?: string[]
          title?: string
          type?: string
          viewed_count?: number | null
        }
        Relationships: []
      }
      notification_prefs: {
        Row: {
          channel: string
          created_at: string
          id: string
          payload: Json | null
          status: string | null
          template_key: string
          updated_at: string
          user_id: string
        }
        Insert: {
          channel?: string
          created_at?: string
          id?: string
          payload?: Json | null
          status?: string | null
          template_key: string
          updated_at?: string
          user_id: string
        }
        Update: {
          channel?: string
          created_at?: string
          id?: string
          payload?: Json | null
          status?: string | null
          template_key?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          campaign_id: string | null
          clicked_at: string | null
          created_at: string
          id: string
          is_read: boolean | null
          link: string | null
          message: string
          title: string
          type: string
          user_id: string
          viewed_at: string | null
        }
        Insert: {
          campaign_id?: string | null
          clicked_at?: string | null
          created_at?: string
          id?: string
          is_read?: boolean | null
          link?: string | null
          message: string
          title: string
          type: string
          user_id: string
          viewed_at?: string | null
        }
        Update: {
          campaign_id?: string | null
          clicked_at?: string | null
          created_at?: string
          id?: string
          is_read?: boolean | null
          link?: string | null
          message?: string
          title?: string
          type?: string
          user_id?: string
          viewed_at?: string | null
        }
        Relationships: []
      }
      oauth_state: {
        Row: {
          code_verifier: string
          created_at: string
          id: string
          platform: string
          user_id: string
        }
        Insert: {
          code_verifier: string
          created_at?: string
          id?: string
          platform: string
          user_id: string
        }
        Update: {
          code_verifier?: string
          created_at?: string
          id?: string
          platform?: string
          user_id?: string
        }
        Relationships: []
      }
      parent_guardians: {
        Row: {
          athlete_id: string
          created_at: string
          id: string
          parent_email: string | null
          parent_name: string
          parent_phone: string | null
          relationship: string | null
          updated_at: string
        }
        Insert: {
          athlete_id: string
          created_at?: string
          id?: string
          parent_email?: string | null
          parent_name: string
          parent_phone?: string | null
          relationship?: string | null
          updated_at?: string
        }
        Update: {
          athlete_id?: string
          created_at?: string
          id?: string
          parent_email?: string | null
          parent_name?: string
          parent_phone?: string | null
          relationship?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "parent_guardians_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
        ]
      }
      parent_verifications: {
        Row: {
          athlete_id: string | null
          created_at: string | null
          expires_at: string | null
          id: string
          ip_address: string | null
          parent_email: string
          user_id: string | null
          verification_code: string
          verified_at: string | null
        }
        Insert: {
          athlete_id?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          ip_address?: string | null
          parent_email: string
          user_id?: string | null
          verification_code: string
          verified_at?: string | null
        }
        Update: {
          athlete_id?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          ip_address?: string | null
          parent_email?: string
          user_id?: string | null
          verification_code?: string
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "parent_verifications_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
        ]
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
      playbook_video_views: {
        Row: {
          completed: boolean | null
          created_at: string
          id: string
          ip_address: string | null
          lesson_id: string
          user_agent: string | null
          user_id: string | null
          viewed_at: string
          watch_duration_seconds: number | null
        }
        Insert: {
          completed?: boolean | null
          created_at?: string
          id?: string
          ip_address?: string | null
          lesson_id: string
          user_agent?: string | null
          user_id?: string | null
          viewed_at?: string
          watch_duration_seconds?: number | null
        }
        Update: {
          completed?: boolean | null
          created_at?: string
          id?: string
          ip_address?: string | null
          lesson_id?: string
          user_agent?: string | null
          user_id?: string | null
          viewed_at?: string
          watch_duration_seconds?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "playbook_video_views_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "playbook_video_views_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "playbook_video_analytics"
            referencedColumns: ["lesson_id"]
          },
        ]
      }
      post_platforms: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          platform: string
          platform_post_id: string | null
          post_id: string
          posted: boolean
          posted_at: string | null
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          platform: string
          platform_post_id?: string | null
          post_id: string
          posted?: boolean
          posted_at?: string | null
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          platform?: string
          platform_post_id?: string | null
          post_id?: string
          posted?: boolean
          posted_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "post_platforms_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "social_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_templates: {
        Row: {
          content_template: string
          created_at: string | null
          description: string | null
          graphic_config: Json | null
          id: string
          is_public: boolean | null
          name: string
          platform: string | null
          suggested_hashtags: string[] | null
          template_type: string
          updated_at: string | null
          usage_count: number | null
          user_id: string | null
        }
        Insert: {
          content_template: string
          created_at?: string | null
          description?: string | null
          graphic_config?: Json | null
          id?: string
          is_public?: boolean | null
          name: string
          platform?: string | null
          suggested_hashtags?: string[] | null
          template_type: string
          updated_at?: string | null
          usage_count?: number | null
          user_id?: string | null
        }
        Update: {
          content_template?: string
          created_at?: string | null
          description?: string | null
          graphic_config?: Json | null
          id?: string
          is_public?: boolean | null
          name?: string
          platform?: string | null
          suggested_hashtags?: string[] | null
          template_type?: string
          updated_at?: string | null
          usage_count?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      profile_views: {
        Row: {
          athlete_id: string
          created_at: string
          id: string
          referrer: string | null
          session_id: string | null
          viewed_at: string
          viewer_id: string
          viewer_type: string
        }
        Insert: {
          athlete_id: string
          created_at?: string
          id?: string
          referrer?: string | null
          session_id?: string | null
          viewed_at?: string
          viewer_id: string
          viewer_type: string
        }
        Update: {
          athlete_id?: string
          created_at?: string
          id?: string
          referrer?: string | null
          session_id?: string | null
          viewed_at?: string
          viewer_id?: string
          viewer_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_views_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          archive_reason: string | null
          archived_at: string | null
          archived_by: string | null
          archived_data: Json | null
          avatar_url: string | null
          city: string | null
          country: string | null
          created_at: string
          date_of_birth: string | null
          email: string
          first_name: string | null
          full_name: string | null
          gender: string | null
          id: string
          is_archived: boolean | null
          last_name: string | null
          notify_on_profile_views: boolean | null
          phone: string | null
          privacy_accepted: boolean
          privacy_accepted_at: string | null
          state: string | null
          terms_accepted: boolean
          terms_accepted_at: string | null
          tutorial_completed: boolean | null
          tutorial_progress: Json | null
          updated_at: string
        }
        Insert: {
          archive_reason?: string | null
          archived_at?: string | null
          archived_by?: string | null
          archived_data?: Json | null
          avatar_url?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          date_of_birth?: string | null
          email: string
          first_name?: string | null
          full_name?: string | null
          gender?: string | null
          id: string
          is_archived?: boolean | null
          last_name?: string | null
          notify_on_profile_views?: boolean | null
          phone?: string | null
          privacy_accepted?: boolean
          privacy_accepted_at?: string | null
          state?: string | null
          terms_accepted?: boolean
          terms_accepted_at?: string | null
          tutorial_completed?: boolean | null
          tutorial_progress?: Json | null
          updated_at?: string
        }
        Update: {
          archive_reason?: string | null
          archived_at?: string | null
          archived_by?: string | null
          archived_data?: Json | null
          avatar_url?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          date_of_birth?: string | null
          email?: string
          first_name?: string | null
          full_name?: string | null
          gender?: string | null
          id?: string
          is_archived?: boolean | null
          last_name?: string | null
          notify_on_profile_views?: boolean | null
          phone?: string | null
          privacy_accepted?: boolean
          privacy_accepted_at?: string | null
          state?: string | null
          terms_accepted?: boolean
          terms_accepted_at?: string | null
          tutorial_completed?: boolean | null
          tutorial_progress?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      promo_code_usage: {
        Row: {
          discount_amount: number
          id: string
          promo_code_id: string
          stripe_subscription_id: string | null
          used_at: string
          user_id: string
        }
        Insert: {
          discount_amount: number
          id?: string
          promo_code_id: string
          stripe_subscription_id?: string | null
          used_at?: string
          user_id: string
        }
        Update: {
          discount_amount?: number
          id?: string
          promo_code_id?: string
          stripe_subscription_id?: string | null
          used_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "promo_code_usage_promo_code_id_fkey"
            columns: ["promo_code_id"]
            isOneToOne: false
            referencedRelation: "promo_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      promo_codes: {
        Row: {
          applicable_products: Json
          code: string
          created_at: string
          created_by: string | null
          discount_type: string
          discount_value: number
          id: string
          is_active: boolean
          max_uses: number | null
          times_used: number
          updated_at: string
          valid_from: string
          valid_until: string | null
        }
        Insert: {
          applicable_products?: Json
          code: string
          created_at?: string
          created_by?: string | null
          discount_type: string
          discount_value: number
          id?: string
          is_active?: boolean
          max_uses?: number | null
          times_used?: number
          updated_at?: string
          valid_from?: string
          valid_until?: string | null
        }
        Update: {
          applicable_products?: Json
          code?: string
          created_at?: string
          created_by?: string | null
          discount_type?: string
          discount_value?: number
          id?: string
          is_active?: boolean
          max_uses?: number | null
          times_used?: number
          updated_at?: string
          valid_from?: string
          valid_until?: string | null
        }
        Relationships: []
      }
      questions: {
        Row: {
          correct_answer: string
          created_at: string
          explanation: string | null
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
          explanation?: string | null
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
          explanation?: string | null
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
            referencedRelation: "lesson_quizzes"
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
          {
            foreignKeyName: "quizzes_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: true
            referencedRelation: "playbook_video_analytics"
            referencedColumns: ["lesson_id"]
          },
        ]
      }
      rankings: {
        Row: {
          athlete_id: string | null
          composite_score: number | null
          created_at: string
          external_athlete_name: string | null
          graduation_year: number | null
          id: string
          is_external_only: boolean | null
          is_manual_override: boolean | null
          last_calculated: string
          national_rank: number | null
          overall_rank: number | null
          overridden_at: string | null
          overridden_by: string | null
          override_reason: string | null
          position_rank: number | null
          sport: string | null
          state_rank: number | null
          updated_at: string
        }
        Insert: {
          athlete_id?: string | null
          composite_score?: number | null
          created_at?: string
          external_athlete_name?: string | null
          graduation_year?: number | null
          id?: string
          is_external_only?: boolean | null
          is_manual_override?: boolean | null
          last_calculated?: string
          national_rank?: number | null
          overall_rank?: number | null
          overridden_at?: string | null
          overridden_by?: string | null
          override_reason?: string | null
          position_rank?: number | null
          sport?: string | null
          state_rank?: number | null
          updated_at?: string
        }
        Update: {
          athlete_id?: string | null
          composite_score?: number | null
          created_at?: string
          external_athlete_name?: string | null
          graduation_year?: number | null
          id?: string
          is_external_only?: boolean | null
          is_manual_override?: boolean | null
          last_calculated?: string
          national_rank?: number | null
          overall_rank?: number | null
          overridden_at?: string | null
          overridden_by?: string | null
          override_reason?: string | null
          position_rank?: number | null
          sport?: string | null
          state_rank?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rankings_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: true
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
        ]
      }
      recruiter_profiles: {
        Row: {
          created_at: string
          division: string | null
          id: string
          notes: string | null
          primary_positions: string[] | null
          school_name: string
          sport: string | null
          states_focus: string[] | null
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          division?: string | null
          id?: string
          notes?: string | null
          primary_positions?: string[] | null
          school_name: string
          sport?: string | null
          states_focus?: string[] | null
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          division?: string | null
          id?: string
          notes?: string | null
          primary_positions?: string[] | null
          school_name?: string
          sport?: string | null
          states_focus?: string[] | null
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      refunds: {
        Row: {
          amount: number
          created_at: string
          id: string
          processed_by: string | null
          reason: string | null
          status: string
          stripe_payment_intent_id: string
          stripe_refund_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          processed_by?: string | null
          reason?: string | null
          status?: string
          stripe_payment_intent_id: string
          stripe_refund_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          processed_by?: string | null
          reason?: string | null
          status?: string
          stripe_payment_intent_id?: string
          stripe_refund_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      saved_searches: {
        Row: {
          created_at: string
          filters: Json
          id: string
          name: string
          sort: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          filters: Json
          id?: string
          name: string
          sort?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          filters?: Json
          id?: string
          name?: string
          sort?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      scheduled_emails: {
        Row: {
          click_count: number | null
          created_at: string
          created_by: string
          error_message: string | null
          failed_count: number | null
          id: string
          include_inactive: boolean | null
          message: string
          open_count: number | null
          recipient_count: number | null
          recipient_type: string
          scheduled_for: string
          sent_at: string | null
          status: string
          subject: string
          success_count: number | null
          unique_clicks: number | null
          unique_opens: number | null
          updated_at: string
        }
        Insert: {
          click_count?: number | null
          created_at?: string
          created_by: string
          error_message?: string | null
          failed_count?: number | null
          id?: string
          include_inactive?: boolean | null
          message: string
          open_count?: number | null
          recipient_count?: number | null
          recipient_type?: string
          scheduled_for: string
          sent_at?: string | null
          status?: string
          subject: string
          success_count?: number | null
          unique_clicks?: number | null
          unique_opens?: number | null
          updated_at?: string
        }
        Update: {
          click_count?: number | null
          created_at?: string
          created_by?: string
          error_message?: string | null
          failed_count?: number | null
          id?: string
          include_inactive?: boolean | null
          message?: string
          open_count?: number | null
          recipient_count?: number | null
          recipient_type?: string
          scheduled_for?: string
          sent_at?: string | null
          status?: string
          subject?: string
          success_count?: number | null
          unique_clicks?: number | null
          unique_opens?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      scheduled_posts: {
        Row: {
          account_id: string | null
          content: string
          created_at: string | null
          error_message: string | null
          hashtags: string[] | null
          id: string
          media_url: string | null
          platforms: string[]
          posted_at: string | null
          scheduled_for: string
          status: string
          template_type: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          account_id?: string | null
          content: string
          created_at?: string | null
          error_message?: string | null
          hashtags?: string[] | null
          id?: string
          media_url?: string | null
          platforms?: string[]
          posted_at?: string | null
          scheduled_for: string
          status?: string
          template_type?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          account_id?: string | null
          content?: string
          created_at?: string | null
          error_message?: string | null
          hashtags?: string[] | null
          id?: string
          media_url?: string | null
          platforms?: string[]
          posted_at?: string | null
          scheduled_for?: string
          status?: string
          template_type?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_posts_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "social_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      schools: {
        Row: {
          acceptance_rate: number | null
          athletic_website_url: string | null
          avg_act: number | null
          avg_gpa: number | null
          avg_sat: number | null
          coach_email: string | null
          coach_name: string | null
          conference: string | null
          contact_email: string | null
          created_at: string
          division: string | null
          email_verified_source_url: string | null
          enrollment: number | null
          id: string
          location_city: string | null
          location_state: string | null
          logo_cache_updated: string | null
          logo_url: string | null
          majors: string | null
          min_gpa: number | null
          name: string
          roster_needs: string | null
          school_size: string | null
          social_links: string | null
          staff_directory_url: string | null
          tuition: number | null
          tuition_estimate: number | null
          updated_at: string
          website_url: string | null
        }
        Insert: {
          acceptance_rate?: number | null
          athletic_website_url?: string | null
          avg_act?: number | null
          avg_gpa?: number | null
          avg_sat?: number | null
          coach_email?: string | null
          coach_name?: string | null
          conference?: string | null
          contact_email?: string | null
          created_at?: string
          division?: string | null
          email_verified_source_url?: string | null
          enrollment?: number | null
          id?: string
          location_city?: string | null
          location_state?: string | null
          logo_cache_updated?: string | null
          logo_url?: string | null
          majors?: string | null
          min_gpa?: number | null
          name: string
          roster_needs?: string | null
          school_size?: string | null
          social_links?: string | null
          staff_directory_url?: string | null
          tuition?: number | null
          tuition_estimate?: number | null
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          acceptance_rate?: number | null
          athletic_website_url?: string | null
          avg_act?: number | null
          avg_gpa?: number | null
          avg_sat?: number | null
          coach_email?: string | null
          coach_name?: string | null
          conference?: string | null
          contact_email?: string | null
          created_at?: string
          division?: string | null
          email_verified_source_url?: string | null
          enrollment?: number | null
          id?: string
          location_city?: string | null
          location_state?: string | null
          logo_cache_updated?: string | null
          logo_url?: string | null
          majors?: string | null
          min_gpa?: number | null
          name?: string
          roster_needs?: string | null
          school_size?: string | null
          social_links?: string | null
          staff_directory_url?: string | null
          tuition?: number | null
          tuition_estimate?: number | null
          updated_at?: string
          website_url?: string | null
        }
        Relationships: []
      }
      scorm_progress: {
        Row: {
          completion_status: string | null
          created_at: string
          id: string
          lesson_id: string
          lesson_location: string | null
          lesson_status: string | null
          score_max: number | null
          score_min: number | null
          score_raw: number | null
          session_time: string | null
          success_status: string | null
          suspend_data: string | null
          total_time: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          completion_status?: string | null
          created_at?: string
          id?: string
          lesson_id: string
          lesson_location?: string | null
          lesson_status?: string | null
          score_max?: number | null
          score_min?: number | null
          score_raw?: number | null
          session_time?: string | null
          success_status?: string | null
          suspend_data?: string | null
          total_time?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          completion_status?: string | null
          created_at?: string
          id?: string
          lesson_id?: string
          lesson_location?: string | null
          lesson_status?: string | null
          score_max?: number | null
          score_min?: number | null
          score_raw?: number | null
          session_time?: string | null
          success_status?: string | null
          suspend_data?: string | null
          total_time?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scorm_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scorm_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "playbook_video_analytics"
            referencedColumns: ["lesson_id"]
          },
        ]
      }
      scraping_history: {
        Row: {
          athletes_imported: number | null
          athletes_scraped: number | null
          athletes_skipped: number | null
          completed_at: string | null
          created_at: string
          errors: Json | null
          id: string
          initiated_by: string | null
          metadata: Json | null
          sources_attempted: string[] | null
          sources_succeeded: string[] | null
          sport: string
          started_at: string
          status: string
        }
        Insert: {
          athletes_imported?: number | null
          athletes_scraped?: number | null
          athletes_skipped?: number | null
          completed_at?: string | null
          created_at?: string
          errors?: Json | null
          id?: string
          initiated_by?: string | null
          metadata?: Json | null
          sources_attempted?: string[] | null
          sources_succeeded?: string[] | null
          sport: string
          started_at?: string
          status?: string
        }
        Update: {
          athletes_imported?: number | null
          athletes_scraped?: number | null
          athletes_skipped?: number | null
          completed_at?: string | null
          created_at?: string
          errors?: Json | null
          id?: string
          initiated_by?: string | null
          metadata?: Json | null
          sources_attempted?: string[] | null
          sources_succeeded?: string[] | null
          sport?: string
          started_at?: string
          status?: string
        }
        Relationships: []
      }
      search_analytics: {
        Row: {
          clicked_result_ids: string[] | null
          created_at: string
          filters: Json
          id: string
          results_count: number | null
          search_type: string
          user_id: string
        }
        Insert: {
          clicked_result_ids?: string[] | null
          created_at?: string
          filters?: Json
          id?: string
          results_count?: number | null
          search_type: string
          user_id: string
        }
        Update: {
          clicked_result_ids?: string[] | null
          created_at?: string
          filters?: Json
          id?: string
          results_count?: number | null
          search_type?: string
          user_id?: string
        }
        Relationships: []
      }
      secret_rotation_tracking: {
        Row: {
          created_at: string
          id: string
          is_critical: boolean
          last_rotated_at: string
          next_rotation_due: string | null
          rotated_by: string | null
          rotation_frequency_days: number
          rotation_notes: string | null
          secret_name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_critical?: boolean
          last_rotated_at?: string
          next_rotation_due?: string | null
          rotated_by?: string | null
          rotation_frequency_days?: number
          rotation_notes?: string | null
          secret_name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_critical?: boolean
          last_rotated_at?: string
          next_rotation_due?: string | null
          rotated_by?: string | null
          rotation_frequency_days?: number
          rotation_notes?: string | null
          secret_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      security_events: {
        Row: {
          created_at: string
          description: string
          event_type: string
          id: string
          ip_address: string | null
          metadata: Json | null
          severity: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          description: string
          event_type: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          severity: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          description?: string
          event_type?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          severity?: string
          user_id?: string | null
        }
        Relationships: []
      }
      social_accounts: {
        Row: {
          connected_at: string | null
          created_at: string | null
          follower_count: number | null
          id: string
          is_primary: boolean | null
          last_posted_at: string | null
          platform: string
          updated_at: string | null
          user_id: string
          username: string
        }
        Insert: {
          connected_at?: string | null
          created_at?: string | null
          follower_count?: number | null
          id?: string
          is_primary?: boolean | null
          last_posted_at?: string | null
          platform: string
          updated_at?: string | null
          user_id: string
          username: string
        }
        Update: {
          connected_at?: string | null
          created_at?: string | null
          follower_count?: number | null
          id?: string
          is_primary?: boolean | null
          last_posted_at?: string | null
          platform?: string
          updated_at?: string | null
          user_id?: string
          username?: string
        }
        Relationships: []
      }
      social_media_calendar: {
        Row: {
          athlete_id: string
          created_at: string
          created_by: string | null
          generated_copy: string
          id: string
          posted_at: string | null
          promotion_type: string
          scheduled_date: string
          status: string
          suggested_hashtags: string[] | null
        }
        Insert: {
          athlete_id: string
          created_at?: string
          created_by?: string | null
          generated_copy: string
          id?: string
          posted_at?: string | null
          promotion_type?: string
          scheduled_date: string
          status?: string
          suggested_hashtags?: string[] | null
        }
        Update: {
          athlete_id?: string
          created_at?: string
          created_by?: string | null
          generated_copy?: string
          id?: string
          posted_at?: string | null
          promotion_type?: string
          scheduled_date?: string
          status?: string
          suggested_hashtags?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "social_media_calendar_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
        ]
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
      sponsors: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          logo_url: string
          name: string
          order_index: number
          tier: string
          updated_at: string
          website_url: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          logo_url: string
          name: string
          order_index?: number
          tier?: string
          updated_at?: string
          website_url: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          logo_url?: string
          name?: string
          order_index?: number
          tier?: string
          updated_at?: string
          website_url?: string
        }
        Relationships: []
      }
      stat_update_reminders: {
        Row: {
          athlete_id: string
          created_at: string | null
          id: string
          is_active: boolean | null
          last_reminder_sent_at: string | null
          reminder_frequency_days: number | null
          updated_at: string | null
        }
        Insert: {
          athlete_id: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_reminder_sent_at?: string | null
          reminder_frequency_days?: number | null
          updated_at?: string | null
        }
        Update: {
          athlete_id?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_reminder_sent_at?: string | null
          reminder_frequency_days?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stat_update_reminders_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
        ]
      }
      tier_features: {
        Row: {
          created_at: string | null
          feature_key: string
          id: string
          is_enabled: boolean | null
          limit_value: number | null
          tier: string
        }
        Insert: {
          created_at?: string | null
          feature_key: string
          id?: string
          is_enabled?: boolean | null
          limit_value?: number | null
          tier: string
        }
        Update: {
          created_at?: string | null
          feature_key?: string
          id?: string
          is_enabled?: boolean | null
          limit_value?: number | null
          tier?: string
        }
        Relationships: []
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
      video_completions: {
        Row: {
          completed_at: string
          id: string
          lesson_id: string
          user_id: string
          watch_duration_seconds: number | null
        }
        Insert: {
          completed_at?: string
          id?: string
          lesson_id: string
          user_id: string
          watch_duration_seconds?: number | null
        }
        Update: {
          completed_at?: string
          id?: string
          lesson_id?: string
          user_id?: string
          watch_duration_seconds?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "video_completions_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_completions_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "playbook_video_analytics"
            referencedColumns: ["lesson_id"]
          },
        ]
      }
      video_favorites: {
        Row: {
          created_at: string
          id: string
          lesson_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          lesson_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          lesson_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_favorites_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_favorites_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "playbook_video_analytics"
            referencedColumns: ["lesson_id"]
          },
        ]
      }
      waitlist_signups: {
        Row: {
          additional_notes: string | null
          created_at: string | null
          email: string
          full_name: string
          how_heard: string | null
          id: string
          interested_in_beta: boolean | null
          level: string | null
          location: string | null
          organization: string | null
          phone: string | null
          role: string
          sport: string | null
          subscribe_updates: boolean | null
          updated_at: string | null
        }
        Insert: {
          additional_notes?: string | null
          created_at?: string | null
          email: string
          full_name: string
          how_heard?: string | null
          id?: string
          interested_in_beta?: boolean | null
          level?: string | null
          location?: string | null
          organization?: string | null
          phone?: string | null
          role: string
          sport?: string | null
          subscribe_updates?: boolean | null
          updated_at?: string | null
        }
        Update: {
          additional_notes?: string | null
          created_at?: string | null
          email?: string
          full_name?: string
          how_heard?: string | null
          id?: string
          interested_in_beta?: boolean | null
          level?: string | null
          location?: string | null
          organization?: string | null
          phone?: string | null
          role?: string
          sport?: string | null
          subscribe_updates?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      connected_accounts_status: {
        Row: {
          account_name: string | null
          expires_at: string | null
          id: string | null
          platform: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          account_name?: string | null
          expires_at?: string | null
          id?: string | null
          platform?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          account_name?: string | null
          expires_at?: string | null
          id?: string | null
          platform?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      playbook_video_analytics: {
        Row: {
          avg_watch_duration: number | null
          completed_views: number | null
          last_viewed_at: string | null
          lesson_id: string | null
          topic_title: string | null
          total_views: number | null
          unique_viewers: number | null
          video_title: string | null
          views_last_30_days: number | null
          views_last_7_days: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      admin_get_archived_media: {
        Args: { p_athlete_id?: string; p_limit?: number; p_user_id?: string }
        Returns: {
          archived_at: string
          archived_reason: string
          athlete_id: string
          athlete_name: string
          file_name: string
          id: string
          is_deleted: boolean
          media_type: string
          original_media_id: string
          storage_path: string
          user_email: string
          user_id: string
          version_number: number
        }[]
      }
      archive_alumni_account: { Args: { p_user_id: string }; Returns: Json }
      archive_user_data: { Args: { p_user_id: string }; Returns: undefined }
      calculate_age: { Args: { p_date_of_birth: string }; Returns: number }
      can_request_reevaluation: {
        Args: { p_athlete_id: string }
        Returns: boolean
      }
      can_user_login: { Args: { p_user_id: string }; Returns: Json }
      check_ai_usage_thresholds: { Args: never; Returns: undefined }
      check_duplicate_athlete: {
        Args: {
          p_full_name: string
          p_graduation_year: number
          p_high_school?: string
          p_sport: string
        }
        Returns: string
      }
      check_expired_consents: { Args: never; Returns: undefined }
      check_profile_upload_rate_limit: { Args: never; Returns: boolean }
      check_stat_update_reminders: { Args: never; Returns: undefined }
      clean_old_contact_submissions: { Args: never; Returns: undefined }
      cleanup_oauth_state: { Args: never; Returns: undefined }
      decrypt_oauth_token: {
        Args: { encrypted_token: string }
        Returns: string
      }
      encrypt_oauth_token: { Args: { token: string }; Returns: string }
      end_impersonation_session: { Args: never; Returns: undefined }
      generate_claim_token: { Args: never; Returns: string }
      get_blended_ranking_score: {
        Args: {
          p_athlete_id: string
          p_graduation_year: number
          p_position: string
          p_sport: string
        }
        Returns: Json
      }
      get_daily_ai_usage: {
        Args: never
        Returns: {
          date: string
          estimated_tokens: number
          failed_requests: number
          rate_limited_requests: number
          successful_requests: number
          total_requests: number
          unique_users: number
        }[]
      }
      get_engagement_stats: {
        Args: { p_days?: number; p_user_id: string }
        Returns: {
          downloads: number
          engagement_by_type: Json
          shares: number
          total_engagements: number
          views: number
        }[]
      }
      get_evaluation_composite_score: {
        Args: { eval_scores: Json }
        Returns: number
      }
      get_evaluation_price: { Args: { p_athlete_id: string }; Returns: string }
      get_impersonated_user_id: { Args: never; Returns: string }
      get_least_featured_athletes: {
        Args: { limit_count?: number }
        Returns: {
          athlete_id: string
          days_since_feature: number
          full_name: string
          last_featured_date: string
          total_features: number
        }[]
      }
      get_media_version_history: {
        Args: { p_media_id: string }
        Returns: {
          archived_at: string
          archived_reason: string
          file_size: number
          storage_path: string
          version_number: number
        }[]
      }
      get_membership_status: { Args: { p_user_id: string }; Returns: Json }
      get_profile_view_stats: {
        Args: { p_athlete_id: string; p_days?: number }
        Returns: {
          coach_views: number
          recent_views: Json
          recruiter_views: number
          total_views: number
          unique_viewers: number
        }[]
      }
      get_recruiter_sport: { Args: { p_user_id: string }; Returns: string }
      get_safe_athlete_profile: {
        Args: { p_athlete_id: string }
        Returns: Json
      }
      get_secrets_needing_rotation: {
        Args: never
        Returns: {
          days_overdue: number
          is_critical: boolean
          last_rotated_at: string
          next_rotation_due: string
          secret_name: string
        }[]
      }
      get_user_evaluation_price: {
        Args: { p_is_reevaluation: boolean; p_user_id: string }
        Returns: number
      }
      get_user_tier: { Args: { p_user_id: string }; Returns: string }
      has_feature_access: {
        Args: { p_feature_key: string; p_user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_minor: { Args: { p_date_of_birth: string }; Returns: boolean }
      is_paid_recruiter: { Args: { p_user_id: string }; Returns: boolean }
      log_audit_event: {
        Args: {
          p_action: string
          p_metadata?: Json
          p_resource_id?: string
          p_resource_type: string
        }
        Returns: string
      }
      log_security_event: {
        Args: {
          p_description: string
          p_event_type: string
          p_metadata?: Json
          p_severity: string
        }
        Returns: string
      }
      mark_secret_rotated: {
        Args: { p_rotation_notes?: string; p_secret_name: string }
        Returns: Json
      }
      notify_expiring_consents: { Args: never; Returns: undefined }
      start_impersonation_session: {
        Args: { p_impersonated_user_id: string }
        Returns: string
      }
      validate_promo_code: {
        Args: { p_code: string; p_product_id: string }
        Returns: Json
      }
    }
    Enums: {
      app_role:
        | "athlete"
        | "parent"
        | "coach"
        | "recruiter"
        | "admin"
        | "alumni"
      evaluation_status:
        | "pending"
        | "in_progress"
        | "completed"
        | "cancelled"
        | "refunded"
      payment_status: "pending" | "completed" | "failed" | "refunded"
      subscription_plan:
        | "free"
        | "annual"
        | "monthly"
        | "pro_monthly"
        | "championship_yearly"
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
      app_role: ["athlete", "parent", "coach", "recruiter", "admin", "alumni"],
      evaluation_status: [
        "pending",
        "in_progress",
        "completed",
        "cancelled",
        "refunded",
      ],
      payment_status: ["pending", "completed", "failed", "refunded"],
      subscription_plan: [
        "free",
        "annual",
        "monthly",
        "pro_monthly",
        "championship_yearly",
      ],
    },
  },
} as const
