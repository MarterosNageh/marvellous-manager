import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useShifts } from "@/context/ShiftsContext";
import { 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  subMonths, 
  addMonths, 
  format 
} from "date-fns";

export const MonthlyScheduleView = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const { shifts } = useShifts();

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const goToPreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Button variant="outline" onClick={goToPreviousMonth}>
          <ChevronLeft className="h-4 w-4 mr-2" />
          Previous Month
        </Button>
        <h2 className="text-xl font-bold">{format(currentMonth, "MMMM yyyy")}</h2>
        <Button variant="outline" onClick={goToNextMonth}>
          Next Month
          <ChevronRight className="h-4 w-4 ml-2" />
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
          <div key={day} className="text-center font-medium p-2">
            {day}
          </div>
        ))}

        {calendarDays.map((day) => {
          const dayShifts = shifts.filter(shift => 
            isSameDay(new Date(shift.start_time), day)
          );

          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isToday = isSameDay(day, new Date());

          return (
            <Card 
              key={day.toString()} 
              className={`min-h-[100px] ${!isCurrentMonth ? 'opacity-40' : ''} ${isToday ? 'border-primary' : ''}`}
            >
              <div className={`text-right p-1 text-xs ${isToday ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                {format(day, "d")}
              </div>
              <CardContent className="p-1 space-y-1">
                {dayShifts.slice(0, 2).map((shift) => (
                  <div key={shift.id} className="bg-primary/10 p-1 rounded text-[10px]">
                    <div>{format(new Date(shift.start_time), "h:mm a")}</div>
                    <div className="truncate">{shift.title}</div>
                  </div>
                ))}
                {dayShifts.length > 2 && (
                  <div className="text-[10px] text-muted-foreground text-center">
                    + {dayShifts.length - 2} more
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
