import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useShifts } from "@/context/ShiftsContext";
import { isSameDay, subDays, addDays, format } from "date-fns";

export const DailyScheduleView = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const { shifts } = useShifts();

  // Filter shifts for the current day
  const todaysShifts = shifts.filter(shift => 
    isSameDay(new Date(shift.start_time), currentDate)
  );

  const goToPreviousDay = () => {
    setCurrentDate(subDays(currentDate, 1));
  };

  const goToNextDay = () => {
    setCurrentDate(addDays(currentDate, 1));
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Button variant="outline" onClick={goToPreviousDay}>
          <ChevronLeft className="h-4 w-4 mr-2" />
          Previous Day
        </Button>
        <h2 className="text-xl font-bold">{format(currentDate, "EEEE, MMMM d, yyyy")}</h2>
        <Button variant="outline" onClick={goToNextDay}>
          Next Day
          <ChevronRight className="h-4 w-4 ml-2" />
        </Button>
      </div>

      {todaysShifts.length > 0 ? (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {todaysShifts.map((shift) => (
            <Card key={shift.id}>
              <CardHeader className="pb-2">
                <div className="flex justify-between">
                  <CardTitle>{shift.title}</CardTitle>
                  <Badge variant="outline">{shift.shift_type}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm mb-2">{format(new Date(shift.start_time), "h:mm a")} - {format(new Date(shift.end_time), "h:mm a")}</p>
                <p className="text-sm text-muted-foreground">{shift.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-4">
            <p className="text-center text-muted-foreground">No shifts scheduled for this day.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
