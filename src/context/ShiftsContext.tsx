import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { toast } from '@/hooks/use-toast';
import { shiftRequestsTable } from '@/integrations/supabase/tables/schedule';
import { supabase } from '@/integrations/supabase/client';

interface ShiftRequest {
  id: string;
  user_id: string;
  request_type: 'day-off' | 'unpaid' | 'extra' | 'public-holiday';
  start_date: string;
  end_date: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at?: string;
  updated_at?: string;
}

interface ShiftsContextType {
  shiftRequests: ShiftRequest[];
  isLoading: boolean;
  createShiftRequest: (request: Omit<ShiftRequest, 'id' | 'created_at' | 'updated_at'>) => Promise<boolean>;
  updateShiftRequest: (id: string, request: Partial<ShiftRequest>) => Promise<boolean>;
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
      
      // Transform the data to match ShiftRequest interface
      const transformedRequests: ShiftRequest[] = requests.map(req => ({
        id: req.id,
        user_id: req.user_id || '',
        request_type: mapRequestType(req.request_type),
        start_date: req.start_date,
        end_date: req.end_date,
        reason: req.reason || '',
        status: mapStatus(req.status),
        created_at: req.created_at,
        updated_at: req.updated_at
      }));
      
      setShiftRequests(transformedRequests);
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

  // Map frontend request types to database values
  const mapRequestTypeToDb = (type: ShiftRequest['request_type']): string => {
    switch (type) {
      case 'day-off': return 'day-off';
      case 'unpaid': return 'unpaid-leave';
      case 'extra': return 'extra-days';
      case 'public-holiday': return 'public-holiday';
      default: return 'day-off';
    }
  };

  // Map database request types to frontend values
  const mapRequestType = (type: string): ShiftRequest['request_type'] => {
    switch (type) {
      case 'day-off':
        return 'day-off';
      case 'unpaid':
      case 'unpaid-leave':
        return 'unpaid';
      case 'extra':
      case 'extra-days':
      case 'extra-day':
        return 'extra';
      case 'public-holiday':
        return 'public-holiday';
      case 'leave':
        return 'day-off'; // Default mapping for 'leave' type
      default:
        return 'day-off';
    }
  };

  // Map database status to frontend values
  const mapStatus = (status: string): ShiftRequest['status'] => {
    if (status === 'pending' || status === 'approved' || status === 'rejected') {
      return status;
    }
    return 'pending';
  };

  const createShiftRequest = async (request: Omit<ShiftRequest, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      console.log('Creating shift request with data:', request);
      
      if (!currentUser?.id) {
        toast({
          title: "Error",
          description: "You must be logged in to submit requests",
          variant: "destructive",
        });
        return false;
      }

      const dbRequest = {
        user_id: request.user_id || currentUser.id,
        request_type: 'leave', // Store as 'leave' in database
        leave_type: mapRequestTypeToDb(request.request_type),
        start_date: request.start_date,
        end_date: request.end_date || request.start_date,
        reason: request.reason,
        status: request.status || 'pending',
        notes: ''
      };

      console.log('Sending to database:', dbRequest);
      
      const newRequest = await shiftRequestsTable.create(dbRequest);
      console.log('Request created successfully:', newRequest);

      // Send notification to admin users
      try {
        const { data: adminUsers } = await supabase
          .from('auth_users')
          .select('id')
          .eq('role', 'admin')
          .or('is_admin.eq.true');

        if (adminUsers && adminUsers.length > 0) {
          const { NotificationService } = await import('@/services/notificationService');
          await NotificationService.sendRequestSubmittedNotification(
            adminUsers.map(u => u.id),
            request.request_type,
            request.start_date,
            currentUser.username || currentUser.id
          );
        }
      } catch (notificationError) {
        console.warn('⚠️ Error sending request submission notification:', notificationError);
      }
      
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

  const updateShiftRequest = async (id: string, request: Partial<ShiftRequest>) => {
    try {
      if (!currentUser?.id) {
        toast({
          title: "Error",
          description: "You must be logged in to update requests",
          variant: "destructive",
        });
        return false;
      }

      const dbRequest: any = {
        ...request,
        request_type: 'leave',
        leave_type: request.request_type ? mapRequestTypeToDb(request.request_type) : undefined,
      };

      console.log('Updating request:', id, dbRequest);
      
      const updatedRequest = await shiftRequestsTable.update(id, dbRequest);

      // Send notification if request is approved
      if (request.status === 'approved') {
        try {
          // Get the original request to get the user_id
          const originalRequest = shiftRequests.find(r => r.id === id);
          if (originalRequest) {
            const { NotificationService } = await import('@/services/notificationService');
            await NotificationService.sendRequestApprovedNotification(
              [originalRequest.user_id],
              originalRequest.request_type,
              originalRequest.start_date
            );
          }
        } catch (notificationError) {
          console.warn('⚠️ Error sending request approval notification:', notificationError);
        }
      }
      
      await refreshRequests();
      toast({
        title: "Success",
        description: "Request updated successfully",
      });
      return true;
    } catch (error) {
      console.error('Error updating shift request:', error);
      toast({
        title: "Error",
        description: "Failed to update request",
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
        updateShiftRequest,
        refreshRequests,
      }}
    >
      {children}
    </ShiftsContext.Provider>
  );
};
