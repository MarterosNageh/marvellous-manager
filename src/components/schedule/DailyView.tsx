import { format, addDays, subDays } from 'date-fns';
import { DailyViewProps, Shift } from '@/types/schedule';
import {
  Button,
} from '@/components/ui';
import { Edit2, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function DailyView({
  selectedDate,
  onEditShift,
  onDeleteShift,
  onDateChange,
  users,
  shifts,
}: DailyViewProps) {
  const { currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'admin';

  const handlePreviousDay = () => {
    onDateChange(subDays(selectedDate, 1));
  };

  const handleNextDay = () => {
    onDateChange(addDays(selectedDate, 1));
  };

  // Filter shifts for the selected date
  const dailyShifts = shifts.filter((shift) => {
    const shiftDate = new Date(shift.start_time);
    return (
      shiftDate.getFullYear() === selectedDate.getFullYear() &&
      shiftDate.getMonth() === selectedDate.getMonth() &&
      shiftDate.getDate() === selectedDate.getDate()
    );
  });

  // Group shifts by time slots (morning, night, on-call)
  const groupedShifts: Record<string, Shift[]> = {
    morning: [],
    night: [],
    'on-call': [],
  };

  dailyShifts.forEach((shift) => {
    groupedShifts[shift.shift_type].push(shift);
  });

  const getShiftTypeColor = (type: string) => {
    switch (type) {
      case 'morning':
        return 'bg-blue-100 text-blue-800';
      case 'night':
        return 'bg-purple-100 text-purple-800';
      case 'on-call':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const renderShiftCard = (shift: Shift) => {
    const user = users.find((u) => u.id === shift.user_id);
    const startTime = format(new Date(shift.start_time), 'HH:mm');
    const endTime = format(new Date(shift.end_time), 'HH:mm');

    return (
      <div
        key={shift.id}
        className={`p-3 rounded-lg mb-2 ${getShiftTypeColor(shift.shift_type)}`}
      >
        <div className="flex justify-between items-start mb-1">
          <div>
            <div className="font-semibold">{user?.username}</div>
            <div className="text-sm">
              {startTime} - {endTime}
            </div>
          </div>
          {isAdmin && (
            <div className="flex space-x-2">
              <button
                onClick={() => onEditShift(shift)}
                className="text-gray-600 hover:text-gray-900"
              >
                <Edit2 className="h-4 w-4" />
              </button>
              <button
                onClick={() => onDeleteShift(shift.id)}
                className="text-gray-600 hover:text-red-600"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
        {shift.notes && (
          <div className="text-sm text-gray-600 mt-1">{shift.notes}</div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={handlePreviousDay}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-[200px] text-center font-medium">
            {format(selectedDate, 'EEEE, MMMM d, yyyy')}
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={handleNextDay}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {dailyShifts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No shifts scheduled for this day
          </div>
        ) : (
          Object.entries(groupedShifts).map(([type, shifts]) => (
            <div key={type} className="space-y-4">
              <h3 className="text-lg font-medium capitalize">{type} Shifts</h3>
              {shifts.length > 0 ? (
                shifts.map(renderShiftCard)
              ) : (
                <p className="text-muted-foreground">No {type} shifts scheduled</p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
} 