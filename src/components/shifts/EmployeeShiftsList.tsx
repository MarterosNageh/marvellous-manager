
import React, { useState } from 'react';
import { useShifts } from '@/context/ShiftsContext';
import { format, isToday, isThisWeek } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Clock, User, Calendar } from 'lucide-react';

export const EmployeeShiftsList = () => {
  const { shifts, users } = useShifts();
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'all'>('today');

  const getFilteredShifts = () => {
    if (!shifts) return [];
    
    return shifts.filter(shift => {
      if (!shift.start_time) return false;
      
      const shiftDate = new Date(shift.start_time);
      
      switch (selectedPeriod) {
        case 'today':
          return isToday(shiftDate);
        case 'week':
          return isThisWeek(shiftDate);
        default:
          return true;
      }
    });
  };

  const getShiftsByEmployee = () => {
    const filteredShifts = getFilteredShifts();
    const shiftsByEmployee = new Map();
    
    filteredShifts.forEach(shift => {
      const user = users?.find(u => u.id === shift.user_id);
      if (user) {
        if (!shiftsByEmployee.has(user.id)) {
          shiftsByEmployee.set(user.id, {
            user: user,
            shifts: []
          });
        }
        shiftsByEmployee.get(user.id).shifts.push(shift);
      }
    });
    
    return Array.from(shiftsByEmployee.values());
  };

  const getShiftStatusColor = (shift: any) => {
    if (!shift.start_time) return 'bg-gray-100 text-gray-800';
    
    const now = new Date();
    const startTime = new Date(shift.start_time);
    const endTime = shift.end_time ? new Date(shift.end_time) : null;
    
    if (endTime && now > endTime) {
      return 'bg-green-100 text-green-800';
    } else if (now >= startTime && (!endTime || now <= endTime)) {
      return 'bg-blue-100 text-blue-800';
    } else {
      return 'bg-yellow-100 text-yellow-800';
    }
  };

  const employeeShifts = getShiftsByEmployee();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-4">Employee Shifts</h2>
        
        <div className="flex gap-2 mb-4">
          {[
            { key: 'today', label: 'Today' },
            { key: 'week', label: 'This Week' },
            { key: 'all', label: 'All Upcoming' }
          ].map(period => (
            <button
              key={period.key}
              onClick={() => setSelectedPeriod(period.key as any)}
              className={`px-3 py-1 rounded text-sm ${
                selectedPeriod === period.key
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {period.label}
            </button>
          ))}
        </div>

        {employeeShifts.length === 0 ? (
          <Card>
            <CardContent className="p-6">
              <p className="text-gray-500 text-center">No shifts found for the selected period</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {employeeShifts.map(({ user, shifts }) => (
              <Card key={user.id}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center space-x-3">
                    <Avatar>
                      <AvatarFallback>
                        {user.username?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{user.username}</div>
                      <div className="text-sm text-gray-500">{shifts.length} shift(s)</div>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {shifts.map((shift) => (
                      <div key={shift.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <div className="font-medium">{shift.title}</div>
                          {shift.notes && (
                            <div className="text-sm text-gray-600 mt-1">{shift.notes}</div>
                          )}
                          <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                            <div className="flex items-center space-x-1">
                              <Calendar className="h-4 w-4" />
                              <span>{shift.start_time && format(new Date(shift.start_time), 'MMM d, yyyy')}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Clock className="h-4 w-4" />
                              <span>
                                {shift.start_time && format(new Date(shift.start_time), 'HH:mm')} - 
                                {shift.end_time && format(new Date(shift.end_time), 'HH:mm')}
                              </span>
                            </div>
                          </div>
                        </div>
                        <Badge className={getShiftStatusColor(shift)}>
                          {shift.start_time && isToday(new Date(shift.start_time)) ? 'Today' : 'Upcoming'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Shift Summary</h2>
        
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">
                  {shifts?.filter(s => s.start_time && isThisWeek(new Date(s.start_time))).length || 0}
                </p>
                <p className="text-sm text-gray-600">This Week</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">
                  {shifts?.filter(s => s.start_time && isToday(new Date(s.start_time))).length || 0}
                </p>
                <p className="text-sm text-gray-600">Today</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-600">
                  {users?.length || 0}
                </p>
                <p className="text-sm text-gray-600">Total Employees</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
