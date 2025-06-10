import { format, addDays, subDays } from 'date-fns';
import { DailyViewProps, Shift } from '@/types/schedule';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Edit2, Trash2, ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { RecurrenceAction } from '@/types';

export default function DailyView({
  selectedDate,
  onEditShift,
  onDeleteShift,
  onDateChange,
  users,
  shifts: initialShifts,
}: DailyViewProps) {
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={() => onDateChange(subDays(selectedDate, 1))}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-lg font-semibold">
          {format(selectedDate, 'EEEE, MMMM d, yyyy')}
        </h2>
        <Button
          variant="ghost"
          onClick={() => onDateChange(addDays(selectedDate, 1))}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-4">
        {shifts.map((shift) => {
          const user = users.find((u) => u.id === shift.user_id);
          return (
            <div
              key={shift.id}
              className="flex items-center justify-between p-4 bg-white rounded-lg shadow"
            >
              <div>
                <div className="font-semibold">
                  {format(new Date(shift.start_time), 'h:mm a')} -{' '}
                  {format(new Date(shift.end_time), 'h:mm a')}
                </div>
                <div className="text-sm text-gray-600">
                  {user?.username || 'Unknown User'}
                </div>
                {shift.notes && (
                  <div className="text-sm text-gray-500 mt-1">
                    {shift.notes}
                  </div>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onEditShift(shift)}
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDeleteClick(shift)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
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