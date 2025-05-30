
import React, { useMemo } from 'react';
import { useShifts } from '@/context/ShiftsContext';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, User } from 'lucide-react';
import { format, isToday, isThisWeek } from 'date-fns';

interface EmployeeShiftsListProps {
  searchTerm?: string;
  filterRole?: string;
}

export const EmployeeShiftsList: React.FC<EmployeeShiftsListProps> = ({ 
  searchTerm = '', 
  filterRole = '' 
}) => {
  const { shifts } = useShifts();
  const { users } = useAuth();

  const todayShifts = useMemo(() => {
    return shifts.filter(shift => 
      isToday(new Date(shift.start_time)) && 
      shift.status === 'scheduled'
    );
  }, [shifts]);

  const weekShifts = useMemo(() => {
    return shifts.filter(shift => 
      isThisWeek(new Date(shift.start_time)) && 
      shift.status === 'scheduled'
    );
  }, [shifts]);

  const filteredShifts = useMemo(() => {
    let filtered = shifts.filter(shift => shift.status === 'scheduled');
    
    if (searchTerm) {
      filtered = filtered.filter(shift => 
        shift.user?.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        shift.title?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (filterRole) {
      filtered = filtered.filter(shift => shift.role === filterRole);
    }
    
    return filtered;
  }, [shifts, searchTerm, filterRole]);

  const employeeStats = useMemo(() => {
    return users.map(user => {
      const userShifts = shifts.filter(shift => shift.user_id === user.id && shift.status === 'scheduled');
      const todayUserShifts = userShifts.filter(shift => isToday(new Date(shift.start_time)));
      const weekUserShifts = userShifts.filter(shift => isThisWeek(new Date(shift.start_time)));
      
      return {
        user,
        totalShifts: userShifts.length,
        todayShifts: todayUserShifts.length,
        weekShifts: weekUserShifts.length,
        upcomingShifts: userShifts.filter(shift => new Date(shift.start_time) > new Date()).slice(0, 3)
      };
    }).filter(stat => stat.totalShifts > 0);
  }, [users, shifts]);

  return (
    <div className="space-y-6">
      {/* Today's Shifts Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Today's Shifts ({todayShifts.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {todayShifts.length > 0 ? (
            <div className="grid gap-3">
              {todayShifts.map((shift) => (
                <div key={shift.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div>
                    <div className="font-medium">{shift.user?.username}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">{shift.title || 'Shift'}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">
                      {format(new Date(shift.start_time), 'HH:mm')} - {format(new Date(shift.end_time), 'HH:mm')}
                    </div>
                    <Badge variant="secondary" className="mt-1">
                      {shift.shift_type}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No shifts scheduled for today</p>
          )}
        </CardContent>
      </Card>

      {/* Employee Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Employee Shift Statistics</CardTitle>
          <CardDescription>Overview of shifts per employee</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {employeeStats.map((stat) => (
              <Card key={stat.user.id}>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3 mb-3">
                    <User className="h-8 w-8 text-gray-400" />
                    <div>
                      <div className="font-medium">{stat.user.username}</div>
                      <div className="text-sm text-gray-500">{stat.user.role || 'Employee'}</div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 text-center text-sm">
                    <div>
                      <div className="font-bold text-blue-600">{stat.todayShifts}</div>
                      <div className="text-gray-500">Today</div>
                    </div>
                    <div>
                      <div className="font-bold text-green-600">{stat.weekShifts}</div>
                      <div className="text-gray-500">This Week</div>
                    </div>
                    <div>
                      <div className="font-bold text-purple-600">{stat.totalShifts}</div>
                      <div className="text-gray-500">Total</div>
                    </div>
                  </div>
                  
                  {stat.upcomingShifts.length > 0 && (
                    <div className="mt-3 pt-3 border-t">
                      <div className="text-sm font-medium mb-2">Upcoming Shifts:</div>
                      <div className="space-y-1">
                        {stat.upcomingShifts.map((shift) => (
                          <div key={shift.id} className="text-xs text-gray-600 dark:text-gray-400">
                            {format(new Date(shift.start_time), 'MMM d, HH:mm')} - {shift.shift_type}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Filtered Shifts List */}
      <Card>
        <CardHeader>
          <CardTitle>All Scheduled Shifts</CardTitle>
          <CardDescription>
            {filteredShifts.length} shift(s) found
            {searchTerm && ` matching "${searchTerm}"`}
            {filterRole && ` for role "${filterRole}"`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredShifts.length > 0 ? (
            <div className="space-y-3">
              {filteredShifts.map((shift) => (
                <div key={shift.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <div className="flex items-center space-x-3">
                    <User className="h-8 w-8 text-gray-400" />
                    <div>
                      <div className="font-medium">{shift.user?.username}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">{shift.title || 'Shift'}</div>
                      {shift.role && (
                        <Badge variant="outline" className="mt-1">
                          {shift.role}
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="text-sm font-medium">
                        {format(new Date(shift.start_time), 'MMM d, yyyy')}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {format(new Date(shift.start_time), 'HH:mm')} - {format(new Date(shift.end_time), 'HH:mm')}
                      </div>
                    </div>
                    
                    <Badge variant={
                      shift.shift_type === 'morning' ? 'default' :
                      shift.shift_type === 'evening' ? 'secondary' : 'outline'
                    }>
                      {shift.shift_type}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No shifts found matching your criteria</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
