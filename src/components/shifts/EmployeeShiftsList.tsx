import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, Filter } from "lucide-react";
import { useShifts } from "@/context/ShiftsContext";
import { isToday, isThisWeek, format } from "date-fns";
import { useAuth } from "@/context/AuthContext";

export const EmployeeShiftsList = () => {
  const { shifts } = useShifts();
  const { currentUser } = useAuth();
  const [activeView, setActiveView] = useState("today");
  
  // Get user's shifts
  const userShifts = shifts.filter(
    (shift) => shift.user_id === currentUser?.id
  );

  // Today's shifts
  const todayShifts = userShifts.filter((shift) => {
    const shiftDate = new Date(shift.start_time);
    return isToday(shiftDate);
  });

  // This week's shifts
  const thisWeekShifts = userShifts.filter((shift) => {
    const shiftDate = new Date(shift.start_time);
    return isThisWeek(shiftDate, { weekStartsOn: 1 });
  }).sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

  // All shifts
  const allShifts = userShifts.filter((shift) => {
    const shiftDate = new Date(shift.start_time);
    return !isThisWeek(shiftDate, { weekStartsOn: 1 });
  }).sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>My Schedule</CardTitle>
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" /> Filter
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="today" onValueChange={setActiveView}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="today">Today</TabsTrigger>
            <TabsTrigger value="week">This Week</TabsTrigger>
            <TabsTrigger value="all">All Shifts</TabsTrigger>
          </TabsList>
          
          <TabsContent value="today">
            {todayShifts.length > 0 ? (
              <div className="space-y-3 mt-4">
                {todayShifts.map((shift) => (
                  <ShiftCard key={shift.id} shift={shift} />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                You have no shifts scheduled for today.
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="week">
            {thisWeekShifts.length > 0 ? (
              <div className="space-y-3 mt-4">
                {thisWeekShifts.map((shift) => (
                  <ShiftCard key={shift.id} shift={shift} />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                You have no shifts scheduled for this week.
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="all">
            {allShifts.length > 0 ? (
              <div className="space-y-3 mt-4">
                {allShifts.map((shift) => (
                  <ShiftCard key={shift.id} shift={shift} />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No other shifts scheduled.
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

const ShiftCard = ({ shift }) => {
  const shiftDate = new Date(shift.start_time);
  const isShiftToday = isToday(shiftDate);
  
  let statusBadge;
  if (shift.status === "completed") {
    statusBadge = <Badge variant="outline">Completed</Badge>;
  } else if (isShiftToday) {
    statusBadge = <Badge>Today</Badge>;
  } else {
    statusBadge = <Badge variant="secondary">{shift.status}</Badge>;
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <div className="font-medium">{shift.title}</div>
            <div className="flex items-center text-sm text-muted-foreground mt-1">
              <CalendarIcon className="h-3 w-3 mr-1" />
              <span>
                {isThisWeek(shiftDate, { weekStartsOn: 1 }) && !isToday(shiftDate)
                  ? format(shiftDate, "EEEE")
                  : format(shiftDate, "MMM d, yyyy")}
              </span>
            </div>
            <div className="text-sm mt-1">
              {format(new Date(shift.start_time), "h:mm a")} - {format(new Date(shift.end_time), "h:mm a")}
            </div>
            {shift.role && <div className="text-xs text-muted-foreground mt-1">Role: {shift.role}</div>}
          </div>
          <div className="flex flex-col items-end">
            {statusBadge}
            <Badge variant="outline" className="mt-2">{shift.shift_type}</Badge>
          </div>
        </div>
        
        {shift.description && (
          <div className="mt-3 text-sm">
            <div className="text-muted-foreground">{shift.description}</div>
          </div>
        )}
        
        {isToday(shiftDate) && shift.status !== "completed" && (
          <div className="mt-3 flex justify-end">
            <Button variant="outline" size="sm">Check In</Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
