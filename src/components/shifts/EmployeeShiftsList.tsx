
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Clock, Calendar, User, Filter } from 'lucide-react';
import { useShifts } from '@/context/ShiftsContext';
import { useAuth } from '@/context/AuthContext';
import * as dateFns from 'date-fns';

type FilterType = 'all' | 'today' | 'week' | 'upcoming';

interface EmployeeShiftsListProps {
  searchTerm?: string;
  filterRole?: string;
}

export const EmployeeShiftsList: React.FC<EmployeeShiftsListProps> = ({ 
  searchTerm = '', 
  filterRole = 'all' 
}) => {
  const { shifts, users } = useShifts();
  const { currentUser } = useAuth();
  const [filter, setFilter] = useState<FilterType>('all');

  // Filter shifts based on selected filter
  const getFilteredShifts = () => {
    const now = new Date();
    
    switch (filter) {
      case 'today':
        return shifts.filter(shift => {
          const shiftDate = new Date(shift.start_time);
          return dateFns.isToday(shiftDate) && shift.status === 'scheduled';
        });
      case 'week':
        return shifts.filter(shift => {
          const shiftDate = new Date(shift.start_time);
          return dateFns.isThisWeek(shiftDate) && shift.status === 'scheduled';
        });
      case 'upcoming':
        return shifts.filter(shift => {
          const shiftStart = new Date(shift.start_time);
          return shiftStart > now && shift.status === 'scheduled';
        });
      default:
        return shifts.filter(shift => shift.status === 'scheduled');
    }
  };

  const filteredShifts = getFilteredShifts().filter(shift => {
    const user = users.find(u => u.id === shift.user_id);
    const matchesSearch = !searchTerm || user?.username.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || user?.role === filterRole;
    return matchesSearch && matchesRole;
  });

  // Sort shifts by start time
  const sortedShifts = filteredShifts.sort((a, b) => 
    new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
  );

  const filterButtons = [
    { key: 'all' as FilterType, label: 'All Shifts', count: shifts.filter(s => s.status === 'scheduled').length },
    { key: 'today' as FilterType, label: 'Today', count: shifts.filter(s => dateFns.isToday(new Date(s.start_time)) && s.status === 'scheduled').length },
    { key: 'week' as FilterType, label: 'This Week', count: shifts.filter(s => dateFns.isThisWeek(new Date(s.start_time)) && s.status === 'scheduled').length },
    { key: 'upcoming' as FilterType, label: 'Upcoming', count: shifts.filter(s => new Date(s.start_time) > new Date() && s.status === 'scheduled').length },
  ];

  return (
    <div className="space-y-6">
      {/* Header with Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Employee Shifts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {filterButtons.map((button) => (
              <Button
                key={button.key}
                variant={filter === button.key ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter(button.key)}
                className="flex items-center gap-2"
              >
                <Filter className="h-4 w-4" />
                {button.label}
                <Badge variant="secondary" className="ml-1">
                  {button.count}
                </Badge>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Shifts List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {filter === 'all' ? 'All Scheduled Shifts' : 
             filter === 'today' ? 'Today\'s Shifts' :
             filter === 'week' ? 'This Week\'s Shifts' : 'Upcoming Shifts'}
            <Badge variant="secondary">{sortedShifts.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {sortedShifts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Clock className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No shifts found for the selected filter</p>
            </div>
          ) : (
            <div className="space-y-4">
              {sortedShifts.map((shift) => {
                const user = users.find(u => u.id === shift.user_id);
                const isCurrentlyActive = (() => {
                  const now = new Date();
                  const startTime = new Date(shift.start_time);
                  const endTime = new Date(shift.end_time);
                  return startTime <= now && endTime >= now;
                })();
                
                return (
                  <div 
                    key={shift.id} 
                    className={`p-4 rounded-lg border ${
                      isCurrentlyActive 
                        ? 'bg-green-50 border-green-200' 
                        : 'bg-white border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <Avatar className="h-12 w-12">
                          <AvatarFallback className={`text-sm font-medium ${
                            isCurrentlyActive ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-600'
                          }`}>
                            {user?.username?.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 className="font-semibold text-gray-900">{user?.username}</h4>
                          <p className="text-sm text-gray-600">{shift.title}</p>
                          <div className="flex items-center space-x-4 mt-1">
                            <div className="flex items-center space-x-1 text-xs text-gray-500">
                              <Clock className="h-3 w-3" />
                              <span>
                                {dateFns.format(new Date(shift.start_time), 'MMM d, HH:mm')} - {dateFns.format(new Date(shift.end_time), 'HH:mm')}
                              </span>
                            </div>
                            <Badge variant="outline">
                              {shift.shift_type}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        {isCurrentlyActive && (
                          <Badge className="bg-green-100 text-green-800 mb-2">
                            Currently Active
                          </Badge>
                        )}
                        <div className="text-xs text-gray-500">
                          {dateFns.isToday(new Date(shift.start_time)) ? 'Today' : 
                           dateFns.format(new Date(shift.start_time), 'MMM d, yyyy')}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
