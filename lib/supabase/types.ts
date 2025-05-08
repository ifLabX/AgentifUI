export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string | null
          avatar_url: string | null
          role: 'admin' | 'manager' | 'user'
          created_at: string
          updated_at: string
          last_login: string | null
          status: 'active' | 'suspended' | 'pending'
          auth_source: string | null
          sso_provider_id: string | null
        }
        Insert: {
          id: string
          full_name?: string | null
          avatar_url?: string | null
          role?: 'admin' | 'manager' | 'user'
          created_at?: string
          updated_at?: string
          last_login?: string | null
          status?: 'active' | 'suspended' | 'pending'
          auth_source?: string | null
          sso_provider_id?: string | null
        }
        Update: {
          id?: string
          full_name?: string | null
          avatar_url?: string | null
          role?: 'admin' | 'manager' | 'user'
          created_at?: string
          updated_at?: string
          last_login?: string | null
          status?: 'active' | 'suspended' | 'pending'
          auth_source?: string | null
          sso_provider_id?: string | null
        }
      }
      organizations: {
        Row: {
          id: string
          name: string
          logo_url: string | null
          settings: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          logo_url?: string | null
          settings?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          logo_url?: string | null
          settings?: Json
          created_at?: string
          updated_at?: string
        }
      }
      org_members: {
        Row: {
          id: string
          org_id: string
          user_id: string
          role: 'owner' | 'admin' | 'member'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          org_id: string
          user_id: string
          role?: 'owner' | 'admin' | 'member'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          org_id?: string
          user_id?: string
          role?: 'owner' | 'admin' | 'member'
          created_at?: string
          updated_at?: string
        }
      }
      ai_configs: {
        Row: {
          id: string
          org_id: string | null
          provider: string
          app_id: string | null
          api_key: string
          api_url: string
          settings: Json
          enabled: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          org_id?: string | null
          provider: string
          app_id?: string | null
          api_key: string
          api_url: string
          settings?: Json
          enabled?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          org_id?: string | null
          provider?: string
          app_id?: string | null
          api_key?: string
          api_url?: string
          settings?: Json
          enabled?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      conversations: {
        Row: {
          id: string
          org_id: string | null
          user_id: string
          ai_config_id: string | null
          title: string
          summary: string | null
          settings: Json
          created_at: string
          updated_at: string
          status: string
        }
        Insert: {
          id?: string
          org_id?: string | null
          user_id: string
          ai_config_id?: string | null
          title: string
          summary?: string | null
          settings?: Json
          created_at?: string
          updated_at?: string
          status?: string
        }
        Update: {
          id?: string
          org_id?: string | null
          user_id?: string
          ai_config_id?: string | null
          title?: string
          summary?: string | null
          settings?: Json
          created_at?: string
          updated_at?: string
          status?: string
        }
      }
      messages: {
        Row: {
          id: string
          conversation_id: string
          user_id: string | null
          role: 'user' | 'assistant' | 'system'
          content: string
          metadata: Json
          created_at: string
          status: 'sent' | 'delivered' | 'error'
        }
        Insert: {
          id?: string
          conversation_id: string
          user_id?: string | null
          role: 'user' | 'assistant' | 'system'
          content: string
          metadata?: Json
          created_at?: string
          status?: 'sent' | 'delivered' | 'error'
        }
        Update: {
          id?: string
          conversation_id?: string
          user_id?: string | null
          role?: 'user' | 'assistant' | 'system'
          content?: string
          metadata?: Json
          created_at?: string
          status?: 'sent' | 'delivered' | 'error'
        }
      }
      api_logs: {
        Row: {
          id: string
          user_id: string | null
          conversation_id: string | null
          provider: string
          endpoint: string
          request: Json
          response: Json
          status_code: number | null
          latency_ms: number | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          conversation_id?: string | null
          provider: string
          endpoint: string
          request?: Json
          response?: Json
          status_code?: number | null
          latency_ms?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          conversation_id?: string | null
          provider?: string
          endpoint?: string
          request?: Json
          response?: Json
          status_code?: number | null
          latency_ms?: number | null
          created_at?: string
        }
      }
      user_preferences: {
        Row: {
          id: string
          user_id: string
          theme: string
          language: string
          notification_settings: Json
          ai_preferences: Json
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          theme?: string
          language?: string
          notification_settings?: Json
          ai_preferences?: Json
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          theme?: string
          language?: string
          notification_settings?: Json
          ai_preferences?: Json
          updated_at?: string
        }
      }
      sso_providers: {
        Row: {
          id: string
          name: string
          protocol: 'SAML' | 'OAuth2' | 'OIDC'
          settings: Json
          client_id: string | null
          client_secret: string | null
          metadata_url: string | null
          enabled: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          protocol: 'SAML' | 'OAuth2' | 'OIDC'
          settings: Json
          client_id?: string | null
          client_secret?: string | null
          metadata_url?: string | null
          enabled?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          protocol?: 'SAML' | 'OAuth2' | 'OIDC'
          settings?: Json
          client_id?: string | null
          client_secret?: string | null
          metadata_url?: string | null
          enabled?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      domain_sso_mappings: {
        Row: {
          id: string
          domain: string
          sso_provider_id: string
          enabled: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          domain: string
          sso_provider_id: string
          enabled?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          domain?: string
          sso_provider_id?: string
          enabled?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      auth_settings: {
        Row: {
          id: string
          allow_email_registration: boolean
          allow_phone_registration: boolean
          allow_password_login: boolean
          require_email_verification: boolean
          password_policy: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          allow_email_registration?: boolean
          allow_phone_registration?: boolean
          allow_password_login?: boolean
          require_email_verification?: boolean
          password_policy?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          allow_email_registration?: boolean
          allow_phone_registration?: boolean
          allow_password_login?: boolean
          require_email_verification?: boolean
          password_policy?: Json
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_role: 'admin' | 'manager' | 'user'
      account_status: 'active' | 'suspended' | 'pending'
      org_member_role: 'owner' | 'admin' | 'member'
      message_role: 'user' | 'assistant' | 'system'
      message_status: 'sent' | 'delivered' | 'error'
      sso_protocol: 'SAML' | 'OAuth2' | 'OIDC'
    }
  }
}
