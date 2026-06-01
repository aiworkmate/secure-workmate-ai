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
      analytics: {
        Row: {
          conversation_id: string | null
          created_at: string
          detail: Json
          event_type: string
          id: string
          latency_ms: number
          mode: Database["public"]["Enums"]["ai_mode"]
          model: string | null
          organization_id: string | null
          status: string
          tokens_estimated: number
          tool_names: string[]
          user_id: string | null
          workspace_id: string | null
        }
        Insert: {
          conversation_id?: string | null
          created_at?: string
          detail?: Json
          event_type: string
          id?: string
          latency_ms?: number
          mode?: Database["public"]["Enums"]["ai_mode"]
          model?: string | null
          organization_id?: string | null
          status?: string
          tokens_estimated?: number
          tool_names?: string[]
          user_id?: string | null
          workspace_id?: string | null
        }
        Update: {
          conversation_id?: string | null
          created_at?: string
          detail?: Json
          event_type?: string
          id?: string
          latency_ms?: number
          mode?: Database["public"]["Enums"]["ai_mode"]
          model?: string | null
          organization_id?: string | null
          status?: string
          tokens_estimated?: number
          tool_names?: string[]
          user_id?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "analytics_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          actor_id: string | null
          created_at: string
          detail: Json
          event_type: string
          id: string
          ip_address: unknown
          organization_id: string | null
          status: string
          target_id: string | null
          target_table: string | null
          user_agent: string | null
          workspace_id: string | null
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          detail?: Json
          event_type: string
          id?: string
          ip_address?: unknown
          organization_id?: string | null
          status?: string
          target_id?: string | null
          target_table?: string | null
          user_agent?: string | null
          workspace_id?: string | null
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          detail?: Json
          event_type?: string
          id?: string
          ip_address?: unknown
          organization_id?: string | null
          status?: string
          target_id?: string | null
          target_table?: string | null
          user_agent?: string | null
          workspace_id?: string | null
        }
        Relationships: []
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          metadata: Json
          mode: Database["public"]["Enums"]["ai_mode"]
          organization_id: string
          summary: string | null
          title: string
          updated_at: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          metadata?: Json
          mode?: Database["public"]["Enums"]["ai_mode"]
          organization_id: string
          summary?: string | null
          title?: string
          updated_at?: string
          user_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          id?: string
          metadata?: Json
          mode?: Database["public"]["Enums"]["ai_mode"]
          organization_id?: string
          summary?: string | null
          title?: string
          updated_at?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_workspace_id_organization_id_fkey"
            columns: ["workspace_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id", "organization_id"]
          },
        ]
      }
      memories: {
        Row: {
          archived: boolean
          category: string
          confidence: number
          content: string
          created_at: string
          embedding: string | null
          frequency: number
          id: string
          importance: number
          kind: string
          last_used_at: string
          metadata: Json
          organization_id: string
          pinned: boolean
          source_message_id: string | null
          tags: string[]
          updated_at: string
          usefulness: number
          user_id: string
          workspace_id: string | null
        }
        Insert: {
          archived?: boolean
          category?: string
          confidence?: number
          content: string
          created_at?: string
          embedding?: string | null
          frequency?: number
          id?: string
          importance?: number
          kind?: string
          last_used_at?: string
          metadata?: Json
          organization_id: string
          pinned?: boolean
          source_message_id?: string | null
          tags?: string[]
          updated_at?: string
          usefulness?: number
          user_id: string
          workspace_id?: string | null
        }
        Update: {
          archived?: boolean
          category?: string
          confidence?: number
          content?: string
          created_at?: string
          embedding?: string | null
          frequency?: number
          id?: string
          importance?: number
          kind?: string
          last_used_at?: string
          metadata?: Json
          organization_id?: string
          pinned?: boolean
          source_message_id?: string | null
          tags?: string[]
          updated_at?: string
          usefulness?: number
          user_id?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "memories_source_message_id_fkey"
            columns: ["source_message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memories_workspace_id_organization_id_fkey"
            columns: ["workspace_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id", "organization_id"]
          },
        ]
      }
      memory_feedback: {
        Row: {
          conversation_id: string | null
          created_at: string
          helpful: boolean
          id: string
          impact: number
          memory_ids: string[]
          message_id: string | null
          note: string | null
          user_id: string
        }
        Insert: {
          conversation_id?: string | null
          created_at?: string
          helpful: boolean
          id?: string
          impact?: number
          memory_ids?: string[]
          message_id?: string | null
          note?: string | null
          user_id: string
        }
        Update: {
          conversation_id?: string | null
          created_at?: string
          helpful?: boolean
          id?: string
          impact?: number
          memory_ids?: string[]
          message_id?: string | null
          note?: string | null
          user_id?: string
        }
        Relationships: []
      }
      message_citations: {
        Row: {
          created_at: string
          id: string
          message_id: string
          metadata: Json
          organization_id: string
          snippet: string | null
          source_type: string
          title: string | null
          upload_id: string | null
          url: string | null
          workspace_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message_id: string
          metadata?: Json
          organization_id: string
          snippet?: string | null
          source_type: string
          title?: string | null
          upload_id?: string | null
          url?: string | null
          workspace_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message_id?: string
          metadata?: Json
          organization_id?: string
          snippet?: string | null
          source_type?: string
          title?: string | null
          upload_id?: string | null
          url?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_citations_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_citations_workspace_id_organization_id_fkey"
            columns: ["workspace_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id", "organization_id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          is_final_response: boolean
          metadata: Json
          model: string | null
          organization_id: string
          role: Database["public"]["Enums"]["message_role"]
          token_estimate: number
          tool_names: string[]
          upload_ids: string[]
          user_id: string | null
          workspace_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          is_final_response?: boolean
          metadata?: Json
          model?: string | null
          organization_id: string
          role: Database["public"]["Enums"]["message_role"]
          token_estimate?: number
          tool_names?: string[]
          upload_ids?: string[]
          user_id?: string | null
          workspace_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          is_final_response?: boolean
          metadata?: Json
          model?: string | null
          organization_id?: string
          role?: Database["public"]["Enums"]["message_role"]
          token_estimate?: number
          tool_names?: string[]
          upload_ids?: string[]
          user_id?: string | null
          workspace_id?: string
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
            foreignKeyName: "messages_workspace_id_organization_id_fkey"
            columns: ["workspace_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id", "organization_id"]
          },
        ]
      }
      organization_members: {
        Row: {
          created_at: string
          id: string
          invited_by: string | null
          organization_id: string
          role: Database["public"]["Enums"]["organization_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          invited_by?: string | null
          organization_id: string
          role?: Database["public"]["Enums"]["organization_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          invited_by?: string | null
          organization_id?: string
          role?: Database["public"]["Enums"]["organization_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          id: string
          metadata: Json
          name: string
          owner_id: string
          plan: string
          slug: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          metadata?: Json
          name: string
          owner_id: string
          plan?: string
          slug?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          metadata?: Json
          name?: string
          owner_id?: string
          plan?: string
          slug?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          default_organization_id: string | null
          default_workspace_id: string | null
          display_name: string | null
          email: string
          full_name: string | null
          id: string
          role: Database["public"]["Enums"]["profile_role"]
          settings: Json
          updated_at: string
          user_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          default_organization_id?: string | null
          default_workspace_id?: string | null
          display_name?: string | null
          email: string
          full_name?: string | null
          id: string
          role?: Database["public"]["Enums"]["profile_role"]
          settings?: Json
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          default_organization_id?: string | null
          default_workspace_id?: string | null
          display_name?: string | null
          email?: string
          full_name?: string | null
          id?: string
          role?: Database["public"]["Enums"]["profile_role"]
          settings?: Json
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_default_org_fk"
            columns: ["default_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_default_workspace_fk"
            columns: ["default_workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      response_outcomes: {
        Row: {
          chars: number
          conversation_id: string
          created_at: string
          id: string
          intent: string
          latency_ms: number
          live_used: boolean
          memory_hits: number
          user_id: string
          was_fallback: boolean
        }
        Insert: {
          chars?: number
          conversation_id: string
          created_at?: string
          id?: string
          intent: string
          latency_ms?: number
          live_used?: boolean
          memory_hits?: number
          user_id: string
          was_fallback?: boolean
        }
        Update: {
          chars?: number
          conversation_id?: string
          created_at?: string
          id?: string
          intent?: string
          latency_ms?: number
          live_used?: boolean
          memory_hits?: number
          user_id?: string
          was_fallback?: boolean
        }
        Relationships: []
      }
      routing_stats: {
        Row: {
          avg_latency_ms: number
          created_at: string
          failure_count: number
          id: string
          intent: string
          last_used_at: string
          live_used: boolean
          success_count: number
          user_id: string
        }
        Insert: {
          avg_latency_ms?: number
          created_at?: string
          failure_count?: number
          id?: string
          intent: string
          last_used_at?: string
          live_used?: boolean
          success_count?: number
          user_id: string
        }
        Update: {
          avg_latency_ms?: number
          created_at?: string
          failure_count?: number
          id?: string
          intent?: string
          last_used_at?: string
          live_used?: boolean
          success_count?: number
          user_id?: string
        }
        Relationships: []
      }
      settings: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          key: string
          organization_id: string | null
          scope: Database["public"]["Enums"]["setting_scope"]
          updated_at: string
          user_id: string | null
          value: Json
          workspace_id: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          key: string
          organization_id?: string | null
          scope: Database["public"]["Enums"]["setting_scope"]
          updated_at?: string
          user_id?: string | null
          value?: Json
          workspace_id?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          key?: string
          organization_id?: string | null
          scope?: Database["public"]["Enums"]["setting_scope"]
          updated_at?: string
          user_id?: string | null
          value?: Json
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "settings_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      tool_invocations: {
        Row: {
          conversation_id: string | null
          created_at: string
          error: string | null
          id: string
          input: Json
          latency_ms: number
          message_id: string | null
          organization_id: string
          output: Json
          status: string
          tool_name: string
          user_id: string | null
          workspace_id: string
        }
        Insert: {
          conversation_id?: string | null
          created_at?: string
          error?: string | null
          id?: string
          input?: Json
          latency_ms?: number
          message_id?: string | null
          organization_id: string
          output?: Json
          status?: string
          tool_name: string
          user_id?: string | null
          workspace_id: string
        }
        Update: {
          conversation_id?: string | null
          created_at?: string
          error?: string | null
          id?: string
          input?: Json
          latency_ms?: number
          message_id?: string | null
          organization_id?: string
          output?: Json
          status?: string
          tool_name?: string
          user_id?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tool_invocations_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tool_invocations_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tool_invocations_workspace_id_organization_id_fkey"
            columns: ["workspace_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id", "organization_id"]
          },
        ]
      }
      uploads: {
        Row: {
          bucket_id: string
          created_at: string
          embedding: string | null
          extracted_text: string | null
          id: string
          metadata: Json
          mime: string
          name: string
          organization_id: string
          size_bytes: number
          status: Database["public"]["Enums"]["upload_status"]
          storage_path: string
          summary: string | null
          updated_at: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          embedding?: string | null
          extracted_text?: string | null
          id?: string
          metadata?: Json
          mime: string
          name: string
          organization_id: string
          size_bytes?: number
          status?: Database["public"]["Enums"]["upload_status"]
          storage_path: string
          summary?: string | null
          updated_at?: string
          user_id: string
          workspace_id: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          embedding?: string | null
          extracted_text?: string | null
          id?: string
          metadata?: Json
          mime?: string
          name?: string
          organization_id?: string
          size_bytes?: number
          status?: Database["public"]["Enums"]["upload_status"]
          storage_path?: string
          summary?: string | null
          updated_at?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "uploads_workspace_id_organization_id_fkey"
            columns: ["workspace_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id", "organization_id"]
          },
        ]
      }
      user_memory: {
        Row: {
          content: string
          created_at: string
          id: string
          kind: string
          source_conversation_id: string | null
          updated_at: string
          user_id: string
          weight: number
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          kind?: string
          source_conversation_id?: string | null
          updated_at?: string
          user_id: string
          weight?: number
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          kind?: string
          source_conversation_id?: string | null
          updated_at?: string
          user_id?: string
          weight?: number
        }
        Relationships: []
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
      workflow_runs: {
        Row: {
          completed_at: string | null
          conversation_id: string | null
          error: string | null
          id: string
          input: Json
          metadata: Json
          organization_id: string
          output: Json
          started_at: string
          started_by: string | null
          status: Database["public"]["Enums"]["workflow_run_status"]
          workflow_id: string | null
          workspace_id: string
        }
        Insert: {
          completed_at?: string | null
          conversation_id?: string | null
          error?: string | null
          id?: string
          input?: Json
          metadata?: Json
          organization_id: string
          output?: Json
          started_at?: string
          started_by?: string | null
          status?: Database["public"]["Enums"]["workflow_run_status"]
          workflow_id?: string | null
          workspace_id: string
        }
        Update: {
          completed_at?: string | null
          conversation_id?: string | null
          error?: string | null
          id?: string
          input?: Json
          metadata?: Json
          organization_id?: string
          output?: Json
          started_at?: string
          started_by?: string | null
          status?: Database["public"]["Enums"]["workflow_run_status"]
          workflow_id?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflow_runs_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_runs_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "workflows"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_runs_workspace_id_organization_id_fkey"
            columns: ["workspace_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id", "organization_id"]
          },
        ]
      }
      workflows: {
        Row: {
          created_at: string
          created_by: string
          definition: Json
          description: string | null
          id: string
          metadata: Json
          name: string
          organization_id: string
          status: Database["public"]["Enums"]["workflow_status"]
          trigger_config: Json
          updated_at: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          definition?: Json
          description?: string | null
          id?: string
          metadata?: Json
          name: string
          organization_id: string
          status?: Database["public"]["Enums"]["workflow_status"]
          trigger_config?: Json
          updated_at?: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          definition?: Json
          description?: string | null
          id?: string
          metadata?: Json
          name?: string
          organization_id?: string
          status?: Database["public"]["Enums"]["workflow_status"]
          trigger_config?: Json
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflows_workspace_id_organization_id_fkey"
            columns: ["workspace_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id", "organization_id"]
          },
        ]
      }
      workspace_members: {
        Row: {
          created_at: string
          id: string
          organization_id: string
          role: Database["public"]["Enums"]["workspace_role"]
          updated_at: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id: string
          role?: Database["public"]["Enums"]["workspace_role"]
          updated_at?: string
          user_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string
          role?: Database["public"]["Enums"]["workspace_role"]
          updated_at?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_members_workspace_id_organization_id_fkey"
            columns: ["workspace_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id", "organization_id"]
          },
        ]
      }
      workspaces: {
        Row: {
          created_at: string
          created_by: string
          default_mode: Database["public"]["Enums"]["ai_mode"]
          id: string
          metadata: Json
          name: string
          organization_id: string
          slug: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          default_mode?: Database["public"]["Enums"]["ai_mode"]
          id?: string
          metadata?: Json
          name: string
          organization_id: string
          slug?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          default_mode?: Database["public"]["Enums"]["ai_mode"]
          id?: string
          metadata?: Json
          name?: string
          organization_id?: string
          slug?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspaces_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
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
      match_memories: {
        Args: {
          match_count?: number
          match_threshold?: number
          p_organization_id?: string
          p_workspace_id?: string
          query_embedding: string
        }
        Returns: {
          content: string
          created_at: string
          id: string
          importance: number
          kind: string
          metadata: Json
          organization_id: string
          similarity: number
          tags: string[]
          user_id: string
          workspace_id: string
        }[]
      }
    }
    Enums: {
      ai_mode: "general" | "medical"
      app_role: "admin" | "member"
      message_role: "user" | "assistant" | "system"
      organization_role: "owner" | "admin" | "member" | "viewer"
      profile_role: "user" | "admin" | "clinician" | "platform_admin"
      setting_scope: "user" | "organization" | "workspace"
      upload_status: "uploaded" | "processing" | "ready" | "failed" | "archived"
      workflow_run_status:
        | "queued"
        | "running"
        | "succeeded"
        | "failed"
        | "cancelled"
      workflow_status: "draft" | "active" | "paused" | "archived"
      workspace_role: "owner" | "admin" | "editor" | "viewer"
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
      ai_mode: ["general", "medical"],
      app_role: ["admin", "member"],
      message_role: ["user", "assistant", "system"],
      organization_role: ["owner", "admin", "member", "viewer"],
      profile_role: ["user", "admin", "clinician", "platform_admin"],
      setting_scope: ["user", "organization", "workspace"],
      upload_status: ["uploaded", "processing", "ready", "failed", "archived"],
      workflow_run_status: [
        "queued",
        "running",
        "succeeded",
        "failed",
        "cancelled",
      ],
      workflow_status: ["draft", "active", "paused", "archived"],
      workspace_role: ["owner", "admin", "editor", "viewer"],
    },
  },
} as const
