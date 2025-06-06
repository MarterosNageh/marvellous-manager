
import React, { useState } from 'react';
import { useShifts } from '@/context/ShiftsContext';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  subMonths, 
  addMonths 
} from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <Button onClick={goToPreviousMonth}><ChevronLeft /></Button>
        <h2 className="text-lg font-semibold">{format(currentDate, 'MMMM yyyy')}</h2>
        <Button onClick={goToNextMonth}><ChevronRight /></Button>
      </div>
      
      <div className="grid grid-cols-7 gap-1">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
          <div key={day} className="p-2 text-center font-medium text-gray-600">
            {day}
          </div>
        ))}
        
        {calendarDays.map((day) => {
          const isCurrentMonth = isSameMonth(day, currentDate);
          const dayShifts = shifts?.filter(shift => {
            if (!shift.start_time) return false;
            try {
              return isSameDay(new Date(shift.start_time), day);
            } catch {
              return false;
            }
          }) || [];

          return (
            <Card key={day.toISOString()} className={`min-h-[80px] ${!isCurrentMonth ? 'opacity-50' : ''}`}>
              <CardContent className="p-1">
                <div className="text-sm font-medium">{format(day, 'd')}</div>
                <div className="space-y-1 mt-1">
                  {dayShifts.slice(0, 2).map((shift) => (
                    <div key={shift.id} className="text-xs bg-blue-100 rounded px-1 truncate">
                      {shift.start_time && format(new Date(shift.start_time), 'HH:mm')} {shift.title}
                    </div>
                  ))}
                  {dayShifts.length > 2 && (
                    <div className="text-xs text-gray-500">+{dayShifts.length - 2} more</div>
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
