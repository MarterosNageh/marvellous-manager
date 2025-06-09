import { useState } from 'react';
import { format, addDays, isSameDay, startOfWeek } from 'date-fns';
import { Plus, Settings, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Shift, ScheduleUser, WeeklyViewProps } from '@/types/schedule';

const getInitials = (name: string) => {
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase();
};

const ShiftBlock = ({ shift }: { shift: Shift }) => {
  const isEveningShift = shift.type === 'night' || shift.type === 'overnight';
  const startTime = format(new Date(shift.startTime), 'h:mm a');
  const endTime = format(new Date(shift.endTime), 'h:mm a');

  return (
    <div
      className={cn(
        'rounded-md p-2 text-xs h-full',
        isEveningShift ? 'bg-green-100' : 'bg-blue-100'
      )}
    >
      <div className="font-semibold">{`${startTime} - ${endTime}`}</div>
      <div className="text-gray-600">{shift.notes || 'Open'}</div>
    </div>
  );
};

const WeeklyView = ({ 
  startDate, 
  selectedDate,
  users, 
  shifts, 
  onAddShift, 
  onDateChange,
  onEditShift,
  onDeleteShift 
}: WeeklyViewProps) => {
  // Group users by role
  const groupedUsers = users.reduce((acc, user) => {
    const roleGroup = user.role === 'operator' ? 'Cashiers' : 'Floor Leaders';
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
  const roleDisplayOrder = ['Cashiers', 'Floor Leaders'];

  // Generate array of dates for the week
  const weekDates = Array.from({ length: 7 }, (_, i) => addDays(startDate, i));

  // Calculate total hours for each user
  const userHours = users.reduce((acc, user) => {
    const userShifts = shifts.filter(shift => shift.user_id === user.id);
    const totalHours = userShifts.reduce((total, shift) => {
      const start = new Date(shift.start_time);
      const end = new Date(shift.end_time);
      const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
      return total + hours;
    }, 0);
    acc[user.id] = Math.round(totalHours);
    return acc;
  }, {} as Record<string, number>);

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'operator':
        return 'Operators';
      case 'admin':
        return 'Managers';
      default:
        return role;
    }
  };

  const handleTodayClick = () => {
    onDateChange(new Date());
  };

  return (
    <div className="border rounded-lg">
      {/* Header row with dates */}
      <div className="grid grid-cols-[200px_repeat(7,1fr)] border-b">
        <div className="p-4 font-medium flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={onAddShift}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        {weekDates.map((date, i) => (
          <div
            key={i}
            className={cn(
              'p-4 text-sm border-l',
              isSameDay(date, new Date()) && 'bg-blue-50'
            )}
          >
            <div className="font-medium">
              <div className="text-lg">{format(date, 'd')}</div>
              <div className="text-sm text-gray-500">{format(date, 'EEEE')}</div>
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
                  <span className="font-medium">
                    {roleGroup} ({usersInGroup.length})
                  </span>
                  <span className="text-sm text-gray-500">
                    Group Total: {totalGroupHours} hrs
                  </span>
                </div>
              </div>
              {usersInGroup.map((user, userIndex) => (
                <div key={user.id}>
                  <div className="grid grid-cols-[200px_repeat(7,1fr)]">
                    <div className="p-4 flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>{getInitials(user.username)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{user.username}</div>
                        <div className="text-sm text-gray-500">
                          {user.title || user.role}
                          <span className="ml-2">{userHours[user.id]} hrs</span>
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
                            'p-2 min-h-[100px] border-l',
                            isSameDay(date, new Date()) && 'bg-blue-50'
                          )}
                        >
                          {dayShifts.map((shift, shiftIndex) => (
                            <div
                              key={shiftIndex}
                              className={cn(
                                'rounded-md p-2 text-xs mb-1',
                                shift.shift_type === 'night' ? 'bg-green-100' : 'bg-blue-100'
                              )}
                              onClick={() => onEditShift(shift)}
                            >
                              <div className="font-semibold">
                                {format(new Date(shift.start_time), 'h:mm a')} - {format(new Date(shift.end_time), 'h:mm a')}
                              </div>
                              <div className="text-gray-600">{shift.notes || 'Open'}</div>
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                  {userIndex < usersInGroup.length - 1 && <Separator />}
                </div>
              ))}
              {roleIndex < roleDisplayOrder.length - 1 && <Separator className="my-4" />}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default WeeklyView; 