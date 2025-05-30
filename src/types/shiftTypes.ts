
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
  // New fields for repetition
  repeat_pattern?: 'none' | 'daily' | 'weekly' | 'biweekly' | 'monthly';
  repeat_end_date?: string;
  parent_shift_id?: string; // For linked repeated shifts
  custom_schedule?: {
    start_hour: number;
    start_minute: number;
    end_hour: number;
    end_minute: number;
    break_duration?: number; // in minutes
  };
}

export interface ShiftRequest {
  id: string;
  user_id: string;
  request_type: 'time_off' | 'extra_work' | 'shift_change' | 'custom_shift';
  start_date: string;
  end_date?: string;
  reason?: string;
  status: 'pending' | 'approved' | 'rejected';
  approved_by?: string;
  approved_at?: string;
  shift_id?: string;
  created_at: string;
  updated_at: string;
  // New fields for custom shift requests
  requested_shift_details?: {
    title: string;
    shift_type: 'morning' | 'evening' | 'night' | 'custom';
    role?: string;
    custom_hours?: {
      start_hour: number;
      start_minute: number;
      end_hour: number;
      end_minute: number;
    };
  };
}

export interface ShiftWithUser extends Shift {
  user?: {
    id: string;
    username: string;
    isAdmin: boolean;
    role?: string;
    title?: string;
  };
}

export interface ShiftRequestWithUser extends ShiftRequest {
  user?: {
    id: string;
    username: string;
    role?: string;
    title?: string;
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
  repeat_pattern?: 'none' | 'daily' | 'weekly' | 'biweekly' | 'monthly';
  repeat_end_date?: string;
  custom_schedule?: {
    start_hour: number;
    start_minute: number;
    end_hour: number;
    end_minute: number;
    break_duration?: number;
  };
}

export interface ShiftAnalytics {
  totalShifts: number;
  shiftsThisWeek: number;
  shiftsThisMonth: number;
  averageHoursPerWeek: number;
  coverageRate: number;
  mostActiveEmployees: Array<{
    userId: string;
    username: string;
    shiftCount: number;
    totalHours: number;
  }>;
  shiftTypeDistribution: {
    morning: number;
    evening: number;
    night: number;
    custom: number;
  };
  pendingRequests: number;
  upcomingShifts: number;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: 'admin' | 'manager' | 'supervisor' | 'employee' | 'intern';
  title?: string;
  department?: string;
  created_at: string;
  updated_at: string;
}
