
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';
import { shiftsTable, templatesTable, shiftRequestsTable } from '@/integrations/supabase/tables/schedule';
import type { Shift, ShiftTemplate } from '@/types/schedule';

interface ScheduleContextType {
  shifts: Shift[];
  templates: ShiftTemplate[];
  shiftRequests: any[];
  isLoading: boolean;
  error: Error | null;
  refreshData: () => Promise<void>;
  createShift: (shift: Omit<Shift, 'id' | 'created_at' | 'updated_at'>) => Promise<Shift>;
  updateShift: (id: string, shift: Partial<Shift>) => Promise<Shift>;
  deleteShift: (id: string) => Promise<void>;
  createTemplate: (template: Omit<ShiftTemplate, 'id' | 'created_at'>) => Promise<ShiftTemplate>;
  updateTemplate: (id: string, template: Partial<ShiftTemplate>) => Promise<ShiftTemplate>;
  deleteTemplate: (id: string) => Promise<void>;
  createShiftRequest: (request: any) => Promise<any>;
  updateShiftRequest: (id: string, request: any) => Promise<any>;
  deleteShiftRequest: (id: string) => Promise<void>;
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
  const { currentUser } = useAuth();
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [templates, setTemplates] = useState<ShiftTemplate[]>([]);
  const [shiftRequests, setShiftRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refreshData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [shiftsData, templatesData, shiftRequestsData] = await Promise.all([
        shiftsTable.getAll(),
        templatesTable.getAll(),
        shiftRequestsTable.getAll()
      ]);

      setShifts(shiftsData);
      setTemplates(templatesData);
      setShiftRequests(shiftRequestsData);
    } catch (err) {
      setError(err as Error);
      toast.error('Failed to load schedule data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
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

      // Cleanup subscriptions
      return () => {
        shiftsSubscription.unsubscribe();
      };
    }
  }, [currentUser]);

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

  const createShiftRequest = async (request: any) => {
    try {
      const newRequest = await shiftRequestsTable.create(request);
      toast.success('Shift request created successfully');
      return newRequest;
    } catch (err) {
      toast.error('Failed to create shift request');
      throw err;
    }
  };

  const updateShiftRequest = async (id: string, request: any) => {
    try {
      const updatedRequest = await shiftRequestsTable.update(id, request);
      toast.success('Shift request updated successfully');
      return updatedRequest;
    } catch (err) {
      toast.error('Failed to update shift request');
      throw err;
    }
  };

  const deleteShiftRequest = async (id: string) => {
    try {
      await shiftRequestsTable.delete(id);
      toast.success('Shift request deleted successfully');
    } catch (err) {
      toast.error('Failed to delete shift request');
      throw err;
    }
  };

  return (
    <ScheduleContext.Provider
      value={{
        shifts,
        templates,
        shiftRequests,
        isLoading,
        error,
        refreshData,
        createShift,
        updateShift,
        deleteShift,
        createTemplate,
        updateTemplate,
        deleteTemplate,
        createShiftRequest,
        updateShiftRequest,
        deleteShiftRequest,
      }}
    >
      {children}
    </ScheduleContext.Provider>
  );
};
