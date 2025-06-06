
import React, { useState } from 'react';
import { useShifts } from '@/context/ShiftsContext';
import { format, isSameDay, subDays, addDays } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Clock, User } from 'lucide-react';

const DailyScheduleView = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const { shifts, users } = useShifts();

  // Get shifts for the current day
  const shiftsForDay = shifts?.filter(shift => {
    if (!shift.start_time) return false;
    try {
      return isSameDay(new Date(shift.start_time), currentDate);
    } catch {
      return false;
    }
  }) || [];

  const goToPreviousDay = () => {
    setCurrentDate(subDays(currentDate, 1));
  };

  const goToNextDay = () => {
    setCurrentDate(addDays(currentDate, 1));
  };

  const getTimeSlots = () => {
    const slots = [];
    for (let hour = 6; hour <= 22; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
    }
    return slots;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={goToPreviousDay}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-xl font-semibold">
          {format(currentDate, 'EEEE, MMMM d, yyyy')}
        </h2>
        <Button variant="outline" onClick={goToNextDay}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Schedule for {format(currentDate, 'MMM d')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {shiftsForDay.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No shifts scheduled for this day
            </p>
          ) : (
            <div className="space-y-3">
              {shiftsForDay.map((shift) => {
                const user = users?.find(u => u.id === shift.user_id);
                return (
                  <div
                    key={shift.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-medium">{shift.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          {user?.username || 'Unknown User'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline">
                        {shift.start_time && format(new Date(shift.start_time), 'HH:mm')} - 
                        {shift.end_time && format(new Date(shift.end_time), 'HH:mm')}
                      </Badge>
                      {shift.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {shift.description}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Time slot grid */}
      <Card>
        <CardHeader>
          <CardTitle>Hourly View</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-2">
            {getTimeSlots().map((timeSlot) => {
              const shiftsAtTime = shiftsForDay.filter(shift => {
                if (!shift.start_time || !shift.end_time) return false;
                try {
                  const startHour = new Date(shift.start_time).getHours();
                  const slotHour = parseInt(timeSlot.split(':')[0]);
                  return startHour <= slotHour && new Date(shift.end_time).getHours() > slotHour;
                } catch {
                  return false;
                }
              });

              return (
                <div key={timeSlot} className="flex items-center p-2 border-b">
                  <div className="w-16 text-sm font-medium text-muted-foreground">
                    {timeSlot}
                  </div>
                  <div className="flex-1 ml-4">
                    {shiftsAtTime.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {shiftsAtTime.map((shift) => {
                          const user = users?.find(u => u.id === shift.user_id);
                          return (
                            <Badge key={shift.id} variant="secondary">
                              {shift.title} - {user?.username}
                            </Badge>
                          );
                        })}
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">No shifts</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export { DailyScheduleView };
