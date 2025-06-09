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
import { Edit2, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';

export default function MonthlyView({
  selectedDate,
  onEditShift,
  onDeleteShift,
  onDateChange,
  users,
  shifts,
}: MonthlyViewProps) {
  const { currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'admin';

  const monthStart = startOfMonth(selectedDate);
  const monthEnd = endOfMonth(selectedDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const handlePreviousMonth = () => {
    onDateChange(subMonths(selectedDate, 1));
  };

  const handleNextMonth = () => {
    onDateChange(addMonths(selectedDate, 1));
  };

  // Group shifts by date
  const shiftsByDate = shifts.reduce((acc, shift) => {
    const date = new Date(shift.start_time).toDateString();
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(shift);
    return acc;
  }, {} as Record<string, Shift[]>);

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

  const renderShiftCell = (shifts: Shift[]) => {
    if (shifts.length === 0) return null;

    return shifts.map((shift) => {
      const user = users.find((u) => u.id === shift.user_id);
      const startTime = format(new Date(shift.start_time), 'HH:mm');
      const endTime = format(new Date(shift.end_time), 'HH:mm');

      return (
        <div
          key={shift.id}
          className={`p-2 rounded ${getShiftTypeColor(shift.shift_type)} mb-1`}
        >
          <div className="flex justify-between items-start">
            <div>
              <div className="font-semibold text-sm">{user?.username}</div>
              <div className="text-xs">
                {startTime} - {endTime}
              </div>
            </div>
            {isAdmin && (
              <div className="flex space-x-1">
                <button
                  onClick={() => onEditShift(shift)}
                  className="text-gray-600 hover:text-gray-900"
                >
                  <Edit2 className="h-3 w-3" />
                </button>
                <button
                  onClick={() => onDeleteShift(shift.id)}
                  className="text-gray-600 hover:text-red-600"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            )}
          </div>
        </div>
      );
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={handlePreviousMonth}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-[200px] text-center">
            <div className="font-semibold text-lg">
              {format(selectedDate, 'MMMM')}
            </div>
            <div className="text-sm text-muted-foreground">
              {format(selectedDate, 'yyyy')}
            </div>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={handleNextMonth}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-px bg-muted rounded-lg overflow-hidden">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div
            key={day}
            className="bg-muted-foreground/5 p-2 text-center font-medium"
          >
            {day}
          </div>
        ))}
        {daysInMonth.map((date) => {
          const dayShifts = shiftsByDate[date.toDateString()] || [];
          const isCurrentMonth = isSameMonth(date, selectedDate);
          const isToday = isSameDay(date, new Date());

          return (
            <div
              key={date.toISOString()}
              className={cn(
                'min-h-[120px] p-2 bg-background relative',
                !isCurrentMonth && 'text-muted-foreground bg-muted/50',
                isToday && 'ring-2 ring-primary ring-inset'
              )}
            >
              <div
                className={cn(
                  'absolute top-2 right-2 h-6 w-6 rounded-full text-center leading-6 text-sm',
                  isToday && 'bg-primary text-primary-foreground'
                )}
              >
                {format(date, 'd')}
              </div>
              <div className="pt-6 space-y-1">
                {renderShiftCell(dayShifts)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
} 