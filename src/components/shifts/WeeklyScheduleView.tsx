
import React, { useState, useMemo } from 'react';
import { useShifts } from '@/context/ShiftsContext';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, MoreHorizontal, User, Clock } from 'lucide-react';
import { 
  format, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  addWeeks, 
  subWeeks, 
  isSameDay 
} from 'date-fns';
import { cn } from '@/lib/utils';
import { ShiftWithUser } from '@/types/shiftTypes';

interface WeeklyScheduleViewProps {
  selectedDate: Date;
  searchTerm: string;
  filterRole: string;
}

const getShiftTypeColor = (type: string) => {
  switch (type) {
    case 'morning':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'evening':
      return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'night':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

export const WeeklyScheduleView: React.FC<WeeklyScheduleViewProps> = ({
  selectedDate,
  searchTerm,
  filterRole
}) => {
  const { shifts, loading } = useShifts();
  const { users } = useAuth();
  const [currentWeek, setCurrentWeek] = useState(selectedDate);

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch = user.username.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = filterRole === 'all' || 
        (filterRole === 'manager' && user.isAdmin) ||
        (filterRole === 'employee' && !user.isAdmin);
      return matchesSearch && matchesRole;
    });
  }, [users, searchTerm, filterRole]);

  const getShiftsForUserAndDay = (userId: string, date: Date): ShiftWithUser[] => {
    return shifts.filter(shift => 
      shift.user_id === userId && 
      isSameDay(new Date(shift.start_time), date) &&
      shift.status === 'scheduled'
    );
  };

  const goToPreviousWeek = () => {
    setCurrentWeek(subWeeks(currentWeek, 1));
  };

  const goToNextWeek = () => {
    setCurrentWeek(addWeeks(currentWeek, 1));
  };

  const goToToday = () => {
    setCurrentWeek(new Date());
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading schedule...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Week Navigation */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={goToPreviousWeek}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-lg font-semibold">
            {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}
          </h2>
          <Button variant="outline" size="icon" onClick={goToNextWeek}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <Button variant="outline" onClick={goToToday}>
          Today
        </Button>
      </div>

      {/* Schedule Grid */}
      <div className="overflow-x-auto">
        <div className="min-w-[800px]">
          {/* Header Row - Days */}
          <div className="grid grid-cols-8 gap-2 mb-4">
            <div className="p-3 font-medium text-gray-600 dark:text-gray-400">
              Employee
            </div>
            {weekDays.map((day, index) => (
              <div key={index} className="p-3 text-center">
                <div className="font-medium text-gray-900 dark:text-white">
                  {format(day, 'EEE')}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {format(day, 'MMM d')}
                </div>
              </div>
            ))}
          </div>

          {/* Employee Rows */}
          <div className="space-y-2">
            {filteredUsers.map((user) => (
              <div key={user.id} className="grid grid-cols-8 gap-2">
                {/* Employee Name Column */}
                <div className="p-3 flex items-center gap-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-full">
                    <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {user.username}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {user.isAdmin ? 'Admin' : 'Employee'}
                    </div>
                  </div>
                </div>

                {/* Daily Shift Columns */}
                {weekDays.map((day, dayIndex) => {
                  const dayShifts = getShiftsForUserAndDay(user.id, day);
                  
                  return (
                    <div key={dayIndex} className="min-h-[80px] p-2 space-y-1">
                      {dayShifts.length > 0 ? (
                        dayShifts.map((shift) => (
                          <Card
                            key={shift.id}
                            className={cn(
                              "p-2 cursor-pointer hover:shadow-md transition-shadow",
                              getShiftTypeColor(shift.shift_type)
                            )}
                          >
                            <CardContent className="p-0">
                              <div className="flex items-center justify-between mb-1">
                                <Badge variant="secondary" className="text-xs">
                                  {shift.shift_type}
                                </Badge>
                                <Button variant="ghost" size="icon" className="h-4 w-4">
                                  <MoreHorizontal className="h-3 w-3" />
                                </Button>
                              </div>
                              <div className="text-xs font-medium truncate">
                                {shift.title}
                              </div>
                              <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                                <Clock className="h-3 w-3" />
                                {format(new Date(shift.start_time), 'HH:mm')} - 
                                {format(new Date(shift.end_time), 'HH:mm')}
                              </div>
                              {shift.role && (
                                <div className="text-xs text-gray-500 truncate">
                                  {shift.role}
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        ))
                      ) : (
                        <div className="h-full flex items-center justify-center text-gray-400 text-xs">
                          No shifts
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {filteredUsers.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No employees found matching your search criteria.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
