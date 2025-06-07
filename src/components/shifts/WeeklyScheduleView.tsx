import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useShifts } from "@/context/ShiftsContext";
import { startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, subWeeks, addWeeks, format } from "date-fns";

export const WeeklyScheduleView = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const { shifts } = useShifts();

  // Date calculations
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  // Get shifts for each day in the current week
  const getShiftsForDay = (day) => {
    return shifts.filter(shift => 
      isSameDay(new Date(shift.start_time), day)
    );
  };

  const goToPreviousWeek = () => {
    setCurrentDate(subWeeks(currentDate, 1));
  };

  const goToNextWeek = () => {
    setCurrentDate(addWeeks(currentDate, 1));
  };

  // Rendering logic
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Button variant="outline" onClick={goToPreviousWeek}>
          <ChevronLeft className="h-4 w-4 mr-2" />
          Previous Week
        </Button>
        <h2 className="text-xl font-bold">
          {format(weekStart, "MMM d")} - {format(weekEnd, "MMM d, yyyy")}
        </h2>
        <Button variant="outline" onClick={goToNextWeek}>
          Next Week
          <ChevronRight className="h-4 w-4 ml-2" />
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {weekDays.map((day) => (
          <div key={day.toString()} className="flex flex-col">
            <div className="text-center p-2 bg-muted rounded-t-md">
              <div className="font-medium">{format(day, "EEE")}</div>
              <div className="text-sm text-muted-foreground">{format(day, "MMM d")}</div>
            </div>
            
            <Card className="flex-1 rounded-t-none min-h-[150px]">
              <CardContent className="p-2 space-y-2">
                {getShiftsForDay(day).map((shift) => (
                  <div key={shift.id} className="bg-primary/10 p-2 rounded text-xs">
                    <div className="font-medium">{shift.title}</div>
                    <div className="text-xs">{format(new Date(shift.start_time), "h:mm a")} - {format(new Date(shift.end_time), "h:mm a")}</div>
                    <Badge className="mt-1 text-[10px] h-5" variant="outline">{shift.shift_type}</Badge>
                  </div>
                ))}
                {getShiftsForDay(day).length === 0 && (
                  <p className="text-xs text-center text-muted-foreground h-full flex items-center justify-center">No shifts</p>
                )}
              </CardContent>
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
};
