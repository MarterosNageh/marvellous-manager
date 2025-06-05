
import React from 'react';
import { useShifts } from '@/context/ShiftsContext';
import { format, isToday, isThisWeek } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, Clock, MapPin } from 'lucide-react';

export const EmployeeShiftsList = () => {
  const { shifts, users } = useShifts();

  // Get upcoming shifts for each employee
  const getEmployeeShifts = (userId: string) => {
    return shifts
      .filter(shift => shift.user_id === userId)
      .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Employee Schedules</h3>
      
      <div className="grid gap-6">
        {users.map((user) => {
          const userShifts = getEmployeeShifts(user.id);
          const todayShifts = userShifts.filter(shift => isToday(new Date(shift.start_time)));
          const weekShifts = userShifts.filter(shift => 
            isThisWeek(new Date(shift.start_time)) && !isToday(new Date(shift.start_time))
          );
          
          return (
            <Card key={user.id} className="w-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold">{user.username}</h4>
                    <p className="text-sm text-gray-600">{user.role || 'Employee'}</p>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Today's Shifts */}
                {todayShifts.length > 0 && (
                  <div>
                    <h5 className="font-medium text-green-700 mb-2">Today</h5>
                    <div className="space-y-2">
                      {todayShifts.map((shift) => (
                        <div
                          key={shift.id}
                          className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200"
                        >
                          <div className="flex items-center space-x-3">
                            <Clock className="h-4 w-4 text-green-600" />
                            <div>
                              <p className="font-medium">{shift.title}</p>
                              <p className="text-sm text-gray-600">
                                {format(new Date(shift.start_time), 'HH:mm')} - {format(new Date(shift.end_time), 'HH:mm')}
                              </p>
                            </div>
                          </div>
                          <Badge variant="default">{shift.shift_type}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* This Week's Shifts */}
                {weekShifts.length > 0 && (
                  <div>
                    <h5 className="font-medium text-blue-700 mb-2">This Week</h5>
                    <div className="space-y-2">
                      {weekShifts.map((shift) => (
                        <div
                          key={shift.id}
                          className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200"
                        >
                          <div className="flex items-center space-x-3">
                            <Clock className="h-4 w-4 text-blue-600" />
                            <div>
                              <p className="font-medium">{shift.title}</p>
                              <p className="text-sm text-gray-600">
                                {format(new Date(shift.start_time), 'HH:mm')} - {format(new Date(shift.end_time), 'HH:mm')}
                              </p>
                            </div>
                          </div>
                          <Badge variant="secondary">{shift.shift_type}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {userShifts.length === 0 && (
                  <div className="text-center py-4 text-gray-500">
                    <p>No upcoming shifts scheduled</p>
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
