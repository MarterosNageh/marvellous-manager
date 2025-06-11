import React, { useState, useEffect } from 'react';
import { format, addDays, isSameDay, startOfWeek } from 'date-fns';
import { Plus, Settings, Calendar, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { WeeklyViewProps, Shift, ScheduleUser } from '@/types/schedule';
import { shiftsTable, usersTable } from '@/integrations/supabase/tables/schedule';
import { toast } from '@/hooks/use-toast';
import { RecurrenceAction } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import {
  RadioGroup,
  RadioGroupItem,
} from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { AlertTriangle } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { useAuth } from '@/context/AuthContext';

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

const ShiftBlock = ({ 
  shift, 
  user, 
  onDelete,
  onEdit,
  index
}: { 
  shift: Shift; 
  user?: ScheduleUser; 
  onDelete: (id: string, recurrenceAction: RecurrenceAction) => void;
  onEdit: (shift: Shift) => void;
  index: number;
}) => {
  const startTime = format(new Date(shift.start_time), 'h:mm a');
  const endTime = format(new Date(shift.end_time), 'h:mm a');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [recurrenceAction, setRecurrenceAction] = useState<RecurrenceAction>('this');

  const shiftColor = getShiftColor(shift.shift_type, shift.color);

  return (
    <Draggable draggableId={shift.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={() => onEdit(shift)}
          style={{
            backgroundColor: shiftColor + (snapshot.isDragging ? 'CC' : '33'),
            borderColor: shiftColor,
            ...provided.draggableProps.style
          }}
          className={cn(
            "rounded-md p-2 text-xs h-full cursor-pointer hover:opacity-80 transition-all relative group border-l-4",
            snapshot.isDragging && "shadow-lg scale-105 rotate-2"
          )}
        >
          <div className="font-semibold text-gray-800">{`${startTime} - ${endTime}`}</div>
          <div className="text-gray-600">{shift.notes || 'Open'}</div>
          {shift.shift_type && (
            <div className="text-xs mt-1 capitalize font-medium" style={{ color: shiftColor }}>
              {shift.shift_type}
            </div>
          )}
          <Button
            size="sm"
            variant="ghost"
            className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 h-6 w-6 p-1 text-red-500 hover:text-red-700"
            onClick={(e) => {
              e.stopPropagation();
              setShowDeleteConfirm(true);
            }}
          >
            <Trash2 className="h-3 w-3" />
          </Button>

          {showDeleteConfirm && (
            <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
              <DialogContent 
                className="sm:max-w-[425px]"
                onClick={(e) => e.stopPropagation()}
              >
                <DialogHeader>
                  <DialogTitle>Delete Shift</DialogTitle>
                  <DialogDescription>
                    How would you like to handle this shift?
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-amber-600">
                    <AlertTriangle className="h-5 w-5" />
                    <p className="font-semibold">Delete Shift</p>
                  </div>
                  <RadioGroup
                    value={recurrenceAction}
                    onValueChange={(value) => setRecurrenceAction(value as RecurrenceAction)}
                    className="space-y-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="this" id="this" />
                      <Label htmlFor="this">Change this shift only</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="future" id="future" />
                      <Label htmlFor="future">Change this shift and shifts in the future</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="previous" id="previous" />
                      <Label htmlFor="previous">Change this shift and the previous shifts</Label>
                    </div>
                  </RadioGroup>

                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowDeleteConfirm(false);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(shift.id, recurrenceAction);
                        setShowDeleteConfirm(false);
                      }}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      )}
    </Draggable>
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
  onDeleteShift,
  onUpdateShift,
  refreshData
}: WeeklyViewProps) => {
  const { currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'admin';
  const [shifts, setShifts] = useState<Shift[]>(propShifts || []);
  const [users, setUsers] = useState<ScheduleUser[]>(propUsers || []);
  const [isLoading, setIsLoading] = useState(true);
  const [weekStart, setWeekStart] = useState(startDate);
  const [hoveredCell, setHoveredCell] = useState<{userId: string, dateIndex: number, targetDate: Date} | null>(null);

  // Update weekStart when startDate changes
  useEffect(() => {
    setWeekStart(startDate);
  }, [startDate]);

  // Load data from database
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        
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
          title: user.title || '',
          balance: 0
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

  // Update local shifts when props change
  useEffect(() => {
    setShifts(propShifts);
  }, [propShifts]);

  const handleDeleteShift = async (shiftId: string, recurrenceAction: RecurrenceAction) => {
    try {
      await onDeleteShift(shiftId, recurrenceAction);
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

  const handleQuickAddShift = (userId: string, targetDate: Date) => {
    if (!isAdmin) return;
    
    // Store the target date and user information for the shift dialog
    const shiftData = {
      user_id: userId,
      start_time: format(targetDate, 'yyyy-MM-dd') + 'T09:00:00',
      end_time: format(targetDate, 'yyyy-MM-dd') + 'T17:00:00',
    };
    
    // You can extend this to open a proper shift creation dialog
    console.log('Quick add shift for user:', userId, 'on date:', format(targetDate, 'yyyy-MM-dd'));
    onAddShift();
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

  const roleDisplayOrder = ['Operators', 'Leaders'];
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
    acc[user.id] = Math.round(totalHours * 10) / 10;
    return acc;
  }, {} as Record<string, number>);

  const handleDragEnd = async (result: any) => {
    if (!result.destination) return;

    const { draggableId, source, destination } = result;
    const shift = shifts.find(s => s.id === draggableId);
    if (!shift) return;

    const [sourceUserId, sourceDayIndex] = source.droppableId.split('-');
    const [destUserId, destDayIndex] = destination.droppableId.split('-');

    const sourceDate = addDays(weekStart, parseInt(sourceDayIndex));
    const destDate = addDays(weekStart, parseInt(destDayIndex));
    const dateDiff = destDate.getTime() - sourceDate.getTime();

    const newStartTime = new Date(shift.start_time);
    const newEndTime = new Date(shift.end_time);
    newStartTime.setTime(newStartTime.getTime() + dateDiff);
    newEndTime.setTime(newEndTime.getTime() + dateDiff);

    const updates: Partial<Shift> = {
      start_time: newStartTime.toISOString(),
      end_time: newEndTime.toISOString(),
    };

    if (sourceUserId !== destUserId) {
      const destUser = users.find(u => u.id === destUserId);
      if (!destUser) {
        console.error('Could not find destination user');
        toast({
          title: "Error",
          description: "Failed to update shift: Invalid destination user",
          variant: "destructive",
        });
        return;
      }
      updates.user_id = destUser.id;
    }

    try {
      // Update the shift in the database
      await shiftsTable.update(shift.id, updates, 'this');
      
      if (refreshData) {
        await refreshData();
      }
      toast({
        title: "Success",
        description: "Shift updated successfully",
      });
    } catch (error) {
      console.error('Error updating shift:', error);
      toast({
        title: "Error",
        description: "Failed to update shift. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="border rounded-lg bg-white overflow-hidden">
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
                'p-4 text-sm border-l text-center transition-colors',
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

                        const isHovered = hoveredCell?.userId === user.id && hoveredCell?.dateIndex === dateIndex;

                        return (
                          <Droppable key={dateIndex} droppableId={`${user.id}-${dateIndex}`}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.droppableProps}
                                onMouseEnter={() => setHoveredCell({
                                  userId: user.id, 
                                  dateIndex, 
                                  targetDate: date
                                })}
                                onMouseLeave={() => setHoveredCell(null)}
                                className={cn(
                                  'relative p-2 min-h-[80px] border-l flex flex-col gap-1 transition-colors',
                                  isSameDay(date, new Date()) && !isHovered && 'bg-blue-50',
                                  snapshot.isDraggingOver && 'bg-green-50 border-green-200',
                                  isHovered && 'bg-blue-50'
                                )}
                              >
                                {dayShifts.map((shift, shiftIndex) => (
                                  <ShiftBlock
                                    key={shift.id}
                                    shift={shift}
                                    user={user}
                                    onDelete={(id, recurrenceAction) => handleDeleteShift(id, recurrenceAction)}
                                    onEdit={onEditShift}
                                    index={shiftIndex}
                                  />
                                ))}
                                {provided.placeholder}
                                
                                {/* Quick add button on hover */}
                                {isHovered && isAdmin && dayShifts.length === 0 && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="absolute inset-0 w-full h-full opacity-70 hover:opacity-100 flex items-center justify-center"
                                    onClick={() => handleQuickAddShift(user.id, date)}
                                    title={`Add shift for ${user.username} on ${format(date, 'MMM dd')}`}
                                  >
                                    <Plus className="h-4 w-4" />
                                    <span className="ml-1 text-xs">
                                      Add to {format(date, 'MMM dd')}
                                    </span>
                                  </Button>
                                )}
                                
                                {dayShifts.length === 0 && !isHovered && (
                                  <div className="flex-1 flex items-center justify-center">
                                    <span className="text-xs text-gray-400">-</span>
                                  </div>
                                )}
                              </div>
                            )}
                          </Droppable>
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
    </DragDropContext>
  );
};

export default WeeklyView;
