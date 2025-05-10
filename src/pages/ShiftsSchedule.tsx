
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { MainLayout } from "@/components/layout/MainLayout";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

// Define interfaces for shift data
interface Employee {
  id: string;
  name: string;
}

interface Shift {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  status: string;
  employee: Employee;
  location?: string;
  notes?: string;
}

const ShiftsSchedule = () => {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const { toast } = useToast();

  // Fetch shifts from our edge function
  const fetchShifts = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("connecteam-shifts");
      
      if (error) throw new Error(error.message);
      return data?.shifts || [];
    } catch (error) {
      console.error("Error fetching shifts:", error);
      toast({
        title: "Error fetching shifts",
        description: error.message,
        variant: "destructive",
      });
      return [];
    }
  };

  // Use tanstack query to fetch and cache shifts
  const { data: shifts, isLoading, error } = useQuery({
    queryKey: ["shifts"],
    queryFn: fetchShifts,
  });

  // Filter shifts by selected date
  const filteredShifts = shifts?.filter((shift: Shift) => {
    if (!date) return true;
    
    const shiftDate = new Date(shift.startTime).toDateString();
    const selectedDate = date.toDateString();
    return shiftDate === selectedDate;
  });

  // Format time from ISO string
  const formatTime = (dateString: string) => {
    try {
      return format(parseISO(dateString), "h:mm a");
    } catch (e) {
      return "Invalid time";
    }
  };

  // Get status color for badges
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "approved":
        return "bg-green-500";
      case "pending":
        return "bg-yellow-500";
      case "rejected":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <MainLayout>
      <div className="flex flex-col space-y-6">
        <h1 className="text-2xl font-bold">Shifts Schedule</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle>Select Date</CardTitle>
              <CardDescription>Choose a date to view shifts</CardDescription>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                className="rounded-md border"
              />
            </CardContent>
          </Card>
          
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>
                {date ? format(date, "MMMM d, yyyy") : "All Shifts"}
              </CardTitle>
              <CardDescription>
                {filteredShifts?.length 
                  ? `${filteredShifts.length} shift${filteredShifts.length !== 1 ? 's' : ''} scheduled`
                  : "No shifts scheduled for this date"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : error ? (
                <div className="text-center py-4 text-red-500">
                  Failed to load shifts. Please try again later.
                </div>
              ) : filteredShifts?.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Shift</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredShifts.map((shift: Shift) => (
                      <TableRow key={shift.id}>
                        <TableCell className="font-medium">
                          {shift.employee?.name || "Unassigned"}
                        </TableCell>
                        <TableCell>{shift.title}</TableCell>
                        <TableCell>
                          {formatTime(shift.startTime)} - {formatTime(shift.endTime)}
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(shift.status)}>
                            {shift.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No shifts found for the selected date.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
};

export default ShiftsSchedule;
