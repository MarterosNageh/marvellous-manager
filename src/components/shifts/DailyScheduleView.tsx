
import React, { useState } from 'react';
import { useShifts } from '@/context/ShiftsContext';
import { format, isSameDay, subDays, addDays } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export const DailyScheduleView = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const { shifts, users } = useShifts();

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

  const goToPreviousDay = () => {
    setCurrentDate(subDays(currentDate, 1));
  };

  const goToNextDay = () => {
    setCurrentDate(addDays(currentDate, 1));
  };

  const dayShifts = getShiftsForDay(currentDate);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <Button onClick={goToPreviousDay}><ChevronLeft /></Button>
        <h2 className="text-lg font-semibold">{format(currentDate, 'EEEE, MMMM d, yyyy')}</h2>
        <Button onClick={goToNextDay}><ChevronRight /></Button>
      </div>
      
      <div className="space-y-2">
        {dayShifts.length === 0 ? (
          <Card>
            <CardContent className="p-4">
              <p className="text-gray-500">No shifts scheduled for {format(currentDate, 'MMMM d')}</p>
            </CardContent>
          </Card>
        ) : (
          dayShifts.map((shift) => {
            const user = users?.find(u => u.id === shift.user_id);
            return (
              <Card key={shift.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="flex justify-between items-center">
                    <span>{shift.title}</span>
                    <Badge variant="secondary">
                      {shift.start_time && format(new Date(shift.start_time), 'HH:mm')} - 
                      {shift.end_time && format(new Date(shift.end_time), 'HH:mm')}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {shift.notes && <p className="text-gray-600 mb-2">{shift.notes}</p>}
                  {user && (
                    <p className="text-sm text-gray-500">Assigned to: {user.username}</p>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};
