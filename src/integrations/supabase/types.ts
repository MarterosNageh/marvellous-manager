export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      auth_users: {
        Row: {
          created_at: string
          department: string | null
          id: string
          is_admin: boolean
          password: string
          role: string | null
          team_name: string | null
          title: string | null
          username: string
        }
        Insert: {
          created_at?: string
          department?: string | null
          id?: string
          is_admin?: boolean
          password: string
          role?: string | null
          team_name?: string | null
          title?: string | null
          username: string
        }
        Update: {
          created_at?: string
          department?: string | null
          id?: string
          is_admin?: boolean
          password?: string
          role?: string | null
          team_name?: string | null
          title?: string | null
          username?: string
        }
        Relationships: []
      }
      fcm_tokens: {
        Row: {
          created_at: string
          device_info: Json | null
          fcm_token: string
          id: string
          is_active: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          device_info?: Json | null
          fcm_token: string
          id?: string
          is_active?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          device_info?: Json | null
          fcm_token?: string
          id?: string
          is_active?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fcm_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "auth_users"
            referencedColumns: ["id"]
          },
        ]
      }
      hard_drives: {
        Row: {
          cables: Json
          capacity: string | null
          created_at: string
          data: string | null
          drive_type: string
          free_space: string | null
          id: string
          name: string
          project_id: string | null
          serial_number: string
          status: string | null
          updated_at: string
        }
        Insert: {
          cables?: Json
          capacity?: string | null
          created_at?: string
          data?: string | null
          drive_type?: string
          free_space?: string | null
          id?: string
          name: string
          project_id?: string | null
          serial_number: string
          status?: string | null
          updated_at?: string
        }
        Update: {
          cables?: Json
          capacity?: string | null
          created_at?: string
          data?: string | null
          drive_type?: string
          free_space?: string | null
          id?: string
          name?: string
          project_id?: string | null
          serial_number?: string
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hard_drives_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      note_shares: {
        Row: {
          created_at: string
          id: string
          note_id: string | null
          permission_level: string | null
          shared_by_user_id: string | null
          shared_with_user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          note_id?: string | null
          permission_level?: string | null
          shared_by_user_id?: string | null
          shared_with_user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          note_id?: string | null
          permission_level?: string | null
          shared_by_user_id?: string | null
          shared_with_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "note_shares_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "notes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "note_shares_shared_by_user_id_fkey"
            columns: ["shared_by_user_id"]
            isOneToOne: false
            referencedRelation: "auth_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "note_shares_shared_with_user_id_fkey"
            columns: ["shared_with_user_id"]
            isOneToOne: false
            referencedRelation: "auth_users"
            referencedColumns: ["id"]
          },
        ]
      }
      notes: {
        Row: {
          content: string | null
          created_at: string
          id: string
          is_shared: boolean | null
          note_type: string | null
          parent_id: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          id?: string
          is_shared?: boolean | null
          note_type?: string | null
          parent_id?: string | null
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string | null
          created_at?: string
          id?: string
          is_shared?: boolean | null
          note_type?: string | null
          parent_id?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notes_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "notes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "auth_users"
            referencedColumns: ["id"]
          },
        ]
      }
      print_history: {
        Row: {
          hard_drive_id: string | null
          id: string
          operator_name: string
          project_id: string | null
          timestamp: string
          type: string
        }
        Insert: {
          hard_drive_id?: string | null
          id?: string
          operator_name: string
          project_id?: string | null
          timestamp?: string
          type: string
        }
        Update: {
          hard_drive_id?: string | null
          id?: string
          operator_name?: string
          project_id?: string | null
          timestamp?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "print_history_hard_drive_id_fkey"
            columns: ["hard_drive_id"]
            isOneToOne: false
            referencedRelation: "hard_drives"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "print_history_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          status: string | null
          type: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          status?: string | null
          type?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          status?: string | null
          type?: string | null
        }
        Relationships: []
      }
      shift_categories: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      shift_requests: {
        Row: {
          created_at: string | null
          end_date: string
          id: string
          reason: string | null
          replacement_user_id: string | null
          request_type: string
          review_notes: string | null
          reviewer_id: string | null
          shift_id: string | null
          start_date: string
          status: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          end_date: string
          id?: string
          reason?: string | null
          replacement_user_id?: string | null
          request_type: string
          review_notes?: string | null
          reviewer_id?: string | null
          shift_id?: string | null
          start_date: string
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          end_date?: string
          id?: string
          reason?: string | null
          replacement_user_id?: string | null
          request_type?: string
          review_notes?: string | null
          reviewer_id?: string | null
          shift_id?: string | null
          start_date?: string
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shift_requests_replacement_user_id_fkey"
            columns: ["replacement_user_id"]
            isOneToOne: false
            referencedRelation: "auth_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shift_requests_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "auth_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shift_requests_shift_id_fkey"
            columns: ["shift_id"]
            isOneToOne: false
            referencedRelation: "shifts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shift_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "auth_users"
            referencedColumns: ["id"]
          },
        ]
      }
      shift_templates: {
        Row: {
          color: string | null
          created_at: string | null
          end_time: string
          id: string
          location: string | null
          name: string
          notes: string | null
          priority: number | null
          shift_type: string
          start_time: string
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          end_time: string
          id?: string
          location?: string | null
          name: string
          notes?: string | null
          priority?: number | null
          shift_type: string
          start_time: string
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          end_time?: string
          id?: string
          location?: string | null
          name?: string
          notes?: string | null
          priority?: number | null
          shift_type?: string
          start_time?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      shifts: {
        Row: {
          color: string | null
          created_at: string | null
          end_time: string
          id: string
          is_recurring: boolean | null
          location: string | null
          notes: string | null
          priority: number | null
          recurrence_pattern: Json | null
          shift_type: string
          start_time: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          end_time: string
          id?: string
          is_recurring?: boolean | null
          location?: string | null
          notes?: string | null
          priority?: number | null
          recurrence_pattern?: Json | null
          shift_type: string
          start_time: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          end_time?: string
          id?: string
          is_recurring?: boolean | null
          location?: string | null
          notes?: string | null
          priority?: number | null
          recurrence_pattern?: Json | null
          shift_type?: string
          start_time?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shifts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "auth_users"
            referencedColumns: ["id"]
          },
        ]
      }
      subtasks: {
        Row: {
          completed: boolean | null
          created_at: string | null
          id: string
          order_index: number | null
          parent_task_id: string
          title: string
        }
        Insert: {
          completed?: boolean | null
          created_at?: string | null
          id?: string
          order_index?: number | null
          parent_task_id: string
          title: string
        }
        Update: {
          completed?: boolean | null
          created_at?: string | null
          id?: string
          order_index?: number | null
          parent_task_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "subtasks_parent_task_id_fkey"
            columns: ["parent_task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_assignments: {
        Row: {
          assigned_at: string
          id: string
          task_id: string
          user_id: string
        }
        Insert: {
          assigned_at?: string
          id?: string
          task_id: string
          user_id: string
        }
        Update: {
          assigned_at?: string
          id?: string
          task_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_assignments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_assignments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "auth_users"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          due_date: string | null
          id: string
          priority: string
          project_id: string | null
          status: string
          supervisor_comments: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          due_date?: string | null
          id?: string
          priority: string
          project_id?: string | null
          status: string
          supervisor_comments?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string
          project_id?: string | null
          status?: string
          supervisor_comments?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_table_if_not_exists: {
        Args: { table_name: string; column_definitions: Json[] }
        Returns: undefined
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
