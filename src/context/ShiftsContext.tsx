
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { toast } from '@/hooks/use-toast';
import { shiftRequestsTable } from '@/integrations/supabase/tables/schedule';

interface ShiftRequest {
  id: string;
  user_id: string;
  request_type: 'time_off' | 'extra_work' | 'shift_change' | 'custom_shift';
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

interface ShiftsContextType {
  shiftRequests: ShiftRequest[];
  isLoading: boolean;
  createShiftRequest: (request: Omit<ShiftRequest, 'id' | 'created_at' | 'updated_at'>) => Promise<boolean>;
  refreshRequests: () => Promise<void>;
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
  const { currentUser } = useAuth();
  const [shiftRequests, setShiftRequests] = useState<ShiftRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const refreshRequests = async () => {
    try {
      setIsLoading(true);
      const requests = await shiftRequestsTable.getAll();
      setShiftRequests(requests);
    } catch (error) {
      console.error('Error loading shift requests:', error);
      toast({
        title: "Error",
        description: "Failed to load shift requests",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createShiftRequest = async (request: Omit<ShiftRequest, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const newRequest = await shiftRequestsTable.create({
        user_id: request.user_id,
        request_type: request.request_type,
        start_date: request.start_date,
        end_date: request.end_date,
        reason: request.reason,
        status: 'pending'
      });
      
      await refreshRequests();
      toast({
        title: "Success",
        description: "Shift request submitted successfully",
      });
      return true;
    } catch (error) {
      console.error('Error creating shift request:', error);
      toast({
        title: "Error",
        description: "Failed to submit shift request",
        variant: "destructive",
      });
      return false;
    }
  };

  useEffect(() => {
    if (currentUser) {
      refreshRequests();
    }
  }, [currentUser]);

  return (
    <ShiftsContext.Provider
      value={{
        shiftRequests,
        isLoading,
        createShiftRequest,
        refreshRequests,
      }}
    >
      {children}
    </ShiftsContext.Provider>
  );
};
