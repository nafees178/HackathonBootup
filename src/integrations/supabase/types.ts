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
      conversations: {
        Row: {
          created_at: string | null
          id: string
          participant1_id: string
          participant2_id: string
          request_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          participant1_id: string
          participant2_id: string
          request_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          participant1_id?: string
          participant2_id?: string
          request_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversations_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "requests"
            referencedColumns: ["id"]
          },
        ]
      }
      deals: {
        Row: {
          accepter_id: string
          accepter_task_completed: boolean | null
          accepter_verified_requester: boolean | null
          cancellation_agreed: boolean | null
          cancellation_requested_by: string | null
          completed_at: string | null
          created_at: string | null
          id: string
          prerequisite_completed: boolean | null
          request_id: string
          requester_id: string
          requester_task_completed: boolean | null
          requester_verified_accepter: boolean | null
          status: Database["public"]["Enums"]["deal_status"] | null
          updated_at: string | null
        }
        Insert: {
          accepter_id: string
          accepter_task_completed?: boolean | null
          accepter_verified_requester?: boolean | null
          cancellation_agreed?: boolean | null
          cancellation_requested_by?: string | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          prerequisite_completed?: boolean | null
          request_id: string
          requester_id: string
          requester_task_completed?: boolean | null
          requester_verified_accepter?: boolean | null
          status?: Database["public"]["Enums"]["deal_status"] | null
          updated_at?: string | null
        }
        Update: {
          accepter_id?: string
          accepter_task_completed?: boolean | null
          accepter_verified_requester?: boolean | null
          cancellation_agreed?: boolean | null
          cancellation_requested_by?: string | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          prerequisite_completed?: boolean | null
          request_id?: string
          requester_id?: string
          requester_task_completed?: boolean | null
          requester_verified_accepter?: boolean | null
          status?: Database["public"]["Enums"]["deal_status"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "deals_accepter_id_fkey"
            columns: ["accepter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      disputes: {
        Row: {
          created_at: string | null
          deal_id: string
          id: string
          reason: string
          reported_against: string
          reported_by: string
          resolution: string | null
          resolved_at: string | null
          resolved_by: string | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          deal_id: string
          id?: string
          reason: string
          reported_against: string
          reported_by: string
          resolution?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          deal_id?: string
          id?: string
          reason?: string
          reported_against?: string
          reported_by?: string
          resolution?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "disputes_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disputes_reported_against_fkey"
            columns: ["reported_against"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disputes_reported_by_fkey"
            columns: ["reported_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disputes_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          conversation_id: string | null
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string
          receiver_id: string
          request_id: string | null
          sender_id: string
          subject: string
        }
        Insert: {
          conversation_id?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          receiver_id: string
          request_id?: string | null
          sender_id: string
          subject: string
        }
        Update: {
          conversation_id?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          receiver_id?: string
          request_id?: string | null
          sender_id?: string
          subject?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          completed_deals: number | null
          created_at: string | null
          education: string | null
          full_name: string | null
          github: string | null
          id: string
          linkedin: string | null
          location: string | null
          phone: string | null
          portfolio_description: string | null
          reputation_score: number | null
          skills: string[] | null
          total_deals: number | null
          twitter: string | null
          updated_at: string | null
          username: string
          website: string | null
          work_experience: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          completed_deals?: number | null
          created_at?: string | null
          education?: string | null
          full_name?: string | null
          github?: string | null
          id: string
          linkedin?: string | null
          location?: string | null
          phone?: string | null
          portfolio_description?: string | null
          reputation_score?: number | null
          skills?: string[] | null
          total_deals?: number | null
          twitter?: string | null
          updated_at?: string | null
          username: string
          website?: string | null
          work_experience?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          completed_deals?: number | null
          created_at?: string | null
          education?: string | null
          full_name?: string | null
          github?: string | null
          id?: string
          linkedin?: string | null
          location?: string | null
          phone?: string | null
          portfolio_description?: string | null
          reputation_score?: number | null
          skills?: string[] | null
          total_deals?: number | null
          twitter?: string | null
          updated_at?: string | null
          username?: string
          website?: string | null
          work_experience?: string | null
        }
        Relationships: []
      }
      request_interests: {
        Row: {
          created_at: string | null
          id: string
          message: string | null
          request_id: string
          status: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          message?: string | null
          request_id: string
          status?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string | null
          request_id?: string
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "request_interests_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "request_interests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      requests: {
        Row: {
          category: string
          created_at: string | null
          deadline: string | null
          description: string
          dropoff_location: string | null
          has_prerequisite: boolean | null
          id: string
          images: string[] | null
          money_amount: number | null
          offering: string
          pickup_location: string | null
          prerequisite_description: string | null
          request_type: Database["public"]["Enums"]["request_type"]
          seeking: string
          status: Database["public"]["Enums"]["request_status"] | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          category: string
          created_at?: string | null
          deadline?: string | null
          description: string
          dropoff_location?: string | null
          has_prerequisite?: boolean | null
          id?: string
          images?: string[] | null
          money_amount?: number | null
          offering: string
          pickup_location?: string | null
          prerequisite_description?: string | null
          request_type: Database["public"]["Enums"]["request_type"]
          seeking: string
          status?: Database["public"]["Enums"]["request_status"] | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string | null
          deadline?: string | null
          description?: string
          dropoff_location?: string | null
          has_prerequisite?: boolean | null
          id?: string
          images?: string[] | null
          money_amount?: number | null
          offering?: string
          pickup_location?: string | null
          prerequisite_description?: string | null
          request_type?: Database["public"]["Enums"]["request_type"]
          seeking?: string
          status?: Database["public"]["Enums"]["request_status"] | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          comment: string | null
          created_at: string | null
          deal_id: string
          id: string
          rating: number
          reviewee_id: string
          reviewer_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string | null
          deal_id: string
          id?: string
          rating: number
          reviewee_id: string
          reviewer_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string | null
          deal_id?: string
          id?: string
          rating?: number
          reviewee_id?: string
          reviewer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_reviewee_id_fkey"
            columns: ["reviewee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_badges: {
        Row: {
          badge_type: Database["public"]["Enums"]["badge_type"]
          earned_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          badge_type: Database["public"]["Enums"]["badge_type"]
          earned_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          badge_type?: Database["public"]["Enums"]["badge_type"]
          earned_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          granted_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          granted_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          granted_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "user" | "mediator" | "admin"
      badge_type:
        | "trusted"
        | "fast_responder"
        | "skill_master"
        | "fair_trader"
        | "prerequisite_ready"
      deal_status:
        | "pending"
        | "active"
        | "prerequisite_pending"
        | "completed"
        | "cancelled"
        | "disputed"
      request_status:
        | "open"
        | "in_progress"
        | "completed"
        | "cancelled"
        | "disputed"
      request_type:
        | "skill_for_skill"
        | "skill_for_item"
        | "skill_for_money"
        | "item_for_skill"
        | "item_for_item"
        | "item_for_money"
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
      app_role: ["user", "mediator", "admin"],
      badge_type: [
        "trusted",
        "fast_responder",
        "skill_master",
        "fair_trader",
        "prerequisite_ready",
      ],
      deal_status: [
        "pending",
        "active",
        "prerequisite_pending",
        "completed",
        "cancelled",
        "disputed",
      ],
      request_status: [
        "open",
        "in_progress",
        "completed",
        "cancelled",
        "disputed",
      ],
      request_type: [
        "skill_for_skill",
        "skill_for_item",
        "skill_for_money",
        "item_for_skill",
        "item_for_item",
        "item_for_money",
      ],
    },
  },
} as const
