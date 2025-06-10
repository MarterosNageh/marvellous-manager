import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
} from 'date-fns';
import { MonthlyViewProps, Shift } from '@/types/schedule';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Edit2, Trash2, ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { RecurrenceAction } from '@/types';

export default function MonthlyView({
  selectedDate,
  onEditShift,
  onDeleteShift,
  onDateChange,
  users,
  shifts: initialShifts,
}: MonthlyViewProps) {
  const { currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'admin';
  const [shifts, setShifts] = useState(initialShifts);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  const [recurrenceAction, setRecurrenceAction] = useState<RecurrenceAction>('this');

  // Update local shifts when props change
  useEffect(() => {
    setShifts(initialShifts);
  }, [initialShifts]);

  const handleDeleteClick = (shift: Shift) => {
    setSelectedShift(shift);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (selectedShift) {
      await onDeleteShift(selectedShift.id, recurrenceAction);
      setShowDeleteConfirm(false);
      setSelectedShift(null);
      setRecurrenceAction('this');
    }
  };

  const monthStart = startOfMonth(selectedDate);
  const monthEnd = endOfMonth(selectedDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={() => onDateChange(subMonths(selectedDate, 1))}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-lg font-semibold">
          {format(selectedDate, 'MMMM yyyy')}
        </h2>
        <Button
          variant="ghost"
          onClick={() => onDateChange(addMonths(selectedDate, 1))}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-px bg-gray-200">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div
            key={day}
            className="bg-gray-50 p-2 text-center text-sm font-medium"
          >
            {day}
          </div>
        ))}
        {days.map((day, dayIdx) => {
          const dayShifts = shifts.filter((shift) =>
            isSameDay(new Date(shift.start_time), day)
          );

          return (
            <div
              key={day.toString()}
              className={cn(
                'min-h-[100px] bg-white p-2',
                !isSameMonth(day, selectedDate) && 'bg-gray-50 text-gray-500'
              )}
            >
              <div className="font-medium">{format(day, 'd')}</div>
              <div className="mt-1 space-y-1">
                {dayShifts.map((shift) => {
                  const user = users.find((u) => u.id === shift.user_id);
                  return (
                    <div
                      key={shift.id}
                      className="flex items-center justify-between rounded bg-blue-50 p-1 text-xs"
                    >
                      <div>
                        <div>
                          {format(new Date(shift.start_time), 'h:mm a')}
                        </div>
                        <div className="text-gray-600">
                          {user?.username || 'Unknown'}
                        </div>
                      </div>
                      <div className="flex space-x-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onEditShift(shift)}
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteClick(shift)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {showDeleteConfirm && selectedShift && (
        <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
          <DialogContent className="sm:max-w-[425px]">
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
                  <Label htmlFor="this">Delete this shift only</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="future" id="future" />
                  <Label htmlFor="future">Delete this and future shifts</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="previous" id="previous" />
                  <Label htmlFor="previous">Delete this and previous shifts</Label>
                </div>
              </RadioGroup>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowDeleteConfirm(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDeleteConfirm}
                >
                  Delete
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
} 