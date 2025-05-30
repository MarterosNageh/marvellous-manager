
import React, { useMemo } from 'react';
import { useShifts } from '@/context/ShiftsContext';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Calendar, Clock, User } from 'lucide-react';
import { format, isToday, isThisWeek } from 'date-fns';

interface EmployeeShiftsListProps {
  searchTerm: string;
  filterRole: string;
}

export const EmployeeShiftsList: React.FC<EmployeeShiftsListProps> = ({
  searchTerm,
  filterRole
}) => {
  const { shifts } = useShifts();
  const { users } = useAuth();

  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch = user.username.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = filterRole === 'all' || user.role === filterRole;
      return matchesSearch && matchesRole;
    });
  }, [users, searchTerm, filterRole]);

  const getUserShifts = (userId: string) => {
    return shifts.filter(shift => shift.user_id === userId && shift.status === 'scheduled');
  };

  const getTodayShifts = (userId: string) => {
    return shifts.filter(shift => 
      shift.user_id === userId && 
      isToday(new Date(shift.start_time)) && 
      shift.status === 'scheduled'
    );
  };

  const getWeekShifts = (userId: string) => {
    return shifts.filter(shift => 
      shift.user_id === userId && 
      isThisWeek(new Date(shift.start_time)) && 
      shift.status === 'scheduled'
    );
  };

  const getUpcomingShifts = (userId: string) => {
    const now = new Date();
    return shifts.filter(shift => 
      shift.user_id === userId && 
      new Date(shift.start_time) > now && 
      shift.status === 'scheduled'
    ).slice(0, 3);
  };

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {filteredUsers.map((user) => {
        const userShifts = getUserShifts(user.id);
        const todayShifts = getTodayShifts(user.id);
        const weekShifts = getWeekShifts(user.id);
        const upcomingShifts = getUpcomingShifts(user.id);

        return (
          <Card key={user.id}>
            <CardHeader>
              <div className="flex items-center space-x-3">
                <Avatar>
                  <AvatarFallback>
                    {user.username.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <CardTitle className="text-lg">{user.username}</CardTitle>
                  <CardDescription>
                    {user.role || 'Employee'} • {user.title || 'Staff Member'}
                  </CardDescription>
                </div>
                {user.isAdmin && (
                  <Badge variant="secondary">Admin</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Today's Shifts */}
              <div>
                <h4 className="font-medium text-sm flex items-center mb-2">
                  <Calendar className="h-4 w-4 mr-1" />
                  Today ({todayShifts.length})
                </h4>
                {todayShifts.length > 0 ? (
                  <div className="space-y-1">
                    {todayShifts.map((shift) => (
                      <div key={shift.id} className="text-xs p-2 bg-blue-50 dark:bg-blue-950 rounded">
                        <div className="font-medium">{shift.title || 'Shift'}</div>
                        <div className="text-gray-600 dark:text-gray-400">
                          {format(new Date(shift.start_time), 'HH:mm')} - {format(new Date(shift.end_time), 'HH:mm')}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-500">No shifts today</p>
                )}
              </div>

              {/* Weekly Summary */}
              <div>
                <h4 className="font-medium text-sm flex items-center mb-2">
                  <Clock className="h-4 w-4 mr-1" />
                  This Week ({weekShifts.length} shifts)
                </h4>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  Total hours: {weekShifts.reduce((acc, shift) => {
                    const start = new Date(shift.start_time);
                    const end = new Date(shift.end_time);
                    return acc + (end.getTime() - start.getTime()) / (1000 * 60 * 60);
                  }, 0).toFixed(1)}h
                </div>
              </div>

              {/* Upcoming Shifts */}
              <div>
                <h4 className="font-medium text-sm flex items-center mb-2">
                  <User className="h-4 w-4 mr-1" />
                  Upcoming
                </h4>
                {upcomingShifts.length > 0 ? (
                  <div className="space-y-1">
                    {upcomingShifts.map((shift) => (
                      <div key={shift.id} className="text-xs p-2 bg-gray-50 dark:bg-gray-800 rounded">
                        <div className="font-medium">{shift.title || 'Shift'}</div>
                        <div className="text-gray-600 dark:text-gray-400">
                          {format(new Date(shift.start_time), 'MMM d, HH:mm')}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-500">No upcoming shifts</p>
                )}
              </div>

              {/* Total Shifts */}
              <div className="pt-2 border-t">
                <div className="flex justify-between text-sm">
                  <span>Total shifts:</span>
                  <span className="font-medium">{userShifts.length}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
