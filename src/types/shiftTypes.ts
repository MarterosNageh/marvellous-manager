
export interface Shift {
  id: string;
  user_id: string;
  title: string;
  start_time: string;
  end_time: string;
  shift_type: 'morning' | 'evening' | 'night' | 'custom';
  role?: string;
  notes?: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ShiftRequest {
  id: string;
  user_id: string;
  request_type: 'time_off' | 'extra_work' | 'shift_change';
  start_date: string;
  end_date?: string;
  reason?: string;
  status: 'pending' | 'approved' | 'rejected';
  approved_by?: string;
  approved_at?: string;
  shift_id?: string;
  created_at: string;
  updated_at: string;
}

export interface ShiftWithUser extends Shift {
  user?: {
    id: string;
    username: string;
    isAdmin: boolean;
  };
}

export interface ShiftRequestWithUser extends ShiftRequest {
  user?: {
    id: string;
    username: string;
  };
}

export type ViewMode = 'day' | 'week' | 'month';

export interface ShiftFormData {
  user_id: string;
  title: string;
  start_time: string;
  end_time: string;
  shift_type: 'morning' | 'evening' | 'night' | 'custom';
  role?: string;
  notes?: string;
}
