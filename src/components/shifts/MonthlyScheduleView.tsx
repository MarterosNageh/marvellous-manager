
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useShifts } from '@/context/ShiftsContext';
import { useAuth } from '@/context/AuthContext';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameDay,
  isSameMonth,
  subMonths,
  addMonths,
  format
} from 'date-fns';

export const MonthlyScheduleView = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const { shifts, users } = useShifts();
  const { currentUser } = useAuth();

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  // Get shifts for a specific day
  const getShiftsForDay = (day: Date) => {
    return shifts.filter(shift => isSameDay(new Date(shift.start_time), day));
  };

  // Get total shifts in current month
  const monthShifts = shifts.filter(shift => {
    const shiftDate = new Date(shift.start_time);
    return shiftDate >= monthStart && shiftDate <= monthEnd;
  });

  const handlePreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h3 className="text-lg font-semibold">
            {format(currentMonth, 'MMMM yyyy')}
          </h3>
          <Badge variant="secondary">
            {monthShifts.length} shifts this month
          </Badge>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={handlePreviousMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Calendar */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-7 gap-2">
            {/* Header row */}
            {weekDays.map((day) => (
              <div key={day} className="p-2 text-center font-medium text-gray-600 bg-gray-50 rounded">
                {day}
              </div>
            ))}
            
            {/* Calendar days */}
            {calendarDays.map((day) => {
              const dayShifts = getShiftsForDay(day);
              const isCurrentMonth = isSameMonth(day, currentMonth);
              const isToday = isSameDay(day, new Date());
              
              return (
                <div
                  key={day.toISOString()}
                  className={`min-h-24 p-2 border rounded-lg ${
                    isCurrentMonth ? 'bg-white' : 'bg-gray-50'
                  } ${isToday ? 'ring-2 ring-blue-500' : ''}`}
                >
                  <div className={`text-sm font-medium ${
                    isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
                  }`}>
                    {format(day, 'd')}
                  </div>
                  
                  {dayShifts.length > 0 && (
                    <div className="mt-1 space-y-1">
                      {dayShifts.slice(0, 2).map((shift) => {
                        const user = users.find(u => u.id === shift.user_id);
                        return (
                          <div
                            key={shift.id}
                            className="text-xs bg-blue-100 text-blue-800 px-1 py-0.5 rounded truncate"
                            title={`${shift.title} - ${user?.username}`}
                          >
                            {user?.username}
                          </div>
                        );
                      })}
                      {dayShifts.length > 2 && (
                        <div className="text-xs text-gray-500">
                          +{dayShifts.length - 2} more
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
