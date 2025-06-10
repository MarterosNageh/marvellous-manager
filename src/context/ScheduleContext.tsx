import { createContext, useContext, useState, useEffect, ReactNode, useRef, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';
import { shiftsTable, templatesTable, shiftRequestsTable } from '@/integrations/supabase/tables/schedule';
import type { Shift, ShiftTemplate, ShiftType } from '@/types/schedule';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { NotificationService } from "@/services/notificationService";
import { RecurrenceAction } from '@/types';
import { realtimeService } from "@/services/realtimeService";
import { format } from 'date-fns';

interface ScheduleContextType {
  shifts: Shift[];
  templates: ShiftTemplate[];
  loading: boolean;
  createShift: (data: Omit<Shift, 'id'>) => Promise<void>;
  updateShift: (shiftId: string, updates: Partial<Shift>, recurrenceAction: RecurrenceAction) => Promise<void>;
  deleteShift: (shiftId: string, recurrenceAction: RecurrenceAction) => Promise<void>;
  createTemplate: (data: Omit<ShiftTemplate, 'id' | 'created_at'>) => Promise<void>;
  updateTemplate: (templateId: string, updates: Partial<ShiftTemplate>) => Promise<void>;
  deleteTemplate: (templateId: string) => Promise<void>;
  refreshData: () => Promise<void>;
}

const ScheduleContext = createContext<ScheduleContextType | undefined>(undefined);

export const useSchedule = () => {
  const context = useContext(ScheduleContext);
  if (!context) {
    throw new Error('useSchedule must be used within a ScheduleProvider');
  }
  return context;
};

export const ScheduleProvider = ({ children }: { children: ReactNode }) => {
  const { toast } = useToast();
  const { currentUser } = useAuth();
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [templates, setTemplates] = useState<ShiftTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Helper function to map database shift to domain shift
  const mapDBShiftToDomainShift = (dbShift: any): Shift => ({
    id: dbShift.id,
    user_id: dbShift.user_id,
    shift_type: dbShift.shift_type as ShiftType,
    start_time: dbShift.start_time,
    end_time: dbShift.end_time,
    notes: dbShift.notes || '',
    status: dbShift.status || 'active',
    created_by: dbShift.created_by || dbShift.user_id,
    repeat_days: dbShift.repeat_days || [],
    created_at: dbShift.created_at || new Date().toISOString(),
    updated_at: dbShift.updated_at || new Date().toISOString(),
    title: dbShift.title || '',
    description: dbShift.description || '',
    color: dbShift.color || '#E3F2FD'
  });

  // Helper function to map database template to domain template
  const mapDBTemplateToDomainTemplate = (dbTemplate: any): ShiftTemplate => ({
    id: dbTemplate.id,
    name: dbTemplate.name,
    shift_type: dbTemplate.shift_type,
    start_time: dbTemplate.start_time,
    end_time: dbTemplate.end_time,
    color: dbTemplate.color,
    created_at: dbTemplate.created_at || new Date().toISOString(),
    user_id: dbTemplate.user_id || currentUser?.id || ''
  });

  const refreshData = async () => {
    try {
      setLoading(true);
      const [shiftsData, templatesData] = await Promise.all([
        shiftsTable.getAll(),
        templatesTable.getAll()
      ]);

      setShifts(shiftsData.map(mapDBShiftToDomainShift));
      setTemplates(templatesData.map(mapDBTemplateToDomainTemplate));
    } catch (error) {
      console.error('Error fetching schedule data:', error);
      toast({
        title: "Error",
        description: "Failed to load schedule data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createShift = async (data: Omit<Shift, 'id'>) => {
    try {
      console.log('📝 Creating shift...');
      await shiftsTable.create(data);
      
      // Send notification to the assigned user
      try {
        const { NotificationService } = await import('@/services/notificationService');
        await NotificationService.sendShiftCreatedNotification(
          [data.user_id],
          format(new Date(data.start_time), 'yyyy-MM-dd'),
          format(new Date(data.start_time), 'HH:mm')
        );
      } catch (notificationError) {
        console.warn('⚠️ Error sending shift creation notification:', notificationError);
      }
      
      toast({
        title: "Success",
        description: "Shift created successfully",
      });
    } catch (error) {
      console.error('Error creating shift:', error);
      toast({
        title: "Error",
        description: "Failed to create shift",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateShift = async (shiftId: string, updates: Partial<Shift>, recurrenceAction: RecurrenceAction) => {
    try {
      console.log('📝 Updating shift:', shiftId, updates);
      
      // Get the original shift to compare changes
      const originalShift = shifts.find(s => s.id === shiftId);
      if (!originalShift) throw new Error('Shift not found');
      
      await shiftsTable.update(shiftId, updates, recurrenceAction);
      
      // Send notification to the affected user
      try {
        const { NotificationService } = await import('@/services/notificationService');
        const changes: string[] = [];
        
        if (updates.start_time && updates.start_time !== originalShift.start_time) {
          changes.push('start time');
        }
        if (updates.end_time && updates.end_time !== originalShift.end_time) {
          changes.push('end time');
        }
        if (updates.shift_type && updates.shift_type !== originalShift.shift_type) {
          changes.push('shift type');
        }
        if (updates.notes && updates.notes !== originalShift.notes) {
          changes.push('notes');
        }
        
        if (changes.length > 0) {
          await NotificationService.sendShiftModifiedNotification(
            [originalShift.user_id],
            format(new Date(originalShift.start_time), 'yyyy-MM-dd'),
            format(new Date(originalShift.start_time), 'HH:mm'),
            changes
          );
        }
      } catch (notificationError) {
        console.warn('⚠️ Error sending shift modification notification:', notificationError);
      }
      
      toast({
        title: "Success",
        description: "Shift updated successfully",
      });
    } catch (error) {
      console.error('Error updating shift:', error);
      toast({
        title: "Error",
        description: "Failed to update shift",
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteShift = async (shiftId: string, recurrenceAction: RecurrenceAction) => {
    try {
      console.log('🗑️ Deleting shift:', shiftId);
      
      // Get the shift before deleting it
      const shiftToDelete = shifts.find(s => s.id === shiftId);
      if (!shiftToDelete) throw new Error('Shift not found');
      
      await shiftsTable.delete(shiftId, recurrenceAction);
      
      // Send notification to the affected user
      try {
        const { NotificationService } = await import('@/services/notificationService');
        await NotificationService.sendShiftDeletedNotification(
          [shiftToDelete.user_id],
          format(new Date(shiftToDelete.start_time), 'yyyy-MM-dd'),
          format(new Date(shiftToDelete.start_time), 'HH:mm')
        );
      } catch (notificationError) {
        console.warn('⚠️ Error sending shift deletion notification:', notificationError);
      }
      
      toast({
        title: "Success",
        description: "Shift deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting shift:', error);
      toast({
        title: "Error",
        description: "Failed to delete shift",
        variant: "destructive",
      });
      throw error;
    }
  };

  const createTemplate = async (data: Omit<ShiftTemplate, 'id' | 'created_at'>) => {
    try {
      console.log('📝 Creating template...', data);
      const newTemplate = await templatesTable.create(data);
      setTemplates(prev => [...prev, mapDBTemplateToDomainTemplate(newTemplate)]);
      
      toast({
        title: "Success",
        description: "Template created successfully",
      });
    } catch (error) {
      console.error('Error creating template:', error);
      toast({
        title: "Error",
        description: "Failed to create template",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateTemplate = async (templateId: string, updates: Partial<ShiftTemplate>) => {
    try {
      console.log('📝 Updating template:', templateId, updates);
      const updatedTemplate = await templatesTable.update(templateId, updates);
      setTemplates(prev => prev.map(template => 
        template.id === templateId ? mapDBTemplateToDomainTemplate(updatedTemplate) : template
      ));
      
      toast({
        title: "Success",
        description: "Template updated successfully",
      });
    } catch (error) {
      console.error('Error updating template:', error);
      toast({
        title: "Error",
        description: "Failed to update template",
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteTemplate = async (templateId: string) => {
    try {
      console.log('🗑️ Deleting template:', templateId);
      await templatesTable.delete(templateId);
      setTemplates(prev => prev.filter(template => template.id !== templateId));
      
      toast({
        title: "Success",
        description: "Template deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting template:', error);
      toast({
        title: "Error",
        description: "Failed to delete template",
        variant: "destructive",
      });
      throw error;
    }
  };

  useEffect(() => {
    if (currentUser) {
      refreshData();
      
      // Subscribe to realtime updates
      const unsubscribe = realtimeService.subscribe(() => {
        console.log('Realtime update received, refreshing data...');
        refreshData();
      });

      return () => {
        unsubscribe();
      };
    }
  }, [currentUser]);

  const value = {
    shifts,
    templates,
    loading,
    createShift,
    updateShift,
    deleteShift,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    refreshData,
  };

  return (
    <ScheduleContext.Provider value={value}>
      {children}
    </ScheduleContext.Provider>
  );
};
