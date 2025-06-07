
import React, { useState } from 'react';
import { useShifts } from '@/context/ShiftsContext';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  format, 
  isToday, 
  isThisWeek 
} from 'date-fns';
import { Clock, Calendar, User, MapPin } from 'lucide-react';

export const EmployeeShiftsList = () => {
  const { shifts, users } = useShifts();
  const { currentUser } = useAuth();
  const [filter, setFilter] = useState<'all' | 'today' | 'week'>('all');

  // Get shifts for current user
  const userShifts = shifts?.filter(shift => shift.user_id === currentUser?.id) || [];

  // Filter shifts based on selected filter
  const filteredShifts = userShifts.filter(shift => {
    if (!shift.start_time) return false;
    
    try {
      const shiftDate = new Date(shift.start_time);
      
      switch (filter) {
        case 'today':
          return isToday(shiftDate);
        case 'week':
          return isThisWeek(shiftDate);
        default:
          return true;
      }
    } catch {
      return false;
    }
  });

  // Sort shifts by start time
  const sortedShifts = filteredShifts.sort((a, b) => {
    if (!a.start_time || !b.start_time) return 0;
    return new Date(a.start_time).getTime() - new Date(b.start_time).getTime();
  });

  // Get upcoming shifts
  const upcomingShifts = sortedShifts.filter(shift => {
    if (!shift.start_time) return false;
    try {
      return new Date(shift.start_time) > new Date();
    } catch {
      return false;
    }
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'in_progress':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Filter buttons */}
      <div className="flex gap-2">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          onClick={() => setFilter('all')}
          size="sm"
        >
          All Shifts
        </Button>
        <Button
          variant={filter === 'today' ? 'default' : 'outline'}
          onClick={() => setFilter('today')}
          size="sm"
        >
          Today
        </Button>
        <Button
          variant={filter === 'week' ? 'default' : 'outline'}
          onClick={() => setFilter('week')}
          size="sm"
        >
          This Week
        </Button>
      </div>

      {/* Next shift card */}
      {upcomingShifts.length > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-600" />
              Next Shift
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              const nextShift = upcomingShifts[0];
              return (
                <div className="space-y-2">
                  <div className="font-medium text-lg">{nextShift.title}</div>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {nextShift.start_time && format(new Date(nextShift.start_time), 'MMM d, yyyy')}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {nextShift.start_time && nextShift.end_time && 
                        `${format(new Date(nextShift.start_time), 'HH:mm')} - ${format(new Date(nextShift.end_time), 'HH:mm')}`}
                    </div>
                  </div>
                  {nextShift.description && (
                    <div className="text-sm text-gray-600 mt-2">
                      {nextShift.description}
                    </div>
                  )}
                  <div className="flex gap-2 mt-3">
                    <Badge className={getStatusColor(nextShift.status)}>
                      {nextShift.status.replace('_', ' ')}
                    </Badge>
                    {nextShift.shift_type && (
                      <Badge variant="outline">{nextShift.shift_type}</Badge>
                    )}
                  </div>
                  {(isThisWeek(new Date(nextShift.start_time!)) && isToday(new Date(nextShift.start_time!))) && (
                    <div className="flex gap-2 mt-3">
                      <Badge className="bg-orange-100 text-orange-800">Today</Badge>
                    </div>
                  )}
                </div>
              );
            })()}
          </CardContent>
        </Card>
      )}

      {/* All shifts list */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            My Shifts ({sortedShifts.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {sortedShifts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No shifts found for the selected filter.
            </div>
          ) : (
            <div className="space-y-4">
              {sortedShifts.map((shift) => (
                <Card key={shift.id} className="border-l-4 border-l-blue-500">
                  <CardContent className="pt-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2 flex-1">
                        <div className="font-medium">{shift.title}</div>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {shift.start_time && format(new Date(shift.start_time), 'MMM d, yyyy')}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {shift.start_time && shift.end_time && 
                              `${format(new Date(shift.start_time), 'HH:mm')} - ${format(new Date(shift.end_time), 'HH:mm')}`}
                          </div>
                        </div>

                        {shift.description && (
                          <div className="text-sm text-gray-600">
                            {shift.description}
                          </div>
                        )}

                        <div className="flex gap-2">
                          <Badge className={getStatusColor(shift.status)}>
                            {shift.status.replace('_', ' ')}
                          </Badge>
                          {shift.shift_type && (
                            <Badge variant="outline">{shift.shift_type}</Badge>
                          )}
                          {shift.start_time && isToday(new Date(shift.start_time)) && (
                            <Badge className="bg-orange-100 text-orange-800">Today</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
