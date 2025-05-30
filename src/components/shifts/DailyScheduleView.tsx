
import React, { useMemo } from 'react';
import { useShifts } from '@/context/ShiftsContext';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { User, Clock, MapPin, MoreHorizontal, Calendar } from 'lucide-react';
import { format, isSameDay } from 'date-fns';
import { cn } from '@/lib/utils';
import { ShiftWithUser } from '@/types/shiftTypes';

interface DailyScheduleViewProps {
  selectedDate: Date;
  searchTerm: string;
  filterRole: string;
}

const getShiftTypeColor = (type: string) => {
  switch (type) {
    case 'morning':
      return 'bg-blue-50 border-blue-200 text-blue-800';
    case 'evening':
      return 'bg-orange-50 border-orange-200 text-orange-800';
    case 'night':
      return 'bg-purple-50 border-purple-200 text-purple-800';
    default:
      return 'bg-gray-50 border-gray-200 text-gray-800';
  }
};

export const DailyScheduleView: React.FC<DailyScheduleViewProps> = ({
  selectedDate,
  searchTerm,
  filterRole
}) => {
  const { shifts, loading } = useShifts();
  const { users } = useAuth();

  const dayShifts = useMemo(() => {
    return shifts.filter(shift => 
      isSameDay(new Date(shift.start_time), selectedDate) &&
      shift.status === 'scheduled'
    ).sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
  }, [shifts, selectedDate]);

  const filteredShifts = useMemo(() => {
    return dayShifts.filter(shift => {
      const user = shift.user;
      if (!user) return false;
      
      const matchesSearch = user.username.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = filterRole === 'all' || 
        (filterRole === 'manager' && user.isAdmin) ||
        (filterRole === 'employee' && !user.isAdmin);
      
      return matchesSearch && matchesRole;
    });
  }, [dayShifts, searchTerm, filterRole]);

  const timeSlots = useMemo(() => {
    const slots: { [key: string]: ShiftWithUser[] } = {
      'morning': [],
      'afternoon': [],
      'evening': [],
      'night': []
    };

    filteredShifts.forEach(shift => {
      const hour = new Date(shift.start_time).getHours();
      if (hour >= 6 && hour < 12) {
        slots.morning.push(shift);
      } else if (hour >= 12 && hour < 17) {
        slots.afternoon.push(shift);
      } else if (hour >= 17 && hour < 22) {
        slots.evening.push(shift);
      } else {
        slots.night.push(shift);
      }
    });

    return slots;
  }, [filteredShifts]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading daily schedule...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {format(selectedDate, 'EEEE, MMMM d, yyyy')}
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {filteredShifts.length} shifts scheduled
          </p>
        </div>
      </div>

      {/* Time Slots */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
        {Object.entries(timeSlots).map(([timeSlot, shifts]) => (
          <Card key={timeSlot} className="h-fit">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg capitalize flex items-center gap-2">
                <Clock className="h-5 w-5" />
                {timeSlot}
                <Badge variant="secondary" className="ml-auto">
                  {shifts.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {shifts.length > 0 ? (
                shifts.map((shift) => (
                  <Card
                    key={shift.id}
                    className={cn(
                      "p-4 cursor-pointer hover:shadow-md transition-all",
                      getShiftTypeColor(shift.shift_type)
                    )}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="bg-white p-1 rounded-full">
                          <User className="h-4 w-4 text-gray-600" />
                        </div>
                        <div>
                          <div className="font-medium text-sm">
                            {shift.user?.username}
                          </div>
                          <div className="text-xs text-gray-600">
                            {shift.user?.isAdmin ? 'Admin' : 'Employee'}
                          </div>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" className="h-6 w-6">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="font-medium text-sm">
                        {shift.title}
                      </div>
                      
                      <div className="flex items-center gap-4 text-xs text-gray-600">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {format(new Date(shift.start_time), 'HH:mm')} - 
                          {format(new Date(shift.end_time), 'HH:mm')}
                        </div>
                        {shift.role && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {shift.role}
                          </div>
                        )}
                      </div>
                      
                      {shift.notes && (
                        <div className="text-xs text-gray-500 bg-white/50 p-2 rounded">
                          {shift.notes}
                        </div>
                      )}
                    </div>
                  </Card>
                ))
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No shifts scheduled</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredShifts.length === 0 && (
        <div className="text-center py-12">
          <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No shifts scheduled
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            There are no shifts scheduled for this day matching your criteria.
          </p>
        </div>
      )}
    </div>
  );
};
