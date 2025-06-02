
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Users, Calendar, Clock, ChevronRight } from 'lucide-react';
import { useShifts } from '@/context/ShiftsContext';
import { useAuth } from '@/context/AuthContext';
import { format, isToday, isThisWeek } from 'date-fns';

export const EmployeeShiftsList = () => {
  const { shifts, users } = useShifts();
  const { currentUser } = useAuth();
  const [selectedUserId, setSelectedUserId] = useState<string>('');

  // Get shifts for each user
  const getUserShifts = (userId: string) => {
    return shifts.filter(shift => shift.user_id === userId);
  };

  // Get today's shifts for a user
  const getTodayShifts = (userId: string) => {
    return shifts.filter(shift => 
      shift.user_id === userId && 
      isToday(new Date(shift.start_time)) && 
      shift.status === 'scheduled'
    );
  };

  // Get this week's shifts for a user
  const getThisWeekShifts = (userId: string) => {
    return shifts.filter(shift => 
      shift.user_id === userId && 
      isThisWeek(new Date(shift.start_time)) && 
      shift.status === 'scheduled'
    );
  };

  // Calculate total hours for a user
  const calculateTotalHours = (userShifts: any[]) => {
    return userShifts.reduce((total, shift) => {
      const start = new Date(shift.start_time);
      const end = new Date(shift.end_time);
      const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
      return total + hours;
    }, 0);
  };

  const filteredUsers = selectedUserId ? users.filter(u => u.id === selectedUserId) : users;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Employee Shifts</h3>
          <p className="text-sm text-gray-600">View shifts for all employees</p>
        </div>
        
        {/* User Filter */}
        <div className="flex items-center space-x-2">
          <select 
            value={selectedUserId} 
            onChange={(e) => setSelectedUserId(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="">All Employees</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.username}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Employee Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredUsers.map((user) => {
          const userShifts = getUserShifts(user.id);
          const todayShifts = getTodayShifts(user.id);
          const weekShifts = getThisWeekShifts(user.id);
          const totalHours = calculateTotalHours(weekShifts);
          const isCurrentlyWorking = todayShifts.some(shift => {
            const now = new Date();
            const shiftStart = new Date(shift.start_time);
            const shiftEnd = new Date(shift.end_time);
            return shiftStart <= now && shiftEnd >= now;
          });

          return (
            <Card key={user.id} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-blue-100 text-blue-600">
                      {user.username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="font-medium">{user.username}</h4>
                    <p className="text-sm text-gray-600">{user.role || 'Employee'}</p>
                  </div>
                  {isCurrentlyWorking && (
                    <Badge className="bg-green-100 text-green-700 text-xs">
                      Working
                    </Badge>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-lg font-semibold text-blue-600">{todayShifts.length}</p>
                    <p className="text-xs text-gray-600">Today</p>
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-green-600">{weekShifts.length}</p>
                    <p className="text-xs text-gray-600">This Week</p>
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-orange-600">{Math.round(totalHours)}h</p>
                    <p className="text-xs text-gray-600">Total Hours</p>
                  </div>
                </div>

                {/* Recent Shifts */}
                <div className="space-y-2">
                  <h5 className="text-sm font-medium">Recent Shifts</h5>
                  {userShifts.slice(0, 3).map((shift) => (
                    <div key={shift.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div>
                        <p className="text-xs font-medium">{shift.title}</p>
                        <p className="text-xs text-gray-600">
                          {format(new Date(shift.start_time), 'MMM d')} • {format(new Date(shift.start_time), 'HH:mm')} - {format(new Date(shift.end_time), 'HH:mm')}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {isToday(new Date(shift.start_time)) && (
                          <Badge variant="outline" className="text-xs">Today</Badge>
                        )}
                        <Badge variant="outline" className="text-xs">{format(new Date(shift.start_time), 'EEE')}</Badge>
                      </div>
                    </div>
                  ))}
                  
                  {userShifts.length === 0 ? (
                    <div className="text-center py-4 text-gray-500">
                      <Calendar className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                      <p className="text-xs">No shifts assigned</p>
                    </div>
                  ) : userShifts.length > 3 && (
                    <Button variant="outline" size="sm" className="w-full">
                      <span className="text-xs">View All {userShifts.length} Shifts</span>
                      <ChevronRight className="h-3 w-3 ml-1" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredUsers.length === 0 && (
        <div className="text-center py-12">
          <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500">No employees found</p>
        </div>
      )}
    </div>
  );
};
