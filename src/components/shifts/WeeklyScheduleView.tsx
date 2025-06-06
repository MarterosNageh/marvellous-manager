
import React, { useState } from 'react';
import { useShifts } from '@/context/ShiftsContext';
import { format, isSameDay, startOfWeek, endOfWeek, eachDayOfInterval, subWeeks, addWeeks } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const WeeklyScheduleView = () => {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const { shifts, users } = useShifts();

  const startOfWeekDate = startOfWeek(currentWeek, { weekStartsOn: 1 });
  const endOfWeekDate = endOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({
    start: startOfWeekDate,
    end: endOfWeekDate,
  });

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
    setCurrentWeek(subWeeks(currentWeek, 1));
  };

  const goToNextWeek = () => {
    setCurrentWeek(addWeeks(currentWeek, 1));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <Button onClick={goToPreviousWeek}><ChevronLeft /></Button>
        <h2 className="text-lg font-semibold">
          {format(startOfWeekDate, 'MMMM d')} - {format(endOfWeekDate, 'MMMM d, yyyy')}
        </h2>
        <Button onClick={goToNextWeek}><ChevronRight /></Button>
      </div>
      <div className="grid grid-cols-7 gap-2">
        {weekDays.map((day) => {
          const dayShifts = getShiftsForDay(day);
          return (
            <Card key={day.toISOString()} className="min-h-[150px]">
              <CardHeader className="p-2">
                <CardTitle className="text-sm text-center">
                  <div>{format(day, 'EEE')}</div>
                  <div className="text-lg">{format(day, 'd')}</div>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-2 space-y-1">
                {dayShifts.map((shift) => {
                  const user = users?.find(u => u.id === shift.user_id);
                  return (
                    <div key={shift.id} className="text-xs p-1 bg-blue-100 rounded">
                      <div className="font-medium">{shift.title}</div>
                      <div className="text-gray-600">
                        {shift.start_time && format(new Date(shift.start_time), 'HH:mm')} - 
                        {shift.end_time && format(new Date(shift.end_time), 'HH:mm')}
                      </div>
                      {user && (
                        <div className="text-gray-500">{user.username}</div>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          );
        })}
      </div>
      
      {/* Summary Section */}
      <div className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Week Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {weekDays.map((day) => {
                const dayShifts = getShiftsForDay(day);
                return (
                  <div key={day.toISOString()} className="flex justify-between items-center">
                    <span className="font-medium">{format(day, 'EEEE, MMMM d')}</span>
                    <Badge variant="secondary">
                      {dayShifts.length} shift{dayShifts.length !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default WeeklyScheduleView;
