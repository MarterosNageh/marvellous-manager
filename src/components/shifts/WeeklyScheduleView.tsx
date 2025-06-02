
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { useShifts } from '@/context/ShiftsContext';
import { startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, subWeeks, addWeeks, format } from 'date-fns';

export const WeeklyScheduleView = () => {
  const { shifts, users } = useShifts();
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Get start and end of the week
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 }); // Monday
  const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  // Get shifts for a specific day
  const getDayShifts = (date: Date) => {
    return shifts.filter(shift => 
      isSameDay(new Date(shift.start_time), date) && 
      shift.status === 'scheduled'
    );
  };

  const handlePreviousWeek = () => {
    setSelectedDate(subWeeks(selectedDate, 1));
  };

  const handleNextWeek = () => {
    setSelectedDate(addWeeks(selectedDate, 1));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          Week of {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}
        </h3>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={handlePreviousWeek}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setSelectedDate(new Date())}>
            This Week
          </Button>
          <Button variant="outline" size="sm" onClick={handleNextWeek}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Week Grid */}
      <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
        {weekDays.map((day) => {
          const dayShifts = getDayShifts(day);
          const isToday = isSameDay(day, new Date());
          
          return (
            <Card key={day.toISOString()} className={isToday ? 'ring-2 ring-blue-500' : ''}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">
                  <div className="text-center">
                    <p className="font-semibold">{format(day, 'EEE')}</p>
                    <p className="text-lg">{format(day, 'd')}</p>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {dayShifts.length === 0 ? (
                  <p className="text-xs text-gray-500 text-center">No shifts</p>
                ) : (
                  dayShifts.map((shift) => {
                    const user = users.find(u => u.id === shift.user_id);
                    return (
                      <div key={shift.id} className="p-2 bg-blue-50 rounded text-xs">
                        <div className="flex items-center space-x-1 mb-1">
                          <Avatar className="h-4 w-4">
                            <AvatarFallback className="text-xs bg-blue-100 text-blue-600">
                              {user?.username?.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium truncate">{user?.username}</span>
                        </div>
                        <p className="text-gray-600 truncate">{shift.title}</p>
                        <p className="text-gray-500">
                          {format(new Date(shift.start_time), 'HH:mm')}-{format(new Date(shift.end_time), 'HH:mm')}
                        </p>
                        <Badge variant="outline" className="text-xs">
                          {shift.shift_type}
                        </Badge>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
