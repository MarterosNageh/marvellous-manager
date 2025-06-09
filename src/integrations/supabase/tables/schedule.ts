
import { supabase } from '../client';
import type { Shift, ShiftTemplate, LeaveRequest, ShiftSwapRequest } from '@/types/schedule';

// Shifts table operations
export const shiftsTable = {
  async getAll(): Promise<Shift[]> {
    const { data, error } = await supabase
      .from('shifts')
      .select('*')
      .order('start_time', { ascending: true });
    
    if (error) throw error;
    return data || [];
  },

  async getByDateRange(startDate: string, endDate: string): Promise<Shift[]> {
    const { data, error } = await supabase
      .from('shifts')
      .select('*')
      .gte('start_time', startDate)
      .lte('start_time', endDate)
      .order('start_time', { ascending: true });
    
    if (error) throw error;
    return data || [];
  },

  async getByUserId(userId: string): Promise<Shift[]> {
    const { data, error } = await supabase
      .from('shifts')
      .select('*')
      .eq('user_id', userId)
      .order('start_time', { ascending: true });
    
    if (error) throw error;
    return data || [];
  },

  async create(shift: Omit<Shift, 'id' | 'created_at' | 'updated_at'>): Promise<Shift> {
    const { data, error } = await supabase
      .from('shifts')
      .insert(shift)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async update(id: string, shift: Partial<Shift>): Promise<Shift> {
    const { data, error } = await supabase
      .from('shifts')
      .update(shift)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('shifts')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  subscribe(callback: (payload: any) => void) {
    return supabase
      .channel('shifts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'shifts' }, callback)
      .subscribe();
  }
};

// Shift Templates table operations
export const templatesTable = {
  async getAll(): Promise<ShiftTemplate[]> {
    const { data, error } = await supabase
      .from('shift_templates')
      .select('*')
      .order('name', { ascending: true });
    
    if (error) throw error;
    return data || [];
  },

  async create(template: Omit<ShiftTemplate, 'id' | 'created_at'>): Promise<ShiftTemplate> {
    const { data, error } = await supabase
      .from('shift_templates')
      .insert(template)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async update(id: string, template: Partial<ShiftTemplate>): Promise<ShiftTemplate> {
    const { data, error } = await supabase
      .from('shift_templates')
      .update(template)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('shift_templates')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};

// Shift Categories table operations
export const categoriesTable = {
  async getAll() {
    const { data, error } = await supabase
      .from('shift_categories')
      .select('*')
      .order('name', { ascending: true });
    
    if (error) throw error;
    return data || [];
  },

  async create(category: any) {
    const { data, error } = await supabase
      .from('shift_categories')
      .insert(category)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async update(id: string, category: any) {
    const { data, error } = await supabase
      .from('shift_categories')
      .update(category)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('shift_categories')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};

// Leave Requests table operations
export const leaveRequestsTable = {
  async getAll(): Promise<LeaveRequest[]> {
    const { data, error } = await supabase
      .from('leave_requests')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  async create(request: Omit<LeaveRequest, 'id' | 'created_at' | 'updated_at'>): Promise<LeaveRequest> {
    const { data, error } = await supabase
      .from('leave_requests')
      .insert(request)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async update(id: string, request: Partial<LeaveRequest>): Promise<LeaveRequest> {
    const { data, error } = await supabase
      .from('leave_requests')
      .update(request)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('leave_requests')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  subscribe(callback: (payload: any) => void) {
    return supabase
      .channel('leave_requests')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leave_requests' }, callback)
      .subscribe();
  }
};

// Shift Swap Requests table operations
export const swapRequestsTable = {
  async getAll(): Promise<ShiftSwapRequest[]> {
    const { data, error } = await supabase
      .from('shift_swap_requests')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  async create(request: Omit<ShiftSwapRequest, 'id' | 'created_at' | 'updated_at'>): Promise<ShiftSwapRequest> {
    const { data, error } = await supabase
      .from('shift_swap_requests')
      .insert(request)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async update(id: string, request: Partial<ShiftSwapRequest>): Promise<ShiftSwapRequest> {
    const { data, error } = await supabase
      .from('shift_swap_requests')
      .update(request)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('shift_swap_requests')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  subscribe(callback: (payload: any) => void) {
    return supabase
      .channel('shift_swap_requests')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'shift_swap_requests' }, callback)
      .subscribe();
  }
};

// Users table operations for schedule
export const usersTable = {
  async getAll() {
    const { data, error } = await supabase
      .from('auth_users')
      .select('*')
      .order('username', { ascending: true });
    
    if (error) throw error;
    return data || [];
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('auth_users')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  }
};
