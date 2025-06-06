
import React, { useState } from 'react';
import { useShifts } from '@/context/ShiftsContext';
import { 
  format, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameDay, 
  subWeeks, 
  addWeeks 
} from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export const WeeklyScheduleView = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const { shifts, users } = useShifts();

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const getShiftsForDay = (day: Date) => {
    return shifts?.filter(shift => {
      if (!shift.start_time) return false;
      try {
        return isSameDay(new Date(shift.start_time), day);
      } catch {
        return false;
      }
    }) || [];
  };

  const goToPreviousWeek = () => {
    setCurrentDate(subWeeks(currentDate, 1));
  };

  const goToNextWeek = () => {
    setCurrentDate(addWeeks(currentDate, 1));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <Button onClick={goToPreviousWeek}><ChevronLeft /></Button>
        <h2 className="text-lg font-semibold">
          {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}
        </h2>
        <Button onClick={goToNextWeek}><ChevronRight /></Button>
      </div>
      
      <div className="grid grid-cols-7 gap-2">
        {weekDays.map((day) => {
          const dayShifts = getShiftsForDay(day);
          return (
            <div key={day.toISOString()}>
              <h3 className="font-medium text-center mb-2">
                {format(day, 'EEE d')}
              </h3>
              <div className="space-y-1">
                {dayShifts.map((shift) => {
                  const user = users?.find(u => u.id === shift.user_id);
                  return (
                    <Card key={shift.id} className="p-2">
                      <div className="text-xs">
                        <div className="font-medium">{shift.title}</div>
                        <div className="text-gray-500">
                          {shift.start_time && format(new Date(shift.start_time), 'HH:mm')} - 
                          {shift.end_time && format(new Date(shift.end_time), 'HH:mm')}
                        </div>
                        {user && (
                          <div className="text-gray-400">{user.username}</div>
                        )}
                      </div>
                    </Card>
                  );
                })}
                {dayShifts.length === 0 && (
                  <div className="text-center text-gray-400 text-xs py-2">
                    No shifts
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
