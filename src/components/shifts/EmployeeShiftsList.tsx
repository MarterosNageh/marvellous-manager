
import React, { useMemo } from 'react';
import { useShifts } from '@/context/ShiftsContext';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, Clock, Calendar, MapPin } from 'lucide-react';
import { format, isThisWeek, isToday } from 'date-fns';

interface EmployeeShiftsListProps {
  searchTerm: string;
  filterRole: string;
}

export const EmployeeShiftsList: React.FC<EmployeeShiftsListProps> = ({
  searchTerm,
  filterRole
}) => {
  const { shifts, loading } = useShifts();
  const { users } = useAuth();

  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch = user.username.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = filterRole === 'all' || 
        (filterRole === 'manager' && user.isAdmin) ||
        (filterRole === 'employee' && !user.isAdmin);
      return matchesSearch && matchesRole;
    });
  }, [users, searchTerm, filterRole]);

  const getUserShifts = (userId: string) => {
    return shifts.filter(shift => 
      shift.user_id === userId && 
      shift.status === 'scheduled'
    ).sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
  };

  const getShiftTypeColor = (type: string) => {
    switch (type) {
      case 'morning':
        return 'bg-blue-100 text-blue-800';
      case 'evening':
        return 'bg-orange-100 text-orange-800';
      case 'night':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading employee schedules...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold mb-2">Employee Schedules</h2>
        <p className="text-gray-600 dark:text-gray-400">
          View individual employee shift schedules and upcoming assignments.
        </p>
      </div>

      {filteredUsers.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <User className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No employees found
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              No employees match your search criteria.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredUsers.map((user) => {
            const userShifts = getUserShifts(user.id);
            const upcomingShifts = userShifts.filter(shift => 
              new Date(shift.start_time) > new Date()
            ).slice(0, 5);
            
            const todayShifts = userShifts.filter(shift => 
              isToday(new Date(shift.start_time))
            );

            const thisWeekShifts = userShifts.filter(shift => 
              isThisWeek(new Date(shift.start_time))
            );

            return (
              <Card key={user.id} className="h-fit">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-full">
                      <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{user.username}</CardTitle>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {user.isAdmin ? 'Admin' : 'Employee'}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded">
                      <div className="text-lg font-bold text-blue-600">
                        {todayShifts.length}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        Today
                      </div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded">
                      <div className="text-lg font-bold text-green-600">
                        {thisWeekShifts.length}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        This Week
                      </div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded">
                      <div className="text-lg font-bold text-purple-600">
                        {upcomingShifts.length}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        Upcoming
                      </div>
                    </div>
                  </div>

                  {/* Upcoming Shifts */}
                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Upcoming Shifts
                    </h4>
                    
                    {upcomingShifts.length > 0 ? (
                      <div className="space-y-2">
                        {upcomingShifts.map((shift) => (
                          <div
                            key={shift.id}
                            className="p-2 bg-gray-50 dark:bg-gray-800 rounded text-sm"
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium truncate">
                                {shift.title}
                              </span>
                              <Badge 
                                variant="secondary" 
                                className={getShiftTypeColor(shift.shift_type)}
                              >
                                {shift.shift_type}
                              </Badge>
                            </div>
                            
                            <div className="flex items-center gap-3 text-xs text-gray-600 dark:text-gray-400">
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {format(new Date(shift.start_time), 'MMM d, HH:mm')}
                              </div>
                              {shift.role && (
                                <div className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {shift.role}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                        No upcoming shifts
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
