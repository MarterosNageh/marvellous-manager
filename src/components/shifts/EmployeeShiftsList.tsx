
import React from 'react';
import { useShifts } from '@/context/ShiftsContext';
import { format, isToday, isThisWeek } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Clock, User, Calendar } from 'lucide-react';

export const EmployeeShiftsList = () => {
  const { shifts, users } = useShifts();

  const getUpcomingShifts = (userId: string) => {
    return shifts?.filter(shift => {
      if (shift.user_id !== userId || !shift.start_time) return false;
      try {
        const shiftDate = new Date(shift.start_time);
        return shiftDate > new Date() && (isToday(shiftDate) || isThisWeek(shiftDate, { weekStartsOn: 1 }));
      } catch {
        return false;
      }
    }).slice(0, 3) || [];
  };

  const getTotalHoursThisWeek = (userId: string) => {
    const weekShifts = shifts?.filter(shift => {
      if (shift.user_id !== userId || !shift.start_time || !shift.end_time) return false;
      try {
        return isThisWeek(new Date(shift.start_time), { weekStartsOn: 1 });
      } catch {
        return false;
      }
    }) || [];

    return weekShifts.reduce((total, shift) => {
      try {
        const start = new Date(shift.start_time);
        const end = new Date(shift.end_time);
        const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
        return total + hours;
      } catch {
        return total;
      }
    }, 0);
  };

  if (!users || users.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Employee Shifts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <User className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No employees found</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Employee Shifts
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {users.map((user) => {
            const upcomingShifts = getUpcomingShifts(user.id);
            const weeklyHours = getTotalHoursThisWeek(user.id);

            return (
              <div key={user.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <Avatar>
                      <AvatarFallback>
                        {user.username?.substring(0, 2).toUpperCase() || 'UN'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="font-medium">{user.username}</h4>
                      <p className="text-sm text-gray-600">{user.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline" className="mb-1">
                      {weeklyHours.toFixed(1)}h this week
                    </Badge>
                  </div>
                </div>

                <div className="space-y-2">
                  <h5 className="font-medium text-sm text-gray-700">Upcoming Shifts:</h5>
                  {upcomingShifts.length === 0 ? (
                    <p className="text-sm text-gray-500">No upcoming shifts</p>
                  ) : (
                    upcomingShifts.map((shift) => (
                      <div key={shift.id} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                        <div>
                          <p className="font-medium text-sm">{shift.title}</p>
                          <p className="text-xs text-gray-600">{shift.description}</p>
                        </div>
                        <div className="text-right text-xs">
                          <p>{shift.start_time && format(new Date(shift.start_time), 'MMM d')}</p>
                          <p className="text-gray-600">
                            {shift.start_time && format(new Date(shift.start_time), 'HH:mm')} - {shift.end_time && format(new Date(shift.end_time), 'HH:mm')}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="mt-4 pt-3 border-t">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Total shifts this week: {shifts?.filter(s => {
                        if (s.user_id !== user.id || !s.start_time) return false;
                        try {
                          return isThisWeek(new Date(s.start_time), { weekStartsOn: 1 });
                        } catch {
                          return false;
                        }
                      }).length || 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {weeklyHours.toFixed(1)} hours
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
