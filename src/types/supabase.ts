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
      shifts: {
        Row: {
          id: string
          userId: string
          startTime: string
          endTime: string
          type: string
          location: string | null
          notes: string | null
          createdAt: string
          updatedAt: string
        }
        Insert: {
          id?: string
          userId: string
          startTime: string
          endTime: string
          type: string
          location?: string | null
          notes?: string | null
          createdAt?: string
          updatedAt?: string
        }
        Update: {
          id?: string
          userId?: string
          startTime?: string
          endTime?: string
          type?: string
          location?: string | null
          notes?: string | null
          createdAt?: string
          updatedAt?: string
        }
      }
      shift_templates: {
        Row: {
          id: string
          name: string
          shift_type: string
          start_time: string
          end_time: string
          location: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          shift_type: string
          start_time: string
          end_time: string
          location?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          shift_type?: string
          start_time?: string
          end_time?: string
          location?: string | null
          created_at?: string
        }
      }
      leave_requests: {
        Row: {
          id: string
          user_id: string
          leave_type: string
          start_date: string
          end_date: string
          reason: string
          status: string
          reviewer_id: string | null
          review_notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          leave_type: string
          start_date: string
          end_date: string
          reason: string
          status?: string
          reviewer_id?: string | null
          review_notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          leave_type?: string
          start_date?: string
          end_date?: string
          reason?: string
          status?: string
          reviewer_id?: string | null
          review_notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      shift_swap_requests: {
        Row: {
          id: string
          requester_id: string
          requested_user_id: string
          shift_id: string
          proposed_shift_id: string | null
          status: string
          notes: string | null
          reviewer_id: string | null
          review_notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          requester_id: string
          requested_user_id: string
          shift_id: string
          proposed_shift_id?: string | null
          status?: string
          notes?: string | null
          reviewer_id?: string | null
          review_notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          requester_id?: string
          requested_user_id?: string
          shift_id?: string
          proposed_shift_id?: string | null
          status?: string
          notes?: string | null
          reviewer_id?: string | null
          review_notes?: string | null
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
      [_ in never]: never
    }
  }
} 