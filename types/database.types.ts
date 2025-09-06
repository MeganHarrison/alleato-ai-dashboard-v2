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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      __drizzle_migrations: {
        Row: {
          created_at: string | null
          hash: string
        }
        Insert: {
          created_at?: string | null
          hash: string
        }
        Update: {
          created_at?: string | null
          hash?: string
        }
        Relationships: []
      }
      ai_insights: {
        Row: {
          confidence_score: number | null
          created_at: string | null
          description: string
          id: number
          insight_type: string | null
          meeting_id: string | null
          project_id: number | null
          resolved: number | null
          severity: string | null
          source_meetings: string | null
          title: string
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string | null
          description: string
          id?: number
          insight_type?: string | null
          meeting_id?: string | null
          project_id?: number | null
          resolved?: number | null
          severity?: string | null
          source_meetings?: string | null
          title: string
        }
        Update: {
          confidence_score?: number | null
          created_at?: string | null
          description?: string
          id?: number
          insight_type?: string | null
          meeting_id?: string | null
          project_id?: number | null
          resolved?: number | null
          severity?: string | null
          source_meetings?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_insights_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meeting_statistics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_insights_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_insights_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings_with_project"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_insights_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_sdk5_chats: {
        Row: {
          id: string
        }
        Insert: {
          id?: string
        }
        Update: {
          id?: string
        }
        Relationships: []
      }
      ai_sdk5_messages: {
        Row: {
          chatId: string
          createdAt: string
          id: string
          role: string
        }
        Insert: {
          chatId: string
          createdAt?: string
          id?: string
          role: string
        }
        Update: {
          chatId?: string
          createdAt?: string
          id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_sdk5_messages_chatId_fkey"
            columns: ["chatId"]
            isOneToOne: false
            referencedRelation: "ai_sdk5_chats"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_sdk5_parts: {
        Row: {
          createdAt: string
          data_meetingresults_analysis: Json | null
          data_meetingresults_chunks: Json | null
          data_meetingresults_id: string | null
          data_meetingresults_insights: Json | null
          data_weather_id: string | null
          data_weather_location: string | null
          data_weather_temperature: number | null
          data_weather_weather: string | null
          file_filename: string | null
          file_mediatype: string | null
          file_url: string | null
          id: string
          messageId: string
          order: number
          providermetadata: Json | null
          reasoning_text: string | null
          source_document_filename: string | null
          source_document_mediatype: string | null
          source_document_sourceid: string | null
          source_document_title: string | null
          source_url_sourceid: string | null
          source_url_title: string | null
          source_url_url: string | null
          text_text: string | null
          tool_errortext: string | null
          tool_searchmeetings_input: Json | null
          tool_searchmeetings_output: Json | null
          tool_state: string | null
          tool_toolcallid: string | null
          type: string
        }
        Insert: {
          createdAt?: string
          data_meetingresults_analysis?: Json | null
          data_meetingresults_chunks?: Json | null
          data_meetingresults_id?: string | null
          data_meetingresults_insights?: Json | null
          data_weather_id?: string | null
          data_weather_location?: string | null
          data_weather_temperature?: number | null
          data_weather_weather?: string | null
          file_filename?: string | null
          file_mediatype?: string | null
          file_url?: string | null
          id?: string
          messageId: string
          order?: number
          providermetadata?: Json | null
          reasoning_text?: string | null
          source_document_filename?: string | null
          source_document_mediatype?: string | null
          source_document_sourceid?: string | null
          source_document_title?: string | null
          source_url_sourceid?: string | null
          source_url_title?: string | null
          source_url_url?: string | null
          text_text?: string | null
          tool_errortext?: string | null
          tool_searchmeetings_input?: Json | null
          tool_searchmeetings_output?: Json | null
          tool_state?: string | null
          tool_toolcallid?: string | null
          type: string
        }
        Update: {
          createdAt?: string
          data_meetingresults_analysis?: Json | null
          data_meetingresults_chunks?: Json | null
          data_meetingresults_id?: string | null
          data_meetingresults_insights?: Json | null
          data_weather_id?: string | null
          data_weather_location?: string | null
          data_weather_temperature?: number | null
          data_weather_weather?: string | null
          file_filename?: string | null
          file_mediatype?: string | null
          file_url?: string | null
          id?: string
          messageId?: string
          order?: number
          providermetadata?: Json | null
          reasoning_text?: string | null
          source_document_filename?: string | null
          source_document_mediatype?: string | null
          source_document_sourceid?: string | null
          source_document_title?: string | null
          source_url_sourceid?: string | null
          source_url_title?: string | null
          source_url_url?: string | null
          text_text?: string | null
          tool_errortext?: string | null
          tool_searchmeetings_input?: Json | null
          tool_searchmeetings_output?: Json | null
          tool_state?: string | null
          tool_toolcallid?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_sdk5_parts_messageId_fkey"
            columns: ["messageId"]
            isOneToOne: false
            referencedRelation: "ai_sdk5_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      archon_code_examples: {
        Row: {
          chunk_number: number
          content: string
          created_at: string
          embedding: string | null
          id: number
          metadata: Json
          source_id: string
          summary: string
          url: string
        }
        Insert: {
          chunk_number: number
          content: string
          created_at?: string
          embedding?: string | null
          id?: number
          metadata?: Json
          source_id: string
          summary: string
          url: string
        }
        Update: {
          chunk_number?: number
          content?: string
          created_at?: string
          embedding?: string | null
          id?: number
          metadata?: Json
          source_id?: string
          summary?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "archon_code_examples_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "archon_sources"
            referencedColumns: ["source_id"]
          },
        ]
      }
      archon_crawled_pages: {
        Row: {
          chunk_number: number
          content: string
          created_at: string
          embedding: string | null
          id: number
          metadata: Json
          source_id: string
          url: string
        }
        Insert: {
          chunk_number: number
          content: string
          created_at?: string
          embedding?: string | null
          id?: number
          metadata?: Json
          source_id: string
          url: string
        }
        Update: {
          chunk_number?: number
          content?: string
          created_at?: string
          embedding?: string | null
          id?: number
          metadata?: Json
          source_id?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "archon_crawled_pages_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "archon_sources"
            referencedColumns: ["source_id"]
          },
        ]
      }
      archon_document_versions: {
        Row: {
          change_summary: string | null
          change_type: string | null
          content: Json
          created_at: string | null
          created_by: string | null
          document_id: string | null
          field_name: string
          id: string
          project_id: string | null
          task_id: string | null
          version_number: number
        }
        Insert: {
          change_summary?: string | null
          change_type?: string | null
          content: Json
          created_at?: string | null
          created_by?: string | null
          document_id?: string | null
          field_name: string
          id?: string
          project_id?: string | null
          task_id?: string | null
          version_number: number
        }
        Update: {
          change_summary?: string | null
          change_type?: string | null
          content?: Json
          created_at?: string | null
          created_by?: string | null
          document_id?: string | null
          field_name?: string
          id?: string
          project_id?: string | null
          task_id?: string | null
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "archon_document_versions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "archon_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "archon_document_versions_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "archon_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      archon_project_sources: {
        Row: {
          created_by: string | null
          id: string
          linked_at: string | null
          notes: string | null
          project_id: string | null
          source_id: string
        }
        Insert: {
          created_by?: string | null
          id?: string
          linked_at?: string | null
          notes?: string | null
          project_id?: string | null
          source_id: string
        }
        Update: {
          created_by?: string | null
          id?: string
          linked_at?: string | null
          notes?: string | null
          project_id?: string | null
          source_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "archon_project_sources_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "archon_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      archon_projects: {
        Row: {
          created_at: string | null
          data: Json | null
          description: string | null
          docs: Json | null
          features: Json | null
          github_repo: string | null
          id: string
          pinned: boolean | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          data?: Json | null
          description?: string | null
          docs?: Json | null
          features?: Json | null
          github_repo?: string | null
          id?: string
          pinned?: boolean | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          data?: Json | null
          description?: string | null
          docs?: Json | null
          features?: Json | null
          github_repo?: string | null
          id?: string
          pinned?: boolean | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      archon_prompts: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          prompt: string
          prompt_name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          prompt: string
          prompt_name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          prompt?: string
          prompt_name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      archon_settings: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          encrypted_value: string | null
          id: string
          is_encrypted: boolean | null
          key: string
          updated_at: string | null
          value: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          encrypted_value?: string | null
          id?: string
          is_encrypted?: boolean | null
          key: string
          updated_at?: string | null
          value?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          encrypted_value?: string | null
          id?: string
          is_encrypted?: boolean | null
          key?: string
          updated_at?: string | null
          value?: string | null
        }
        Relationships: []
      }
      archon_sources: {
        Row: {
          created_at: string
          metadata: Json | null
          source_id: string
          summary: string | null
          title: string | null
          total_word_count: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          metadata?: Json | null
          source_id: string
          summary?: string | null
          title?: string | null
          total_word_count?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          metadata?: Json | null
          source_id?: string
          summary?: string | null
          title?: string | null
          total_word_count?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      archon_tasks: {
        Row: {
          archived: boolean | null
          archived_at: string | null
          archived_by: string | null
          assignee: string | null
          code_examples: Json | null
          created_at: string | null
          description: string | null
          feature: string | null
          id: string
          parent_task_id: string | null
          project_id: string | null
          sources: Json | null
          status: Database["public"]["Enums"]["task_status"] | null
          task_order: number | null
          title: string
          updated_at: string | null
        }
        Insert: {
          archived?: boolean | null
          archived_at?: string | null
          archived_by?: string | null
          assignee?: string | null
          code_examples?: Json | null
          created_at?: string | null
          description?: string | null
          feature?: string | null
          id?: string
          parent_task_id?: string | null
          project_id?: string | null
          sources?: Json | null
          status?: Database["public"]["Enums"]["task_status"] | null
          task_order?: number | null
          title: string
          updated_at?: string | null
        }
        Update: {
          archived?: boolean | null
          archived_at?: string | null
          archived_by?: string | null
          assignee?: string | null
          code_examples?: Json | null
          created_at?: string | null
          description?: string | null
          feature?: string | null
          id?: string
          parent_task_id?: string | null
          project_id?: string | null
          sources?: Json | null
          status?: Database["public"]["Enums"]["task_status"] | null
          task_order?: number | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "archon_tasks_parent_task_id_fkey"
            columns: ["parent_task_id"]
            isOneToOne: false
            referencedRelation: "archon_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "archon_tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "archon_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      asrs_blocks: {
        Row: {
          block_type: string
          html: string | null
          id: string
          meta: Json | null
          ordinal: number
          section_id: string
          source_text: string | null
        }
        Insert: {
          block_type: string
          html?: string | null
          id?: string
          meta?: Json | null
          ordinal: number
          section_id: string
          source_text?: string | null
        }
        Update: {
          block_type?: string
          html?: string | null
          id?: string
          meta?: Json | null
          ordinal?: number
          section_id?: string
          source_text?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "asrs_blocks_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "asrs_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      asrs_configurations: {
        Row: {
          asrs_type: string
          config_name: string
          container_types: string[] | null
          cost_multiplier: number | null
          created_at: string | null
          id: string
          max_height_ft: number | null
          typical_applications: string[] | null
        }
        Insert: {
          asrs_type: string
          config_name: string
          container_types?: string[] | null
          cost_multiplier?: number | null
          created_at?: string | null
          id?: string
          max_height_ft?: number | null
          typical_applications?: string[] | null
        }
        Update: {
          asrs_type?: string
          config_name?: string
          container_types?: string[] | null
          cost_multiplier?: number | null
          created_at?: string | null
          id?: string
          max_height_ft?: number | null
          typical_applications?: string[] | null
        }
        Relationships: []
      }
      asrs_protection_rules: {
        Row: {
          area_ft2: number | null
          asrs_type: string | null
          ceiling_height_max: number | null
          ceiling_height_min: number | null
          commodity_class: string | null
          container_material: string | null
          container_top: string | null
          container_wall: string | null
          density_gpm_ft2: number | null
          id: string
          k_factor: number | null
          notes: string | null
          pressure_psi: number | null
          section_id: string
          sprinkler_scheme: string | null
        }
        Insert: {
          area_ft2?: number | null
          asrs_type?: string | null
          ceiling_height_max?: number | null
          ceiling_height_min?: number | null
          commodity_class?: string | null
          container_material?: string | null
          container_top?: string | null
          container_wall?: string | null
          density_gpm_ft2?: number | null
          id?: string
          k_factor?: number | null
          notes?: string | null
          pressure_psi?: number | null
          section_id: string
          sprinkler_scheme?: string | null
        }
        Update: {
          area_ft2?: number | null
          asrs_type?: string | null
          ceiling_height_max?: number | null
          ceiling_height_min?: number | null
          commodity_class?: string | null
          container_material?: string | null
          container_top?: string | null
          container_wall?: string | null
          density_gpm_ft2?: number | null
          id?: string
          k_factor?: number | null
          notes?: string | null
          pressure_psi?: number | null
          section_id?: string
          sprinkler_scheme?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "asrs_protection_rules_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "asrs_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      asrs_sections: {
        Row: {
          id: string
          number: string
          parent_id: string | null
          slug: string
          sort_key: number
          title: string
        }
        Insert: {
          id?: string
          number: string
          parent_id?: string | null
          slug: string
          sort_key: number
          title: string
        }
        Update: {
          id?: string
          number?: string
          parent_id?: string | null
          slug?: string
          sort_key?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "asrs_sections_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "asrs_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      block_embeddings: {
        Row: {
          block_id: string
          embedding: string | null
        }
        Insert: {
          block_id: string
          embedding?: string | null
        }
        Update: {
          block_id?: string
          embedding?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "block_embeddings_block_id_fkey"
            columns: ["block_id"]
            isOneToOne: true
            referencedRelation: "asrs_blocks"
            referencedColumns: ["id"]
          },
        ]
      }
      chats: {
        Row: {
          id: string
        }
        Insert: {
          id: string
        }
        Update: {
          id?: string
        }
        Relationships: []
      }
      clients: {
        Row: {
          company_id: string | null
          created_at: string
          id: number
          name: string | null
          status: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          id?: number
          name?: string | null
          status?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string
          id?: number
          name?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clients_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          address: string | null
          city: string | null
          created_at: string | null
          id: string
          name: string
          notes: string | null
          state: string | null
          title: string | null
          updated_at: string | null
          website: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          created_at?: string | null
          id?: string
          name: string
          notes?: string | null
          state?: string | null
          title?: string | null
          updated_at?: string | null
          website: string
        }
        Update: {
          address?: string | null
          city?: string | null
          created_at?: string | null
          id?: string
          name?: string
          notes?: string | null
          state?: string | null
          title?: string | null
          updated_at?: string | null
          website?: string
        }
        Relationships: []
      }
      company_context: {
        Row: {
          goals: Json | null
          id: string
          okrs: Json | null
          org_structure: Json | null
          policies: Json | null
          resource_constraints: Json | null
          strategic_initiatives: Json | null
          updated_at: string | null
        }
        Insert: {
          goals?: Json | null
          id?: string
          okrs?: Json | null
          org_structure?: Json | null
          policies?: Json | null
          resource_constraints?: Json | null
          strategic_initiatives?: Json | null
          updated_at?: string | null
        }
        Update: {
          goals?: Json | null
          id?: string
          okrs?: Json | null
          org_structure?: Json | null
          policies?: Json | null
          resource_constraints?: Json | null
          strategic_initiatives?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      contacts: {
        Row: {
          birthday: string | null
          created_at: string
          email: string | null
          first_name: string | null
          id: number
          last_name: string | null
          notes: string | null
          phone: string | null
        }
        Insert: {
          birthday?: string | null
          created_at?: string
          email?: string | null
          first_name?: string | null
          id?: number
          last_name?: string | null
          notes?: string | null
          phone?: string | null
        }
        Update: {
          birthday?: string | null
          created_at?: string
          email?: string | null
          first_name?: string | null
          id?: number
          last_name?: string | null
          notes?: string | null
          phone?: string | null
        }
        Relationships: []
      }
      cost_factors: {
        Row: {
          base_cost_per_unit: number | null
          complexity_multiplier: number | null
          factor_name: string
          factor_type: string
          id: string
          unit_type: string | null
          updated_at: string | null
        }
        Insert: {
          base_cost_per_unit?: number | null
          complexity_multiplier?: number | null
          factor_name: string
          factor_type: string
          id?: string
          unit_type?: string | null
          updated_at?: string | null
        }
        Update: {
          base_cost_per_unit?: number | null
          complexity_multiplier?: number | null
          factor_name?: string
          factor_type?: string
          id?: string
          unit_type?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      design_recommendations: {
        Row: {
          created_at: string | null
          description: string
          id: string
          implementation_effort: string | null
          potential_savings: number | null
          priority_level: string
          project_id: string | null
          recommendation_type: string
          technical_details: Json | null
        }
        Insert: {
          created_at?: string | null
          description: string
          id?: string
          implementation_effort?: string | null
          potential_savings?: number | null
          priority_level: string
          project_id?: string | null
          recommendation_type: string
          technical_details?: Json | null
        }
        Update: {
          created_at?: string | null
          description?: string
          id?: string
          implementation_effort?: string | null
          potential_savings?: number | null
          priority_level?: string
          project_id?: string | null
          recommendation_type?: string
          technical_details?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_project_id"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "user_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      document_metadata: {
        Row: {
          created_at: string | null
          id: string
          schema: string | null
          title: string | null
          url: string | null
        }
        Insert: {
          created_at?: string | null
          id: string
          schema?: string | null
          title?: string | null
          url?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          schema?: string | null
          title?: string | null
          url?: string | null
        }
        Relationships: []
      }
      document_rows: {
        Row: {
          dataset_id: string | null
          id: number
          row_data: Json | null
        }
        Insert: {
          dataset_id?: string | null
          id?: number
          row_data?: Json | null
        }
        Update: {
          dataset_id?: string | null
          id?: number
          row_data?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "document_rows_dataset_id_fkey"
            columns: ["dataset_id"]
            isOneToOne: false
            referencedRelation: "document_metadata"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          content: string | null
          document_type: string | null
          embedding: string | null
          id: number
          metadata: Json | null
        }
        Insert: {
          content?: string | null
          document_type?: string | null
          embedding?: string | null
          id?: number
          metadata?: Json | null
        }
        Update: {
          content?: string | null
          document_type?: string | null
          embedding?: string | null
          id?: number
          metadata?: Json | null
        }
        Relationships: []
      }
      embeddings: {
        Row: {
          content: string
          embedding: string
          id: string
          resource_id: string | null
        }
        Insert: {
          content: string
          embedding: string
          id: string
          resource_id?: string | null
        }
        Update: {
          content?: string
          embedding?: string
          id?: string
          resource_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "embeddings_resource_id_resources_id_fk"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "resources"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          company_card: number | null
          created_at: string
          department: string | null
          email: string | null
          first_name: string | null
          id: number
          last_name: string | null
          phone: string | null
          phone_allowance: number | null
          salery: string | null
          start_date: string | null
          supervisor: string | null
          truck_allowance: number | null
          updated_at: string
        }
        Insert: {
          company_card?: number | null
          created_at?: string
          department?: string | null
          email?: string | null
          first_name?: string | null
          id?: number
          last_name?: string | null
          phone?: string | null
          phone_allowance?: number | null
          salery?: string | null
          start_date?: string | null
          supervisor?: string | null
          truck_allowance?: number | null
          updated_at?: string
        }
        Update: {
          company_card?: number | null
          created_at?: string
          department?: string | null
          email?: string | null
          first_name?: string | null
          id?: number
          last_name?: string | null
          phone?: string | null
          phone_allowance?: number | null
          salery?: string | null
          start_date?: string | null
          supervisor?: string | null
          truck_allowance?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      fm_documents: {
        Row: {
          content: string
          created_at: string | null
          document_type: string | null
          embedding: string | null
          fm_table_id: number | null
          id: string
          metadata: Json | null
          source: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          document_type?: string | null
          embedding?: string | null
          fm_table_id?: number | null
          id?: string
          metadata?: Json | null
          source?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          document_type?: string | null
          embedding?: string | null
          fm_table_id?: number | null
          id?: string
          metadata?: Json | null
          source?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      fm_global_semantic: {
        Row: {
          content: string | null
          content_type: string | null
          embedding: string | null
          id: number
          metadata: Json | null
          table_id: string | null
        }
        Insert: {
          content?: string | null
          content_type?: string | null
          embedding?: string | null
          id?: number
          metadata?: Json | null
          table_id?: string | null
        }
        Update: {
          content?: string | null
          content_type?: string | null
          embedding?: string | null
          id?: number
          metadata?: Json | null
          table_id?: string | null
        }
        Relationships: []
      }
      fm_global_tables: {
        Row: {
          aisle_width: string | null
          applicable_figures: number[] | null
          asrs_type: string | null
          ceiling_height: string | null
          ceiling_height_ft: number | null
          ceiling_height_m: number | null
          commodity: string | null
          commodity_classes: string[] | null
          commodity_hazards: string | null
          condition: string | null
          configuration: Json | null
          decision_logic: Json | null
          description: string | null
          design_flow_gpm: number | null
          error: string | null
          figure: string | null
          id: number
          iras_levels: number | null
          iras_system_type: string | null
          k_factor: number | null
          k_type: string | null
          list_item: Json | null
          max_horizontal_spacing_ft: number | null
          max_spacing_ft: number | null
          max_spacing_m: number | null
          parameter: string | null
          pressure_bar: number | null
          pressure_psi: number | null
          rack_row_depth_ft: string | null
          rack_row_depth_m: number | null
          raw_json: Json | null
          requires_vertical_barriers: boolean | null
          scenario: Json | null
          scenario_id: number | null
          special_conditions: string[] | null
          sprinkler_count: number | null
          sprinkler_location: string | null
          sprinkler_orientation: string | null
          sprinkler_response: string | null
          sprinklers_in_design: number | null
          storage_height_ft: number | null
          structure_type: string | null
          system_type: string | null
          table_id: string | null
          table_number: number | null
          title: string | null
          transverse_flue_spaces: boolean | null
          value: number | null
        }
        Insert: {
          aisle_width?: string | null
          applicable_figures?: number[] | null
          asrs_type?: string | null
          ceiling_height?: string | null
          ceiling_height_ft?: number | null
          ceiling_height_m?: number | null
          commodity?: string | null
          commodity_classes?: string[] | null
          commodity_hazards?: string | null
          condition?: string | null
          configuration?: Json | null
          decision_logic?: Json | null
          description?: string | null
          design_flow_gpm?: number | null
          error?: string | null
          figure?: string | null
          id?: number
          iras_levels?: number | null
          iras_system_type?: string | null
          k_factor?: number | null
          k_type?: string | null
          list_item?: Json | null
          max_horizontal_spacing_ft?: number | null
          max_spacing_ft?: number | null
          max_spacing_m?: number | null
          parameter?: string | null
          pressure_bar?: number | null
          pressure_psi?: number | null
          rack_row_depth_ft?: string | null
          rack_row_depth_m?: number | null
          raw_json?: Json | null
          requires_vertical_barriers?: boolean | null
          scenario?: Json | null
          scenario_id?: number | null
          special_conditions?: string[] | null
          sprinkler_count?: number | null
          sprinkler_location?: string | null
          sprinkler_orientation?: string | null
          sprinkler_response?: string | null
          sprinklers_in_design?: number | null
          storage_height_ft?: number | null
          structure_type?: string | null
          system_type?: string | null
          table_id?: string | null
          table_number?: number | null
          title?: string | null
          transverse_flue_spaces?: boolean | null
          value?: number | null
        }
        Update: {
          aisle_width?: string | null
          applicable_figures?: number[] | null
          asrs_type?: string | null
          ceiling_height?: string | null
          ceiling_height_ft?: number | null
          ceiling_height_m?: number | null
          commodity?: string | null
          commodity_classes?: string[] | null
          commodity_hazards?: string | null
          condition?: string | null
          configuration?: Json | null
          decision_logic?: Json | null
          description?: string | null
          design_flow_gpm?: number | null
          error?: string | null
          figure?: string | null
          id?: number
          iras_levels?: number | null
          iras_system_type?: string | null
          k_factor?: number | null
          k_type?: string | null
          list_item?: Json | null
          max_horizontal_spacing_ft?: number | null
          max_spacing_ft?: number | null
          max_spacing_m?: number | null
          parameter?: string | null
          pressure_bar?: number | null
          pressure_psi?: number | null
          rack_row_depth_ft?: string | null
          rack_row_depth_m?: number | null
          raw_json?: Json | null
          requires_vertical_barriers?: boolean | null
          scenario?: Json | null
          scenario_id?: number | null
          special_conditions?: string[] | null
          sprinkler_count?: number | null
          sprinkler_location?: string | null
          sprinkler_orientation?: string | null
          sprinkler_response?: string | null
          sprinklers_in_design?: number | null
          storage_height_ft?: number | null
          structure_type?: string | null
          system_type?: string | null
          table_id?: string | null
          table_number?: number | null
          title?: string | null
          transverse_flue_spaces?: boolean | null
          value?: number | null
        }
        Relationships: []
      }
      fm_table_metadata: {
        Row: {
          asrs_type: string
          business_impact: string
          category: string
          commodity_types: string
          created_at: string | null
          estimated_page: number | null
          extraction_status: string | null
          fm_global_table_id: number | null
          id: string
          priority_level: string
          protection_scheme: string
          structure_type: string
          system_type: string
          table_number: number
          table_title: string
          updated_at: string | null
        }
        Insert: {
          asrs_type: string
          business_impact: string
          category: string
          commodity_types: string
          created_at?: string | null
          estimated_page?: number | null
          extraction_status?: string | null
          fm_global_table_id?: number | null
          id?: string
          priority_level: string
          protection_scheme: string
          structure_type: string
          system_type: string
          table_number: number
          table_title: string
          updated_at?: string | null
        }
        Update: {
          asrs_type?: string
          business_impact?: string
          category?: string
          commodity_types?: string
          created_at?: string | null
          estimated_page?: number | null
          extraction_status?: string | null
          fm_global_table_id?: number | null
          id?: string
          priority_level?: string
          protection_scheme?: string
          structure_type?: string
          system_type?: string
          table_number?: number
          table_title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      meeting_chunks: {
        Row: {
          chunk_index: number
          chunk_type: string | null
          content: string
          content_tokens: number | null
          created_at: string | null
          embedding: string | null
          end_timestamp: number | null
          id: string
          meeting_id: string | null
          metadata: Json | null
          project_id: number | null
          relational_embedding: string | null
          search_text: unknown | null
          speaker_info: Json | null
          start_timestamp: number | null
          temporal_embedding: string | null
        }
        Insert: {
          chunk_index: number
          chunk_type?: string | null
          content: string
          content_tokens?: number | null
          created_at?: string | null
          embedding?: string | null
          end_timestamp?: number | null
          id?: string
          meeting_id?: string | null
          metadata?: Json | null
          project_id?: number | null
          relational_embedding?: string | null
          search_text?: unknown | null
          speaker_info?: Json | null
          start_timestamp?: number | null
          temporal_embedding?: string | null
        }
        Update: {
          chunk_index?: number
          chunk_type?: string | null
          content?: string
          content_tokens?: number | null
          created_at?: string | null
          embedding?: string | null
          end_timestamp?: number | null
          id?: string
          meeting_id?: string | null
          metadata?: Json | null
          project_id?: number | null
          relational_embedding?: string | null
          search_text?: unknown | null
          speaker_info?: Json | null
          start_timestamp?: number | null
          temporal_embedding?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "meeting_chunks_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meeting_statistics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_chunks_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_chunks_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings_with_project"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_chunks_meeting_id_meetings_id_fk"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meeting_statistics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_chunks_meeting_id_meetings_id_fk"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_chunks_meeting_id_meetings_id_fk"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings_with_project"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_chunks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_embeddings: {
        Row: {
          chunk_index: number
          created_at: string | null
          embedding: string
          id: string
          meeting_id: string
          metadata: Json | null
        }
        Insert: {
          chunk_index: number
          created_at?: string | null
          embedding: string
          id?: string
          meeting_id: string
          metadata?: Json | null
        }
        Update: {
          chunk_index?: number
          created_at?: string | null
          embedding?: string
          id?: string
          meeting_id?: string
          metadata?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "meeting_embeddings_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meeting_statistics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_embeddings_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_embeddings_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings_with_project"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_summaries: {
        Row: {
          action_items: Json | null
          confidence_score: number | null
          created_at: string | null
          decisions: Json | null
          generated_by: string | null
          id: string
          key_points: Json | null
          meeting_id: string | null
          questions: Json | null
          sentiment_score: number | null
          summary_long: string | null
          summary_text: string
          summary_type: string | null
        }
        Insert: {
          action_items?: Json | null
          confidence_score?: number | null
          created_at?: string | null
          decisions?: Json | null
          generated_by?: string | null
          id?: string
          key_points?: Json | null
          meeting_id?: string | null
          questions?: Json | null
          sentiment_score?: number | null
          summary_long?: string | null
          summary_text: string
          summary_type?: string | null
        }
        Update: {
          action_items?: Json | null
          confidence_score?: number | null
          created_at?: string | null
          decisions?: Json | null
          generated_by?: string | null
          id?: string
          key_points?: Json | null
          meeting_id?: string | null
          questions?: Json | null
          sentiment_score?: number | null
          summary_long?: string | null
          summary_text?: string
          summary_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "meeting_summaries_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meeting_statistics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_summaries_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_summaries_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings_with_project"
            referencedColumns: ["id"]
          },
        ]
      }
      meetings: {
        Row: {
          assignment_confidence: number | null
          assignment_signals: Json | null
          category: string | null
          created_at: string | null
          date: string
          duration_minutes: number | null
          fireflies_id: string | null
          fireflies_link: string | null
          id: string
          insights: number | null
          participants: string[] | null
          processed_at: string | null
          processing_error: string | null
          processing_status: string | null
          project_id: number | null
          raw_metadata: Json | null
          sentiment_score: number | null
          speaker_count: number | null
          storage_bucket_path: string | null
          summary: string | null
          tags: string[] | null
          title: string | null
          transcript_id: string | null
          transcript_url: string | null
          updated_at: string | null
          word_count: number | null
        }
        Insert: {
          assignment_confidence?: number | null
          assignment_signals?: Json | null
          category?: string | null
          created_at?: string | null
          date: string
          duration_minutes?: number | null
          fireflies_id?: string | null
          fireflies_link?: string | null
          id?: string
          insights?: number | null
          participants?: string[] | null
          processed_at?: string | null
          processing_error?: string | null
          processing_status?: string | null
          project_id?: number | null
          raw_metadata?: Json | null
          sentiment_score?: number | null
          speaker_count?: number | null
          storage_bucket_path?: string | null
          summary?: string | null
          tags?: string[] | null
          title?: string | null
          transcript_id?: string | null
          transcript_url?: string | null
          updated_at?: string | null
          word_count?: number | null
        }
        Update: {
          assignment_confidence?: number | null
          assignment_signals?: Json | null
          category?: string | null
          created_at?: string | null
          date?: string
          duration_minutes?: number | null
          fireflies_id?: string | null
          fireflies_link?: string | null
          id?: string
          insights?: number | null
          participants?: string[] | null
          processed_at?: string | null
          processing_error?: string | null
          processing_status?: string | null
          project_id?: number | null
          raw_metadata?: Json | null
          sentiment_score?: number | null
          speaker_count?: number | null
          storage_bucket_path?: string | null
          summary?: string | null
          tags?: string[] | null
          title?: string | null
          transcript_id?: string | null
          transcript_url?: string | null
          updated_at?: string | null
          word_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "meetings_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          chatId: string
          createdAt: string
          id: string
          role: string
        }
        Insert: {
          chatId: string
          createdAt?: string
          id: string
          role: string
        }
        Update: {
          chatId?: string
          createdAt?: string
          id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_chatId_chats_id_fk"
            columns: ["chatId"]
            isOneToOne: false
            referencedRelation: "chats"
            referencedColumns: ["id"]
          },
        ]
      }
      nods_page: {
        Row: {
          checksum: string | null
          id: number
          meta: Json | null
          parent_page_id: number | null
          path: string
          source: string | null
          type: string | null
        }
        Insert: {
          checksum?: string | null
          id?: number
          meta?: Json | null
          parent_page_id?: number | null
          path: string
          source?: string | null
          type?: string | null
        }
        Update: {
          checksum?: string | null
          id?: number
          meta?: Json | null
          parent_page_id?: number | null
          path?: string
          source?: string | null
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "nods_page_parent_page_id_fkey"
            columns: ["parent_page_id"]
            isOneToOne: false
            referencedRelation: "nods_page"
            referencedColumns: ["id"]
          },
        ]
      }
      nods_page_section: {
        Row: {
          content: string | null
          embedding: string | null
          heading: string | null
          id: number
          page_id: number
          slug: string | null
          token_count: number | null
        }
        Insert: {
          content?: string | null
          embedding?: string | null
          heading?: string | null
          id?: number
          page_id: number
          slug?: string | null
          token_count?: number | null
        }
        Update: {
          content?: string | null
          embedding?: string | null
          heading?: string | null
          id?: number
          page_id?: number
          slug?: string | null
          token_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "nods_page_section_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "nods_page"
            referencedColumns: ["id"]
          },
        ]
      }
      optimization_rules: {
        Row: {
          condition_from: Json | null
          condition_to: Json | null
          cost_impact: number | null
          description: string | null
          embedding: string | null
          id: number
        }
        Insert: {
          condition_from?: Json | null
          condition_to?: Json | null
          cost_impact?: number | null
          description?: string | null
          embedding?: string | null
          id?: number
        }
        Update: {
          condition_from?: Json | null
          condition_to?: Json | null
          cost_impact?: number | null
          description?: string | null
          embedding?: string | null
          id?: number
        }
        Relationships: []
      }
      parts: {
        Row: {
          createdAt: string
          data_weather_id: string | null
          data_weather_location: string | null
          data_weather_temperature: number | null
          data_weather_weather: string | null
          file_filename: string | null
          file_mediaType: string | null
          file_url: string | null
          id: string
          messageId: string
          order: number
          providerMetadata: Json | null
          reasoning_text: string | null
          source_document_filename: string | null
          source_document_mediaType: string | null
          source_document_sourceId: string | null
          source_document_title: string | null
          source_url_sourceId: string | null
          source_url_title: string | null
          source_url_url: string | null
          text_text: string | null
          tool_errorText: string | null
          tool_getLocation_input: Json | null
          tool_getLocation_output: Json | null
          tool_getWeatherInformation_input: Json | null
          tool_getWeatherInformation_output: Json | null
          tool_state: string | null
          tool_toolCallId: string | null
          type: string
        }
        Insert: {
          createdAt?: string
          data_weather_id?: string | null
          data_weather_location?: string | null
          data_weather_temperature?: number | null
          data_weather_weather?: string | null
          file_filename?: string | null
          file_mediaType?: string | null
          file_url?: string | null
          id: string
          messageId: string
          order?: number
          providerMetadata?: Json | null
          reasoning_text?: string | null
          source_document_filename?: string | null
          source_document_mediaType?: string | null
          source_document_sourceId?: string | null
          source_document_title?: string | null
          source_url_sourceId?: string | null
          source_url_title?: string | null
          source_url_url?: string | null
          text_text?: string | null
          tool_errorText?: string | null
          tool_getLocation_input?: Json | null
          tool_getLocation_output?: Json | null
          tool_getWeatherInformation_input?: Json | null
          tool_getWeatherInformation_output?: Json | null
          tool_state?: string | null
          tool_toolCallId?: string | null
          type: string
        }
        Update: {
          createdAt?: string
          data_weather_id?: string | null
          data_weather_location?: string | null
          data_weather_temperature?: number | null
          data_weather_weather?: string | null
          file_filename?: string | null
          file_mediaType?: string | null
          file_url?: string | null
          id?: string
          messageId?: string
          order?: number
          providerMetadata?: Json | null
          reasoning_text?: string | null
          source_document_filename?: string | null
          source_document_mediaType?: string | null
          source_document_sourceId?: string | null
          source_document_title?: string | null
          source_url_sourceId?: string | null
          source_url_title?: string | null
          source_url_url?: string | null
          text_text?: string | null
          tool_errorText?: string | null
          tool_getLocation_input?: Json | null
          tool_getLocation_output?: Json | null
          tool_getWeatherInformation_input?: Json | null
          tool_getWeatherInformation_output?: Json | null
          tool_state?: string | null
          tool_toolCallId?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "parts_messageId_messages_id_fk"
            columns: ["messageId"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          full_name: string | null
          id: string
          updated_at: string | null
          username: string | null
          website: string | null
        }
        Insert: {
          avatar_url?: string | null
          full_name?: string | null
          id: string
          updated_at?: string | null
          username?: string | null
          website?: string | null
        }
        Update: {
          avatar_url?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string | null
          username?: string | null
          website?: string | null
        }
        Relationships: []
      }
      project_health: {
        Row: {
          decision_count: number | null
          health_score: number | null
          health_trend: Json | null
          id: string
          last_activity: string | null
          last_updated: string | null
          meeting_count: number | null
          momentum: string | null
          open_action_items: number | null
          project_id: number | null
          risk_level: string | null
          sentiment_trend: Json | null
        }
        Insert: {
          decision_count?: number | null
          health_score?: number | null
          health_trend?: Json | null
          id?: string
          last_activity?: string | null
          last_updated?: string | null
          meeting_count?: number | null
          momentum?: string | null
          open_action_items?: number | null
          project_id?: number | null
          risk_level?: string | null
          sentiment_trend?: Json | null
        }
        Update: {
          decision_count?: number | null
          health_score?: number | null
          health_trend?: Json | null
          id?: string
          last_activity?: string | null
          last_updated?: string | null
          meeting_count?: number | null
          momentum?: string | null
          open_action_items?: number | null
          project_id?: number | null
          risk_level?: string | null
          sentiment_trend?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "project_health_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_insights: {
        Row: {
          category: string
          created_at: string | null
          id: string
          meeting_id: string | null
          project_id: number | null
          text: string
        }
        Insert: {
          category: string
          created_at?: string | null
          id?: string
          meeting_id?: string | null
          project_id?: number | null
          text: string
        }
        Update: {
          category?: string
          created_at?: string | null
          id?: string
          meeting_id?: string | null
          project_id?: number | null
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_insights_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meeting_statistics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_insights_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_insights_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings_with_project"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_insights_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_tasks: {
        Row: {
          assigned_to: string | null
          created_at: string | null
          due_date: string | null
          id: string
          priority: string | null
          project_id: number | null
          status: string | null
          task_description: string
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string | null
          due_date?: string | null
          id?: string
          priority?: string | null
          project_id?: number | null
          status?: string | null
          task_description: string
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          created_at?: string | null
          due_date?: string | null
          id?: string
          priority?: string | null
          project_id?: number | null
          status?: string | null
          task_description?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          address: string | null
          aliases: string[] | null
          budget: number | null
          budget_used: number | null
          category: string | null
          client_id: number | null
          completion_percentage: number | null
          created_at: string
          current_phase: string | null
          description: string | null
          "est completion": string | null
          "est profit": number | null
          "est revenue": number | null
          id: number
          "job number": string | null
          keywords: string[] | null
          name: string | null
          onedrive: string | null
          phase: string | null
          stakeholders: string[] | null
          "start date": string | null
          state: string | null
          team_members: string[] | null
        }
        Insert: {
          address?: string | null
          aliases?: string[] | null
          budget?: number | null
          budget_used?: number | null
          category?: string | null
          client_id?: number | null
          completion_percentage?: number | null
          created_at?: string
          current_phase?: string | null
          description?: string | null
          "est completion"?: string | null
          "est profit"?: number | null
          "est revenue"?: number | null
          id?: number
          "job number"?: string | null
          keywords?: string[] | null
          name?: string | null
          onedrive?: string | null
          phase?: string | null
          stakeholders?: string[] | null
          "start date"?: string | null
          state?: string | null
          team_members?: string[] | null
        }
        Update: {
          address?: string | null
          aliases?: string[] | null
          budget?: number | null
          budget_used?: number | null
          category?: string | null
          client_id?: number | null
          completion_percentage?: number | null
          created_at?: string
          current_phase?: string | null
          description?: string | null
          "est completion"?: string | null
          "est profit"?: number | null
          "est revenue"?: number | null
          id?: number
          "job number"?: string | null
          keywords?: string[] | null
          name?: string | null
          onedrive?: string | null
          phase?: string | null
          stakeholders?: string[] | null
          "start date"?: string | null
          state?: string | null
          team_members?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      rag_queries: {
        Row: {
          created_at: string | null
          feedback_rating: number | null
          feedback_text: string | null
          id: string
          query_text: string
          relevance_scores: number[] | null
          response: string | null
          retrieved_chunks: string[] | null
          session_id: string | null
        }
        Insert: {
          created_at?: string | null
          feedback_rating?: number | null
          feedback_text?: string | null
          id?: string
          query_text: string
          relevance_scores?: number[] | null
          response?: string | null
          retrieved_chunks?: string[] | null
          session_id?: string | null
        }
        Update: {
          created_at?: string | null
          feedback_rating?: number | null
          feedback_text?: string | null
          id?: string
          query_text?: string
          relevance_scores?: number[] | null
          response?: string | null
          retrieved_chunks?: string[] | null
          session_id?: string | null
        }
        Relationships: []
      }
      resources: {
        Row: {
          content: string
          created_at: string
          id: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          id: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      sync_status: {
        Row: {
          created_at: string | null
          error_message: string | null
          id: string
          last_successful_sync_at: string | null
          last_sync_at: string | null
          metadata: Json | null
          status: string | null
          sync_type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          last_successful_sync_at?: string | null
          last_sync_at?: string | null
          metadata?: Json | null
          status?: string | null
          sync_type?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          last_successful_sync_at?: string | null
          last_sync_at?: string | null
          metadata?: Json | null
          status?: string | null
          sync_type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      todos: {
        Row: {
          id: number
          task: string | null
        }
        Insert: {
          id?: number
          task?: string | null
        }
        Update: {
          id?: number
          task?: string | null
        }
        Relationships: []
      }
      user_projects: {
        Row: {
          company_name: string | null
          contact_phone: string | null
          created_at: string | null
          estimated_value: number | null
          id: string
          lead_score: number | null
          project_data: Json
          project_name: string | null
          status: string | null
          updated_at: string | null
          user_email: string | null
        }
        Insert: {
          company_name?: string | null
          contact_phone?: string | null
          created_at?: string | null
          estimated_value?: number | null
          id?: string
          lead_score?: number | null
          project_data: Json
          project_name?: string | null
          status?: string | null
          updated_at?: string | null
          user_email?: string | null
        }
        Update: {
          company_name?: string | null
          contact_phone?: string | null
          created_at?: string | null
          estimated_value?: number | null
          id?: string
          lead_score?: number | null
          project_data?: Json
          project_name?: string | null
          status?: string | null
          updated_at?: string | null
          user_email?: string | null
        }
        Relationships: []
      }
      users: {
        Row: {
          created_at: string
          email: string
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      ai_insights_with_project: {
        Row: {
          confidence_score: number | null
          created_at: string | null
          description: string | null
          id: number | null
          insight_type: string | null
          meeting_id: string | null
          project_id: number | null
          project_name: string | null
          resolved: number | null
          severity: string | null
          source_meetings: string | null
          title: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_insights_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meeting_statistics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_insights_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_insights_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings_with_project"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_insights_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      fm_tables_overview: {
        Row: {
          asrs_type: string | null
          ceiling_height_ft: number | null
          ceiling_height_m: number | null
          commodity_classes: string[] | null
          k_factor: number | null
          k_type: string | null
          pressure_bar: number | null
          pressure_psi: number | null
          sprinkler_count: number | null
          structure_type: string | null
          system_type: string | null
          table_id: string | null
          table_number: number | null
          title: string | null
        }
        Relationships: []
      }
      meeting_statistics: {
        Row: {
          avg_importance: number | null
          chunk_count: number | null
          date: string | null
          id: string | null
          last_processed: string | null
          project_id: number | null
          speaker_count: number | null
          title: string | null
          total_tokens: number | null
        }
        Relationships: [
          {
            foreignKeyName: "meetings_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      meetings_with_project: {
        Row: {
          category: string | null
          created_at: string | null
          date: string | null
          duration_minutes: number | null
          id: string | null
          insights: number | null
          participants: string[] | null
          processed_at: string | null
          project_id: number | null
          project_name: string | null
          raw_metadata: Json | null
          sentiment_score: number | null
          speaker_count: number | null
          storage_bucket_path: string | null
          summary: string | null
          tags: string[] | null
          title: string | null
          transcript_id: string | null
          transcript_url: string | null
          updated_at: string | null
          word_count: number | null
        }
        Relationships: [
          {
            foreignKeyName: "meetings_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      archive_task: {
        Args: { archived_by_param?: string; task_id_param: string }
        Returns: boolean
      }
      auto_archive_old_chats: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      backfill_meeting_participants_to_contacts: {
        Args: Record<PropertyKey, never>
        Returns: {
          total_contacts_added: number
          unique_emails: string[]
        }[]
      }
      binary_quantize: {
        Args: { "": string } | { "": unknown }
        Returns: unknown
      }
      create_conversation_with_message: {
        Args: {
          p_agent_type: string
          p_content: string
          p_metadata?: Json
          p_role: string
          p_title: string
        }
        Returns: string
      }
      email_to_names: {
        Args: { email: string }
        Returns: {
          first_name: string
          last_name: string
        }[]
      }
      extract_names: {
        Args: { participant: string }
        Returns: {
          first_name: string
          last_name: string
        }[]
      }
      find_sprinkler_requirements: {
        Args: {
          p_asrs_type?: string
          p_ceiling_height_ft?: number
          p_commodity_class?: string
          p_k_factor?: number
          p_system_type?: string
        }
        Returns: {
          ceiling_height_ft: number
          k_factor: number
          k_type: string
          pressure_bar: number
          pressure_psi: number
          special_conditions: string[]
          sprinkler_count: number
          sprinkler_orientation: string
          sprinkler_response: string
          table_id: string
          table_number: number
          title: string
        }[]
      }
      generate_optimization_recommendations: {
        Args: { project_data: Json }
        Returns: {
          implementation_effort: string
          priority: string
          recommendation: string
          savings_potential: number
          technical_details: Json
        }[]
      }
      get_conversation_with_history: {
        Args: { p_conversation_id: string }
        Returns: {
          agent_type: string
          content: string
          conversation_created_at: string
          conversation_id: string
          message_created_at: string
          message_id: string
          message_metadata: Json
          role: string
          title: string
        }[]
      }
      get_meeting_frequency_stats: {
        Args: { p_days_back?: number }
        Returns: {
          meeting_count: number
          period_date: string
          total_duration_minutes: number
          unique_participants: number
        }[]
      }
      get_meeting_statistics: {
        Args: Record<PropertyKey, never>
        Returns: {
          avg_duration_minutes: number
          meetings_this_week: number
          open_risks: number
          pending_actions: number
          total_meetings: number
          total_participants: number
        }[]
      }
      get_page_parents: {
        Args: { page_id: number }
        Returns: {
          id: number
          meta: Json
          parent_page_id: number
          path: string
        }[]
      }
      get_recent_project_insights: {
        Args: { p_days_back?: number; p_limit?: number; p_project_id: string }
        Returns: {
          assigned_to: string
          content: string
          created_at: string
          due_date: string
          insight_id: string
          insight_type: string
          meeting_date: string
          meeting_id: string
          meeting_title: string
          priority: string
          status: string
        }[]
      }
      get_user_chat_stats: {
        Args: { p_user_id: string }
        Returns: {
          active_chats: number
          archived_chats: number
          starred_chats: number
          total_chats: number
          total_messages: number
          total_tokens_used: number
        }[]
      }
      gtrgm_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_decompress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_options: {
        Args: { "": unknown }
        Returns: undefined
      }
      gtrgm_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      halfvec_avg: {
        Args: { "": number[] }
        Returns: unknown
      }
      halfvec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      halfvec_send: {
        Args: { "": unknown }
        Returns: string
      }
      halfvec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      hnsw_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_sparsevec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnswhandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      increment_session_tokens: {
        Args: { session_id: string; tokens_to_add: number }
        Returns: undefined
      }
      interpolate_sprinkler_requirements: {
        Args: { p_table_id: string; p_target_height_ft: number }
        Returns: {
          interpolated_count: number
          interpolated_height_ft: number
          interpolated_pressure: number
          k_factor: number
          k_type: string
          lower_height_ft: number
          note: string
          table_id: string
          upper_height_ft: number
        }[]
      }
      ivfflat_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflat_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflathandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      l2_norm: {
        Args: { "": unknown } | { "": unknown }
        Returns: number
      }
      l2_normalize: {
        Args: { "": string } | { "": unknown } | { "": unknown }
        Returns: unknown
      }
      match_archon_code_examples: {
        Args: {
          filter?: Json
          match_count?: number
          query_embedding: string
          source_filter?: string
        }
        Returns: {
          chunk_number: number
          content: string
          id: number
          metadata: Json
          similarity: number
          source_id: string
          summary: string
          url: string
        }[]
      }
      match_archon_crawled_pages: {
        Args: {
          filter?: Json
          match_count?: number
          query_embedding: string
          source_filter?: string
        }
        Returns: {
          chunk_number: number
          content: string
          id: number
          metadata: Json
          similarity: number
          source_id: string
          url: string
        }[]
      }
      match_fm_documents: {
        Args: {
          match_count?: number
          match_threshold?: number
          query_embedding: string
        }
        Returns: {
          content: string
          id: string
          metadata: Json
          similarity: number
          title: string
        }[]
      }
      match_meeting_chunks: {
        Args: {
          match_count?: number
          match_threshold?: number
          p_meeting_id?: string
          p_project_id?: number
          query_embedding: string
        }
        Returns: {
          chunk_index: number
          content: string
          end_timestamp: number
          id: string
          meeting_id: string
          project_id: number
          similarity: number
          speaker_info: Json
          start_timestamp: number
        }[]
      }
      match_page_sections: {
        Args: {
          embedding: string
          match_count: number
          match_threshold: number
          min_content_length: number
        }
        Returns: {
          content: string
          heading: string
          id: number
          page_id: number
          similarity: number
          slug: string
        }[]
      }
      search_meeting_chunks: {
        Args:
          | {
              chunk_types?: string[]
              date_from?: string
              date_to?: string
              match_count?: number
              match_threshold?: number
              project_filter?: number
              query_embedding: string
            }
          | {
              match_count?: number
              match_threshold?: number
              project_filter?: string
              query_embedding: string
            }
        Returns: {
          chunk_id: string
          chunk_index: number
          chunk_text: string
          chunk_type: string
          meeting_date: string
          meeting_id: string
          meeting_title: string
          metadata: Json
          project_id: number
          rank_score: number
          similarity: number
          speakers: Json
        }[]
      }
      set_limit: {
        Args: { "": number }
        Returns: number
      }
      show_limit: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      show_trgm: {
        Args: { "": string }
        Returns: string[]
      }
      sparsevec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      sparsevec_send: {
        Args: { "": unknown }
        Returns: string
      }
      sparsevec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      vector_avg: {
        Args: { "": number[] }
        Returns: string
      }
      vector_dims: {
        Args: { "": string } | { "": unknown }
        Returns: number
      }
      vector_norm: {
        Args: { "": string }
        Returns: number
      }
      vector_out: {
        Args: { "": string }
        Returns: unknown
      }
      vector_search: {
        Args: {
          match_count?: number
          match_threshold?: number
          query_embedding: string
        }
        Returns: {
          content: string
          id: string
          meeting_id: string
          similarity: number
        }[]
      }
      vector_send: {
        Args: { "": string }
        Returns: string
      }
      vector_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
    }
    Enums: {
      task_status: "todo" | "doing" | "review" | "done"
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
      task_status: ["todo", "doing", "review", "done"],
    },
  },
} as const
