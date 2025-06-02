
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ChevronLeft, ChevronRight, Calendar, Clock, Users } from 'lucide-react';
import { useShifts } from '@/context/ShiftsContext';
import { isSameDay, subDays, addDays, format } from 'date-fns';

export const DailyScheduleView = () => {
  const { shifts, users } = useShifts();
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Get shifts for the selected date
  const getDayShifts = () => {
    return shifts.filter(shift => 
      isSameDay(new Date(shift.start_time), selectedDate) && 
      shift.status === 'scheduled'
    );
  };

  const handlePreviousDay = () => {
    setSelectedDate(subDays(selectedDate, 1));
  };

  const handleNextDay = () => {
    setSelectedDate(addDays(selectedDate, 1));
  };

  const dayShifts = getDayShifts();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{format(selectedDate, 'EEEE, MMMM d, yyyy')}</h3>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={handlePreviousDay}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setSelectedDate(new Date())}>
            Today
          </Button>
          <Button variant="outline" size="sm" onClick={handleNextDay}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Shifts for the day */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Shifts ({dayShifts.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {dayShifts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No shifts scheduled for this day</p>
            </div>
          ) : (
            <div className="space-y-4">
              {dayShifts.map((shift) => {
                const user = users.find(u => u.id === shift.user_id);
                return (
                  <div key={shift.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-blue-100 text-blue-600">
                          {user?.username?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="font-medium">{shift.title}</h4>
                        <p className="text-sm text-gray-600">{user?.username}</p>
                        <p className="text-xs text-gray-500">
                          {format(new Date(shift.start_time), 'HH:mm')} - {format(new Date(shift.end_time), 'HH:mm')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">
                        {shift.shift_type}
                      </Badge>
                      <Badge variant="secondary">
                        {shift.status}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
