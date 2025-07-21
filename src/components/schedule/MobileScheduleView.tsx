import React from 'react';
import { format, addDays, isSameDay } from 'date-fns';
import { Plus, ChevronLeft, ChevronRight, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Shift, ScheduleUser } from '@/types/schedule';
import RequestsView from '@/components/schedule/RequestsView';

interface MobileScheduleViewProps {
  users: ScheduleUser[];
  shifts: Shift[];
  isLoading: boolean;
  selectedDate: Date;
  onEditShift?: (shift: Shift) => void;
  onDeleteShift?: (shiftId: string) => void;
  onDateChange?: (date: Date) => void;
  onAddShift?: () => void;
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
  users = [],
  shifts = [],
  isLoading = false,
  selectedDate,
  onEditShift = () => {},
  onDeleteShift = () => {},
  onDateChange = () => {},
  onAddShift = () => {},
}) => {
  const [tab, setTab] = React.useState('schedule');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // Filter shifts for selectedDate only
  const dayShifts = shifts.filter(shift => isSameDay(new Date(shift.start_time), selectedDate));

  // Group users by role
  const groupedUsers = users.reduce((acc, user) => {
    let roleGroup: string;
    if (user.role === 'operator') {
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

  const roleDisplayOrder = ['Operators', 'Technical Leaders'];

  return (
    <Tabs value={tab} onValueChange={setTab} className="space-y-6">
      <TabsList className="w-full flex justify-between mb-2">
        <TabsTrigger value="schedule" className="flex-1">Schedule</TabsTrigger>
        <TabsTrigger value="requests" className="flex-1"><Users className="h-4 w-4 mr-1 inline" />Requests</TabsTrigger>
      </TabsList>
      <TabsContent value="schedule">
        <div className="flex items-center justify-between mb-4">
          <Button variant="outline" size="icon" onClick={() => onDateChange && onDateChange(addDays(selectedDate, -1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="font-semibold text-base">
            {format(selectedDate, 'EEEE, MMMM d, yyyy')}
          </div>
          <Button variant="outline" size="icon" onClick={() => onDateChange && onDateChange(addDays(selectedDate, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-gray-500">{dayShifts.length} shifts scheduled</p>
        </div>
        {roleDisplayOrder.map(role => (
          <div key={role} className="space-y-2">
            <h3 className="text-lg font-semibold mt-4 mb-2">{role}</h3>
            {groupedUsers[role] && groupedUsers[role].length > 0 ? (
              groupedUsers[role].map(user => {
                const userShifts = dayShifts.filter(shift => shift.user_id === user.id);
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
                      <div className="text-sm text-gray-400">No shift for this day</div>
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
      </TabsContent>
      <TabsContent value="requests">
        <RequestsView users={users} />
      </TabsContent>
    </Tabs>
  );
};

export default MobileScheduleView;
