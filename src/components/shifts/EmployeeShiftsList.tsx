
import React from 'react';
import { useShifts } from '@/context/ShiftsContext';
import { format, isToday, isThisWeek } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Clock, User } from 'lucide-react';

export const EmployeeShiftsList = () => {
  const { shifts, users } = useShifts();

  const getUpcomingShifts = () => {
    return shifts?.filter(shift => {
      if (!shift.start_time) return false;
      try {
        const shiftDate = new Date(shift.start_time);
        return isToday(shiftDate) || isThisWeek(shiftDate);
      } catch {
        return false;
      }
    }) || [];
  };

  const getTotalShiftsThisWeek = (userId: string) => {
    return shifts?.filter(shift => {
      if (!shift.start_time || shift.user_id !== userId) return false;
      try {
        return isThisWeek(new Date(shift.start_time));
      } catch {
        return false;
      }
    }).length || 0;
  };

  const upcomingShifts = getUpcomingShifts();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-4">Employee Overview</h2>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {users?.map((user) => {
            const weeklyShifts = getTotalShiftsThisWeek(user.id);
            const userShifts = shifts?.filter(shift => shift.user_id === user.id) || [];
            
            return (
              <Card key={user.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src="" />
                      <AvatarFallback>
                        <User className="h-5 w-5" />
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-base">{user.username}</CardTitle>
                      <p className="text-sm text-gray-500">{user.email || 'No email'}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">This Week:</span>
                      <Badge variant="secondary">
                        {weeklyShifts} shift{weeklyShifts !== 1 ? 's' : ''}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Total Shifts:</span>
                      <Badge variant="outline">
                        {userShifts.length}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Upcoming Shifts</h2>
        
        <div className="space-y-4">
          {upcomingShifts.length === 0 ? (
            <Card>
              <CardContent className="p-6">
                <p className="text-gray-500 text-center">No upcoming shifts this week</p>
              </CardContent>
            </Card>
          ) : (
            upcomingShifts.map((shift) => {
              const user = users?.find(u => u.id === shift.user_id);
              return (
                <Card key={shift.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src="" />
                          <AvatarFallback>
                            <User className="h-4 w-4" />
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{shift.title}</p>
                          {shift.description && <p className="text-sm text-gray-600">{shift.description}</p>}
                          <p className="text-sm text-gray-500">
                            {user?.username || 'Unassigned'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <span className="text-sm">
                          {shift.start_time && format(new Date(shift.start_time), 'MMM d')} • 
                          {shift.start_time && format(new Date(shift.start_time), 'HH:mm')} - {shift.end_time && format(new Date(shift.end_time), 'HH:mm')}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Weekly Statistics</h2>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">
                  {shifts?.filter(shift => shift.start_time && isThisWeek(new Date(shift.start_time))).length || 0}
                </p>
                <p className="text-sm text-gray-600">Total Shifts This Week</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{users?.length || 0}</p>
                <p className="text-sm text-gray-600">Active Employees</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">
                  {shifts?.filter(shift => shift.start_time && isToday(new Date(shift.start_time))).length || 0}
                </p>
                <p className="text-sm text-gray-600">Today's Shifts</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-600">{shifts?.length || 0}</p>
                <p className="text-sm text-gray-600">Total Shifts</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
