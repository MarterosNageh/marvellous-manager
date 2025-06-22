import React, { useState, useEffect } from 'react';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, addWeeks, subWeeks, isToday } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar, Plus, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shift, ScheduleUser } from '@/types/schedule';
import { shiftsTable, usersTable } from '@/integrations/supabase/tables/schedule';
import { cn } from '@/lib/utils';

interface MobileScheduleViewProps {
  selectedDate: Date;
  onEditShift: (shift: Shift) => void;
  onDeleteShift: (shiftId: string) => void;
  onDateChange: (date: Date) => void;
  onAddShift: () => void;
  refreshData: () => Promise<void>;
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

const MobileScheduleView: React.FC<MobileScheduleViewProps> = ({
  selectedDate,
  onEditShift,
  onDeleteShift,
  onDateChange,
  onAddShift,
  refreshData
}) => {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [users, setUsers] = useState<ScheduleUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const transformUserRole = (role: string | null): 'admin' | 'operator' | 'senior' => {
    if (role && ['admin', 'senior', 'operator'].includes(role)) {
      return role as 'admin' | 'operator' | 'senior';
    }
    return 'operator'; // default fallback
  };

  useEffect(() => {
<<<<<<< HEAD
    const loadData = async () => {
      try {
        setIsLoading(true);
        
        const [usersData, shiftsData] = await Promise.all([
          usersTable.getAll(),
          shiftsTable.getAll()
        ]);
=======
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

      setLocalUsers([...operationalUsers, ...producerUsers]);
    } else {
      // fallback: fetch from DB (legacy)
      const loadUsers = async () => {
        try {
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
            }));

          const producerUsers = usersData
            .filter(user => user.role === 'producer')
            .map(user => ({
              id: user.id,
              username: user.username,
              role: 'producer' as const,
              title: user.title || '',
              balance: 0
            }));

          setLocalUsers([...operationalUsers, ...producerUsers]);
        } catch (error) {
          console.error('Error loading users:', error);
        }
      };
      loadUsers();
    }
  }, [users]);
>>>>>>> fe29dbd (add producers role)

        const transformedUsers = usersData.map(user => ({
          id: user.id,
          username: user.username,
          role: transformUserRole(user.role),
          title: user.title || '',
          balance: user.balance || 0
        }));
        setUsers(transformedUsers);
        
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

  return (
    <div className="space-y-4">
      {/* Week navigation */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">
            {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}
          </h2>
          <p className="text-sm text-gray-500">
            {shifts.length} shifts this week
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handlePreviousWeek}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleNextWeek}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Days grid */}
      <div className="space-y-3">
        {weekDays.map((day) => {
          const dayShifts = getShiftsForDate(day);
          const isCurrentDay = isToday(day);
          const isSelected = isSameDay(day, selectedDate);

          return (
            <Card
              key={day.toISOString()}
              className={cn(
                "cursor-pointer transition-colors",
                isCurrentDay && "bg-blue-50 border-blue-200",
                isSelected && "ring-2 ring-blue-500"
              )}
              onClick={() => onDateChange(day)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium">
                      {format(day, 'EEEE')}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {format(day, 'MMM d')}
                    </p>
                  </div>
                  <Badge variant="secondary">
                    {dayShifts.length} shifts
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="space-y-2">
                  {dayShifts.slice(0, 3).map((shift) => {
                    const user = users.find(u => u.id === shift.user_id);
                    const shiftColor = getShiftColor(shift.shift_type, shift.color);
                    const startTime = format(new Date(shift.start_time), 'h:mm a');
                    const endTime = format(new Date(shift.end_time), 'h:mm a');

                    return (
                      <div
                        key={shift.id}
                        className="p-2 rounded-lg cursor-pointer hover:opacity-80"
                        style={{
                          backgroundColor: shiftColor + '33',
                          borderLeft: `3px solid ${shiftColor}`
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditShift(shift);
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-sm">
                              {user?.username || 'Unknown'}
                            </p>
                            <p className="text-xs text-gray-600">
                              {startTime} - {endTime}
                            </p>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {shift.shift_type}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                  
                  {dayShifts.length > 3 && (
                    <div className="text-xs text-gray-500 text-center">
                      +{dayShifts.length - 3} more shifts
                    </div>
                  )}
                  
                  {dayShifts.length === 0 && (
                    <div className="text-sm text-gray-400 text-center py-2">
                      No shifts scheduled
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Add shift button */}
      <Button onClick={onAddShift} className="w-full">
        <Plus className="h-4 w-4 mr-2" />
        Add Shift
      </Button>
    </div>
  );
};

export default MobileScheduleView;
