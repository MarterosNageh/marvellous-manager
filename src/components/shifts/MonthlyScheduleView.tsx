
import React, { useState, useMemo } from 'react';
import { useShifts } from '@/context/ShiftsContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameDay, 
  subMonths, 
  addMonths,
  isSameMonth
} from 'date-fns';

export const MonthlyScheduleView = () => {
  const { shifts } = useShifts();
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  const monthDays = useMemo(() => {
    const monthStart = startOfMonth(selectedMonth);
    const monthEnd = endOfMonth(selectedMonth);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [selectedMonth]);

  const monthShifts = useMemo(() => {
    return shifts.filter(shift => {
      const shiftDate = new Date(shift.start_time);
      return monthDays.some(day => isSameDay(shiftDate, day)) && shift.status === 'scheduled';
    });
  }, [shifts, monthDays]);

  const getShiftsForDay = (day: Date) => {
    return monthShifts.filter(shift => isSameDay(new Date(shift.start_time), day));
  };

  const goToPreviousMonth = () => {
    setSelectedMonth(subMonths(selectedMonth, 1));
  };

  const goToNextMonth = () => {
    setSelectedMonth(addMonths(selectedMonth, 1));
  };

  const goToCurrentMonth = () => {
    setSelectedMonth(new Date());
  };

  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="icon" onClick={goToPreviousMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-2xl font-bold">
            {format(selectedMonth, 'MMMM yyyy')}
          </h2>
          <Button variant="outline" size="icon" onClick={goToNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <Button variant="outline" onClick={goToCurrentMonth}>
          <Calendar className="mr-2 h-4 w-4" />
          This Month
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {weekDays.map((day) => (
          <div key={day} className="p-2 text-center font-medium text-sm text-gray-600">
            {day}
          </div>
        ))}
        
        {monthDays.map((day) => {
          const dayShifts = getShiftsForDay(day);
          const isCurrentMonth = isSameMonth(day, selectedMonth);
          const isToday = isSameDay(day, new Date());
          
          return (
            <Card key={day.toISOString()} className={`min-h-24 ${!isCurrentMonth ? 'opacity-50' : ''} ${isToday ? 'ring-2 ring-blue-500' : ''}`}>
              <CardContent className="p-2">
                <div className="text-sm font-medium mb-1">
                  {format(day, 'd')}
                </div>
                <div className="space-y-1">
                  {dayShifts.slice(0, 2).map((shift) => (
                    <div key={shift.id} className="text-xs p-1 bg-blue-100 dark:bg-blue-900 rounded truncate">
                      {shift.user?.username}
                    </div>
                  ))}
                  {dayShifts.length > 2 && (
                    <div className="text-xs text-gray-500">
                      +{dayShifts.length - 2} more
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
