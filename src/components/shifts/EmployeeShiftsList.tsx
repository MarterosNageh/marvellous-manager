
import React, { useMemo } from 'react';
import { useShifts } from '@/context/ShiftsContext';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, User } from 'lucide-react';
import { format, isToday, isThisWeek } from 'date-fns';

export const EmployeeShiftsList = () => {
  const { shifts } = useShifts();
  const { users } = useAuth();

  const employeeShifts = useMemo(() => {
    return users.map(user => {
      const userShifts = shifts.filter(shift => 
        shift.user_id === user.id && shift.status === 'scheduled'
      );
      
      const todayShifts = userShifts.filter(shift => 
        isToday(new Date(shift.start_time))
      );
      
      const weekShifts = userShifts.filter(shift => 
        isThisWeek(new Date(shift.start_time))
      );
      
      return {
        user,
        shifts: userShifts,
        todayShifts,
        weekShifts
      };
    });
  }, [shifts, users]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Employee Shifts</h2>
        <Button variant="outline">
          <Calendar className="mr-2 h-4 w-4" />
          View Calendar
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {employeeShifts.map(({ user, shifts: userShifts, todayShifts, weekShifts }) => (
          <Card key={user.id}>
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-lg">{user.username}</CardTitle>
                  <CardDescription>
                    {user.title || user.role || 'Employee'}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div className="text-center">
                  <div className="font-bold text-blue-600">{todayShifts.length}</div>
                  <div className="text-gray-600">Today</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-green-600">{weekShifts.length}</div>
                  <div className="text-gray-600">This Week</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-gray-600">{userShifts.length}</div>
                  <div className="text-gray-600">Total</div>
                </div>
              </div>

              {todayShifts.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2 flex items-center">
                    <Clock className="mr-1 h-4 w-4" />
                    Today's Shifts
                  </h4>
                  <div className="space-y-2">
                    {todayShifts.map((shift) => (
                      <div key={shift.id} className="p-2 bg-gray-50 dark:bg-gray-800 rounded text-sm">
                        <div className="font-medium">{shift.title}</div>
                        <div className="text-gray-600 dark:text-gray-400">
                          {format(new Date(shift.start_time), 'HH:mm')} - {format(new Date(shift.end_time), 'HH:mm')}
                        </div>
                        <Badge variant="outline" className="mt-1">
                          {shift.shift_type}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
