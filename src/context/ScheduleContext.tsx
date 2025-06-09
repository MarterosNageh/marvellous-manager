import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';
import { shiftsTable, templatesTable, leaveRequestsTable, swapRequestsTable } from '@/integrations/supabase/tables/schedule';
import type { Shift, ShiftTemplate, LeaveRequest, ShiftSwapRequest } from '@/types/schedule';

interface ScheduleContextType {
  shifts: Shift[];
  templates: ShiftTemplate[];
  leaveRequests: LeaveRequest[];
  swapRequests: ShiftSwapRequest[];
  isLoading: boolean;
  error: Error | null;
  refreshData: () => Promise<void>;
  createShift: (shift: Omit<Shift, 'id' | 'created_at' | 'updated_at'>) => Promise<Shift>;
  updateShift: (id: string, shift: Partial<Shift>) => Promise<Shift>;
  deleteShift: (id: string) => Promise<void>;
  createTemplate: (template: Omit<ShiftTemplate, 'id' | 'created_at'>) => Promise<ShiftTemplate>;
  updateTemplate: (id: string, template: Partial<ShiftTemplate>) => Promise<ShiftTemplate>;
  deleteTemplate: (id: string) => Promise<void>;
  createLeaveRequest: (request: Omit<LeaveRequest, 'id' | 'created_at' | 'updated_at'>) => Promise<LeaveRequest>;
  updateLeaveRequest: (id: string, request: Partial<LeaveRequest>) => Promise<LeaveRequest>;
  deleteLeaveRequest: (id: string) => Promise<void>;
  createSwapRequest: (request: Omit<ShiftSwapRequest, 'id' | 'created_at' | 'updated_at'>) => Promise<ShiftSwapRequest>;
  updateSwapRequest: (id: string, request: Partial<ShiftSwapRequest>) => Promise<ShiftSwapRequest>;
  deleteSwapRequest: (id: string) => Promise<void>;
}

const ScheduleContext = createContext<ScheduleContextType | undefined>(undefined);

export const useSchedule = () => {
  const context = useContext(ScheduleContext);
  if (!context) {
    throw new Error('useSchedule must be used within a ScheduleProvider');
  }
  return context;
};

export const ScheduleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [templates, setTemplates] = useState<ShiftTemplate[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [swapRequests, setSwapRequests] = useState<ShiftSwapRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refreshData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [shiftsData, templatesData, leaveRequestsData, swapRequestsData] = await Promise.all([
        shiftsTable.getAll(),
        templatesTable.getAll(),
        leaveRequestsTable.getAll(),
        swapRequestsTable.getAll()
      ]);

      setShifts(shiftsData);
      setTemplates(templatesData);
      setLeaveRequests(leaveRequestsData);
      setSwapRequests(swapRequestsData);
    } catch (err) {
      setError(err as Error);
      toast.error('Failed to load schedule data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      refreshData();

      // Set up realtime subscriptions
      const shiftsSubscription = shiftsTable.subscribe((payload) => {
        if (payload.eventType === 'INSERT') {
          setShifts(prev => [...prev, payload.new as Shift]);
        } else if (payload.eventType === 'UPDATE') {
          setShifts(prev => prev.map(shift => 
            shift.id === payload.new.id ? payload.new as Shift : shift
          ));
        } else if (payload.eventType === 'DELETE') {
          setShifts(prev => prev.filter(shift => shift.id !== payload.old.id));
        }
      });

      const leaveRequestsSubscription = leaveRequestsTable.subscribe((payload) => {
        if (payload.eventType === 'INSERT') {
          setLeaveRequests(prev => [...prev, payload.new as LeaveRequest]);
        } else if (payload.eventType === 'UPDATE') {
          setLeaveRequests(prev => prev.map(request => 
            request.id === payload.new.id ? payload.new as LeaveRequest : request
          ));
        } else if (payload.eventType === 'DELETE') {
          setLeaveRequests(prev => prev.filter(request => request.id !== payload.old.id));
        }
      });

      const swapRequestsSubscription = swapRequestsTable.subscribe((payload) => {
        if (payload.eventType === 'INSERT') {
          setSwapRequests(prev => [...prev, payload.new as ShiftSwapRequest]);
        } else if (payload.eventType === 'UPDATE') {
          setSwapRequests(prev => prev.map(request => 
            request.id === payload.new.id ? payload.new as ShiftSwapRequest : request
          ));
        } else if (payload.eventType === 'DELETE') {
          setSwapRequests(prev => prev.filter(request => request.id !== payload.old.id));
        }
      });

      // Cleanup subscriptions
      return () => {
        shiftsSubscription.unsubscribe();
        leaveRequestsSubscription.unsubscribe();
        swapRequestsSubscription.unsubscribe();
      };
    }
  }, [user]);

  const createShift = async (shift: Omit<Shift, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const newShift = await shiftsTable.create(shift);
      toast.success('Shift created successfully');
      return newShift;
    } catch (err) {
      toast.error('Failed to create shift');
      throw err;
    }
  };

  const updateShift = async (id: string, shift: Partial<Shift>) => {
    try {
      const updatedShift = await shiftsTable.update(id, shift);
      toast.success('Shift updated successfully');
      return updatedShift;
    } catch (err) {
      toast.error('Failed to update shift');
      throw err;
    }
  };

  const deleteShift = async (id: string) => {
    try {
      await shiftsTable.delete(id);
      toast.success('Shift deleted successfully');
    } catch (err) {
      toast.error('Failed to delete shift');
      throw err;
    }
  };

  const createTemplate = async (template: Omit<ShiftTemplate, 'id' | 'created_at'>) => {
    try {
      const newTemplate = await templatesTable.create(template);
      toast.success('Template created successfully');
      return newTemplate;
    } catch (err) {
      toast.error('Failed to create template');
      throw err;
    }
  };

  const updateTemplate = async (id: string, template: Partial<ShiftTemplate>) => {
    try {
      const updatedTemplate = await templatesTable.update(id, template);
      toast.success('Template updated successfully');
      return updatedTemplate;
    } catch (err) {
      toast.error('Failed to update template');
      throw err;
    }
  };

  const deleteTemplate = async (id: string) => {
    try {
      await templatesTable.delete(id);
      toast.success('Template deleted successfully');
    } catch (err) {
      toast.error('Failed to delete template');
      throw err;
    }
  };

  const createLeaveRequest = async (request: Omit<LeaveRequest, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const newRequest = await leaveRequestsTable.create(request);
      toast.success('Leave request created successfully');
      return newRequest;
    } catch (err) {
      toast.error('Failed to create leave request');
      throw err;
    }
  };

  const updateLeaveRequest = async (id: string, request: Partial<LeaveRequest>) => {
    try {
      const updatedRequest = await leaveRequestsTable.update(id, request);
      toast.success('Leave request updated successfully');
      return updatedRequest;
    } catch (err) {
      toast.error('Failed to update leave request');
      throw err;
    }
  };

  const deleteLeaveRequest = async (id: string) => {
    try {
      await leaveRequestsTable.delete(id);
      toast.success('Leave request deleted successfully');
    } catch (err) {
      toast.error('Failed to delete leave request');
      throw err;
    }
  };

  const createSwapRequest = async (request: Omit<ShiftSwapRequest, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const newRequest = await swapRequestsTable.create(request);
      toast.success('Swap request created successfully');
      return newRequest;
    } catch (err) {
      toast.error('Failed to create swap request');
      throw err;
    }
  };

  const updateSwapRequest = async (id: string, request: Partial<ShiftSwapRequest>) => {
    try {
      const updatedRequest = await swapRequestsTable.update(id, request);
      toast.success('Swap request updated successfully');
      return updatedRequest;
    } catch (err) {
      toast.error('Failed to update swap request');
      throw err;
    }
  };

  const deleteSwapRequest = async (id: string) => {
    try {
      await swapRequestsTable.delete(id);
      toast.success('Swap request deleted successfully');
    } catch (err) {
      toast.error('Failed to delete swap request');
      throw err;
    }
  };

  return (
    <ScheduleContext.Provider
      value={{
        shifts,
        templates,
        leaveRequests,
        swapRequests,
        isLoading,
        error,
        refreshData,
        createShift,
        updateShift,
        deleteShift,
        createTemplate,
        updateTemplate,
        deleteTemplate,
        createLeaveRequest,
        updateLeaveRequest,
        deleteLeaveRequest,
        createSwapRequest,
        updateSwapRequest,
        deleteSwapRequest,
      }}
    >
      {children}
    </ScheduleContext.Provider>
  );
}; 