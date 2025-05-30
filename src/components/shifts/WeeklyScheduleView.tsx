
import React, { useState, useMemo } from 'react';
import { useShifts } from '@/context/ShiftsContext';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Calendar, Clock } from 'lucide-react';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, subWeeks, addWeeks } from 'date-fns';

export const WeeklyScheduleView = () => {
  const { shifts } = useShifts();
  const { users } = useAuth();
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

  const getShiftsForUserAndDay = (userId: string, day: Date) => {
    return weekShifts.filter(shift => 
      shift.user_id === userId && isSameDay(new Date(shift.start_time), day)
    );
  };

  const getCurrentlyWorking = () => {
    const now = new Date();
    return weekShifts.filter(shift => {
      const shiftStart = new Date(shift.start_time);
      const shiftEnd = new Date(shift.end_time);
      return shiftStart <= now && shiftEnd >= now;
    });
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

  const currentlyWorking = getCurrentlyWorking();

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

      {/* Currently Working Section */}
      {currentlyWorking.length > 0 && (
        <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
          <CardHeader>
            <CardTitle className="flex items-center text-green-800 dark:text-green-200">
              <Clock className="mr-2 h-5 w-5" />
              Currently Working
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {currentlyWorking.map((shift) => (
                <div key={shift.id} className="text-sm text-green-700 dark:text-green-300 bg-white dark:bg-green-900 p-2 rounded">
                  <strong>{shift.user?.username}</strong> - {shift.title || 'Shift'}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Users vs Days Table View */}
      <Card>
        <CardHeader>
          <CardTitle>Weekly Schedule</CardTitle>
          <CardDescription>Team schedule for the week</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2 font-medium">Employee</th>
                  {weekDays.map((day) => (
                    <th key={day.toISOString()} className="text-center p-2 font-medium min-w-[120px]">
                      <div>{format(day, 'EEE')}</div>
                      <div className="text-xs text-gray-500">{format(day, 'd')}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="p-2 font-medium">
                      <div>{user.username}</div>
                      <div className="text-xs text-gray-500">{user.role || 'Employee'}</div>
                    </td>
                    {weekDays.map((day) => {
                      const dayShifts = getShiftsForUserAndDay(user.id, day);
                      return (
                        <td key={day.toISOString()} className="p-1 text-center">
                          {dayShifts.length > 0 ? (
                            <div className="space-y-1">
                              {dayShifts.map((shift) => (
                                <div key={shift.id} className="text-xs p-1 bg-blue-100 dark:bg-blue-900 rounded">
                                  <div className="font-medium">{shift.shift_type}</div>
                                  <div>{format(new Date(shift.start_time), 'HH:mm')}-{format(new Date(shift.end_time), 'HH:mm')}</div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-xs text-gray-400">-</div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
