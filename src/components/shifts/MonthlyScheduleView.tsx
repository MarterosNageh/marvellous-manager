
import React, { useState } from 'react';
import { useShifts } from '@/context/ShiftsContext';
import { format, isSameDay, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, addMonths, subMonths, isSameMonth } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const MonthlyScheduleView = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const { shifts, users } = useShifts();

  const startOfMonthDate = startOfMonth(currentMonth);
  const endOfMonthDate = endOfMonth(currentMonth);
  const startOfWeekDate = startOfWeek(startOfMonthDate);
  const endOfWeekDate = endOfWeek(endOfMonthDate);

  const calendarDays = eachDayOfInterval({
    start: startOfWeekDate,
    end: endOfWeekDate,
  });

  const goToPreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <Button onClick={goToPreviousMonth}><ChevronLeft /></Button>
        <h2 className="text-lg font-semibold">{format(currentMonth, 'MMMM yyyy')}</h2>
        <Button onClick={goToNextMonth}><ChevronRight /></Button>
      </div>
      <div className="grid grid-cols-7 gap-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
          <div key={index} className="text-center font-medium">{day}</div>
        ))}
        {calendarDays.map((day) => {
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const shiftForDay = shifts?.find(shift => {
            if (!shift.start_time) return false;
            try {
              return isSameDay(new Date(shift.start_time), day);
            } catch {
              return false;
            }
          });
          return (
            <Card key={day.toISOString()} className={`shadow-sm ${isCurrentMonth ? '' : 'opacity-50'}`}>
              <CardHeader className="p-1">
                <CardTitle className="text-sm text-center">{format(day, 'd')}</CardTitle>
              </CardHeader>
              <CardContent className="p-2">
                {shiftForDay && (
                  <Badge variant="secondary">
                    {shiftForDay.start_time && format(new Date(shiftForDay.start_time), 'HH:mm')} - {shiftForDay.end_time && format(new Date(shiftForDay.end_time), 'HH:mm')}
                  </Badge>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default MonthlyScheduleView;
