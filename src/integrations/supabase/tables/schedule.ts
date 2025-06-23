import { supabase } from '../client';
import type { 
  Shift, 
  ShiftTemplate, 
  LeaveRequest, 
  SwapRequest, 
  RequestStatus, 
  ShiftType,
  RequestType,
  LeaveType
} from '@/types/schedule';
import type { Database } from '../types';
import { RecurrenceAction } from '@/types';

interface DBShift {
  id: string;
  user_id: string;
  shift_type: string;
  start_time: string;
  end_time: string;
  title?: string;
  description?: string;
  notes?: string;
  status?: 'active' | 'inactive';
  created_by?: string;
  repeat_days?: number[];
  created_at?: string;
  updated_at?: string;
  color?: string;
}

interface DBRequest {
  id: string;
  user_id: string;
  request_type: 'leave' | 'swap';
  leave_type?: LeaveType;
  start_date?: string;
  end_date?: string;
  reason?: string;
  notes?: string;
  status: RequestStatus;
  created_at: string;
  updated_at: string;
  shift_id?: string;
  proposed_shift_id?: string;
  requester_id?: string;
  requested_user_id?: string;
}

// Helper function to map database shift to frontend shift
const mapDBShiftToShift = (dbShift: DBShift): Shift => ({
  id: dbShift.id,
  user_id: dbShift.user_id,
  shift_type: dbShift.shift_type,
  start_time: dbShift.start_time,
  end_time: dbShift.end_time,
  title: dbShift.title || dbShift.shift_type,
  description: dbShift.description || '',
  notes: dbShift.notes || '',
  status: dbShift.status || 'active',
  created_by: dbShift.created_by || dbShift.user_id,
  repeat_days: (dbShift.repeat_days || []).map(String),
  created_at: dbShift.created_at || new Date().toISOString(),
  updated_at: dbShift.updated_at,
  color: dbShift.color || (dbShift.shift_type === 'night' ? '#EDE7F6' : dbShift.shift_type === 'over night' ? '#FFF3E0' : '#E3F2FD')
});

const sanitizeShiftForDB = (shift: Partial<Shift>): Partial<Database['public']['Tables']['shifts']['Row']> => {
    const dbRow: Partial<Database['public']['Tables']['shifts']['Row']> = {};

    // Only include keys that are present in the 'shifts' table row type
    if (shift.user_id !== undefined) dbRow.user_id = shift.user_id;
    if (shift.shift_type !== undefined) dbRow.shift_type = shift.shift_type;
    if (shift.start_time !== undefined) dbRow.start_time = shift.start_time;
    if (shift.end_time !== undefined) dbRow.end_time = shift.end_time;
    if (shift.notes !== undefined) dbRow.notes = shift.notes;
    if (shift.color !== undefined) dbRow.color = shift.color;

    return dbRow;
};

// Shifts table operations
export const shiftsTable = {
  async getAll(): Promise<Shift[]> {
    const { data, error } = await supabase
      .from('shifts')
      .select('*')
      .order('start_time', { ascending: true });

    if (error) {
      throw error;
    }

    return (data || []).map(mapDBShiftToShift);
  },

  async getByDateRange(startDate: string, endDate: string): Promise<Shift[]> {
    const { data, error } = await supabase
      .from('shifts')
      .select('*')
      .gte('start_time', startDate)
      .lte('start_time', endDate)
      .order('start_time', { ascending: true });
    
    if (error) throw error;
    return (data || []).map(mapDBShiftToShift);
  },

  async getByUserId(userId: string): Promise<Shift[]> {
    const { data, error } = await supabase
      .from('shifts')
      .select('*')
      .eq('user_id', userId)
      .order('start_time', { ascending: true });
    
    if (error) throw error;
    return (data || []).map(mapDBShiftToShift);
  },

  async create(shift: Omit<Shift, 'id'>): Promise<Shift> {
    console.log('Creating shift with data:', shift);
    
    // Prepare the data for insertion
    const shiftData = {
      user_id: shift.user_id,
      shift_type: shift.shift_type,
      start_time: shift.start_time,
      end_time: shift.end_time,
      notes: shift.notes || '',
      color: shift.color || (shift.shift_type === 'night' ? '#EDE7F6' : shift.shift_type === 'over night' ? '#FFF3E0' : '#E3F2FD')
    };

    console.log('Prepared shift data:', shiftData);

    const { data, error } = await supabase
      .from('shifts')
      .insert([shiftData])
      .select()
      .single();

    if (error) {
      console.error('Error creating shift:', error);
      throw error;
    }

    console.log('Created shift:', data);
    return mapDBShiftToShift(data as DBShift);
  },

  async update(id: string, shift: Partial<Shift>, recurrenceAction: RecurrenceAction = 'this'): Promise<void> {
    const sanitizedPayload = sanitizeShiftForDB(shift);

    if (recurrenceAction === 'this') {
      const { error } = await supabase.from('shifts').update(sanitizedPayload).eq('id', id);
      if (error) {
        console.error('Error updating single shift:', error);
        throw new Error(`Failed to update shift. DB error: ${error.message}`);
      }
      return;
    }

    // For series updates ('future' or 'previous')
    const { data: referenceShift, error: fetchError } = await supabase
      .from('shifts')
      .select('start_time, user_id')
      .eq('id', id)
      .single();

    if (fetchError) {
      console.error('Error fetching reference shift:', fetchError);
      throw new Error('Could not find the shift to update.');
    }
    
    const { start_time, user_id } = referenceShift;

    // Update the series with all fields except start_time and end_time
    const { start_time: newStartTime, end_time: newEndTime, ...seriesUpdateData } = sanitizedPayload;
    
    if (Object.keys(seriesUpdateData).length > 0) {
      let seriesQuery = supabase.from('shifts').update(seriesUpdateData)
        .eq('user_id', user_id);

      if (recurrenceAction === 'future') {
        seriesQuery = seriesQuery.gte('start_time', start_time);
      } else { // 'previous'
        seriesQuery = seriesQuery.lte('start_time', start_time);
      }

      const { error: seriesUpdateError } = await seriesQuery;

      if (seriesUpdateError) {
        console.error('Error updating shift series:', seriesUpdateError);
        throw new Error(`Failed to update shift series. DB error: ${seriesUpdateError.message}`);
      }
    }

    // Update only the specific shift with its new start and end times
    if (newStartTime || newEndTime) {
      const specificShiftUpdateData: Partial<Database['public']['Tables']['shifts']['Row']> = {};
      if (newStartTime) specificShiftUpdateData.start_time = newStartTime;
      if (newEndTime) specificShiftUpdateData.end_time = newEndTime;
      
      const { error: singleUpdateError } = await supabase
          .from('shifts')
          .update(specificShiftUpdateData)
          .eq('id', id);
      
      if (singleUpdateError) {
          console.error('Error updating shift times:', singleUpdateError);
          throw new Error(`Failed to update shift times. DB error: ${singleUpdateError.message}`);
      }
    }
  },

  async delete(id: string, recurrenceAction: RecurrenceAction = 'this'): Promise<void> {
    // Get the reference shift to identify the recurrence pattern
    const { data: referenceShift, error: fetchError } = await supabase
      .from('shifts')
      .select('start_time, user_id, shift_type')
      .eq('id', id)
      .single();

    if (fetchError) {
      // If the shift is already gone, we can consider the job done.
      if (fetchError.code === 'PGRST116') {
        console.warn(`Shift with id ${id} not found. It might have been already deleted.`);
        return;
      }
      console.error('Error fetching reference shift:', fetchError);
      throw new Error('Could not find the shift to delete.');
    }
    
    const { start_time, user_id, shift_type } = referenceShift;

    // Base query for deleting shifts
    let query = supabase.from('shifts').delete();

    // Apply recurrence logic
    if (recurrenceAction === 'this') {
      // Delete this single shift only
      query = query.eq('id', id);
    } else {
      // For future or previous, match the pattern
      query = query.eq('user_id', user_id).eq('shift_type', shift_type);
      if (recurrenceAction === 'future') {
        // Delete this shift and all future ones in the series
        query = query.gte('start_time', start_time);
      } else if (recurrenceAction === 'previous') {
        // Delete this shift and all previous ones in the series
        query = query.lte('start_time', start_time);
      }
    }

    // Execute the delete query
    const { error: deleteError } = await query;

    if (deleteError) {
      console.error('Error deleting shifts:', deleteError);
      throw new Error('Failed to delete shifts.');
    }
  },

  getTemplates: async () => {
    const { data, error } = await supabase
      .from('shift_templates')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
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
    return (data || []).map(template => ({
      ...template,
      user_id: 'system' // Add default user_id since templates don't have user_id
    }));
  },

  async create(template: Omit<ShiftTemplate, 'id' | 'created_at'>): Promise<ShiftTemplate> {
    // Remove user_id from template before inserting since it doesn't exist in the table
    const { user_id, ...templateData } = template;
    
    const { data, error } = await supabase
      .from('shift_templates')
      .insert(templateData)
      .select()
      .single();
    
    if (error) throw error;
    return {
      ...data,
      user_id: 'system'
    };
  },

  async update(id: string, template: Partial<ShiftTemplate>): Promise<ShiftTemplate> {
    // Remove user_id from template before updating since it doesn't exist in the table
    const { user_id, ...templateData } = template;
    
    const { data, error } = await supabase
      .from('shift_templates')
      .update(templateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return {
      ...data,
      user_id: 'system'
    };
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('shift_templates')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },
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

// Shift Requests table operations
export const shiftRequestsTable = {
  async getAll() {
    const { data, error } = await supabase
      .from('shift_requests')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  async create(request: any) {
    const { data, error } = await supabase
      .from('shift_requests')
      .insert({
        ...request,
        notes: request.notes || ''
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async update(id: string, request: any) {
    const { data, error } = await supabase
      .from('shift_requests')
      .update(request)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('shift_requests')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return true;
  }
};

// Leave Requests table operations
export const leaveRequestsTable = {
  async getAll(): Promise<LeaveRequest[]> {
    const { data, error } = await supabase
      .from('shift_requests')
      .select('*')
      .or('request_type.eq.leave,request_type.eq.day-off')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data as any[]).map(row => ({
      id: row.id,
      user_id: row.user_id,
      type: 'leave',
      request_type: 'leave',
      leave_type: row.leave_type || 'day-off',
      start_date: row.start_date,
      end_date: row.end_date,
      reason: row.reason || '',
      notes: row.notes || '',
      status: row.status,
      created_at: row.created_at,
      updated_at: row.updated_at,
    })) as LeaveRequest[];
  },

  async getAllForUser(userId: string): Promise<LeaveRequest[]> {
    const { data, error } = await supabase
      .from('shift_requests')
      .select('*')
      .eq('user_id', userId)
      .or('request_type.eq.leave,request_type.eq.day-off')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data as any[]).map(row => ({
      id: row.id,
      user_id: row.user_id,
      type: 'leave',
      request_type: 'leave',
      leave_type: row.leave_type || 'day-off',
      start_date: row.start_date,
      end_date: row.end_date,
      reason: row.reason || '',
      notes: row.notes || '',
      status: row.status,
      created_at: row.created_at,
      updated_at: row.updated_at,
    })) as LeaveRequest[];
  },

  async create(request: Omit<LeaveRequest, 'id' | 'status' | 'created_at' | 'updated_at' | 'type' | 'request_type'>): Promise<LeaveRequest> {
    const { data, error } = await supabase
      .from('shift_requests')
      .insert({
        user_id: request.user_id,
        start_date: request.start_date,
        end_date: request.end_date,
        reason: request.reason,
        notes: request.notes || '',
        request_type: 'leave',
        leave_type: request.leave_type,
        status: 'pending',
      })
      .select()
      .single();

    if (error) throw error;
    const row = data as any;
    return {
      id: row.id,
      user_id: row.user_id,
      type: 'leave',
      request_type: 'leave',
      leave_type: row.leave_type,
      start_date: row.start_date,
      end_date: row.end_date,
      reason: row.reason || '',
      notes: row.notes || '',
      status: row.status,
      created_at: row.created_at,
      updated_at: row.updated_at,
    } as LeaveRequest;
  },

  async update(id: string, request: Partial<LeaveRequest>): Promise<LeaveRequest> {
    const updateData: any = {};
    if (request.user_id) updateData.user_id = request.user_id;
    if (request.leave_type) updateData.leave_type = request.leave_type;
    if (request.start_date) updateData.start_date = request.start_date;
    if (request.end_date) updateData.end_date = request.end_date;
    if (request.reason !== undefined) updateData.reason = request.reason;
    if (request.notes !== undefined) updateData.notes = request.notes;
    if (request.status) updateData.status = request.status;

    const { data, error } = await supabase
      .from('shift_requests')
      .update(updateData)
      .eq('id', id)
      .eq('request_type', 'leave')
      .select()
      .single();

    if (error) throw error;
    const row = data as any;
    return {
      id: row.id,
      user_id: row.user_id,
      type: 'leave',
      request_type: 'leave',
      leave_type: row.leave_type,
      start_date: row.start_date,
      end_date: row.end_date,
      reason: row.reason || '',
      notes: row.notes || '',
      status: row.status,
      created_at: row.created_at,
      updated_at: row.updated_at,
    } as LeaveRequest;
  },

  async updateStatus(id: string, status: RequestStatus): Promise<LeaveRequest> {
    const { data, error } = await supabase
      .from('shift_requests')
      .update({ status })
      .eq('id', id)
      .eq('request_type', 'leave')
      .select()
      .single();

    if (error) throw error;
    const row = data as any;
    return {
      id: row.id,
      user_id: row.user_id,
      type: 'leave',
      request_type: 'leave',
      leave_type: row.leave_type,
      start_date: row.start_date,
      end_date: row.end_date,
      reason: row.reason || '',
      notes: row.notes || '',
      status: row.status,
      created_at: row.created_at,
      updated_at: row.updated_at,
    } as LeaveRequest;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('shift_requests')
      .delete()
      .eq('id', id)
      .eq('request_type', 'leave');

    if (error) throw error;
  },

  count: async (filters?: { status?: RequestStatus }): Promise<number> => {
    let query = supabase
      .from('shift_requests')
      .select('*', { count: 'exact', head: true })
      .eq('request_type', 'leave');

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    const { count, error } = await query;

    if (error) {
      console.error('Error counting leave requests:', error);
      return 0;
    }

    return count || 0;
  },
};

// Swap Requests table operations
export const swapRequestsTable = {
  async getAll(): Promise<SwapRequest[]> {
    const { data, error } = await supabase
      .from('shift_requests')
      .select('*')
      .eq('request_type', 'swap')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return (data as any[]).map(row => ({
      id: row.id,
      user_id: row.user_id,
      type: 'swap',
      request_type: 'swap',
      shift_id: row.shift_id || '',
      proposed_shift_id: row.proposed_shift_id,
      requester_id: row.user_id,
      requested_user_id: row.replacement_user_id || '',
      notes: row.notes || '',
      status: row.status,
      start_date: row.start_date || '',
      end_date: row.end_date || '',
      created_at: row.created_at,
      updated_at: row.updated_at,
    })) as SwapRequest[];
  },

  async getAllForUser(userId: string): Promise<SwapRequest[]> {
    const { data, error } = await supabase
      .from('shift_requests')
      .select('*')
      .eq('request_type', 'swap')
      .or(`user_id.eq.${userId},replacement_user_id.eq.${userId}`)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return (data as any[]).map(row => ({
      id: row.id,
      user_id: row.user_id,
      type: 'swap',
      request_type: 'swap',
      shift_id: row.shift_id || '',
      proposed_shift_id: row.proposed_shift_id,
      requester_id: row.user_id,
      requested_user_id: row.replacement_user_id || '',
      notes: row.notes || '',
      status: row.status,
      start_date: row.start_date || '',
      end_date: row.end_date || '',
      created_at: row.created_at,
      updated_at: row.updated_at,
    })) as SwapRequest[];
  },

  async create(request: Omit<SwapRequest, 'id' | 'status' | 'created_at' | 'updated_at' | 'type' | 'request_type'>): Promise<SwapRequest> {
    const { data, error } = await supabase
      .from('shift_requests')
      .insert({
        user_id: request.requester_id,
        replacement_user_id: request.requested_user_id,
        shift_id: request.shift_id,
        proposed_shift_id: request.proposed_shift_id,
        request_type: 'swap',
        status: 'pending',
        notes: request.notes,
        start_date: request.start_date,
        end_date: request.end_date,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating swap request:', error);
      throw error;
    }

    const row = data as any;
    return {
      id: row.id,
      user_id: row.user_id,
      type: 'swap',
      request_type: 'swap',
      shift_id: row.shift_id || '',
      proposed_shift_id: row.proposed_shift_id,
      requester_id: row.user_id,
      requested_user_id: row.replacement_user_id || '',
      notes: row.notes || '',
      status: row.status,
      start_date: row.start_date || '',
      end_date: row.end_date || '',
      created_at: row.created_at,
      updated_at: row.updated_at,
    } as SwapRequest;
  },

  async update(id: string, request: Partial<SwapRequest>): Promise<SwapRequest> {
    const updateData: any = {};
    if (request.user_id) updateData.user_id = request.user_id;
    if (request.shift_id) updateData.shift_id = request.shift_id;
    if (request.proposed_shift_id) updateData.proposed_shift_id = request.proposed_shift_id;
    if (request.requester_id) updateData.user_id = request.requester_id;
    if (request.requested_user_id) updateData.replacement_user_id = request.requested_user_id;
    if (request.notes !== undefined) updateData.notes = request.notes;
    if (request.status) updateData.status = request.status;

    const { data, error } = await supabase
      .from('shift_requests')
      .update(updateData)
      .eq('id', id)
      .eq('request_type', 'swap')
      .select()
      .single();

    if (error) throw error;
    const row = data as any;
    return {
      id: row.id,
      user_id: row.user_id,
      type: 'swap',
      request_type: 'swap',
      shift_id: row.shift_id || '',
      proposed_shift_id: row.proposed_shift_id,
      requester_id: row.user_id,
      requested_user_id: row.replacement_user_id || '',
      notes: row.notes || '',
      status: row.status,
      start_date: row.start_date || '',
      end_date: row.end_date || '',
      created_at: row.created_at,
      updated_at: row.updated_at,
    } as SwapRequest;
  },

  async updateStatus(id: string, status: RequestStatus): Promise<SwapRequest> {
    const { data, error } = await supabase
      .from('shift_requests')
      .update({ status })
      .eq('id', id)
      .eq('request_type', 'swap')
      .select()
      .single();
    
    if (error) throw error;
    const row = data as any;
    return {
      id: row.id,
      user_id: row.user_id,
      type: 'swap',
      request_type: 'swap',
      shift_id: row.shift_id || '',
      proposed_shift_id: row.proposed_shift_id,
      requester_id: row.user_id,
      requested_user_id: row.replacement_user_id || '',
      notes: row.notes || '',
      status: row.status,
      start_date: row.start_date || '',
      end_date: row.end_date || '',
      created_at: row.created_at,
      updated_at: row.updated_at,
    } as SwapRequest;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('shift_requests')
      .delete()
      .eq('id', id)
      .eq('request_type', 'swap');
    
    if (error) throw error;
  },

  count: async (filters?: { status?: RequestStatus }): Promise<number> => {
    let query = supabase
      .from('shift_requests')
      .select('*', { count: 'exact', head: true })
      .eq('request_type', 'swap');

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    const { count, error } = await query;

    if (error) {
      console.error('Error counting swap requests:', error);
      return 0;
    }

    return count || 0;
  },
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

// Remove userBalancesTable since the table doesn't exist - balance is stored in auth_users
