export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '12.2.3 (519615d)';
  };
  public: {
    Tables: {
      ai_configs: {
        Row: {
          api_key: string;
          api_url: string;
          app_id: string | null;
          created_at: string | null;
          enabled: boolean | null;
          id: string;
          org_id: string | null;
          provider: string;
          settings: Json | null;
          updated_at: string | null;
        };
        Insert: {
          api_key: string;
          api_url: string;
          app_id?: string | null;
          created_at?: string | null;
          enabled?: boolean | null;
          id?: string;
          org_id?: string | null;
          provider: string;
          settings?: Json | null;
          updated_at?: string | null;
        };
        Update: {
          api_key?: string;
          api_url?: string;
          app_id?: string | null;
          created_at?: string | null;
          enabled?: boolean | null;
          id?: string;
          org_id?: string | null;
          provider?: string;
          settings?: Json | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      api_keys: {
        Row: {
          created_at: string | null;
          id: string;
          is_default: boolean | null;
          key_value: string;
          last_used_at: string | null;
          provider_id: string | null;
          service_instance_id: string | null;
          updated_at: string | null;
          usage_count: number | null;
          user_id: string | null;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          is_default?: boolean | null;
          key_value: string;
          last_used_at?: string | null;
          provider_id?: string | null;
          service_instance_id?: string | null;
          updated_at?: string | null;
          usage_count?: number | null;
          user_id?: string | null;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          is_default?: boolean | null;
          key_value?: string;
          last_used_at?: string | null;
          provider_id?: string | null;
          service_instance_id?: string | null;
          updated_at?: string | null;
          usage_count?: number | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'api_keys_provider_id_fkey';
            columns: ['provider_id'];
            isOneToOne: false;
            referencedRelation: 'providers';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'api_keys_service_instance_id_fkey';
            columns: ['service_instance_id'];
            isOneToOne: false;
            referencedRelation: 'service_instances';
            referencedColumns: ['id'];
          },
        ];
      };
      api_logs: {
        Row: {
          conversation_id: string | null;
          created_at: string | null;
          endpoint: string;
          id: string;
          latency_ms: number | null;
          provider: string;
          request: Json | null;
          response: Json | null;
          status_code: number | null;
          user_id: string | null;
        };
        Insert: {
          conversation_id?: string | null;
          created_at?: string | null;
          endpoint: string;
          id?: string;
          latency_ms?: number | null;
          provider: string;
          request?: Json | null;
          response?: Json | null;
          status_code?: number | null;
          user_id?: string | null;
        };
        Update: {
          conversation_id?: string | null;
          created_at?: string | null;
          endpoint?: string;
          id?: string;
          latency_ms?: number | null;
          provider?: string;
          request?: Json | null;
          response?: Json | null;
          status_code?: number | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'api_logs_conversation_id_fkey';
            columns: ['conversation_id'];
            isOneToOne: false;
            referencedRelation: 'conversations';
            referencedColumns: ['id'];
          },
        ];
      };
      app_executions: {
        Row: {
          completed_at: string | null;
          created_at: string | null;
          elapsed_time: number | null;
          error_message: string | null;
          execution_type: Database['public']['Enums']['execution_type'];
          external_execution_id: string | null;
          id: string;
          inputs: Json;
          metadata: Json | null;
          outputs: Json | null;
          service_instance_id: string;
          status: Database['public']['Enums']['execution_status'];
          task_id: string | null;
          title: string;
          total_steps: number | null;
          total_tokens: number | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          completed_at?: string | null;
          created_at?: string | null;
          elapsed_time?: number | null;
          error_message?: string | null;
          execution_type: Database['public']['Enums']['execution_type'];
          external_execution_id?: string | null;
          id?: string;
          inputs?: Json;
          metadata?: Json | null;
          outputs?: Json | null;
          service_instance_id: string;
          status?: Database['public']['Enums']['execution_status'];
          task_id?: string | null;
          title: string;
          total_steps?: number | null;
          total_tokens?: number | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          completed_at?: string | null;
          created_at?: string | null;
          elapsed_time?: number | null;
          error_message?: string | null;
          execution_type?: Database['public']['Enums']['execution_type'];
          external_execution_id?: string | null;
          id?: string;
          inputs?: Json;
          metadata?: Json | null;
          outputs?: Json | null;
          service_instance_id?: string;
          status?: Database['public']['Enums']['execution_status'];
          task_id?: string | null;
          title?: string;
          total_steps?: number | null;
          total_tokens?: number | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'app_executions_service_instance_id_fkey';
            columns: ['service_instance_id'];
            isOneToOne: false;
            referencedRelation: 'service_instances';
            referencedColumns: ['id'];
          },
        ];
      };
      auth_settings: {
        Row: {
          allow_email_registration: boolean | null;
          allow_password_login: boolean | null;
          allow_phone_registration: boolean | null;
          created_at: string | null;
          id: string;
          password_policy: Json | null;
          require_email_verification: boolean | null;
          updated_at: string | null;
        };
        Insert: {
          allow_email_registration?: boolean | null;
          allow_password_login?: boolean | null;
          allow_phone_registration?: boolean | null;
          created_at?: string | null;
          id?: string;
          password_policy?: Json | null;
          require_email_verification?: boolean | null;
          updated_at?: string | null;
        };
        Update: {
          allow_email_registration?: boolean | null;
          allow_password_login?: boolean | null;
          allow_phone_registration?: boolean | null;
          created_at?: string | null;
          id?: string;
          password_policy?: Json | null;
          require_email_verification?: boolean | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      conversations: {
        Row: {
          ai_config_id: string | null;
          app_id: string | null;
          created_at: string | null;
          external_id: string | null;
          id: string;
          last_message_preview: string | null;
          metadata: Json | null;
          settings: Json | null;
          status: string | null;
          summary: string | null;
          title: string;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          ai_config_id?: string | null;
          app_id?: string | null;
          created_at?: string | null;
          external_id?: string | null;
          id?: string;
          last_message_preview?: string | null;
          metadata?: Json | null;
          settings?: Json | null;
          status?: string | null;
          summary?: string | null;
          title: string;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          ai_config_id?: string | null;
          app_id?: string | null;
          created_at?: string | null;
          external_id?: string | null;
          id?: string;
          last_message_preview?: string | null;
          metadata?: Json | null;
          settings?: Json | null;
          status?: string | null;
          summary?: string | null;
          title?: string;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'conversations_ai_config_id_fkey';
            columns: ['ai_config_id'];
            isOneToOne: false;
            referencedRelation: 'ai_configs';
            referencedColumns: ['id'];
          },
        ];
      };
      domain_sso_mappings: {
        Row: {
          created_at: string | null;
          domain: string;
          enabled: boolean | null;
          id: string;
          sso_provider_id: string;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          domain: string;
          enabled?: boolean | null;
          id?: string;
          sso_provider_id: string;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          domain?: string;
          enabled?: boolean | null;
          id?: string;
          sso_provider_id?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'domain_sso_mappings_sso_provider_id_fkey';
            columns: ['sso_provider_id'];
            isOneToOne: false;
            referencedRelation: 'sso_providers';
            referencedColumns: ['id'];
          },
        ];
      };
      group_app_permissions: {
        Row: {
          created_at: string | null;
          group_id: string | null;
          id: string;
          is_enabled: boolean | null;
          service_instance_id: string | null;
          usage_quota: number | null;
          used_count: number | null;
        };
        Insert: {
          created_at?: string | null;
          group_id?: string | null;
          id?: string;
          is_enabled?: boolean | null;
          service_instance_id?: string | null;
          usage_quota?: number | null;
          used_count?: number | null;
        };
        Update: {
          created_at?: string | null;
          group_id?: string | null;
          id?: string;
          is_enabled?: boolean | null;
          service_instance_id?: string | null;
          usage_quota?: number | null;
          used_count?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'group_app_permissions_group_id_fkey';
            columns: ['group_id'];
            isOneToOne: false;
            referencedRelation: 'groups';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'group_app_permissions_service_instance_id_fkey';
            columns: ['service_instance_id'];
            isOneToOne: false;
            referencedRelation: 'service_instances';
            referencedColumns: ['id'];
          },
        ];
      };
      group_members: {
        Row: {
          created_at: string | null;
          group_id: string | null;
          id: string;
          user_id: string | null;
        };
        Insert: {
          created_at?: string | null;
          group_id?: string | null;
          id?: string;
          user_id?: string | null;
        };
        Update: {
          created_at?: string | null;
          group_id?: string | null;
          id?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'group_members_group_id_fkey';
            columns: ['group_id'];
            isOneToOne: false;
            referencedRelation: 'groups';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'group_members_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      groups: {
        Row: {
          created_at: string | null;
          created_by: string | null;
          description: string | null;
          id: string;
          name: string;
        };
        Insert: {
          created_at?: string | null;
          created_by?: string | null;
          description?: string | null;
          id?: string;
          name: string;
        };
        Update: {
          created_at?: string | null;
          created_by?: string | null;
          description?: string | null;
          id?: string;
          name?: string;
        };
        Relationships: [];
      };
      messages: {
        Row: {
          content: string;
          conversation_id: string;
          created_at: string | null;
          external_id: string | null;
          id: string;
          is_synced: boolean | null;
          metadata: Json | null;
          role: Database['public']['Enums']['message_role'];
          sequence_index: number | null;
          status: Database['public']['Enums']['message_status'] | null;
          token_count: number | null;
          user_id: string | null;
        };
        Insert: {
          content: string;
          conversation_id: string;
          created_at?: string | null;
          external_id?: string | null;
          id?: string;
          is_synced?: boolean | null;
          metadata?: Json | null;
          role: Database['public']['Enums']['message_role'];
          sequence_index?: number | null;
          status?: Database['public']['Enums']['message_status'] | null;
          token_count?: number | null;
          user_id?: string | null;
        };
        Update: {
          content?: string;
          conversation_id?: string;
          created_at?: string | null;
          external_id?: string | null;
          id?: string;
          is_synced?: boolean | null;
          metadata?: Json | null;
          role?: Database['public']['Enums']['message_role'];
          sequence_index?: number | null;
          status?: Database['public']['Enums']['message_status'] | null;
          token_count?: number | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'messages_conversation_id_fkey';
            columns: ['conversation_id'];
            isOneToOne: false;
            referencedRelation: 'conversations';
            referencedColumns: ['id'];
          },
        ];
      };
      profiles: {
        Row: {
          auth_source: string;
          avatar_url: string | null;
          created_at: string | null;
          email: string | null;
          employee_number: string | null;
          full_name: string | null;
          id: string;
          last_login: string | null;
          phone: string | null;
          role: Database['public']['Enums']['user_role'] | null;
          sso_provider_id: string | null;
          status: Database['public']['Enums']['account_status'] | null;
          updated_at: string | null;
          username: string | null;
        };
        Insert: {
          auth_source: string;
          avatar_url?: string | null;
          created_at?: string | null;
          email?: string | null;
          employee_number?: string | null;
          full_name?: string | null;
          id: string;
          last_login?: string | null;
          phone?: string | null;
          role?: Database['public']['Enums']['user_role'] | null;
          sso_provider_id?: string | null;
          status?: Database['public']['Enums']['account_status'] | null;
          updated_at?: string | null;
          username?: string | null;
        };
        Update: {
          auth_source?: string;
          avatar_url?: string | null;
          created_at?: string | null;
          email?: string | null;
          employee_number?: string | null;
          full_name?: string | null;
          id?: string;
          last_login?: string | null;
          phone?: string | null;
          role?: Database['public']['Enums']['user_role'] | null;
          sso_provider_id?: string | null;
          status?: Database['public']['Enums']['account_status'] | null;
          updated_at?: string | null;
          username?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'profiles_sso_provider_id_fkey';
            columns: ['sso_provider_id'];
            isOneToOne: false;
            referencedRelation: 'sso_providers';
            referencedColumns: ['id'];
          },
        ];
      };
      providers: {
        Row: {
          auth_type: string;
          base_url: string;
          created_at: string | null;
          id: string;
          is_active: boolean | null;
          is_default: boolean | null;
          name: string;
          type: string;
          updated_at: string | null;
        };
        Insert: {
          auth_type: string;
          base_url: string;
          created_at?: string | null;
          id?: string;
          is_active?: boolean | null;
          is_default?: boolean | null;
          name: string;
          type: string;
          updated_at?: string | null;
        };
        Update: {
          auth_type?: string;
          base_url?: string;
          created_at?: string | null;
          id?: string;
          is_active?: boolean | null;
          is_default?: boolean | null;
          name?: string;
          type?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      service_instances: {
        Row: {
          api_path: string | null;
          config: Json | null;
          created_at: string | null;
          description: string | null;
          display_name: string | null;
          id: string;
          instance_id: string;
          is_default: boolean | null;
          provider_id: string | null;
          updated_at: string | null;
          visibility: string | null;
        };
        Insert: {
          api_path?: string | null;
          config?: Json | null;
          created_at?: string | null;
          description?: string | null;
          display_name?: string | null;
          id?: string;
          instance_id: string;
          is_default?: boolean | null;
          provider_id?: string | null;
          updated_at?: string | null;
          visibility?: string | null;
        };
        Update: {
          api_path?: string | null;
          config?: Json | null;
          created_at?: string | null;
          description?: string | null;
          display_name?: string | null;
          id?: string;
          instance_id?: string;
          is_default?: boolean | null;
          provider_id?: string | null;
          updated_at?: string | null;
          visibility?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'service_instances_provider_id_fkey';
            columns: ['provider_id'];
            isOneToOne: false;
            referencedRelation: 'providers';
            referencedColumns: ['id'];
          },
        ];
      };
      sso_providers: {
        Row: {
          button_text: string | null;
          client_id: string | null;
          client_secret: string | null;
          created_at: string | null;
          display_order: number | null;
          enabled: boolean | null;
          id: string;
          metadata_url: string | null;
          name: string;
          protocol: Database['public']['Enums']['sso_protocol'];
          settings: Json;
          updated_at: string | null;
        };
        Insert: {
          button_text?: string | null;
          client_id?: string | null;
          client_secret?: string | null;
          created_at?: string | null;
          display_order?: number | null;
          enabled?: boolean | null;
          id?: string;
          metadata_url?: string | null;
          name: string;
          protocol: Database['public']['Enums']['sso_protocol'];
          settings?: Json;
          updated_at?: string | null;
        };
        Update: {
          button_text?: string | null;
          client_id?: string | null;
          client_secret?: string | null;
          created_at?: string | null;
          display_order?: number | null;
          enabled?: boolean | null;
          id?: string;
          metadata_url?: string | null;
          name?: string;
          protocol?: Database['public']['Enums']['sso_protocol'];
          settings?: Json;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      user_preferences: {
        Row: {
          ai_preferences: Json | null;
          id: string;
          language: string | null;
          notification_settings: Json | null;
          theme: string | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          ai_preferences?: Json | null;
          id?: string;
          language?: string | null;
          notification_settings?: Json | null;
          theme?: string | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          ai_preferences?: Json | null;
          id?: string;
          language?: string | null;
          notification_settings?: Json | null;
          theme?: string | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      public_sso_providers: {
        Row: {
          button_text: string | null;
          created_at: string | null;
          display_order: number | null;
          enabled: boolean | null;
          id: string | null;
          name: string | null;
          protocol: string | null;
          settings: Json | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      check_user_app_permission: {
        Args:
          | { p_user_id: string; p_service_instance_id: string }
          | { user_id: string; app_instance_id: string };
        Returns: {
          has_access: boolean;
          permission_level: string;
          quota_remaining: number;
          error_message: string;
        }[];
      };
      cleanup_orphan_data: {
        Args: Record<PropertyKey, never>;
        Returns: {
          cleanup_type: string;
          records_affected: number;
        }[];
      };
      create_default_permissions_for_department: {
        Args: { target_org_id: string; target_department: string };
        Returns: number;
      };
      create_sso_user: {
        Args: {
          emp_number: string;
          user_name: string;
          sso_provider_uuid: string;
        };
        Returns: string;
      };
      filter_sensitive_sso_settings: {
        Args: { settings_input: Json };
        Returns: Json;
      };
      find_user_by_employee_number: {
        Args: { emp_num: string };
        Returns: {
          user_id: string;
          full_name: string;
          username: string;
          employee_number: string;
          last_login: string;
          auth_source: string;
          status: Database['public']['Enums']['account_status'];
        }[];
      };
      get_admin_user_count: {
        Args: {
          p_role?: Database['public']['Enums']['user_role'];
          p_status?: Database['public']['Enums']['account_status'];
          p_auth_source?: string;
          p_search?: string;
        };
        Returns: number;
      };
      get_admin_user_list: {
        Args: {
          p_role?: Database['public']['Enums']['user_role'];
          p_status?: Database['public']['Enums']['account_status'];
          p_auth_source?: string;
          p_search?: string;
          p_sort_by?: string;
          p_sort_order?: string;
          p_page?: number;
          p_page_size?: number;
        };
        Returns: {
          id: string;
          full_name: string;
          username: string;
          avatar_url: string;
          role: Database['public']['Enums']['user_role'];
          status: Database['public']['Enums']['account_status'];
          created_at: string;
          updated_at: string;
          last_login: string;
          auth_source: string;
          sso_provider_id: string;
          email: string;
          phone: string;
          email_confirmed_at: string;
          phone_confirmed_at: string;
          last_sign_in_at: string;
        }[];
      };
      get_admin_users: {
        Args: { user_ids?: string[] };
        Returns: {
          id: string;
          email: string;
          phone: string;
          email_confirmed_at: string;
          phone_confirmed_at: string;
          created_at: string;
          updated_at: string;
          last_sign_in_at: string;
        }[];
      };
      get_enabled_sso_providers: {
        Args: { protocol_filter?: string };
        Returns: {
          id: string;
          name: string;
          protocol: string;
          button_text: string;
          display_order: number;
          settings: Json;
        }[];
      };
      get_public_sso_providers: {
        Args: Record<PropertyKey, never>;
        Returns: {
          id: string;
          name: string;
          protocol: string;
          enabled: boolean;
          display_order: number;
          button_text: string;
          settings: Json;
          created_at: string;
        }[];
      };
      get_sso_provider_config: {
        Args: { provider_id_param: string };
        Returns: {
          id: string;
          name: string;
          protocol: string;
          settings: Json;
          enabled: boolean;
        }[];
      };
      get_user_accessible_apps: {
        Args: { p_user_id: string };
        Returns: {
          service_instance_id: string;
          display_name: string;
          description: string;
          instance_id: string;
          api_path: string;
          visibility: string;
          config: Json;
          usage_quota: number;
          used_count: number;
          quota_remaining: number;
          group_name: string;
        }[];
      };
      get_user_auth_providers: {
        Args: { user_id: string };
        Returns: string[];
      };
      get_user_detail: {
        Args: { target_user_id: string };
        Returns: {
          id: string;
          email: string;
          phone: string;
          email_confirmed_at: string;
          phone_confirmed_at: string;
          created_at: string;
          updated_at: string;
          last_sign_in_at: string;
          full_name: string;
          username: string;
          avatar_url: string;
          role: Database['public']['Enums']['user_role'];
          status: Database['public']['Enums']['account_status'];
          auth_source: string;
          sso_provider_id: string;
          profile_created_at: string;
          profile_updated_at: string;
          last_login: string;
        }[];
      };
      get_user_detail_for_admin: {
        Args: { target_user_id: string };
        Returns: {
          id: string;
          full_name: string;
          username: string;
          avatar_url: string;
          role: Database['public']['Enums']['user_role'];
          status: Database['public']['Enums']['account_status'];
          created_at: string;
          updated_at: string;
          last_login: string;
          auth_source: string;
          sso_provider_id: string;
          has_email: boolean;
          email_confirmed: boolean;
          has_phone: boolean;
          phone_confirmed: boolean;
          last_sign_in_at: string;
        }[];
      };
      get_user_oauth_provider: {
        Args: { user_id: string };
        Returns: {
          provider: string;
          provider_id: string;
          email: string;
          name: string;
          avatar_url: string;
        }[];
      };
      get_user_stats: {
        Args: Record<PropertyKey, never>;
        Returns: Json;
      };
      increment_app_usage: {
        Args:
          | {
              p_user_id: string;
              p_service_instance_id: string;
              p_increment?: number;
            }
          | { user_id: string; app_instance_id: string };
        Returns: boolean;
      };
      initialize_admin: {
        Args: { admin_email: string };
        Returns: undefined;
      };
      is_admin: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      reset_monthly_quotas: {
        Args: Record<PropertyKey, never>;
        Returns: number;
      };
      safe_batch_update_role: {
        Args: {
          target_user_ids: string[];
          target_role: Database['public']['Enums']['user_role'];
        };
        Returns: number;
      };
      safe_cleanup_orphan_data: {
        Args: { dry_run?: boolean };
        Returns: {
          cleanup_type: string;
          records_found: number;
          action_taken: string;
        }[];
      };
      safe_delete_user: {
        Args: { target_user_id: string };
        Returns: boolean;
      };
      set_default_service_instance: {
        Args: { target_instance_id: string; target_provider_id: string };
        Returns: undefined;
      };
      setup_test_organizations: {
        Args: { admin_user_id: string };
        Returns: string;
      };
      update_sso_user_login: {
        Args: { user_uuid: string };
        Returns: boolean;
      };
      validate_auth_source_sync: {
        Args: Record<PropertyKey, never>;
        Returns: {
          user_id: string;
          profile_auth_source: string;
          actual_provider: string;
          is_synced: boolean;
        }[];
      };
    };
    Enums: {
      account_status: 'active' | 'suspended' | 'pending';
      execution_status:
        | 'pending'
        | 'running'
        | 'completed'
        | 'failed'
        | 'stopped'
        | 'deleted';
      execution_type: 'workflow' | 'text-generation';
      message_role: 'user' | 'assistant' | 'system';
      message_status: 'sent' | 'delivered' | 'error';
      sso_protocol: 'SAML' | 'OAuth2' | 'OIDC' | 'CAS';
      user_role: 'admin' | 'manager' | 'user';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  'public'
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] &
        DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] &
        DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      account_status: ['active', 'suspended', 'pending'],
      execution_status: [
        'pending',
        'running',
        'completed',
        'failed',
        'stopped',
        'deleted',
      ],
      execution_type: ['workflow', 'text-generation'],
      message_role: ['user', 'assistant', 'system'],
      message_status: ['sent', 'delivered', 'error'],
      sso_protocol: ['SAML', 'OAuth2', 'OIDC', 'CAS'],
      user_role: ['admin', 'manager', 'user'],
    },
  },
} as const;
