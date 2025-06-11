
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

const WeeklyView: React.FC<WeeklyViewProps> = ({
  selectedDate,
  onEditShift,
  onDeleteShift,
  onDateChange,
  users,
  shifts,
  startDate,
  onAddShift,
  onUpdateShift,
  refreshData
}) => {
  const { currentUser } = useAuth();
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  const [hoveredCell, setHoveredCell] = useState<{ date: Date; userId: string } | null>(null);

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(startDate, i));

  const getShiftsForUserAndDate = (userId: string, date: Date) => {
    return shifts.filter(shift => 
      shift.user_id === userId && 
      isSameDay(new Date(shift.start_time), date)
    );
  };

  const handleDragEnd = async (result: any) => {
    if (!result.destination) return;

    const { source, destination, draggableId } = result;
    
    // Parse the droppable IDs to get user and date info
    const sourceCell = source.droppableId.split('-');
    const destCell = destination.droppableId.split('-');
    
    if (sourceCell.length < 3 || destCell.length < 3) return;
    
    const sourceUserId = sourceCell[1];
    const sourceDateStr = sourceCell[2];
    const destUserId = destCell[1];
    const destDateStr = destCell[2];

    // Find the shift being moved
    const shiftToMove = shifts.find(s => s.id === draggableId);
    if (!shiftToMove) return;

    try {
      // Parse the destination date
      const destDate = new Date(destDateStr);
      const currentShiftDate = new Date(shiftToMove.start_time);
      const currentShiftEndDate = new Date(shiftToMove.end_time);
      
      // Calculate time difference to maintain shift duration
      const timeDiff = destDate.getTime() - new Date(currentShiftDate.toDateString()).getTime();
      
      const newStartTime = new Date(currentShiftDate.getTime() + timeDiff);
      const newEndTime = new Date(currentShiftEndDate.getTime() + timeDiff);

      // Update the shift with new user, date, and time
      await onUpdateShift(shiftToMove.id, {
        user_id: destUserId,
        start_time: newStartTime.toISOString(),
        end_time: newEndTime.toISOString(),
      }, 'this');

      toast({
        title: "Shift moved",
        description: "The shift has been successfully moved.",
      });
      
      await refreshData();
    } catch (error) {
      console.error('Error moving shift:', error);
      toast({
        title: "Error",
        description: "Failed to move shift. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCellClick = (date: Date, userId: string) => {
    // Set the selected date and user for adding a new shift
    onDateChange(date);
    onAddShift();
  };

  const handleCellHover = (date: Date, userId: string) => {
    setHoveredCell({ date, userId });
  };

  const handleCellLeave = () => {
    setHoveredCell(null);
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="bg-white rounded-lg shadow-sm border">
        {/* Header */}
        <div className="grid grid-cols-8 border-b">
          <div className="p-4 border-r bg-gray-50">
            <span className="font-medium text-gray-700">Team Members</span>
          </div>
          {weekDays.map((day, index) => (
            <div key={index} className="p-4 text-center border-r last:border-r-0 bg-gray-50">
              <div className="font-medium text-gray-700">
                {format(day, 'EEE')}
              </div>
              <div className="text-sm text-gray-500">
                {format(day, 'dd')}
              </div>
            </div>
          ))}
        </div>

        {/* Body */}
        <div className="divide-y">
          {users.map((user) => (
            <div key={user.id} className="grid grid-cols-8 min-h-[120px]">
              {/* User Info */}
              <div className="p-4 border-r bg-gray-50 flex items-center">
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs">
                      {getInitials(user.username)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium text-sm">{user.username}</div>
                    <div className="text-xs text-gray-500 capitalize">{user.role}</div>
                  </div>
                </div>
              </div>

              {/* Date Cells */}
              {weekDays.map((day, dayIndex) => {
                const dayShifts = getShiftsForUserAndDate(user.id, day);
                const cellId = `cell-${user.id}-${day.toISOString().split('T')[0]}`;
                const isHovered = hoveredCell?.date.toDateString() === day.toDateString() && 
                                 hoveredCell?.userId === user.id;

                return (
                  <Droppable key={dayIndex} droppableId={cellId}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={cn(
                          "border-r last:border-r-0 p-2 min-h-[120px] relative cursor-pointer hover:bg-gray-50 transition-colors",
                          snapshot.isDraggingOver && "bg-blue-50 border-blue-200",
                          isHovered && "bg-blue-50"
                        )}
                        onClick={() => handleCellClick(day, user.id)}
                        onMouseEnter={() => handleCellHover(day, user.id)}
                        onMouseLeave={handleCellLeave}
                      >
                        <div className="space-y-1">
                          {dayShifts.map((shift, shiftIndex) => (
                            <ShiftBlock
                              key={shift.id}
                              shift={shift}
                              user={user}
                              onDelete={onDeleteShift}
                              onEdit={onEditShift}
                              index={shiftIndex}
                            />
                          ))}
                        </div>
                        
                        {/* Add shift button on hover */}
                        {isHovered && dayShifts.length === 0 && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-blue-600 hover:text-blue-800"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCellClick(day, user.id);
                              }}
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              Add Shift
                            </Button>
                          </div>
                        )}
                        
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </DragDropContext>
  );
};

export default WeeklyView;
