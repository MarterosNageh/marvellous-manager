import { supabase } from './client';
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
      .select('*')
      .order('startTime', { ascending: true });

    if (error) handleSupabaseError(error);
    return data as Shift[];
  },

  async getByDateRange(startDate: string, endDate: string) {
    const { data, error } = await supabase
      .from('shifts')
      .select('*')
      .gte('startTime', startDate)
      .lte('endTime', endDate)
      .order('startTime', { ascending: true });

    if (error) handleSupabaseError(error);
    return data as Shift[];
  },

  async create(shift: Omit<Shift, 'id' | 'createdAt' | 'updatedAt'>) {
    const { data, error } = await supabase
      .from('shifts')
      .insert([{
        userId: shift.userId,
        startTime: shift.startTime,
        endTime: shift.endTime,
        type: shift.type,
        notes: shift.notes,
      }])
      .select()
      .single();

    if (error) handleSupabaseError(error);
    return data;
  },

  async update(id: string, shift: Partial<Shift>) {
    const { data, error } = await supabase
      .from('shifts')
      .update({
        userId: shift.userId,
        startTime: shift.startTime,
        endTime: shift.endTime,
        type: shift.type,
        notes: shift.notes,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) handleSupabaseError(error);
    return data;
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
    console.log('Fetching all templates...');
    const { data, error } = await supabase
      .from('shift_templates')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching templates:', error);
      handleSupabaseError(error);
    }
    
    console.log('Fetched templates:', data);
    return data as ShiftTemplate[];
  },

  async create(template: Omit<ShiftTemplate, 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('shift_templates')
      .insert([template])
      .select()
      .single();

    if (error) handleSupabaseError(error);
    return data;
  },

  async update(id: string, template: Partial<ShiftTemplate>) {
    const { data, error } = await supabase
      .from('shift_templates')
      .update(template)
      .eq('id', id)
      .select()
      .single();

    if (error) handleSupabaseError(error);
    return data;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('shift_templates')
      .delete()
      .eq('id', id);

    if (error) handleSupabaseError(error);
  }
};

export const usersTable = {
  async getAll() {
    const { data, error } = await supabase
      .from('auth_users')
      .select(`
        id,
        username,
        role,
        title,
        created_at,
        updated_at
      `)
      .order('username', { ascending: true });

    if (error) handleSupabaseError(error);
    
    // Transform the data to match ScheduleUser type
    return (data || []).map(user => ({
      id: user.id,
      username: user.username,
      role: user.role || 'operator',
      title: user.title || '',
      created_at: user.created_at,
      updated_at: user.updated_at
    })) as ScheduleUser[];
  }
};

export const leaveRequestsTable = {
  async getAll() {
    const { data, error } = await supabase
      .from('leave_requests')
      .select(`
        *,
        user:user_id (
          id,
          username,
          role,
          title
        )
      `)
      .order('start_date', { ascending: true });

    if (error) handleSupabaseError(error);
    return data as LeaveRequest[];
  },

  async getByDateRange(startDate: string, endDate: string) {
    const { data, error } = await supabase
      .from('leave_requests')
      .select(`
        *,
        user:user_id (
          id,
          username,
          role,
          title
        )
      `)
      .gte('start_date', startDate)
      .lte('end_date', endDate)
      .order('start_date', { ascending: true });

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
    return data;
  },

  async updateStatus(id: string, status: string, comment?: string) {
    const { data, error } = await supabase
      .from('leave_requests')
      .update({ status, comment })
      .eq('id', id)
      .select()
      .single();

    if (error) handleSupabaseError(error);
    return data;
  }
};

export const swapRequestsTable = {
  async getAll() {
    const { data, error } = await supabase
      .from('shift_swap_requests')
      .select(`
        *,
        requester:requester_id (
          id,
          username,
          role,
          title
        ),
        target_user:target_user_id (
          id,
          username,
          role,
          title
        ),
        original_shift:original_shift_id (
          *
        ),
        target_shift:target_shift_id (
          *
        )
      `)
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
    return data;
  },

  async updateStatus(id: string, status: string, comment?: string) {
    const { data, error } = await supabase
      .from('shift_swap_requests')
      .update({ status, comment })
      .eq('id', id)
      .select()
      .single();

    if (error) handleSupabaseError(error);
    return data;
  }
}; 