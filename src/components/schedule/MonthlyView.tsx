import React, { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, isToday, isSameMonth } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar, Plus, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MonthlyViewProps, Shift, ScheduleUser, LeaveRequest } from '@/types/schedule';
import { shiftsTable, usersTable, leaveRequestsTable } from '@/integrations/supabase/tables/schedule';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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

const MonthlyView = ({ 
  selectedDate, 
  onEditShift, 
  onDeleteShift, 
  onDateChange, 
  shifts: propShifts, 
  users: propUsers 
}: MonthlyViewProps) => {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [users, setUsers] = useState<ScheduleUser[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [leaveTypeFilter, setLeaveTypeFilter] = useState<'all' | 'extra' | 'unpaid'>('all');

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        
        const [usersData, shiftsData, leaveRequestsData] = await Promise.all([
          usersTable.getAll(),
          shiftsTable.getAll(),
          leaveRequestsTable.getAll()
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
        
        setShifts(shiftsData);
        setLeaveRequests(leaveRequestsData.filter(lr => lr.status === 'approved'));
      } catch (error) {
        console.error('Error loading monthly data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [selectedDate]);

  const monthStart = startOfMonth(selectedDate);
  const monthEnd = endOfMonth(selectedDate);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Pad the month to start on Sunday
  const startPadding = monthStart.getDay();
  const paddedDays = [
    ...Array.from({ length: startPadding }, (_, i) => {
      const date = new Date(monthStart);
      date.setDate(date.getDate() - startPadding + i);
      return date;
    }),
    ...monthDays
  ];

  const handlePreviousMonth = () => {
    onDateChange(subMonths(selectedDate, 1));
  };

  const handleNextMonth = () => {
    onDateChange(addMonths(selectedDate, 1));
  };

  const getShiftsForDate = (date: Date) => {
    return shifts.filter(shift => isSameDay(new Date(shift.start_time), date));
  };

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

  // Helper to get leave requests for a date, filtered by type
  const getLeaveRequestsForDate = (date: Date) => {
    let filtered = leaveRequests.filter(lr => {
      const start = new Date(lr.start_date);
      const end = new Date(lr.end_date);
      start.setHours(0,0,0,0);
      end.setHours(23,59,59,999);
      date.setHours(0,0,0,0);
      return date >= start && date <= end;
    });
    if (leaveTypeFilter === 'extra') {
      filtered = filtered.filter(lr => lr.leave_type === 'extra');
    } else if (leaveTypeFilter === 'unpaid') {
      filtered = filtered.filter(lr => lr.leave_type === 'unpaid');
    }
    return filtered;
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
      {/* Month navigation and filter */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{format(selectedDate, 'MMMM yyyy')}</h2>
          <p className="text-gray-500">
            {shifts.filter(shift => isSameMonth(new Date(shift.start_time), selectedDate)).length} shifts this month
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={leaveTypeFilter} onValueChange={v => setLeaveTypeFilter(v as any)}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Filter by leave type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Leaves</SelectItem>
                <SelectItem value="extra">Extra Days</SelectItem>
                <SelectItem value="unpaid">Unpaid Leave</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" size="icon" onClick={handlePreviousMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={() => onDateChange(new Date())}>
            Today
          </Button>
          <Button variant="outline" size="icon" onClick={handleNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Calendar grid */}
      <Card>
        <div className="p-6">
          {/* Days of week header */}
          <div className="grid grid-cols-7 gap-px mb-4">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar days */}
          <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-lg overflow-hidden">
            {paddedDays.map((date, index) => {
              let dayShifts = getShiftsForDate(date);
              const isCurrentMonth = isSameMonth(date, selectedDate);
              const isCurrentDay = isToday(date);
              const isSelected = isSameDay(date, selectedDate);
              const dayLeaves = getLeaveRequestsForDate(date);

              // If filtering by 'extra' or 'unpaid', only show shifts for users with that leave type on this day
              if (leaveTypeFilter === 'extra' || leaveTypeFilter === 'unpaid') {
                const filteredUserIds = dayLeaves.filter(lr => lr.leave_type === leaveTypeFilter).map(lr => lr.user_id);
                dayShifts = dayShifts.filter(shift => filteredUserIds.includes(shift.user_id));
              }

              return (
                <div
                  key={index}
                  className={cn(
                    "bg-white min-h-[120px] p-2 cursor-pointer hover:bg-gray-50 transition-colors",
                    !isCurrentMonth && "bg-gray-50 text-gray-400",
                    isCurrentDay && "bg-blue-50",
                    isSelected && "ring-2 ring-blue-500"
                  )}
                  onClick={() => onDateChange(date)}
                >
                  {/* Date number */}
                  <div className="flex items-center justify-between mb-1">
                    <span className={cn(
                      "text-sm font-medium",
                      isCurrentDay && "bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center"
                    )}>
                      {format(date, 'd')}
                    </span>
                    {dayShifts.length > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {dayShifts.length}
                      </Badge>
                    )}
                  </div>

                  {/* Shifts for this day */}
                  <div className="space-y-1">
                    {dayShifts.slice(0, 3).map((shift) => {
                      const user = users.find(u => u.id === shift.user_id);
                      const shiftColor = getShiftColor(shift.shift_type, shift.color);
                      const startTime = format(new Date(shift.start_time), 'h:mm a');

                      return (
                        <div
                          key={shift.id}
                          className="text-xs p-1 rounded cursor-pointer hover:opacity-80"
                          style={{
                            backgroundColor: shiftColor + '33',
                            borderLeft: `3px solid ${shiftColor}`
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditShift(shift);
                          }}
                        >
                          <div className="font-medium truncate">
                            {user?.username || 'Unknown'}
                          </div>
                          <div className="text-gray-600">
                            {startTime} • {shift.shift_type}
                          </div>
                        </div>
                      );
                    })}
                    
                    {/* Leave requests for this day */}
                    {dayLeaves.map((leave, i) => (
                      <div
                        key={leave.id + i}
                        className={cn(
                          'text-xs p-1 rounded border-l-4',
                          leave.leave_type === 'extra' ? 'bg-green-100 border-green-500 text-green-800' :
                          leave.leave_type === 'unpaid' ? 'bg-red-100 border-red-500 text-red-800' :
                          'bg-gray-100 border-gray-500 text-gray-800'
                        )}
                        title={leave.leave_type}
                      >
                        <div className="font-semibold capitalize">{leave.leave_type.replace('-', ' ')}</div>
                        <div className="mt-1 flex items-center gap-2">
                          <Badge variant="secondary" className="capitalize">
                            {leave.leave_type}
                          </Badge>
                          <span className="text-gray-500 text-[10px]">
                            {format(new Date(leave.start_date), 'MMM d')} - {format(new Date(leave.end_date), 'MMM d')}
                          </span>
                        </div>
                      </div>
                    ))}
                    
                    {dayShifts.length > 3 && (
                      <div className="text-xs text-gray-500 text-center">
                        +{dayShifts.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      {/* Monthly summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Calendar className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total shifts</p>
              <p className="text-xl font-semibold">
                {shifts.filter(shift => isSameMonth(new Date(shift.start_time), selectedDate)).length}
              </p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Plus className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Working days</p>
              <p className="text-xl font-semibold">
                {new Set(
                  shifts
                    .filter(shift => isSameMonth(new Date(shift.start_time), selectedDate))
                    .map(shift => format(new Date(shift.start_time), 'yyyy-MM-dd'))
                ).size}
              </p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Calendar className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total hours</p>
              <p className="text-xl font-semibold">
                {shifts
                  .filter(shift => isSameMonth(new Date(shift.start_time), selectedDate))
                  .reduce((total, shift) => {
                    const start = new Date(shift.start_time);
                    const end = new Date(shift.end_time);
                    return total + (end.getTime() - start.getTime()) / (1000 * 60 * 60);
                  }, 0)
                  .toFixed(1)}h
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default MonthlyView;
