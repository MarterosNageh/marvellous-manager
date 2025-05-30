
import React, { useState, useMemo } from 'react';
import { useShifts } from '@/context/ShiftsContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { format, isSameDay } from 'date-fns';

export const DailyScheduleView = () => {
  const { shifts } = useShifts();
  const [selectedDate, setSelectedDate] = useState(new Date());

  const dayShifts = useMemo(() => {
    return shifts.filter(shift => 
      isSameDay(new Date(shift.start_time), selectedDate) && 
      shift.status === 'scheduled'
    );
  }, [shifts, selectedDate]);

  const goToPreviousDay = () => {
    const previousDay = new Date(selectedDate);
    previousDay.setDate(previousDay.getDate() - 1);
    setSelectedDate(previousDay);
  };

  const goToNextDay = () => {
    const nextDay = new Date(selectedDate);
    nextDay.setDate(nextDay.getDate() + 1);
    setSelectedDate(nextDay);
  };

  const goToToday = () => {
    setSelectedDate(new Date());
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="icon" onClick={goToPreviousDay}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-2xl font-bold">
            {format(selectedDate, 'EEEE, MMMM d, yyyy')}
          </h2>
          <Button variant="outline" size="icon" onClick={goToNextDay}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <Button variant="outline" onClick={goToToday}>
          <Calendar className="mr-2 h-4 w-4" />
          Today
        </Button>
      </div>

      <div className="grid gap-4">
        {dayShifts.length > 0 ? (
          dayShifts.map((shift) => (
            <Card key={shift.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{shift.title || 'Shift'}</CardTitle>
                  <Badge variant={shift.shift_type === 'morning' ? 'default' : shift.shift_type === 'evening' ? 'secondary' : 'outline'}>
                    {shift.shift_type}
                  </Badge>
                </div>
                <CardDescription>
                  {shift.user?.username} • {format(new Date(shift.start_time), 'HH:mm')} - {format(new Date(shift.end_time), 'HH:mm')}
                </CardDescription>
              </CardHeader>
              {shift.notes && (
                <CardContent>
                  <p className="text-sm text-gray-600">{shift.notes}</p>
                </CardContent>
              )}
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="text-center py-8">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-500">No shifts scheduled for this day</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
