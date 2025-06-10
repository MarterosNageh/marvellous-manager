import { AuthUser } from '@/context/AuthContext';
import { RecurrenceAction, User } from './index';

export type ViewType = 'daily' | 'weekly' | 'monthly';
export type ShiftType = 'morning' | 'night' | 'on-call' | 'day-off' | 'public-holiday';
export type LeaveType = 'day-off' | 'unpaid-leave' | 'extra-day' | 'public-holiday' | 'paid';
export type RequestStatus = 'pending' | 'approved' | 'rejected';
export type UserRole = 'admin' | 'senior' | 'operator';
export type RequestType = 'leave' | 'swap';
export type ShiftStatus = 'active' | 'inactive' | 'pending_swap';

export interface ScheduleUser {
  id: string;
  username: string;
  role: 'admin' | 'operator' | 'senior';
  title?: string;
  balance?: number;
  department?: string;
  team_name?: string;
}

export interface Shift {
  id: string;
  user_id: string;
  shift_type: string;
  start_time: string;
  end_time: string;
  title: string;
  description: string;
  notes: string;
  status: ShiftStatus;
  created_by: string;
  color: string;
  repeat_days: string[];
  is_all_day?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ShiftTemplate {
  id: string;
  name: string;
  shift_type: string;
  start_time: string;
  end_time: string;
  color?: string;
  created_at?: string;
  user_id: string;
}

export interface BaseRequest {
  id: string;
  user_id: string;
  status: RequestStatus;
  created_at: string;
  updated_at: string;
  reviewer_id?: string;
  start_date: string;
  end_date: string;
}

export interface LeaveRequest extends BaseRequest {
  type: 'leave';
  leave_type: LeaveType;
  reason: string;
  notes?: string;
  review_notes?: string;
}

export interface SwapRequest extends BaseRequest {
  type: 'swap';
  notes: string;
  requester_id: string;
  requested_user_id: string;
  shift_id: string;
  proposed_shift_id?: string;
}

export interface SwapRequestDB extends Omit<SwapRequest, 'start_date' | 'end_date'> {
  shift?: {
    start_time: string;
    end_time: string;
  };
  start_date?: string;
  end_date?: string;
}

export type DBRequest = LeaveRequest | SwapRequestDB;
export type AnyRequest = LeaveRequest | SwapRequest;

export interface DisplayRequest {
  id: string;
  user_id: string;
  type: 'leave' | 'swap';
  status: RequestStatus;
  created_at: string;
  updated_at: string;
  displayStartDate: string;
  displayEndDate: string;
  displayReason: string;
  leave_type?: LeaveType;
  originalRequest: LeaveRequest | SwapRequest;
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
  onDeleteShift: (shiftId: string, recurrenceAction: RecurrenceAction) => void;
  onDateChange: (date: Date) => void;
  users: ScheduleUser[];
  shifts: Shift[];
}

export interface DailyViewProps extends BaseViewProps {}

export interface WeeklyViewProps extends BaseViewProps {
  startDate: Date;
  onAddShift: () => void;
  onUpdateShift: (shiftId: string, updates: Partial<Shift>, recurrenceAction: RecurrenceAction) => Promise<void>;
  refreshData: () => Promise<void>;
}

export interface MonthlyViewProps extends BaseViewProps {}

export interface ShiftDialogProps {
  shift?: Shift;
  onClose: () => void;
  onSave: (shift: any) => Promise<void>;
  onDelete?: (shiftId: string, recurrenceAction: RecurrenceAction) => Promise<void>;
  templates: ShiftTemplate[];
  users: ScheduleUser[];
}

export interface RequestsViewProps {
  users: ScheduleUser[];
  onRequestsUpdate?: (leaveRequests: LeaveRequest[], swapRequests: SwapRequest[]) => void;
}

// Utility Types
export interface WeeklyViewData {
  users: ScheduleUser[];
  shifts: Shift[];
  leaveRequests: LeaveRequest[];
  startDate: Date;
  endDate: Date;
}

// Database Types
export interface ShiftRequestDB {
  id: string;
  user_id: string;
  request_type: RequestType;
  start_date: string;
  end_date: string;
  reason: string;
  status: RequestStatus;
  reviewer_id?: string;
  review_notes?: string;
  replacement_user_id?: string;
  shift_id?: string;
  proposed_shift_id?: string;
  created_at: string;
  updated_at: string;
}

export interface ShiftRequest {
  id: string;
  user_id: string;
  request_type: 'day-off' | 'unpaid-leave' | 'extra-days' | 'public-holiday';
  start_date: string;
  end_date: string;
  reason: string;
  status: RequestStatus;
  created_at?: string;
  updated_at?: string;
}

// Database Table Interfaces
export interface LeaveRequestTable {
  getAll(): Promise<LeaveRequest[]>;
  getAllForUser(userId: string): Promise<LeaveRequest[]>;
  create(request: Omit<LeaveRequest, "id" | "created_at" | "updated_at">): Promise<LeaveRequest>;
  update(id: string, request: Partial<LeaveRequest>): Promise<LeaveRequest>;
  updateStatus(id: string, status: RequestStatus): Promise<LeaveRequest>;
  delete(id: string): Promise<void>;
}

export interface ShiftSwapRequestTable {
  getAll(): Promise<SwapRequest[]>;
  getAllForUser(userId: string): Promise<SwapRequest[]>;
  create(request: Omit<SwapRequest, "id" | "created_at" | "updated_at">): Promise<SwapRequest>;
  update(id: string, request: Partial<SwapRequest>): Promise<SwapRequest>;
  updateStatus(id: string, status: RequestStatus): Promise<SwapRequest>;
  delete(id: string): Promise<void>;
} 

// Helper type for converting DB requests to display requests
export type RequestToDisplay<T extends LeaveRequest | SwapRequest> = Omit<DisplayRequest, 'originalRequest'> & {
  originalRequest: T;
};

// Helper type for converting SwapRequestDB to SwapRequest
export type SwapRequestDBToRequest = Omit<SwapRequest, 'type'> & {
  type: 'swap';
}; 