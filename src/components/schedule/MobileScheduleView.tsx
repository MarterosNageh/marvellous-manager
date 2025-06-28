import React, { useState, useEffect } from 'react';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, addWeeks, subWeeks, isToday, startOfDay, endOfDay } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar, Plus, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shift, ScheduleUser } from '@/types/schedule';
import { shiftsTable, usersTable } from '@/integrations/supabase/tables/schedule';
import { cn } from '@/lib/utils';

interface MobileScheduleViewProps {
  selectedDate?: Date;
  onEditShift?: (shift: Shift) => void;
  onDeleteShift?: (shiftId: string) => void;
  onDateChange?: (date: Date) => void;
  onAddShift?: () => void;
  refreshData?: () => Promise<void>;
}

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

const transformUserRole = (role: string | null): 'admin' | 'operator' | 'senior' | 'producer' => {
  if (role && ['admin', 'senior', 'operator', 'producer'].includes(role)) {
    return role as 'admin' | 'operator' | 'senior' | 'producer';
  }
  return 'operator'; // default fallback
};

const MobileScheduleView: React.FC<MobileScheduleViewProps> = ({
  selectedDate = new Date(),
  onEditShift = () => {},
  onDeleteShift = () => {},
  onDateChange = () => {},
  onAddShift = () => {},
  refreshData = async () => {}
}) => {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [users, setUsers] = useState<ScheduleUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        
        // Use users from AuthContext if available, else fallback to DB fetch
        if (users && users.length > 0) {
          // Separate operational users from producers
          const operationalUsers = users
            .filter(user => user.role !== 'producer')
            .map(user => ({
              id: user.id,
              username: user.username,
              role: (user.role === 'admin' || user.role === 'senior' || user.role === 'operator') ? user.role : 'operator',
              title: user.title || '',
              balance: 0
            })) as ScheduleUser[];

          const producerUsers = users
            .filter(user => user.role === 'producer')
            .map(user => ({
              id: user.id,
              username: user.username,
              role: 'producer' as const,
              title: user.title || '',
              balance: 0
            })) as ScheduleUser[];

          setUsers([...operationalUsers, ...producerUsers]);
        } else {
          // fallback: fetch from DB (legacy)
          const usersData = await usersTable.getAll();
          
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
        }

        // Always load shifts data
        const shiftsData = await shiftsTable.getAll();
        setShifts(shiftsData);
      } catch (error) {
        console.error('Error loading mobile schedule data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [selectedDate]);

  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const handlePreviousWeek = () => {
    onDateChange(subWeeks(selectedDate, 1));
  };

  const handleNextWeek = () => {
    onDateChange(addWeeks(selectedDate, 1));
  };

  const getShiftsForDate = (date: Date) => {
    return shifts.filter(shift => isSameDay(new Date(shift.start_time), date));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // Filter shifts for today only
  const today = new Date();
  const todayShifts = shifts.filter(shift => isSameDay(new Date(shift.start_time), today));

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

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={() => onDateChange && onDateChange(new Date(today.getTime() + 24 * 60 * 60 * 1000))}>
          View Other Days
        </Button>
      </div>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{format(today, 'EEEE, MMMM d, yyyy')}</h2>
          <p className="text-gray-500">{todayShifts.length} shifts scheduled</p>
        </div>
      </div>
      {roleDisplayOrder.map(role => (
        <div key={role} className="space-y-2">
          <h3 className="text-lg font-semibold mt-4 mb-2">{role}</h3>
          {groupedUsers[role] && groupedUsers[role].length > 0 ? (
            groupedUsers[role].map(user => {
              const userShifts = todayShifts.filter(shift => shift.user_id === user.id);
              return (
                <div key={user.id} className="border rounded-lg p-3 mb-2 bg-white">
                  <div className="font-medium text-base mb-1">{user.username}</div>
                  {userShifts.length > 0 ? (
                    userShifts.map(shift => {
                      const shiftColor = getShiftColor(shift.shift_type, shift.color);
                      const startTime = format(new Date(shift.start_time), 'h:mm a');
                      const endTime = format(new Date(shift.end_time), 'h:mm a');
                      return (
                        <div
                          key={shift.id}
                          className="flex items-center justify-between p-2 rounded-lg mb-1"
                          style={{ backgroundColor: shiftColor + '22', borderLeft: `3px solid ${shiftColor}` }}
                          onClick={() => onEditShift(shift)}
                        >
                          <div>
                            <span className="font-medium text-sm">{shift.shift_type}</span>
                            <span className="ml-2 text-xs text-gray-600">{startTime} - {endTime}</span>
                          </div>
                          <Badge variant="outline" className="text-xs">{shift.shift_type}</Badge>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-sm text-gray-400">No shift for today</div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="text-sm text-gray-400">No users in this group</div>
          )}
        </div>
      ))}
      <Button onClick={onAddShift} className="w-full mt-4">
        <Plus className="h-4 w-4 mr-2" />
        Add Shift
      </Button>
    </div>
  );
};

export default MobileScheduleView;
