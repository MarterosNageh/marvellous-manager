
import React, { useState } from 'react';
import { useShifts } from '@/context/ShiftsContext';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameDay, 
  isSameMonth, 
  subMonths, 
  addMonths 
} from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export const MonthlyScheduleView = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const { shifts, users } = useShifts();

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const goToPreviousMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

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

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <Button onClick={goToPreviousMonth}><ChevronLeft /></Button>
        <h2 className="text-lg font-semibold">
          {format(currentDate, 'MMMM yyyy')}
        </h2>
        <Button onClick={goToNextMonth}><ChevronRight /></Button>
      </div>
      
      <div className="grid grid-cols-7 gap-1">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
          <div key={day} className="font-medium text-center p-2 bg-gray-100">
            {day}
          </div>
        ))}
        
        {calendarDays.map((day) => {
          const dayShifts = getShiftsForDay(day);
          const isCurrentMonth = isSameMonth(day, currentDate);
          
          return (
            <div key={day.toISOString()} className={`min-h-20 p-1 border ${isCurrentMonth ? 'bg-white' : 'bg-gray-50'}`}>
              <div className={`text-sm font-medium ${isCurrentMonth ? 'text-gray-900' : 'text-gray-400'}`}>
                {format(day, 'd')}
              </div>
              <div className="space-y-1">
                {dayShifts.slice(0, 2).map((shift) => {
                  const user = users?.find(u => u.id === shift.user_id);
                  return (
                    <Card key={shift.id} className="p-1">
                      <div className="text-xs">
                        <div className="font-medium truncate">{shift.title}</div>
                        {user && (
                          <div className="text-gray-400 truncate">{user.username}</div>
                        )}
                      </div>
                    </Card>
                  );
                })}
                {dayShifts.length > 2 && (
                  <div className="text-xs text-gray-500">
                    +{dayShifts.length - 2} more
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
