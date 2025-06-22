import React, { useState, useEffect } from 'react';
import { format, addHours, startOfDay, endOfDay } from 'date-fns';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Plus, Clock, User, Calendar } from 'lucide-react';
import { DailyViewProps, Shift, ScheduleUser } from '@/types/schedule';
import { shiftsTable, usersTable } from '@/integrations/supabase/tables/schedule';
import { cn } from '@/lib/utils';

const getInitials = (name: string) => {
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase();
};

const getShiftColor = (shiftType: string, color?: string) => {
  if (color) return color;
  
  const defaultColors = {
    'morning': '#10B981',
    'night': '#8B5CF6',
    'over night': '#F59E0B',
    'day-off': '#6B7280'
  };
  return defaultColors[shiftType as keyof typeof defaultColors] || '#3B82F6';
};

const DailyView = ({ 
  selectedDate, 
  onEditShift, 
  onDeleteShift, 
  onDateChange,
  shifts: propShifts, 
  users: propUsers 
}: DailyViewProps) => {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [users, setUsers] = useState<ScheduleUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        
        const [usersData, shiftsData] = await Promise.all([
          usersTable.getAll(),
          shiftsTable.getAll()
        ]);

        // Separate operational users from producers
        const operationalUsers = usersData
          .filter(user => user.role !== 'producer')
          .map(user => ({
            id: user.id,
            username: user.username,
            role: (user.role === 'admin' || user.role === 'senior' || user.role === 'operator') ? user.role : 'operator',
            title: user.title || '',
            balance: 0
          })) as ScheduleUser[];

        const producerUsers = usersData
          .filter(user => user.role === 'producer')
          .map(user => ({
            id: user.id,
            username: user.username,
            role: 'producer' as const,
            title: user.title || '',
            balance: 0
          })) as ScheduleUser[];

        setUsers([...operationalUsers, ...producerUsers]);
        
        // Filter shifts for selected date
        const dayStart = startOfDay(selectedDate);
        const dayEnd = endOfDay(selectedDate);
        const dayShifts = shiftsData.filter(shift => {
          const shiftStart = new Date(shift.start_time);
          return shiftStart >= dayStart && shiftStart <= dayEnd;
        });
        
        setShifts(dayShifts);
      } catch (error) {
        console.error('Error loading daily data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [selectedDate]);

  // Generate time slots (24 hours)
  const timeSlots = Array.from({ length: 24 }, (_, i) => {
    const hour = addHours(startOfDay(selectedDate), i);
    return {
      time: hour,
      label: format(hour, 'h:mm a'),
      hour24: format(hour, 'HH:mm')
    };
  });

  // Group shifts by user and time
  const shiftsByUser = users.reduce((acc, user) => {
    acc[user.id] = shifts.filter(shift => shift.user_id === user.id);
    return acc;
  }, {} as Record<string, Shift[]>);

  // Group users by role
  const groupedUsers = users.reduce((acc, user) => {
    let roleGroup: string;
    if (user.role === 'producer') {
      roleGroup = 'Producers';
    } else if (user.role === 'operator') {
      roleGroup = 'Operators';
    } else {
      roleGroup = 'Technical Leaders';
    }
    
    if (!acc[roleGroup]) {
      acc[roleGroup] = [];
    }
    acc[roleGroup].push(user);
    return acc;
  }, {} as Record<string, ScheduleUser[]>);

  // Sort users within each group by username
  Object.keys(groupedUsers).forEach(role => {
    groupedUsers[role].sort((a, b) => a.username.localeCompare(b.username));
  });

  const roleDisplayOrder = ['Operators', 'Producers', 'Technical Leaders'];

  const getShiftForTimeSlot = (userId: string, timeSlot: Date) => {
    const userShifts = shiftsByUser[userId] || [];
    return userShifts.find(shift => {
      const shiftStart = new Date(shift.start_time);
      const shiftEnd = new Date(shift.end_time);
      return timeSlot >= shiftStart && timeSlot < shiftEnd;
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Date header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{format(selectedDate, 'EEEE, MMMM d, yyyy')}</h2>
          <p className="text-gray-500">{shifts.length} shifts scheduled</p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            Daily View
          </Badge>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <User className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Staff on duty</p>
              <p className="text-xl font-semibold">{new Set(shifts.map(s => s.user_id)).size}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Clock className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total shifts</p>
              <p className="text-xl font-semibold">{shifts.length}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Calendar className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Coverage hours</p>
              <p className="text-xl font-semibold">
                {shifts.reduce((total, shift) => {
                  const start = new Date(shift.start_time);
                  const end = new Date(shift.end_time);
                  return total + (end.getTime() - start.getTime()) / (1000 * 60 * 60);
                }, 0).toFixed(1)}h
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Timeline view */}
      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Daily Timeline</h3>
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Add Shift
            </Button>
          </div>
          
          {users.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No staff members found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <div className="min-w-[800px]">
                {/* Header with time slots */}
                <div className="grid grid-cols-[200px_repeat(24,1fr)] gap-px bg-gray-200 rounded-t-lg overflow-hidden">
                  <div className="bg-gray-50 p-2 font-medium text-sm">Staff</div>
                  {timeSlots.map((slot, index) => (
                    <div key={index} className="bg-gray-50 p-1 text-xs text-center">
                      {index % 4 === 0 ? slot.label : slot.hour24}
                    </div>
                  ))}
                </div>
                
                {/* User rows */}
                {roleDisplayOrder.map((role) => {
                  const roleUsers = groupedUsers[role] || [];
                  
                  return roleUsers.map((user) => {
                    const userShifts = shiftsByUser[user.id] || [];
                    
                    return (
                      <div key={user.id} className="grid grid-cols-[200px_repeat(24,1fr)] gap-px bg-gray-200">
                        {/* User info */}
                        <div className="bg-white p-3 flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs bg-blue-100 text-blue-700">
                              {getInitials(user.username)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate">{user.username}</div>
                            <div className="text-xs text-gray-500 truncate">
                              {user.title || user.role}
                            </div>
                          </div>
                        </div>
                        
                        {/* Time slots */}
                        {timeSlots.map((slot, slotIndex) => {
                          const shift = getShiftForTimeSlot(user.id, slot.time);
                          
                          return (
                            <div key={slotIndex} className="bg-white p-1 relative">
                              {shift ? (
                                <div
                                  className="text-xs p-1 rounded text-white text-center truncate"
                                  style={{
                                    backgroundColor: getShiftColor(shift.shift_type, shift.color),
                                    minHeight: '20px'
                                  }}
                                >
                                  {shift.shift_type}
                                </div>
                              ) : (
                                <div className="h-5"></div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    );
                  });
                })}
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Shifts list */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">All Shifts</h3>
          
          {shifts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No shifts scheduled for this day</p>
            </div>
          ) : (
            <div className="space-y-3">
              {shifts
                .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
                .map((shift) => {
                  const user = users.find(u => u.id === shift.user_id);
                  const startTime = format(new Date(shift.start_time), 'h:mm a');
                  const endTime = format(new Date(shift.end_time), 'h:mm a');
                  const shiftColor = getShiftColor(shift.shift_type, shift.color);
                  
                  return (
                    <div
                      key={shift.id}
                      className="flex items-center gap-4 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => onEditShift(shift)}
                    >
                      <div
                        className="w-1 h-12 rounded-full"
                        style={{ backgroundColor: shiftColor }}
                      />
                      
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="text-sm bg-blue-100 text-blue-700">
                          {getInitials(user?.username || 'U')}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{user?.username || 'Unknown User'}</span>
                          <Badge variant="secondary" className="capitalize">
                            {shift.shift_type}
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-500">
                          {startTime} - {endTime}
                        </div>
                        {shift.notes && (
                          <div className="text-sm text-gray-600 mt-1">{shift.notes}</div>
                        )}
                      </div>
                      
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          {((new Date(shift.end_time).getTime() - new Date(shift.start_time).getTime()) / (1000 * 60 * 60)).toFixed(1)}h
                        </div>
                        <div className="text-xs text-gray-500">Duration</div>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default DailyView;
