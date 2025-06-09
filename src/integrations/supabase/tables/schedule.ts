import { supabase } from '../client';
import type { Shift, ShiftTemplate, LeaveRequest, ShiftSwapRequest, ScheduleUser } from '@/types/schedule';

// Error handling wrapper
const handleSupabaseError = (error: any) => {
  console.error('Database error:', error);
  throw new Error(error.message);
};

export const shiftsTable = {
  async getAll() {
    const { data, error } = await supabase
      .from('shifts')
      .select(`
        *,
        created_by:auth_users!shifts_created_by_fkey(username),
        user:auth_users!shifts_user_id_fkey(username)
      `)
      .order('start_time', { ascending: true });

    if (error) handleSupabaseError(error);
    return data as Shift[];
  },

  async getByDateRange(startDate: string, endDate: string) {
    const { data, error } = await supabase
      .from('shifts')
      .select(`
        *,
        created_by:auth_users!shifts_created_by_fkey(username),
        user:auth_users!shifts_user_id_fkey(username)
      `)
      .gte('start_time', startDate)
      .lte('end_time', endDate)
      .order('start_time', { ascending: true });

    if (error) handleSupabaseError(error);
    return data as Shift[];
  },

  async getByUserId(userId: string) {
    const { data, error } = await supabase
      .from('shifts')
      .select(`
        *,
        created_by:auth_users!shifts_created_by_fkey(username),
        user:auth_users!shifts_user_id_fkey(username)
      `)
      .eq('user_id', userId)
      .order('start_time', { ascending: true });

    if (error) handleSupabaseError(error);
    return data as Shift[];
  },

  async create(shift: Omit<Shift, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('shifts')
      .insert([shift])
      .select()
      .single();

    if (error) handleSupabaseError(error);
    return data as Shift;
  },

  async update(id: string, shift: Partial<Shift>) {
    const { data, error } = await supabase
      .from('shifts')
      .update(shift)
      .eq('id', id)
      .select()
      .single();

    if (error) handleSupabaseError(error);
    return data as Shift;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('shifts')
      .delete()
      .eq('id', id);

    if (error) handleSupabaseError(error);
  },

  subscribe(callback: (payload: any) => void) {
    return supabase
      .channel('shifts_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'shifts',
      }, callback)
      .subscribe();
  }
};

export const templatesTable = {
  async getAll() {
    const { data, error } = await supabase
      .from('shift_templates')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) handleSupabaseError(error);
    return data as ShiftTemplate[];
  },

  async create(template: Omit<ShiftTemplate, 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('shift_templates')
      .insert([template])
      .select()
      .single();

    if (error) handleSupabaseError(error);
    return data as ShiftTemplate;
  },

  async update(id: string, template: Partial<ShiftTemplate>) {
    const { data, error } = await supabase
      .from('shift_templates')
      .update(template)
      .eq('id', id)
      .select()
      .single();

    if (error) handleSupabaseError(error);
    return data as ShiftTemplate;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('shift_templates')
      .delete()
      .eq('id', id);

    if (error) handleSupabaseError(error);
  }
};

export const leaveRequestsTable = {
  async getAll() {
    const { data, error } = await supabase
      .from('leave_requests')
      .select(`
        *,
        user:auth_users!leave_requests_user_id_fkey(username),
        reviewer:auth_users!leave_requests_reviewer_id_fkey(username)
      `)
      .order('created_at', { ascending: false });

    if (error) handleSupabaseError(error);
    return data as LeaveRequest[];
  },

  async getByUserId(userId: string) {
    const { data, error } = await supabase
      .from('leave_requests')
      .select(`
        *,
        user:auth_users!leave_requests_user_id_fkey(username),
        reviewer:auth_users!leave_requests_reviewer_id_fkey(username)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) handleSupabaseError(error);
    return data as LeaveRequest[];
  },

  async create(request: Omit<LeaveRequest, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('leave_requests')
      .insert([request])
      .select()
      .single();

    if (error) handleSupabaseError(error);
    return data as LeaveRequest;
  },

  async update(id: string, request: Partial<LeaveRequest>) {
    const { data, error } = await supabase
      .from('leave_requests')
      .update(request)
      .eq('id', id)
      .select()
      .single();

    if (error) handleSupabaseError(error);
    return data as LeaveRequest;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('leave_requests')
      .delete()
      .eq('id', id);

    if (error) handleSupabaseError(error);
  },

  subscribe(callback: (payload: any) => void) {
    return supabase
      .channel('leave_requests_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'leave_requests',
      }, callback)
      .subscribe();
  }
};

export const swapRequestsTable = {
  async getAll() {
    const { data, error } = await supabase
      .from('shift_swap_requests')
      .select(`
        *,
        requester:auth_users!shift_swap_requests_requester_id_fkey(username),
        requested_user:auth_users!shift_swap_requests_requested_user_id_fkey(username),
        reviewer:auth_users!shift_swap_requests_reviewer_id_fkey(username),
        shift:shifts!shift_swap_requests_shift_id_fkey(*),
        proposed_shift:shifts!shift_swap_requests_proposed_shift_id_fkey(*)
      `)
      .order('created_at', { ascending: false });

    if (error) handleSupabaseError(error);
    return data as ShiftSwapRequest[];
  },

  async getByUserId(userId: string) {
    const { data, error } = await supabase
      .from('shift_swap_requests')
      .select(`
        *,
        requester:auth_users!shift_swap_requests_requester_id_fkey(username),
        requested_user:auth_users!shift_swap_requests_requested_user_id_fkey(username),
        reviewer:auth_users!shift_swap_requests_reviewer_id_fkey(username),
        shift:shifts!shift_swap_requests_shift_id_fkey(*),
        proposed_shift:shifts!shift_swap_requests_proposed_shift_id_fkey(*)
      `)
      .or(`requester_id.eq.${userId},requested_user_id.eq.${userId}`)
      .order('created_at', { ascending: false });

    if (error) handleSupabaseError(error);
    return data as ShiftSwapRequest[];
  },

  async create(request: Omit<ShiftSwapRequest, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('shift_swap_requests')
      .insert([request])
      .select()
      .single();

    if (error) handleSupabaseError(error);
    return data as ShiftSwapRequest;
  },

  async update(id: string, request: Partial<ShiftSwapRequest>) {
    const { data, error } = await supabase
      .from('shift_swap_requests')
      .update(request)
      .eq('id', id)
      .select()
      .single();

    if (error) handleSupabaseError(error);
    return data as ShiftSwapRequest;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('shift_swap_requests')
      .delete()
      .eq('id', id);

    if (error) handleSupabaseError(error);
  },

  subscribe(callback: (payload: any) => void) {
    return supabase
      .channel('shift_swap_requests_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'shift_swap_requests',
      }, callback)
      .subscribe();
  }
}; 