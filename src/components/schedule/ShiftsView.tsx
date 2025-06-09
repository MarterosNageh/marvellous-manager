import { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import {
  Button,
  Calendar,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui';
import { ShiftViewProps, Shift, ShiftTemplate, ScheduleUser, ViewType } from '@/types/schedule';
import { shiftsTable, templatesTable } from '@/integrations/supabase/tables';
import WeeklyView from './WeeklyView';
import DailyView from './DailyView';
import MonthlyView from './MonthlyView';
import ShiftDialog from './ShiftDialog';
import { Plus } from 'lucide-react';
import { startOfWeek, endOfWeek, startOfDay, endOfDay, startOfMonth, endOfMonth } from 'date-fns';

export interface ShiftsViewProps {
  viewType: ViewType;
  selectedDate: Date;
  onViewTypeChange: (viewType: ViewType) => void;
  onDateChange: (date: Date) => void;
  teamFilter: string;
  locationFilter: string;
  users: ScheduleUser[];
  templates: ShiftTemplate[];
  shifts: Shift[];
  onCreateShift: () => void;
  onEditShift: (shift: Shift) => void;
  onDeleteShift: (shiftId: string) => void;
}

export default function ShiftsView({
  viewType,
  selectedDate,
  onViewTypeChange,
  onDateChange,
  teamFilter,
  locationFilter,
  users,
  templates,
  shifts,
  onCreateShift,
  onEditShift,
  onDeleteShift,
}: ShiftsViewProps) {
  const { toast } = useToast();
  const { currentUser } = useAuth();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [teamFilter, selectedDate, viewType]);

  const loadData = async () => {
    try {
      setIsLoading(true);

      // Filter shifts by team if teamFilter is set
      const filteredShifts = teamFilter
        ? shifts.filter(shift => {
            const user = users.find(u => u.id === shift.user_id);
            return user?.role === teamFilter;
          })
        : shifts;

      // No need to set shifts since they're passed as props
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Error",
        description: "Failed to load data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateShift = () => {
    if (!currentUser?.role || currentUser.role === 'operator') {
      toast({
        title: "Permission denied",
        description: "You don't have permission to create shifts",
        variant: "destructive",
      });
      return;
    }
    onCreateShift();
  };

  const handleEditShift = (shift: Shift) => {
    if (!currentUser?.role || currentUser.role === 'operator') {
      toast({
        title: "Permission denied",
        description: "You don't have permission to edit shifts",
        variant: "destructive",
      });
      return;
    }
    onEditShift(shift);
  };

  const renderView = () => {
    const commonProps = {
      shifts,
      selectedDate,
      onEditShift: handleEditShift,
      onDeleteShift,
      users,
      onDateChange,
    };

    switch (viewType) {
      case 'daily':
        return <DailyView {...commonProps} />;
      case 'weekly':
        return (
          <WeeklyView
            {...commonProps}
            startDate={selectedDate}
            onAddShift={handleCreateShift}
          />
        );
      case 'monthly':
        return <MonthlyView {...commonProps} />;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        {renderView()}
      </div>
    </div>
  );
} 