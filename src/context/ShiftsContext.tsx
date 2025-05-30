
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { Shift, ShiftRequest, ShiftWithUser, ShiftRequestWithUser, ShiftFormData } from '@/types/shiftTypes';
import { toast } from 'sonner';

interface User {
  id: string;
  username: string;
  role?: string;
  isAdmin?: boolean;
}

interface ShiftsContextType {
  shifts: ShiftWithUser[];
  shiftRequests: ShiftRequestWithUser[];
  users: User[];
  loading: boolean;
  refreshShifts: () => Promise<void>;
  refreshShiftRequests: () => Promise<void>;
  createShift: (shiftData: ShiftFormData) => Promise<boolean>;
  updateShift: (id: string, shiftData: Partial<ShiftFormData>) => Promise<boolean>;
  deleteShift: (id: string) => Promise<boolean>;
  createShiftRequest: (requestData: Omit<ShiftRequest, 'id' | 'created_at' | 'updated_at'>) => Promise<boolean>;
  approveShiftRequest: (id: string) => Promise<boolean>;
  rejectShiftRequest: (id: string) => Promise<boolean>;
  getTodayShifts: () => ShiftWithUser[];
  getUpcomingShifts: () => ShiftWithUser[];
  getCurrentShifts: () => ShiftWithUser[];
}

const ShiftsContext = createContext<ShiftsContextType | undefined>(undefined);

export const useShifts = () => {
  const context = useContext(ShiftsContext);
  if (!context) {
    throw new Error('useShifts must be used within a ShiftsProvider');
  }
  return context;
};

export const ShiftsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { users, currentUser } = useAuth();
  const [shifts, setShifts] = useState<ShiftWithUser[]>([]);
  const [shiftRequests, setShiftRequests] = useState<ShiftRequestWithUser[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshShifts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('shifts')
        .select('*')
        .order('start_time', { ascending: true });

      if (error) throw error;

      const shiftsWithUsers: ShiftWithUser[] = data.map(shift => ({
        ...shift,
        shift_type: shift.shift_type as 'morning' | 'evening' | 'night' | 'custom',
        status: shift.status as 'scheduled' | 'completed' | 'cancelled',
        user: users.find(user => user.id === shift.user_id)
      }));

      setShifts(shiftsWithUsers);
    } catch (error) {
      console.error('Error fetching shifts:', error);
      toast.error('Failed to load shifts');
    } finally {
      setLoading(false);
    }
  };

  const refreshShiftRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('shift_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const requestsWithUsers: ShiftRequestWithUser[] = data.map(request => ({
        ...request,
        request_type: request.request_type as 'time_off' | 'extra_work' | 'shift_change',
        status: request.status as 'pending' | 'approved' | 'rejected',
        user: users.find(user => user.id === request.user_id)
      }));

      setShiftRequests(requestsWithUsers);
    } catch (error) {
      console.error('Error fetching shift requests:', error);
      toast.error('Failed to load shift requests');
    }
  };

  const createShift = async (shiftData: ShiftFormData): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('shifts')
        .insert({
          ...shiftData,
          created_by: currentUser?.id
        });

      if (error) throw error;

      toast.success('Shift created successfully');
      await refreshShifts();
      return true;
    } catch (error) {
      console.error('Error creating shift:', error);
      toast.error('Failed to create shift');
      return false;
    }
  };

  const updateShift = async (id: string, shiftData: Partial<ShiftFormData>): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('shifts')
        .update(shiftData)
        .eq('id', id);

      if (error) throw error;

      toast.success('Shift updated successfully');
      await refreshShifts();
      return true;
    } catch (error) {
      console.error('Error updating shift:', error);
      toast.error('Failed to update shift');
      return false;
    }
  };

  const deleteShift = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('shifts')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Shift deleted successfully');
      await refreshShifts();
      return true;
    } catch (error) {
      console.error('Error deleting shift:', error);
      toast.error('Failed to delete shift');
      return false;
    }
  };

  const createShiftRequest = async (requestData: Omit<ShiftRequest, 'id' | 'created_at' | 'updated_at'>): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('shift_requests')
        .insert(requestData);

      if (error) throw error;

      toast.success('Shift request submitted successfully');
      await refreshShiftRequests();
      return true;
    } catch (error) {
      console.error('Error creating shift request:', error);
      toast.error('Failed to submit shift request');
      return false;
    }
  };

  const approveShiftRequest = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('shift_requests')
        .update({
          status: 'approved',
          approved_by: currentUser?.id,
          approved_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      toast.success('Shift request approved');
      await refreshShiftRequests();
      return true;
    } catch (error) {
      console.error('Error approving shift request:', error);
      toast.error('Failed to approve shift request');
      return false;
    }
  };

  const rejectShiftRequest = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('shift_requests')
        .update({
          status: 'rejected',
          approved_by: currentUser?.id,
          approved_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      toast.success('Shift request rejected');
      await refreshShiftRequests();
      return true;
    } catch (error) {
      console.error('Error rejecting shift request:', error);
      toast.error('Failed to reject shift request');
      return false;
    }
  };

  const getTodayShifts = (): ShiftWithUser[] => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    return shifts.filter(shift => {
      const shiftDate = new Date(shift.start_time).toISOString().split('T')[0];
      return shiftDate === todayStr && shift.status === 'scheduled';
    });
  };

  const getUpcomingShifts = (): ShiftWithUser[] => {
    const now = new Date();
    return shifts.filter(shift => {
      const shiftStart = new Date(shift.start_time);
      return shiftStart > now && shift.status === 'scheduled';
    }).slice(0, 5);
  };

  const getCurrentShifts = (): ShiftWithUser[] => {
    const now = new Date();
    return shifts.filter(shift => {
      const shiftStart = new Date(shift.start_time);
      const shiftEnd = new Date(shift.end_time);
      return shiftStart <= now && shiftEnd >= now && shift.status === 'scheduled';
    });
  };

  useEffect(() => {
    if (currentUser && users.length > 0) {
      refreshShifts();
      refreshShiftRequests();
    }
  }, [currentUser, users]);

  return (
    <ShiftsContext.Provider value={{
      shifts,
      shiftRequests,
      users,
      loading,
      refreshShifts,
      refreshShiftRequests,
      createShift,
      updateShift,
      deleteShift,
      createShiftRequest,
      approveShiftRequest,
      rejectShiftRequest,
      getTodayShifts,
      getUpcomingShifts,
      getCurrentShifts
    }}>
      {children}
    </ShiftsContext.Provider>
  );
};
