
import React, { useState, useMemo } from 'react';
import { useShifts } from '@/context/ShiftsContext';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  addMonths, 
  subMonths, 
  isSameDay, 
  isSameMonth, 
  startOfWeek, 
  endOfWeek 
} from 'date-fns';
import { cn } from '@/lib/utils';

interface MonthlyScheduleViewProps {
  selectedDate: Date;
  searchTerm: string;
  filterRole: string;
}

export const MonthlyScheduleView: React.FC<MonthlyScheduleViewProps> = ({
  selectedDate,
  searchTerm,
  filterRole
}) => {
  const { shifts, loading } = useShifts();
  const { users } = useAuth();
  const [currentMonth, setCurrentMonth] = useState(selectedDate);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch = user.username.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = filterRole === 'all' || 
        (filterRole === 'manager' && user.isAdmin) ||
        (filterRole === 'employee' && !user.isAdmin);
      return matchesSearch && matchesRole;
    });
  }, [users, searchTerm, filterRole]);

  const getShiftsForDay = (date: Date) => {
    return shifts.filter(shift => 
      isSameDay(new Date(shift.start_time), date) &&
      shift.status === 'scheduled' &&
      filteredUsers.some(user => user.id === shift.user_id)
    );
  };

  const goToPreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const goToToday = () => {
    setCurrentMonth(new Date());
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading monthly schedule...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Month Navigation */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={goToPreviousMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-lg font-semibold">
            {format(currentMonth, 'MMMM yyyy')}
          </h2>
          <Button variant="outline" size="icon" onClick={goToNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <Button variant="outline" onClick={goToToday}>
          Today
        </Button>
      </div>

      {/* Calendar Grid */}
      <div className="p-4">
        {/* Week Header */}
        <div className="grid grid-cols-7 gap-2 mb-4">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
            <div key={day} className="p-2 text-center font-medium text-gray-600 dark:text-gray-400">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7 gap-2">
          {calendarDays.map((day, index) => {
            const dayShifts = getShiftsForDay(day);
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isToday = isSameDay(day, new Date());

            return (
              <Card
                key={index}
                className={cn(
                  "min-h-[120px] p-2",
                  !isCurrentMonth && "opacity-40",
                  isToday && "ring-2 ring-blue-500"
                )}
              >
                <CardContent className="p-0">
                  <div className={cn(
                    "text-sm font-medium mb-2",
                    isToday && "bg-blue-500 text-white rounded px-2 py-1"
                  )}>
                    {format(day, 'd')}
                  </div>
                  
                  <div className="space-y-1">
                    {dayShifts.slice(0, 3).map((shift) => (
                      <div
                        key={shift.id}
                        className={cn(
                          "text-xs p-1 rounded truncate",
                          shift.shift_type === 'morning' && "bg-blue-100 text-blue-800",
                          shift.shift_type === 'evening' && "bg-orange-100 text-orange-800",
                          shift.shift_type === 'night' && "bg-purple-100 text-purple-800",
                          shift.shift_type === 'custom' && "bg-gray-100 text-gray-800"
                        )}
                      >
                        {shift.user?.username} - {shift.title}
                      </div>
                    ))}
                    
                    {dayShifts.length > 3 && (
                      <div className="text-xs text-gray-500">
                        +{dayShifts.length - 3} more
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};
