import { AuthUser } from '@/context/AuthContext';

export type ViewType = 'daily' | 'weekly' | 'monthly';
export type ShiftType = 'morning' | 'night' | 'on-call';
export type LeaveType = 'paid' | 'unpaid' | 'day-off' | 'extra';
export type RequestStatus = 'pending' | 'approved' | 'rejected';
export type UserRole = 'admin' | 'senior' | 'operator';

export interface ScheduleUser {
  id: string;
  username: string;
  role: 'admin' | 'senior' | 'operator';
  title?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Shift {
  id: string;
  user_id: string;
  shift_type: string;
  start_time: string;
  end_time: string;
  notes?: string;
  created_by: string;
  title: string;
  status: string;
  role?: string;
  created_at?: string;
  updated_at?: string;
  user?: {
    username: string;
  };
}

export interface ShiftTemplate {
  id: string;
  name: string;
  shift_type: string;
  start_time: string;
  end_time: string;
  color?: string;
  created_at?: string;
}

export interface BaseRequest {
  id: string;
  user_id: string;
  start_date: string;
  end_date: string;
  status: RequestStatus;
  reason: string;
  comment?: string;
  created_at: string;
  updated_at: string;
}

export interface LeaveRequest {
  id: string;
  user_id: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  reason: string;
  status: string;
  reviewer_id?: string;
  review_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ShiftSwapRequest {
  id: string;
  requester_id: string;
  requested_user_id: string;
  shift_id: string;
  proposed_shift_id?: string;
  status: string;
  notes?: string;
  reviewer_id?: string;
  review_notes?: string;
  created_at: string;
  updated_at: string;
}

// Props Types
export interface ShiftViewProps {
  viewType: ViewType;
  selectedDate: Date;
  onViewTypeChange: (type: ViewType) => void;
  onDateChange: (date: Date) => void;
  teamFilter: string;
  locationFilter: string;
}

export interface BaseViewProps {
  selectedDate: Date;
  onEditShift: (shift: Shift) => void;
  onDeleteShift: (shiftId: string) => void;
  onDateChange: (date: Date) => void;
  users: ScheduleUser[];
  shifts: Shift[];
}

export interface DailyViewProps extends BaseViewProps {}

export interface WeeklyViewProps extends BaseViewProps {
  startDate: Date;
  onAddShift: () => void;
}

export interface MonthlyViewProps extends BaseViewProps {}

export interface ShiftDialogProps {
  shift?: Shift | null;
  onClose: () => void;
  onSave: (shiftData: Partial<Shift>) => Promise<void>;
  templates: ShiftTemplate[];
  users: ScheduleUser[];
}

export interface RequestsViewProps {
  users: ScheduleUser[];
}

// Utility Types
export interface WeeklyViewData {
  users: ScheduleUser[];
  shifts: Shift[];
  leaveRequests: LeaveRequest[];
  startDate: Date;
  endDate: Date;
} 