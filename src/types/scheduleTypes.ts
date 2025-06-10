export type ShiftType = 'morning' | 'afternoon' | 'night' | 'custom';
export type ShiftStatus = 'active' | 'cancelled' | 'completed';
export type RecurrenceAction = 'this' | 'future' | 'all' | 'previous';

export interface Shift {
  id: string;
  user_id: string;
  shift_type: ShiftType;
  start_time: string;
  end_time: string;
  notes?: string;
  status: ShiftStatus;
  recurrence_id?: string;
  created_at: string;
  updated_at: string;
}

export interface ShiftTemplate {
  id: string;
  name: string;
  shift_type: ShiftType;
  start_time: string;
  end_time: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface ShiftRequest {
  id: string;
  user_id: string;
  shift_id: string;
  request_type: 'leave' | 'swap';
  status: 'pending' | 'approved' | 'rejected';
  notes?: string;
  created_at: string;
  updated_at: string;
} 