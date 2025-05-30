
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Clock, Calendar, User } from 'lucide-react';
import { useShifts } from '@/context/ShiftsContext';
import { useAuth } from '@/context/AuthContext';
import { isToday, isThisWeek, format } from 'date-fns';

interface EmployeeShiftsListProps {
  searchTerm: string;
  filterRole: string;
}

export const EmployeeShiftsList: React.FC<EmployeeShiftsListProps> = ({
  searchTerm,
  filterRole
}) => {
  const { shifts, users } = useShifts();
  const { currentUser } = useAuth();

  // Filter users based on search and role
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.username.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    return matchesSearch && matchesRole;
  });

  // Get shifts for a specific user
  const getUserShifts = (userId: string) => {
    return shifts.filter(shift => shift.user_id === userId);
  };

  // Get today's shifts for a user
  const getTodayShifts = (userId: string) => {
    return shifts.filter(shift => 
      shift.user_id === userId && isToday(new Date(shift.start_time))
    );
  };

  // Get this week's shifts for a user
  const getWeekShifts = (userId: string) => {
    return shifts.filter(shift => 
      shift.user_id === userId && isThisWeek(new Date(shift.start_time))
    );
  };

  // Check if user is currently working
  const isCurrentlyWorking = (userId: string) => {
    const now = new Date();
    return shifts.some(shift => {
      if (shift.user_id !== userId) return false;
      const startTime = new Date(shift.start_time);
      const endTime = new Date(shift.end_time);
      return startTime <= now && endTime >= now;
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredUsers.map((user) => {
          const userShifts = getUserShifts(user.id);
          const todayShifts = getTodayShifts(user.id);
          const weekShifts = getWeekShifts(user.id);
          const currentlyWorking = isCurrentlyWorking(user.id);

          return (
            <Card key={user.id} className={`${currentlyWorking ? 'ring-2 ring-green-500' : ''}`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Avatar>
                      <AvatarFallback>
                        {user.username.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-base">{user.username}</CardTitle>
                      <p className="text-sm text-gray-600">{user.role || 'Employee'}</p>
                    </div>
                  </div>
                  {currentlyWorking && (
                    <Badge className="bg-green-100 text-green-800">Working</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Today's Shifts */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Today ({todayShifts.length})
                  </h4>
                  {todayShifts.length === 0 ? (
                    <p className="text-sm text-gray-500">Day off</p>
                  ) : (
                    <div className="space-y-2">
                      {todayShifts.map((shift) => (
                        <div key={shift.id} className="text-sm">
                          <div className="font-medium">{shift.title}</div>
                          <div className="text-gray-600">
                            {format(new Date(shift.start_time), 'HH:mm')} - {format(new Date(shift.end_time), 'HH:mm')}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* This Week Stats */}
                <div className="pt-3 border-t">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">This week:</span>
                    <span className="font-medium">{weekShifts.length} shifts</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Total shifts:</span>
                    <span className="font-medium">{userShifts.length}</span>
                  </div>
                </div>

                {/* Recent Shifts */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    Recent Shifts
                  </h4>
                  <div className="space-y-2">
                    {userShifts
                      .sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime())
                      .slice(0, 3)
                      .map((shift) => (
                        <div key={shift.id} className="text-sm">
                          <div className="font-medium">{shift.title}</div>
                          <div className="text-gray-600">
                            {format(new Date(shift.start_time), 'MMM d, HH:mm')}
                          </div>
                        </div>
                      ))}
                    {userShifts.length === 0 && (
                      <p className="text-sm text-gray-500">No shifts assigned</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredUsers.length === 0 && (
        <div className="text-center py-12">
          <User className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No employees found</h3>
          <p className="text-gray-600">Try adjusting your search or filter criteria.</p>
        </div>
      )}
    </div>
  );
};
