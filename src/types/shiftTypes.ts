export interface ShiftRequest {
  id: string;
  user_id: string;
  request_type: 'day-off' | 'unpaid-leave' | 'extra-days' | 'public-holiday';
  start_date: string;
  end_date: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  requested_shift_details?: {
    title: string;
    shift_type: string;
    role: string;
    custom_hours?: {
      start_hour: number;
      start_minute: number;
      end_hour: number;
      end_minute: number;
    };
  };
  created_at?: string;
  updated_at?: string;
}
