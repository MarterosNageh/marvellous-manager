import { useState, useEffect } from 'react';
import { format, addDays, isSameDay, startOfWeek } from 'date-fns';
import { Plus, Settings, Calendar, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Shift, ScheduleUser, WeeklyViewProps } from '@/types/schedule';
import { shiftsTable, usersTable } from '@/integrations/supabase/tables/schedule';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

const getInitials = (name: string) => {
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase();
};

const ShiftBlock = ({ shift, user, onDelete }: { shift: Shift; user?: ScheduleUser; onDelete: (id: string) => void }) => {
  const isEveningShift = shift.shift_type === 'night' || shift.shift_type === 'overnight';
  const startTime = format(new Date(shift.start_time), 'h:mm a');
  const endTime = format(new Date(shift.end_time), 'h:mm a');

  return (
    <div
      className={cn(
        'rounded-md p-2 text-xs h-full cursor-pointer hover:opacity-80 transition-opacity relative group',
        isEveningShift ? 'bg-green-100 border border-green-200' : 'bg-blue-100 border border-blue-200'
      )}
    >
      <div className="font-semibold">{`${startTime} - ${endTime}`}</div>
      <div className="text-gray-600">{shift.notes || 'Open'}</div>
      {shift.shift_type && (
        <div className="text-xs mt-1 capitalize">{shift.shift_type}</div>
      )}
      <Button
        size="sm"
        variant="ghost"
        className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 h-6 w-6 p-1 text-red-500 hover:text-red-700"
        onClick={(e) => {
          e.stopPropagation();
          onDelete(shift.id);
        }}
      >
        <Trash2 className="h-3 w-3" />
      </Button>
    </div>
  );
};

const WeeklyView = ({ 
  startDate, 
  selectedDate,
  users: propUsers, 
  shifts: propShifts, 
  onAddShift, 
  onDateChange,
  onEditShift,
  onDeleteShift 
}: WeeklyViewProps) => {
  const [shifts, setShifts] = useState<Shift[]>(propShifts || []);
  const [users, setUsers] = useState<ScheduleUser[]>(propUsers || []);
  const [isLoading, setIsLoading] = useState(true);

  // Calculate week start from Sunday (weekStartsOn: 0)
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 0 });

  // Load data from database
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        
        // Load users and shifts
        const [usersData, shiftsData] = await Promise.all([
          usersTable.getAll(),
          shiftsTable.getAll()
        ]);

        console.log('Loaded users:', usersData);
        console.log('Loaded shifts:', shiftsData);

        setUsers(usersData.map(user => ({
          id: user.id,
          username: user.username,
          role: (user.role === 'admin' || user.role === 'senior' || user.role === 'operator') ? user.role : 'operator',
          title: user.title,
          created_at: user.created_at,
          updated_at: user.created_at
        })));
        
        setShifts(shiftsData);
      } catch (error) {
        console.error('Error loading schedule data:', error);
        toast({
          title: "Error",
          description: "Failed to load schedule data. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [startDate]);

  // Set up realtime subscription for shifts
  useEffect(() => {
    const channel = supabase
      .channel('shifts-changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'shifts' 
      }, (payload) => {
        console.log('Realtime shift change:', payload);
        
        if (payload.eventType === 'INSERT') {
          const newShift = {
            ...payload.new,
            created_by: payload.new.user_id,
            title: payload.new.shift_type,
            status: 'active'
          } as Shift;
          setShifts(prev => [...prev, newShift]);
        } else if (payload.eventType === 'UPDATE') {
          const updatedShift = {
            ...payload.new,
            created_by: payload.new.user_id,
            title: payload.new.shift_type,
            status: 'active'
          } as Shift;
          setShifts(prev => prev.map(shift => 
            shift.id === updatedShift.id ? updatedShift : shift
          ));
        } else if (payload.eventType === 'DELETE') {
          setShifts(prev => prev.filter(shift => shift.id !== payload.old.id));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleDeleteShift = async (shiftId: string) => {
    try {
      await shiftsTable.delete(shiftId);
      toast({
        title: "Success",
        description: "Shift deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting shift:', error);
      toast({
        title: "Error",
        description: "Failed to delete shift. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  // Group users by role with updated names
  const groupedUsers = users.reduce((acc, user) => {
    const roleGroup = user.role === 'operator' ? 'Operators' : 'Leaders';
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

  // Define display order of roles
  const roleDisplayOrder = ['Operators', 'Leaders'];

  // Generate array of dates for the week starting from Sunday
  const weekDates = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  // Calculate total hours for each user for the current week
  const userHours = users.reduce((acc, user) => {
    const userShifts = shifts.filter(shift => {
      const shiftDate = new Date(shift.start_time);
      return shift.user_id === user.id && 
             weekDates.some(date => isSameDay(shiftDate, date));
    });
    
    const totalHours = userShifts.reduce((total, shift) => {
      const start = new Date(shift.start_time);
      const end = new Date(shift.end_time);
      const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
      return total + hours;
    }, 0);
    acc[user.id] = Math.round(totalHours * 10) / 10; // Round to 1 decimal place
    return acc;
  }, {} as Record<string, number>);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="border rounded-lg bg-white">
      {/* Header row with dates */}
      <div className="grid grid-cols-[200px_repeat(7,1fr)] border-b bg-gray-50">
        <div className="p-4 font-medium flex items-center justify-between">
          <div className="text-sm font-semibold">Staff</div>
          <Button variant="ghost" size="sm" onClick={onAddShift}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        {weekDates.map((date, i) => (
          <div
            key={i}
            className={cn(
              'p-4 text-sm border-l text-center',
              isSameDay(date, new Date()) && 'bg-blue-50'
            )}
          >
            <div className="font-medium">
              <div className="text-lg">{format(date, 'd')}</div>
              <div className="text-sm text-gray-500">{format(date, 'EEE')}</div>
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {format(date, 'MM/dd')}
            </div>
          </div>
        ))}
      </div>

      {/* Users list */}
      <div>
        {roleDisplayOrder.map((roleGroup, roleIndex) => {
          const usersInGroup = groupedUsers[roleGroup] || [];
          if (usersInGroup.length === 0) return null;

          const totalGroupHours = usersInGroup.reduce(
            (total, user) => total + (userHours[user.id] || 0),
            0
          );

          return (
            <div key={roleGroup}>
              <div className="px-4 py-2 bg-gray-50 border-y">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-sm">
                    {roleGroup} ({usersInGroup.length})
                  </span>
                  <span className="text-sm text-gray-500">
                    Group Total: {totalGroupHours} hrs
                  </span>
                </div>
              </div>
              {usersInGroup.map((user, userIndex) => (
                <div key={user.id}>
                  <div className="grid grid-cols-[200px_repeat(7,1fr)] hover:bg-gray-50 transition-colors">
                    <div className="p-3 flex items-center gap-3 border-r">
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
                        <div className="text-xs font-medium text-blue-600">
                          {userHours[user.id] || 0} hrs/week
                        </div>
                      </div>
                    </div>
                    {weekDates.map((date, dateIndex) => {
                      const dayShifts = shifts.filter(shift => 
                        isSameDay(new Date(shift.start_time), date) && 
                        shift.user_id === user.id
                      );

                      return (
                        <div
                          key={dateIndex}
                          className={cn(
                            'p-2 min-h-[80px] border-l flex flex-col gap-1',
                            isSameDay(date, new Date()) && 'bg-blue-50'
                          )}
                        >
                          {dayShifts.map((shift, shiftIndex) => (
                            <ShiftBlock
                              key={shiftIndex}
                              shift={shift}
                              user={user}
                              onDelete={handleDeleteShift}
                            />
                          ))}
                          {dayShifts.length === 0 && (
                            <div className="flex-1 flex items-center justify-center">
                              <span className="text-xs text-gray-400">-</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  {userIndex < usersInGroup.length - 1 && <Separator />}
                </div>
              ))}
              {roleIndex < roleDisplayOrder.length - 1 && <div className="h-4 bg-gray-50" />}
            </div>
          );
        })}
      </div>

      {users.length === 0 && (
        <div className="p-8 text-center text-gray-500">
          <div className="text-lg font-medium mb-2">No users found</div>
          <div className="text-sm">Add users to start scheduling shifts</div>
        </div>
      )}
    </div>
  );
};

export default WeeklyView;
