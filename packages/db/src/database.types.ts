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
    PostgrestVersion: "14.4"
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
      athletes: {
        Row: {
          country_code: string
          created_at: string
          events: string[]
          first_name: string
          gender: Database["public"]["Enums"]["athlete_gender"]
          id: string
          is_active: boolean
          last_name: string
          photo_url: string | null
          pool: Database["public"]["Enums"]["athlete_pool"]
          primary_event: string
          salary: number
          updated_at: string
          world_athletics_id: string | null
        }
        Insert: {
          country_code: string
          created_at?: string
          events?: string[]
          first_name: string
          gender: Database["public"]["Enums"]["athlete_gender"]
          id?: string
          is_active?: boolean
          last_name: string
          photo_url?: string | null
          pool: Database["public"]["Enums"]["athlete_pool"]
          primary_event: string
          salary: number
          updated_at?: string
          world_athletics_id?: string | null
        }
        Update: {
          country_code?: string
          created_at?: string
          events?: string[]
          first_name?: string
          gender?: Database["public"]["Enums"]["athlete_gender"]
          id?: string
          is_active?: boolean
          last_name?: string
          photo_url?: string | null
          pool?: Database["public"]["Enums"]["athlete_pool"]
          primary_event?: string
          salary?: number
          updated_at?: string
          world_athletics_id?: string | null
        }
        Relationships: []
      }
      dnf_insurance_tokens: {
        Row: {
          created_at: string
          id: string
          season_id: string
          used: boolean
          used_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          season_id: string
          used?: boolean
          used_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          season_id?: string
          used?: boolean
          used_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dnf_insurance_tokens_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      draft_picks: {
        Row: {
          athlete_id: string
          id: string
          league_id: string
          pick_number: number
          picked_at: string
          round_number: number
          salary: number
          user_id: string
        }
        Insert: {
          athlete_id: string
          id?: string
          league_id: string
          pick_number: number
          picked_at?: string
          round_number: number
          salary: number
          user_id: string
        }
        Update: {
          athlete_id?: string
          id?: string
          league_id?: string
          pick_number?: number
          picked_at?: string
          round_number?: number
          salary?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "draft_picks_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "draft_picks_league_id_fkey"
            columns: ["league_id"]
            isOneToOne: false
            referencedRelation: "leagues"
            referencedColumns: ["id"]
          },
        ]
      }
      league_members: {
        Row: {
          draft_order: number | null
          id: string
          joined_at: string
          league_id: string
          role: Database["public"]["Enums"]["league_member_role"]
          total_points: number
          user_id: string
        }
        Insert: {
          draft_order?: number | null
          id?: string
          joined_at?: string
          league_id: string
          role?: Database["public"]["Enums"]["league_member_role"]
          total_points?: number
          user_id: string
        }
        Update: {
          draft_order?: number | null
          id?: string
          joined_at?: string
          league_id?: string
          role?: Database["public"]["Enums"]["league_member_role"]
          total_points?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "league_members_league_id_fkey"
            columns: ["league_id"]
            isOneToOne: false
            referencedRelation: "leagues"
            referencedColumns: ["id"]
          },
        ]
      }
      leagues: {
        Row: {
          created_at: string
          created_by: string
          draft_starts_at: string | null
          draft_status: Database["public"]["Enums"]["draft_status"]
          id: string
          invite_code: string | null
          max_members: number
          name: string
          season_id: string
          type: Database["public"]["Enums"]["league_type"]
        }
        Insert: {
          created_at?: string
          created_by: string
          draft_starts_at?: string | null
          draft_status?: Database["public"]["Enums"]["draft_status"]
          id?: string
          invite_code?: string | null
          max_members?: number
          name: string
          season_id: string
          type?: Database["public"]["Enums"]["league_type"]
        }
        Update: {
          created_at?: string
          created_by?: string
          draft_starts_at?: string | null
          draft_status?: Database["public"]["Enums"]["draft_status"]
          id?: string
          invite_code?: string | null
          max_members?: number
          name?: string
          season_id?: string
          type?: Database["public"]["Enums"]["league_type"]
        }
        Relationships: [
          {
            foreignKeyName: "leagues_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      meets: {
        Row: {
          created_at: string
          ends_at: string
          id: string
          is_scored: boolean
          location: string
          name: string
          season_id: string
          starts_at: string
          tier: Database["public"]["Enums"]["meet_tier"]
        }
        Insert: {
          created_at?: string
          ends_at: string
          id?: string
          is_scored?: boolean
          location: string
          name: string
          season_id: string
          starts_at: string
          tier?: Database["public"]["Enums"]["meet_tier"]
        }
        Update: {
          created_at?: string
          ends_at?: string
          id?: string
          is_scored?: boolean
          location?: string
          name?: string
          season_id?: string
          starts_at?: string
          tier?: Database["public"]["Enums"]["meet_tier"]
        }
        Relationships: [
          {
            foreignKeyName: "meets_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      pickem_entries: {
        Row: {
          id: string
          meet_id: string
          submitted_at: string
          total_points: number
          user_id: string
        }
        Insert: {
          id?: string
          meet_id: string
          submitted_at?: string
          total_points?: number
          user_id: string
        }
        Update: {
          id?: string
          meet_id?: string
          submitted_at?: string
          total_points?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pickem_entries_meet_id_fkey"
            columns: ["meet_id"]
            isOneToOne: false
            referencedRelation: "meets"
            referencedColumns: ["id"]
          },
        ]
      }
      pickem_picks: {
        Row: {
          athlete_id: string
          created_at: string
          entry_id: string
          event: string
          id: string
          is_correct: boolean | null
          points_awarded: number
        }
        Insert: {
          athlete_id: string
          created_at?: string
          entry_id: string
          event: string
          id?: string
          is_correct?: boolean | null
          points_awarded?: number
        }
        Update: {
          athlete_id?: string
          created_at?: string
          entry_id?: string
          event?: string
          id?: string
          is_correct?: boolean | null
          points_awarded?: number
        }
        Relationships: [
          {
            foreignKeyName: "pickem_picks_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pickem_picks_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: false
            referencedRelation: "pickem_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      roster_athletes: {
        Row: {
          acquired_at: string
          athlete_id: string
          dropped_at: string | null
          id: string
          roster_id: string
          slot_type: Database["public"]["Enums"]["roster_slot_type"]
        }
        Insert: {
          acquired_at?: string
          athlete_id: string
          dropped_at?: string | null
          id?: string
          roster_id: string
          slot_type?: Database["public"]["Enums"]["roster_slot_type"]
        }
        Update: {
          acquired_at?: string
          athlete_id?: string
          dropped_at?: string | null
          id?: string
          roster_id?: string
          slot_type?: Database["public"]["Enums"]["roster_slot_type"]
        }
        Relationships: [
          {
            foreignKeyName: "roster_athletes_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "roster_athletes_roster_id_fkey"
            columns: ["roster_id"]
            isOneToOne: false
            referencedRelation: "rosters"
            referencedColumns: ["id"]
          },
        ]
      }
      rosters: {
        Row: {
          created_at: string
          id: string
          league_id: string
          season_id: string
          total_salary_used: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          league_id: string
          season_id: string
          total_salary_used?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          league_id?: string
          season_id?: string
          total_salary_used?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rosters_league_id_fkey"
            columns: ["league_id"]
            isOneToOne: false
            referencedRelation: "leagues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rosters_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      scoring_events: {
        Row: {
          athlete_id: string
          base_points: number
          created_at: string
          dnf_insurance_applied: boolean
          event: string
          id: string
          mark: string | null
          meet_id: string
          place: number | null
          result: Database["public"]["Enums"]["finish_result"]
          tier_multiplier: number
          total_points: number
        }
        Insert: {
          athlete_id: string
          base_points?: number
          created_at?: string
          dnf_insurance_applied?: boolean
          event: string
          id?: string
          mark?: string | null
          meet_id: string
          place?: number | null
          result: Database["public"]["Enums"]["finish_result"]
          tier_multiplier?: number
          total_points: number
        }
        Update: {
          athlete_id?: string
          base_points?: number
          created_at?: string
          dnf_insurance_applied?: boolean
          event?: string
          id?: string
          mark?: string | null
          meet_id?: string
          place?: number | null
          result?: Database["public"]["Enums"]["finish_result"]
          tier_multiplier?: number
          total_points?: number
        }
        Relationships: [
          {
            foreignKeyName: "scoring_events_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scoring_events_meet_id_fkey"
            columns: ["meet_id"]
            isOneToOne: false
            referencedRelation: "meets"
            referencedColumns: ["id"]
          },
        ]
      }
      seasons: {
        Row: {
          created_at: string
          discipline: Database["public"]["Enums"]["season_discipline"]
          draft_opens_at: string
          ends_at: string
          id: string
          level: Database["public"]["Enums"]["season_level"]
          name: string
          roster_size: number
          salary_cap: number
          starting_slots: number
          starts_at: string
          status: Database["public"]["Enums"]["season_status"]
        }
        Insert: {
          created_at?: string
          discipline: Database["public"]["Enums"]["season_discipline"]
          draft_opens_at: string
          ends_at: string
          id?: string
          level: Database["public"]["Enums"]["season_level"]
          name: string
          roster_size?: number
          salary_cap?: number
          starting_slots?: number
          starts_at: string
          status?: Database["public"]["Enums"]["season_status"]
        }
        Update: {
          created_at?: string
          discipline?: Database["public"]["Enums"]["season_discipline"]
          draft_opens_at?: string
          ends_at?: string
          id?: string
          level?: Database["public"]["Enums"]["season_level"]
          name?: string
          roster_size?: number
          salary_cap?: number
          starting_slots?: number
          starts_at?: string
          status?: Database["public"]["Enums"]["season_status"]
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string
          id: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
          user_id: string
          username: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id: string
          username: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id?: string
          username?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_league_member: { Args: { p_league_id: string }; Returns: boolean }
    }
    Enums: {
      athlete_gender: "men" | "women"
      athlete_pool: "pro" | "college"
      draft_status: "pending" | "active" | "completed"
      finish_result: "completed" | "dnf" | "dns" | "dq" | "nh" | "nm"
      league_member_role: "commissioner" | "member"
      league_type: "public" | "private"
      meet_tier:
        | "world_championship"
        | "diamond_league"
        | "gold"
        | "silver"
        | "bronze"
        | "regular"
      roster_slot_type: "starter" | "bench" | "captain"
      season_discipline: "indoor" | "outdoor" | "cross_country"
      season_level: "pro" | "college"
      season_status: "upcoming" | "active" | "completed"
      user_role: "user" | "admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  storage: {
    Tables: {
      buckets: {
        Row: {
          allowed_mime_types: string[] | null
          avif_autodetection: boolean | null
          created_at: string | null
          file_size_limit: number | null
          id: string
          name: string
          owner: string | null
          owner_id: string | null
          public: boolean | null
          type: Database["storage"]["Enums"]["buckettype"]
          updated_at: string | null
        }
        Insert: {
          allowed_mime_types?: string[] | null
          avif_autodetection?: boolean | null
          created_at?: string | null
          file_size_limit?: number | null
          id: string
          name: string
          owner?: string | null
          owner_id?: string | null
          public?: boolean | null
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string | null
        }
        Update: {
          allowed_mime_types?: string[] | null
          avif_autodetection?: boolean | null
          created_at?: string | null
          file_size_limit?: number | null
          id?: string
          name?: string
          owner?: string | null
          owner_id?: string | null
          public?: boolean | null
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string | null
        }
        Relationships: []
      }
      buckets_analytics: {
        Row: {
          created_at: string
          deleted_at: string | null
          format: string
          id: string
          name: string
          type: Database["storage"]["Enums"]["buckettype"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          format?: string
          id?: string
          name: string
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          format?: string
          id?: string
          name?: string
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string
        }
        Relationships: []
      }
      buckets_vectors: {
        Row: {
          created_at: string
          id: string
          type: Database["storage"]["Enums"]["buckettype"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id: string
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string
        }
        Relationships: []
      }
      migrations: {
        Row: {
          executed_at: string | null
          hash: string
          id: number
          name: string
        }
        Insert: {
          executed_at?: string | null
          hash: string
          id: number
          name: string
        }
        Update: {
          executed_at?: string | null
          hash?: string
          id?: number
          name?: string
        }
        Relationships: []
      }
      objects: {
        Row: {
          bucket_id: string | null
          created_at: string | null
          id: string
          last_accessed_at: string | null
          metadata: Json | null
          name: string | null
          owner: string | null
          owner_id: string | null
          path_tokens: string[] | null
          updated_at: string | null
          user_metadata: Json | null
          version: string | null
        }
        Insert: {
          bucket_id?: string | null
          created_at?: string | null
          id?: string
          last_accessed_at?: string | null
          metadata?: Json | null
          name?: string | null
          owner?: string | null
          owner_id?: string | null
          path_tokens?: string[] | null
          updated_at?: string | null
          user_metadata?: Json | null
          version?: string | null
        }
        Update: {
          bucket_id?: string | null
          created_at?: string | null
          id?: string
          last_accessed_at?: string | null
          metadata?: Json | null
          name?: string | null
          owner?: string | null
          owner_id?: string | null
          path_tokens?: string[] | null
          updated_at?: string | null
          user_metadata?: Json | null
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "objects_bucketId_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
        ]
      }
      s3_multipart_uploads: {
        Row: {
          bucket_id: string
          created_at: string
          id: string
          in_progress_size: number
          key: string
          owner_id: string | null
          upload_signature: string
          user_metadata: Json | null
          version: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          id: string
          in_progress_size?: number
          key: string
          owner_id?: string | null
          upload_signature: string
          user_metadata?: Json | null
          version: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          id?: string
          in_progress_size?: number
          key?: string
          owner_id?: string | null
          upload_signature?: string
          user_metadata?: Json | null
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "s3_multipart_uploads_bucket_id_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
        ]
      }
      s3_multipart_uploads_parts: {
        Row: {
          bucket_id: string
          created_at: string
          etag: string
          id: string
          key: string
          owner_id: string | null
          part_number: number
          size: number
          upload_id: string
          version: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          etag: string
          id?: string
          key: string
          owner_id?: string | null
          part_number: number
          size?: number
          upload_id: string
          version: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          etag?: string
          id?: string
          key?: string
          owner_id?: string | null
          part_number?: number
          size?: number
          upload_id?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "s3_multipart_uploads_parts_bucket_id_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "s3_multipart_uploads_parts_upload_id_fkey"
            columns: ["upload_id"]
            isOneToOne: false
            referencedRelation: "s3_multipart_uploads"
            referencedColumns: ["id"]
          },
        ]
      }
      vector_indexes: {
        Row: {
          bucket_id: string
          created_at: string
          data_type: string
          dimension: number
          distance_metric: string
          id: string
          metadata_configuration: Json | null
          name: string
          updated_at: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          data_type: string
          dimension: number
          distance_metric: string
          id?: string
          metadata_configuration?: Json | null
          name: string
          updated_at?: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          data_type?: string
          dimension?: number
          distance_metric?: string
          id?: string
          metadata_configuration?: Json | null
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "vector_indexes_bucket_id_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets_vectors"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_insert_object: {
        Args: { bucketid: string; metadata: Json; name: string; owner: string }
        Returns: undefined
      }
      extension: { Args: { name: string }; Returns: string }
      filename: { Args: { name: string }; Returns: string }
      foldername: { Args: { name: string }; Returns: string[] }
      get_common_prefix: {
        Args: { p_delimiter: string; p_key: string; p_prefix: string }
        Returns: string
      }
      get_size_by_bucket: {
        Args: never
        Returns: {
          bucket_id: string
          size: number
        }[]
      }
      list_multipart_uploads_with_delimiter: {
        Args: {
          bucket_id: string
          delimiter_param: string
          max_keys?: number
          next_key_token?: string
          next_upload_token?: string
          prefix_param: string
        }
        Returns: {
          created_at: string
          id: string
          key: string
        }[]
      }
      list_objects_with_delimiter: {
        Args: {
          _bucket_id: string
          delimiter_param: string
          max_keys?: number
          next_token?: string
          prefix_param: string
          sort_order?: string
          start_after?: string
        }
        Returns: {
          created_at: string
          id: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
      operation: { Args: never; Returns: string }
      search: {
        Args: {
          bucketname: string
          levels?: number
          limits?: number
          offsets?: number
          prefix: string
          search?: string
          sortcolumn?: string
          sortorder?: string
        }
        Returns: {
          created_at: string
          id: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
      search_by_timestamp: {
        Args: {
          p_bucket_id: string
          p_level: number
          p_limit: number
          p_prefix: string
          p_sort_column: string
          p_sort_column_after: string
          p_sort_order: string
          p_start_after: string
        }
        Returns: {
          created_at: string
          id: string
          key: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
      search_v2: {
        Args: {
          bucket_name: string
          levels?: number
          limits?: number
          prefix: string
          sort_column?: string
          sort_column_after?: string
          sort_order?: string
          start_after?: string
        }
        Returns: {
          created_at: string
          id: string
          key: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
    }
    Enums: {
      buckettype: "STANDARD" | "ANALYTICS" | "VECTOR"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      athlete_gender: ["men", "women"],
      athlete_pool: ["pro", "college"],
      draft_status: ["pending", "active", "completed"],
      finish_result: ["completed", "dnf", "dns", "dq", "nh", "nm"],
      league_member_role: ["commissioner", "member"],
      league_type: ["public", "private"],
      meet_tier: [
        "world_championship",
        "diamond_league",
        "gold",
        "silver",
        "bronze",
        "regular",
      ],
      roster_slot_type: ["starter", "bench", "captain"],
      season_discipline: ["indoor", "outdoor", "cross_country"],
      season_level: ["pro", "college"],
      season_status: ["upcoming", "active", "completed"],
      user_role: ["user", "admin"],
    },
  },
  storage: {
    Enums: {
      buckettype: ["STANDARD", "ANALYTICS", "VECTOR"],
    },
  },
} as const
