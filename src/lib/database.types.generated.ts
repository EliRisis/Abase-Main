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
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      archetype_category_weights: {
        Row: {
          archetype_id: string
          category: Database["public"]["Enums"]["module_category"]
          phase: Database["public"]["Enums"]["training_phase"]
          weight: number
        }
        Insert: {
          archetype_id: string
          category: Database["public"]["Enums"]["module_category"]
          phase: Database["public"]["Enums"]["training_phase"]
          weight: number
        }
        Update: {
          archetype_id?: string
          category?: Database["public"]["Enums"]["module_category"]
          phase?: Database["public"]["Enums"]["training_phase"]
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "archetype_category_weights_archetype_id_fkey"
            columns: ["archetype_id"]
            isOneToOne: false
            referencedRelation: "position_archetypes"
            referencedColumns: ["id"]
          },
        ]
      }
      exercise_logs: {
        Row: {
          completed: boolean
          created_at: string
          exercise_id: string | null
          id: string
          program_day_exercise_id: string | null
          progress_log_id: string
          reps_completed: number | null
          result_seconds: number | null
          set_number: number
          user_id: string
          weight: number | null
          weight_unit: Database["public"]["Enums"]["weight_unit"]
          workout_exercise_id: string | null
        }
        Insert: {
          completed?: boolean
          created_at?: string
          exercise_id?: string | null
          id?: string
          program_day_exercise_id?: string | null
          progress_log_id: string
          reps_completed?: number | null
          result_seconds?: number | null
          set_number: number
          user_id: string
          weight?: number | null
          weight_unit?: Database["public"]["Enums"]["weight_unit"]
          workout_exercise_id?: string | null
        }
        Update: {
          completed?: boolean
          created_at?: string
          exercise_id?: string | null
          id?: string
          program_day_exercise_id?: string | null
          progress_log_id?: string
          reps_completed?: number | null
          result_seconds?: number | null
          set_number?: number
          user_id?: string
          weight?: number | null
          weight_unit?: Database["public"]["Enums"]["weight_unit"]
          workout_exercise_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "exercise_logs_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exercise_logs_program_day_exercise_id_fkey"
            columns: ["program_day_exercise_id"]
            isOneToOne: false
            referencedRelation: "user_program_day_exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exercise_logs_progress_log_id_fkey"
            columns: ["progress_log_id"]
            isOneToOne: false
            referencedRelation: "progress_logs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exercise_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exercise_logs_workout_exercise_id_fkey"
            columns: ["workout_exercise_id"]
            isOneToOne: false
            referencedRelation: "workout_exercises"
            referencedColumns: ["id"]
          },
        ]
      }
      exercise_positions: {
        Row: {
          exercise_id: string
          position_id: string
        }
        Insert: {
          exercise_id: string
          position_id: string
        }
        Update: {
          exercise_id?: string
          position_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exercise_positions_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exercise_positions_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "positions"
            referencedColumns: ["id"]
          },
        ]
      }
      exercise_role_prescriptions: {
        Row: {
          exercise_id: string
          load_pct: number | null
          reps: string
          role: Database["public"]["Enums"]["training_attribute"]
          sets: number
          tempo: string | null
        }
        Insert: {
          exercise_id: string
          load_pct?: number | null
          reps: string
          role: Database["public"]["Enums"]["training_attribute"]
          sets: number
          tempo?: string | null
        }
        Update: {
          exercise_id?: string
          load_pct?: number | null
          reps?: string
          role?: Database["public"]["Enums"]["training_attribute"]
          sets?: number
          tempo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "exercise_role_prescriptions_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
        ]
      }
      exercises: {
        Row: {
          attr_agility: number
          attr_conditioning: number
          attr_coordination: number
          attr_mobility: number
          attr_power: number
          attr_speed: number
          attr_strength: number
          created_at: string
          created_by: string | null
          description: string | null
          equipment: string | null
          equipment_tier: Database["public"]["Enums"]["equipment_access"]
          id: string
          image_url: string | null
          loaded_areas: Database["public"]["Enums"]["limitation_body_area"][]
          min_level: Database["public"]["Enums"]["experience_level"]
          movement_pattern:
            | Database["public"]["Enums"]["movement_pattern"]
            | null
          muscle_groups: string[]
          name: string
          prescription_mode: Database["public"]["Enums"]["prescription_mode"]
          setting: Database["public"]["Enums"]["training_setting"]
          slug: string
          updated_at: string
          video_url: string | null
        }
        Insert: {
          attr_agility?: number
          attr_conditioning?: number
          attr_coordination?: number
          attr_mobility?: number
          attr_power?: number
          attr_speed?: number
          attr_strength?: number
          created_at?: string
          created_by?: string | null
          description?: string | null
          equipment?: string | null
          equipment_tier?: Database["public"]["Enums"]["equipment_access"]
          id?: string
          image_url?: string | null
          loaded_areas?: Database["public"]["Enums"]["limitation_body_area"][]
          min_level?: Database["public"]["Enums"]["experience_level"]
          movement_pattern?:
            | Database["public"]["Enums"]["movement_pattern"]
            | null
          muscle_groups?: string[]
          name: string
          prescription_mode?: Database["public"]["Enums"]["prescription_mode"]
          setting?: Database["public"]["Enums"]["training_setting"]
          slug: string
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          attr_agility?: number
          attr_conditioning?: number
          attr_coordination?: number
          attr_mobility?: number
          attr_power?: number
          attr_speed?: number
          attr_strength?: number
          created_at?: string
          created_by?: string | null
          description?: string | null
          equipment?: string | null
          equipment_tier?: Database["public"]["Enums"]["equipment_access"]
          id?: string
          image_url?: string | null
          loaded_areas?: Database["public"]["Enums"]["limitation_body_area"][]
          min_level?: Database["public"]["Enums"]["experience_level"]
          movement_pattern?:
            | Database["public"]["Enums"]["movement_pattern"]
            | null
          muscle_groups?: string[]
          name?: string
          prescription_mode?: Database["public"]["Enums"]["prescription_mode"]
          setting?: Database["public"]["Enums"]["training_setting"]
          slug?: string
          updated_at?: string
          video_url?: string | null
        }
        Relationships: []
      }
      metric_archetypes: {
        Row: {
          archetype_id: string
          metric_id: string
        }
        Insert: {
          archetype_id: string
          metric_id: string
        }
        Update: {
          archetype_id?: string
          metric_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "metric_archetypes_archetype_id_fkey"
            columns: ["archetype_id"]
            isOneToOne: false
            referencedRelation: "position_archetypes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "metric_archetypes_metric_id_fkey"
            columns: ["metric_id"]
            isOneToOne: false
            referencedRelation: "metric_definitions"
            referencedColumns: ["id"]
          },
        ]
      }
      metric_definitions: {
        Row: {
          attribute: Database["public"]["Enums"]["training_attribute"] | null
          category: Database["public"]["Enums"]["module_category"]
          created_at: string
          description: string | null
          direction: Database["public"]["Enums"]["metric_direction"]
          display_format: string
          id: string
          max_value: number
          min_value: number
          name: string
          slug: string
          sort_order: number
          sport_id: string | null
          unit: string
        }
        Insert: {
          attribute?: Database["public"]["Enums"]["training_attribute"] | null
          category: Database["public"]["Enums"]["module_category"]
          created_at?: string
          description?: string | null
          direction: Database["public"]["Enums"]["metric_direction"]
          display_format?: string
          id?: string
          max_value: number
          min_value: number
          name: string
          slug: string
          sort_order?: number
          sport_id?: string | null
          unit: string
        }
        Update: {
          attribute?: Database["public"]["Enums"]["training_attribute"] | null
          category?: Database["public"]["Enums"]["module_category"]
          created_at?: string
          description?: string | null
          direction?: Database["public"]["Enums"]["metric_direction"]
          display_format?: string
          id?: string
          max_value?: number
          min_value?: number
          name?: string
          slug?: string
          sort_order?: number
          sport_id?: string | null
          unit?: string
        }
        Relationships: [
          {
            foreignKeyName: "metric_definitions_sport_id_fkey"
            columns: ["sport_id"]
            isOneToOne: false
            referencedRelation: "sports"
            referencedColumns: ["id"]
          },
        ]
      }
      metric_logs: {
        Row: {
          created_at: string
          id: string
          logged_on: string
          metric_id: string
          note: string | null
          user_id: string
          value: number
        }
        Insert: {
          created_at?: string
          id?: string
          logged_on?: string
          metric_id: string
          note?: string | null
          user_id: string
          value: number
        }
        Update: {
          created_at?: string
          id?: string
          logged_on?: string
          metric_id?: string
          note?: string | null
          user_id?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "metric_logs_metric_id_fkey"
            columns: ["metric_id"]
            isOneToOne: false
            referencedRelation: "metric_definitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "metric_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      phase_attribute_modifiers: {
        Row: {
          attribute: Database["public"]["Enums"]["training_attribute"]
          modifier: number
          phase: Database["public"]["Enums"]["training_phase"]
        }
        Insert: {
          attribute: Database["public"]["Enums"]["training_attribute"]
          modifier?: number
          phase: Database["public"]["Enums"]["training_phase"]
        }
        Update: {
          attribute?: Database["public"]["Enums"]["training_attribute"]
          modifier?: number
          phase?: Database["public"]["Enums"]["training_phase"]
        }
        Relationships: []
      }
      plan_workouts: {
        Row: {
          day_number: number
          id: string
          plan_id: string
          title: string | null
          week_number: number
          workout_id: string
        }
        Insert: {
          day_number: number
          id?: string
          plan_id: string
          title?: string | null
          week_number: number
          workout_id: string
        }
        Update: {
          day_number?: number
          id?: string
          plan_id?: string
          title?: string | null
          week_number?: number
          workout_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "plan_workouts_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plan_workouts_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "workouts"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          category: Database["public"]["Enums"]["module_category"]
          cover_image_url: string | null
          created_at: string
          created_by: string | null
          days_per_week: number
          description: string | null
          goal: Database["public"]["Enums"]["training_goal"] | null
          id: string
          intensity: Database["public"]["Enums"]["intensity_level"]
          level: Database["public"]["Enums"]["experience_level"] | null
          name: string
          phases: Database["public"]["Enums"]["training_phase"][]
          position_id: string | null
          published: boolean
          secondary_category:
            | Database["public"]["Enums"]["module_category"]
            | null
          slug: string
          sport_id: string | null
          updated_at: string
          weeks: number
          why_note: string | null
        }
        Insert: {
          category: Database["public"]["Enums"]["module_category"]
          cover_image_url?: string | null
          created_at?: string
          created_by?: string | null
          days_per_week: number
          description?: string | null
          goal?: Database["public"]["Enums"]["training_goal"] | null
          id?: string
          intensity: Database["public"]["Enums"]["intensity_level"]
          level?: Database["public"]["Enums"]["experience_level"] | null
          name: string
          phases?: Database["public"]["Enums"]["training_phase"][]
          position_id?: string | null
          published?: boolean
          secondary_category?:
            | Database["public"]["Enums"]["module_category"]
            | null
          slug: string
          sport_id?: string | null
          updated_at?: string
          weeks: number
          why_note?: string | null
        }
        Update: {
          category?: Database["public"]["Enums"]["module_category"]
          cover_image_url?: string | null
          created_at?: string
          created_by?: string | null
          days_per_week?: number
          description?: string | null
          goal?: Database["public"]["Enums"]["training_goal"] | null
          id?: string
          intensity?: Database["public"]["Enums"]["intensity_level"]
          level?: Database["public"]["Enums"]["experience_level"] | null
          name?: string
          phases?: Database["public"]["Enums"]["training_phase"][]
          position_id?: string | null
          published?: boolean
          secondary_category?:
            | Database["public"]["Enums"]["module_category"]
            | null
          slug?: string
          sport_id?: string | null
          updated_at?: string
          weeks?: number
          why_note?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "plans_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "positions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plans_sport_id_fkey"
            columns: ["sport_id"]
            isOneToOne: false
            referencedRelation: "sports"
            referencedColumns: ["id"]
          },
        ]
      }
      position_archetypes: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      position_attribute_notes: {
        Row: {
          attribute: Database["public"]["Enums"]["training_attribute"]
          note: string
          position_id: string
        }
        Insert: {
          attribute: Database["public"]["Enums"]["training_attribute"]
          note: string
          position_id: string
        }
        Update: {
          attribute?: Database["public"]["Enums"]["training_attribute"]
          note?: string
          position_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "position_attribute_notes_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "positions"
            referencedColumns: ["id"]
          },
        ]
      }
      position_needs_profiles: {
        Row: {
          attr_agility: number
          attr_conditioning: number
          attr_coordination: number
          attr_mobility: number
          attr_power: number
          attr_speed: number
          attr_strength: number
          position_id: string
          rotational: boolean
          updated_at: string
        }
        Insert: {
          attr_agility?: number
          attr_conditioning?: number
          attr_coordination?: number
          attr_mobility?: number
          attr_power?: number
          attr_speed?: number
          attr_strength?: number
          position_id: string
          rotational?: boolean
          updated_at?: string
        }
        Update: {
          attr_agility?: number
          attr_conditioning?: number
          attr_coordination?: number
          attr_mobility?: number
          attr_power?: number
          attr_speed?: number
          attr_strength?: number
          position_id?: string
          rotational?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "position_needs_profiles_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: true
            referencedRelation: "positions"
            referencedColumns: ["id"]
          },
        ]
      }
      positions: {
        Row: {
          archetype_id: string | null
          created_at: string
          description: string | null
          id: string
          name: string
          slug: string
          sport_id: string
        }
        Insert: {
          archetype_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          slug: string
          sport_id: string
        }
        Update: {
          archetype_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          slug?: string
          sport_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "positions_archetype_id_fkey"
            columns: ["archetype_id"]
            isOneToOne: false
            referencedRelation: "position_archetypes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "positions_sport_id_fkey"
            columns: ["sport_id"]
            isOneToOne: false
            referencedRelation: "sports"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          days_per_week: number | null
          display_name: string | null
          email: string | null
          equipment_access:
            | Database["public"]["Enums"]["equipment_access"]
            | null
          id: string
          level: Database["public"]["Enums"]["experience_level"] | null
          onboarded: boolean
          position_id: string | null
          role: Database["public"]["Enums"]["user_role"]
          secondary_position_id: string | null
          session_minutes: number | null
          sport_id: string | null
          target_date: string | null
          target_event: string | null
          timezone: string | null
          training_days: number[] | null
          training_phase: Database["public"]["Enums"]["training_phase"]
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          days_per_week?: number | null
          display_name?: string | null
          email?: string | null
          equipment_access?:
            | Database["public"]["Enums"]["equipment_access"]
            | null
          id: string
          level?: Database["public"]["Enums"]["experience_level"] | null
          onboarded?: boolean
          position_id?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          secondary_position_id?: string | null
          session_minutes?: number | null
          sport_id?: string | null
          target_date?: string | null
          target_event?: string | null
          timezone?: string | null
          training_days?: number[] | null
          training_phase?: Database["public"]["Enums"]["training_phase"]
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          days_per_week?: number | null
          display_name?: string | null
          email?: string | null
          equipment_access?:
            | Database["public"]["Enums"]["equipment_access"]
            | null
          id?: string
          level?: Database["public"]["Enums"]["experience_level"] | null
          onboarded?: boolean
          position_id?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          secondary_position_id?: string | null
          session_minutes?: number | null
          sport_id?: string | null
          target_date?: string | null
          target_event?: string | null
          timezone?: string | null
          training_days?: number[] | null
          training_phase?: Database["public"]["Enums"]["training_phase"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "positions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_secondary_position_id_fkey"
            columns: ["secondary_position_id"]
            isOneToOne: false
            referencedRelation: "positions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_sport_id_fkey"
            columns: ["sport_id"]
            isOneToOne: false
            referencedRelation: "sports"
            referencedColumns: ["id"]
          },
        ]
      }
      progress_logs: {
        Row: {
          attribute_profile: Json | null
          category: Database["public"]["Enums"]["module_category"] | null
          completed_at: string | null
          created_at: string
          day_number: number | null
          feedback: Database["public"]["Enums"]["session_feedback"] | null
          feedback_at: string | null
          id: string
          intensity: Database["public"]["Enums"]["intensity_level"] | null
          patterns: Database["public"]["Enums"]["movement_pattern"][]
          plan_id: string | null
          plan_workout_id: string | null
          program_day_id: string | null
          setting: Database["public"]["Enums"]["training_setting"] | null
          started_at: string
          supplemental: boolean
          swapped: boolean
          user_id: string
          user_plan_id: string | null
          volume_pct: number
          week_number: number | null
          workout_id: string | null
        }
        Insert: {
          attribute_profile?: Json | null
          category?: Database["public"]["Enums"]["module_category"] | null
          completed_at?: string | null
          created_at?: string
          day_number?: number | null
          feedback?: Database["public"]["Enums"]["session_feedback"] | null
          feedback_at?: string | null
          id?: string
          intensity?: Database["public"]["Enums"]["intensity_level"] | null
          patterns?: Database["public"]["Enums"]["movement_pattern"][]
          plan_id?: string | null
          plan_workout_id?: string | null
          program_day_id?: string | null
          setting?: Database["public"]["Enums"]["training_setting"] | null
          started_at?: string
          supplemental?: boolean
          swapped?: boolean
          user_id: string
          user_plan_id?: string | null
          volume_pct?: number
          week_number?: number | null
          workout_id?: string | null
        }
        Update: {
          attribute_profile?: Json | null
          category?: Database["public"]["Enums"]["module_category"] | null
          completed_at?: string | null
          created_at?: string
          day_number?: number | null
          feedback?: Database["public"]["Enums"]["session_feedback"] | null
          feedback_at?: string | null
          id?: string
          intensity?: Database["public"]["Enums"]["intensity_level"] | null
          patterns?: Database["public"]["Enums"]["movement_pattern"][]
          plan_id?: string | null
          plan_workout_id?: string | null
          program_day_id?: string | null
          setting?: Database["public"]["Enums"]["training_setting"] | null
          started_at?: string
          supplemental?: boolean
          swapped?: boolean
          user_id?: string
          user_plan_id?: string | null
          volume_pct?: number
          week_number?: number | null
          workout_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "progress_logs_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "progress_logs_plan_workout_id_fkey"
            columns: ["plan_workout_id"]
            isOneToOne: false
            referencedRelation: "plan_workouts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "progress_logs_program_day_id_fkey"
            columns: ["program_day_id"]
            isOneToOne: false
            referencedRelation: "user_program_days"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "progress_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "progress_logs_user_plan_id_fkey"
            columns: ["user_plan_id"]
            isOneToOne: false
            referencedRelation: "user_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "progress_logs_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "workouts"
            referencedColumns: ["id"]
          },
        ]
      }
      readiness_checkins: {
        Row: {
          checkin_date: string
          created_at: string
          id: string
          note: string | null
          score: number
          user_id: string
        }
        Insert: {
          checkin_date: string
          created_at?: string
          id?: string
          note?: string | null
          score: number
          user_id: string
        }
        Update: {
          checkin_date?: string
          created_at?: string
          id?: string
          note?: string | null
          score?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "readiness_checkins_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      sports: {
        Row: {
          created_at: string
          icon: string | null
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          icon?: string | null
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          icon?: string | null
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      training_phase_config: {
        Row: {
          deload_every_weeks: number
          description: string
          label: string
          max_high_intensity_sessions: number
          max_session_intensity: Database["public"]["Enums"]["intensity_level"]
          phase: Database["public"]["Enums"]["training_phase"]
          sessions_per_week: number
          sort_order: number
          volume_pct: number
        }
        Insert: {
          deload_every_weeks?: number
          description: string
          label: string
          max_high_intensity_sessions: number
          max_session_intensity?: Database["public"]["Enums"]["intensity_level"]
          phase: Database["public"]["Enums"]["training_phase"]
          sessions_per_week: number
          sort_order: number
          volume_pct: number
        }
        Update: {
          deload_every_weeks?: number
          description?: string
          label?: string
          max_high_intensity_sessions?: number
          max_session_intensity?: Database["public"]["Enums"]["intensity_level"]
          phase?: Database["public"]["Enums"]["training_phase"]
          sessions_per_week?: number
          sort_order?: number
          volume_pct?: number
        }
        Relationships: []
      }
      user_calendar_events: {
        Row: {
          created_at: string
          event_date: string
          event_type: Database["public"]["Enums"]["calendar_event_type"]
          id: string
          note: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          event_date: string
          event_type: Database["public"]["Enums"]["calendar_event_type"]
          id?: string
          note?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          event_date?: string
          event_type?: Database["public"]["Enums"]["calendar_event_type"]
          id?: string
          note?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_calendar_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_plans: {
        Row: {
          completed_at: string | null
          created_at: string
          current_week: number
          id: string
          plan_id: string
          started_at: string
          status: Database["public"]["Enums"]["enrollment_status"]
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          current_week?: number
          id?: string
          plan_id: string
          started_at?: string
          status?: Database["public"]["Enums"]["enrollment_status"]
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          current_week?: number
          id?: string
          plan_id?: string
          started_at?: string
          status?: Database["public"]["Enums"]["enrollment_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_plans_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_plans_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_program_day_exercises: {
        Row: {
          block: string
          created_at: string
          exercise_id: string | null
          exercise_name: string
          id: string
          order_index: number
          program_day_id: string
          reps: string
          rest_seconds: number | null
          role: Database["public"]["Enums"]["training_attribute"]
          rx_note: string | null
          sets: number
          setting: Database["public"]["Enums"]["training_setting"]
          target_weight: number | null
          user_id: string
          weight_unit: Database["public"]["Enums"]["weight_unit"]
        }
        Insert: {
          block: string
          created_at?: string
          exercise_id?: string | null
          exercise_name: string
          id?: string
          order_index: number
          program_day_id: string
          reps: string
          rest_seconds?: number | null
          role: Database["public"]["Enums"]["training_attribute"]
          rx_note?: string | null
          sets: number
          setting: Database["public"]["Enums"]["training_setting"]
          target_weight?: number | null
          user_id: string
          weight_unit?: Database["public"]["Enums"]["weight_unit"]
        }
        Update: {
          block?: string
          created_at?: string
          exercise_id?: string | null
          exercise_name?: string
          id?: string
          order_index?: number
          program_day_id?: string
          reps?: string
          rest_seconds?: number | null
          role?: Database["public"]["Enums"]["training_attribute"]
          rx_note?: string | null
          sets?: number
          setting?: Database["public"]["Enums"]["training_setting"]
          target_weight?: number | null
          user_id?: string
          weight_unit?: Database["public"]["Enums"]["weight_unit"]
        }
        Relationships: [
          {
            foreignKeyName: "user_program_day_exercises_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_program_day_exercises_program_day_id_fkey"
            columns: ["program_day_id"]
            isOneToOne: false
            referencedRelation: "user_program_days"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_program_day_exercises_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_program_days: {
        Row: {
          attribute_profile: Json | null
          category: Database["public"]["Enums"]["module_category"]
          day_number: number
          deload: boolean
          est_minutes: number | null
          focus: Database["public"]["Enums"]["training_attribute"] | null
          id: string
          intensity: Database["public"]["Enums"]["intensity_level"]
          note: string | null
          patterns: Database["public"]["Enums"]["movement_pattern"][]
          plan_id: string | null
          program_id: string
          setting: Database["public"]["Enums"]["training_setting"]
          template: string | null
          title: string | null
          user_id: string
          volume_pct: number
          week_number: number
          why_note: string | null
          workout_id: string | null
        }
        Insert: {
          attribute_profile?: Json | null
          category: Database["public"]["Enums"]["module_category"]
          day_number: number
          deload?: boolean
          est_minutes?: number | null
          focus?: Database["public"]["Enums"]["training_attribute"] | null
          id?: string
          intensity: Database["public"]["Enums"]["intensity_level"]
          note?: string | null
          patterns?: Database["public"]["Enums"]["movement_pattern"][]
          plan_id?: string | null
          program_id: string
          setting: Database["public"]["Enums"]["training_setting"]
          template?: string | null
          title?: string | null
          user_id: string
          volume_pct?: number
          week_number: number
          why_note?: string | null
          workout_id?: string | null
        }
        Update: {
          attribute_profile?: Json | null
          category?: Database["public"]["Enums"]["module_category"]
          day_number?: number
          deload?: boolean
          est_minutes?: number | null
          focus?: Database["public"]["Enums"]["training_attribute"] | null
          id?: string
          intensity?: Database["public"]["Enums"]["intensity_level"]
          note?: string | null
          patterns?: Database["public"]["Enums"]["movement_pattern"][]
          plan_id?: string | null
          program_id?: string
          setting?: Database["public"]["Enums"]["training_setting"]
          template?: string | null
          title?: string | null
          user_id?: string
          volume_pct?: number
          week_number?: number
          why_note?: string | null
          workout_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_program_days_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_program_days_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "user_programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_program_days_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_program_days_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "workouts"
            referencedColumns: ["id"]
          },
        ]
      }
      user_programs: {
        Row: {
          adjustments: Json
          archived_at: string | null
          created_at: string
          days_per_week: number | null
          deload_carry: number
          emphasis: Database["public"]["Enums"]["module_category"][]
          emphasis_attributes: Database["public"]["Enums"]["training_attribute"][]
          equipment_access:
            | Database["public"]["Enums"]["equipment_access"]
            | null
          id: string
          level: Database["public"]["Enums"]["experience_level"] | null
          phase: Database["public"]["Enums"]["training_phase"]
          position_id: string | null
          rationale: Json
          secondary_position_id: string | null
          session_minutes: number | null
          sessions_per_week: number
          started_on: string
          status: Database["public"]["Enums"]["program_status"]
          target_date: string | null
          target_event: string | null
          training_days: number[] | null
          user_id: string
          weeks: number
        }
        Insert: {
          adjustments?: Json
          archived_at?: string | null
          created_at?: string
          days_per_week?: number | null
          deload_carry?: number
          emphasis?: Database["public"]["Enums"]["module_category"][]
          emphasis_attributes?: Database["public"]["Enums"]["training_attribute"][]
          equipment_access?:
            | Database["public"]["Enums"]["equipment_access"]
            | null
          id?: string
          level?: Database["public"]["Enums"]["experience_level"] | null
          phase: Database["public"]["Enums"]["training_phase"]
          position_id?: string | null
          rationale?: Json
          secondary_position_id?: string | null
          session_minutes?: number | null
          sessions_per_week: number
          started_on?: string
          status?: Database["public"]["Enums"]["program_status"]
          target_date?: string | null
          target_event?: string | null
          training_days?: number[] | null
          user_id: string
          weeks?: number
        }
        Update: {
          adjustments?: Json
          archived_at?: string | null
          created_at?: string
          days_per_week?: number | null
          deload_carry?: number
          emphasis?: Database["public"]["Enums"]["module_category"][]
          emphasis_attributes?: Database["public"]["Enums"]["training_attribute"][]
          equipment_access?:
            | Database["public"]["Enums"]["equipment_access"]
            | null
          id?: string
          level?: Database["public"]["Enums"]["experience_level"] | null
          phase?: Database["public"]["Enums"]["training_phase"]
          position_id?: string | null
          rationale?: Json
          secondary_position_id?: string | null
          session_minutes?: number | null
          sessions_per_week?: number
          started_on?: string
          status?: Database["public"]["Enums"]["program_status"]
          target_date?: string | null
          target_event?: string | null
          training_days?: number[] | null
          user_id?: string
          weeks?: number
        }
        Relationships: [
          {
            foreignKeyName: "user_programs_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "positions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_programs_secondary_position_id_fkey"
            columns: ["secondary_position_id"]
            isOneToOne: false
            referencedRelation: "positions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_programs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_training_limitations: {
        Row: {
          active: boolean
          body_area: Database["public"]["Enums"]["limitation_body_area"]
          created_at: string
          id: string
          note: string | null
          side: Database["public"]["Enums"]["limitation_side"]
          user_id: string
        }
        Insert: {
          active?: boolean
          body_area: Database["public"]["Enums"]["limitation_body_area"]
          created_at?: string
          id?: string
          note?: string | null
          side?: Database["public"]["Enums"]["limitation_side"]
          user_id: string
        }
        Update: {
          active?: boolean
          body_area?: Database["public"]["Enums"]["limitation_body_area"]
          created_at?: string
          id?: string
          note?: string | null
          side?: Database["public"]["Enums"]["limitation_side"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_training_limitations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_exercises: {
        Row: {
          exercise_id: string
          id: string
          notes: string | null
          order_index: number
          reps: string
          rest_seconds: number | null
          sets: number
          workout_id: string
        }
        Insert: {
          exercise_id: string
          id?: string
          notes?: string | null
          order_index: number
          reps: string
          rest_seconds?: number | null
          sets: number
          workout_id: string
        }
        Update: {
          exercise_id?: string
          id?: string
          notes?: string | null
          order_index?: number
          reps?: string
          rest_seconds?: number | null
          sets?: number
          workout_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_exercises_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_exercises_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "workouts"
            referencedColumns: ["id"]
          },
        ]
      }
      workouts: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          estimated_minutes: number | null
          id: string
          intensity: Database["public"]["Enums"]["intensity_level"] | null
          level: Database["public"]["Enums"]["experience_level"] | null
          name: string
          position_id: string | null
          slug: string
          sport_id: string | null
          updated_at: string
          why_note: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          estimated_minutes?: number | null
          id?: string
          intensity?: Database["public"]["Enums"]["intensity_level"] | null
          level?: Database["public"]["Enums"]["experience_level"] | null
          name: string
          position_id?: string | null
          slug: string
          sport_id?: string | null
          updated_at?: string
          why_note?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          estimated_minutes?: number | null
          id?: string
          intensity?: Database["public"]["Enums"]["intensity_level"] | null
          level?: Database["public"]["Enums"]["experience_level"] | null
          name?: string
          position_id?: string | null
          slug?: string
          sport_id?: string | null
          updated_at?: string
          why_note?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workouts_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "positions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workouts_sport_id_fkey"
            columns: ["sport_id"]
            isOneToOne: false
            referencedRelation: "sports"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      workout_attribute_profiles: {
        Row: {
          agility: number | null
          conditioning: number | null
          coordination: number | null
          exercise_count: number | null
          mobility: number | null
          power: number | null
          speed: number | null
          strength: number | null
          total_sets: number | null
          workout_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workout_exercises_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "workouts"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      is_admin: { Args: never; Returns: boolean }
      is_ascending_unique_days: { Args: { days: number[] }; Returns: boolean }
      replace_program_day: {
        Args: { p_day: Json; p_day_id: string }
        Returns: undefined
      }
      replace_program_days: {
        Args: { p_days: Json; p_from_date: string; p_program_id: string }
        Returns: number
      }
      set_training_days: {
        Args: { p_today: string; p_training_days: number[] }
        Returns: undefined
      }
    }
    Enums: {
      calendar_event_type: "game" | "practice"
      enrollment_status: "active" | "completed" | "abandoned"
      equipment_access: "bodyweight" | "home" | "full_gym"
      experience_level: "beginner" | "intermediate" | "advanced"
      intensity_level: "low" | "moderate" | "high"
      limitation_body_area:
        | "knee"
        | "ankle_foot"
        | "hip"
        | "low_back"
        | "shoulder"
        | "elbow_wrist"
        | "hamstring_groin"
        | "other"
      limitation_side: "left" | "right" | "both"
      metric_direction: "lower_is_better" | "higher_is_better"
      module_category:
        | "strength"
        | "speed_acceleration"
        | "agility_cod"
        | "conditioning"
        | "mobility_injury_prevention"
        | "position_skill"
      movement_pattern:
        | "upper_push"
        | "upper_pull"
        | "hinge"
        | "squat"
        | "single_leg"
        | "core"
        | "carry"
        | "rotational"
        | "plyometric"
        | "locomotion"
        | "mobility"
      prescription_mode:
        | "loaded"
        | "bodyweight"
        | "ballistic"
        | "drill"
        | "hold"
        | "interval"
        | "steady"
        | "mobility"
      program_status: "active" | "archived"
      session_feedback: "too_easy" | "just_right" | "too_hard"
      training_attribute:
        | "speed"
        | "strength"
        | "power"
        | "agility"
        | "coordination"
        | "conditioning"
        | "mobility"
      training_goal:
        | "speed"
        | "strength_power"
        | "agility_lateral_quickness"
        | "conditioning"
        | "injury_prevention_mobility"
      training_phase: "off_season" | "pre_season" | "in_season" | "post_season"
      training_setting: "weight_room" | "field" | "either" | "recovery"
      user_role: "athlete" | "admin"
      weight_unit: "lb" | "kg"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      calendar_event_type: ["game", "practice"],
      enrollment_status: ["active", "completed", "abandoned"],
      equipment_access: ["bodyweight", "home", "full_gym"],
      experience_level: ["beginner", "intermediate", "advanced"],
      intensity_level: ["low", "moderate", "high"],
      limitation_body_area: [
        "knee",
        "ankle_foot",
        "hip",
        "low_back",
        "shoulder",
        "elbow_wrist",
        "hamstring_groin",
        "other",
      ],
      limitation_side: ["left", "right", "both"],
      metric_direction: ["lower_is_better", "higher_is_better"],
      module_category: [
        "strength",
        "speed_acceleration",
        "agility_cod",
        "conditioning",
        "mobility_injury_prevention",
        "position_skill",
      ],
      movement_pattern: [
        "upper_push",
        "upper_pull",
        "hinge",
        "squat",
        "single_leg",
        "core",
        "carry",
        "rotational",
        "plyometric",
        "locomotion",
        "mobility",
      ],
      prescription_mode: [
        "loaded",
        "bodyweight",
        "ballistic",
        "drill",
        "hold",
        "interval",
        "steady",
        "mobility",
      ],
      program_status: ["active", "archived"],
      session_feedback: ["too_easy", "just_right", "too_hard"],
      training_attribute: [
        "speed",
        "strength",
        "power",
        "agility",
        "coordination",
        "conditioning",
        "mobility",
      ],
      training_goal: [
        "speed",
        "strength_power",
        "agility_lateral_quickness",
        "conditioning",
        "injury_prevention_mobility",
      ],
      training_phase: ["off_season", "pre_season", "in_season", "post_season"],
      training_setting: ["weight_room", "field", "either", "recovery"],
      user_role: ["athlete", "admin"],
      weight_unit: ["lb", "kg"],
    },
  },
} as const
