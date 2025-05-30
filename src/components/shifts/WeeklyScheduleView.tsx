
import React, { useState, useMemo } from 'react';
import { useShifts } from '@/context/ShiftsContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, subWeeks, addWeeks } from 'date-fns';

export const WeeklyScheduleView = () => {
  const { shifts } = useShifts();
  const [selectedWeek, setSelectedWeek] = useState(new Date());

  const weekDays = useMemo(() => {
    const weekStart = startOfWeek(selectedWeek, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(selectedWeek, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: weekStart, end: weekEnd });
  }, [selectedWeek]);

  const weekShifts = useMemo(() => {
    return shifts.filter(shift => {
      const shiftDate = new Date(shift.start_time);
      return weekDays.some(day => isSameDay(shiftDate, day)) && shift.status === 'scheduled';
    });
  }, [shifts, weekDays]);

  const getShiftsForDay = (day: Date) => {
    return weekShifts.filter(shift => isSameDay(new Date(shift.start_time), day));
  };

  const goToPreviousWeek = () => {
    setSelectedWeek(subWeeks(selectedWeek, 1));
  };

  const goToNextWeek = () => {
    setSelectedWeek(addWeeks(selectedWeek, 1));
  };

  const goToCurrentWeek = () => {
    setSelectedWeek(new Date());
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="icon" onClick={goToPreviousWeek}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-2xl font-bold">
            {format(weekDays[0], 'MMM d')} - {format(weekDays[6], 'MMM d, yyyy')}
          </h2>
          <Button variant="outline" size="icon" onClick={goToNextWeek}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <Button variant="outline" onClick={goToCurrentWeek}>
          <Calendar className="mr-2 h-4 w-4" />
          This Week
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-4">
        {weekDays.map((day) => {
          const dayShifts = getShiftsForDay(day);
          return (
            <Card key={day.toISOString()}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">
                  {format(day, 'EEE')}
                </CardTitle>
                <CardDescription className="text-xs">
                  {format(day, 'd')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {dayShifts.map((shift) => (
                  <div key={shift.id} className="p-2 bg-gray-50 dark:bg-gray-800 rounded text-xs">
                    <div className="font-medium truncate">{shift.user?.username}</div>
                    <div className="text-gray-600 dark:text-gray-400">
                      {format(new Date(shift.start_time), 'HH:mm')} - {format(new Date(shift.end_time), 'HH:mm')}
                    </div>
                    <Badge variant="outline" className="mt-1 text-xs">
                      {shift.shift_type}
                    </Badge>
                  </div>
                ))}
                {dayShifts.length === 0 && (
                  <div className="text-xs text-gray-400 text-center py-2">
                    No shifts
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
