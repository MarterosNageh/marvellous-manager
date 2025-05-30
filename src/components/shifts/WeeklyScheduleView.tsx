
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Users, Clock } from 'lucide-react';
import { useShifts } from '@/context/ShiftsContext';
import { useAuth } from '@/context/AuthContext';
import { startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, subWeeks, addWeeks, format } from 'date-fns';

export const WeeklyScheduleView = () => {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const { shifts, users } = useShifts();
  const { currentUser } = useAuth();

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  // Filter shifts for current week
  const weekShifts = shifts.filter(shift => {
    const shiftDate = new Date(shift.start_time);
    return isSameDay(shiftDate, weekStart) || 
           (shiftDate >= weekStart && shiftDate <= weekEnd);
  });

  // Get shifts for a specific day
  const getShiftsForDay = (day: Date) => {
    return weekShifts.filter(shift => isSameDay(new Date(shift.start_time), day));
  };

  // Get currently working employees (at the top)
  const getCurrentlyWorking = () => {
    const now = new Date();
    return weekShifts.filter(shift => {
      const startTime = new Date(shift.start_time);
      const endTime = new Date(shift.end_time);
      return startTime <= now && endTime >= now;
    });
  };

  const handlePreviousWeek = () => {
    setCurrentWeek(subWeeks(currentWeek, 1));
  };

  const handleNextWeek = () => {
    setCurrentWeek(addWeeks(currentWeek, 1));
  };

  const currentlyWorking = getCurrentlyWorking();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h3 className="text-lg font-semibold">
            Week of {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}
          </h3>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={handlePreviousWeek}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleNextWeek}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Currently Working Section */}
      {currentlyWorking.length > 0 && (
        <Card className="bg-green-50 border-green-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-green-800 flex items-center gap-2">
              <Users className="h-5 w-5" />
              Currently Working ({currentlyWorking.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {currentlyWorking.map((shift) => {
              const user = users.find(u => u.id === shift.user_id);
              return (
                <div key={shift.id} className="bg-white rounded-lg p-3 border border-green-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{user?.username}</p>
                      <p className="text-sm text-gray-600">{shift.title}</p>
                      <p className="text-xs text-gray-500">
                        {format(new Date(shift.start_time), 'HH:mm')} - {format(new Date(shift.end_time), 'HH:mm')}
                      </p>
                    </div>
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      Active
                    </Badge>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Weekly Schedule Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4 font-medium bg-gray-50">Employee</th>
                  {weekDays.map((day) => (
                    <th key={day.toISOString()} className="text-center p-4 font-medium bg-gray-50 min-w-32">
                      <div>
                        <div className="font-semibold">{format(day, 'EEE')}</div>
                        <div className="text-sm text-gray-600">{format(day, 'MMM d')}</div>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((user) => {
                  return (
                    <tr key={user.id} className="border-b hover:bg-gray-50">
                      <td className="p-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-blue-600">
                              {user.username.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium">{user.username}</p>
                            <p className="text-sm text-gray-600">{user.role || 'Employee'}</p>
                          </div>
                        </div>
                      </td>
                      {weekDays.map((day) => {
                        const dayShifts = getShiftsForDay(day).filter(shift => shift.user_id === user.id);
                        return (
                          <td key={day.toISOString()} className="p-4 text-center">
                            {dayShifts.length > 0 ? (
                              <div className="space-y-1">
                                {dayShifts.map((shift) => (
                                  <div
                                    key={shift.id}
                                    className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs"
                                  >
                                    <div className="font-medium">{shift.title}</div>
                                    <div className="text-xs">
                                      {format(new Date(shift.start_time), 'HH:mm')} - {format(new Date(shift.end_time), 'HH:mm')}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="text-gray-400 text-sm">Off</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
