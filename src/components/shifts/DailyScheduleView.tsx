
import React, { useState } from 'react';
import { useShifts } from '@/context/ShiftsContext';
import { 
  format, 
  isSameDay, 
  subDays, 
  addDays 
} from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
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
        <h2 className="text-lg font-semibold">
          {format(currentDate, 'EEEE, MMMM d, yyyy')}
        </h2>
        <Button onClick={goToNextDay}><ChevronRight /></Button>
      </div>
      
      <div className="space-y-2">
        {dayShifts.map((shift) => {
          const user = users?.find(u => u.id === shift.user_id);
          return (
            <Card key={shift.id} className="p-4">
              <div className="font-medium">{shift.title}</div>
              <div className="text-sm text-gray-500">
                {shift.start_time && format(new Date(shift.start_time), 'HH:mm')} - 
                {shift.end_time && format(new Date(shift.end_time), 'HH:mm')}
              </div>
              {user && (
                <div className="text-sm text-gray-400">{user.username}</div>
              )}
              {shift.description && (
                <div className="text-sm mt-2">{shift.description}</div>
              )}
            </Card>
          );
        })}
        {dayShifts.length === 0 && (
          <div className="text-center text-gray-400 py-8">
            No shifts scheduled for this day
          </div>
        )}
      </div>
    </div>
  );
};
