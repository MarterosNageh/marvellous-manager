
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
import { CalendarClock, Users, AlertCircle } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

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
  const [errorDetails, setErrorDetails] = useState<string | null>(null);

  // Fetch shifts from our edge function
  const fetchShifts = async () => {
    try {
      console.log("Invoking connecteam-shifts function...");
      const { data, error } = await supabase.functions.invoke("connecteam-shifts");
      
      if (error) {
        console.error("Supabase function error:", error);
        throw new Error(error.message || "Failed to invoke shifts function");
      }
      
      if (data?.error) {
        console.error("API error:", data.error, data.details);
        setErrorDetails(data.details || data.error);
        throw new Error(data.error);
      }
      
      console.log("Shifts fetched successfully:", data?.shifts?.length || 0);
      setErrorDetails(null);
      return data?.shifts || [];
    } catch (error: any) {
      console.error("Error fetching shifts:", error);
      toast({
        title: "Error fetching shifts",
        description: error.message || "Failed to load shifts from Connecteam",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Use tanstack query to fetch and cache shifts
  const { data: shifts, isLoading, error, refetch } = useQuery({
    queryKey: ["shifts"],
    queryFn: fetchShifts,
    retry: 1,
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
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Shifts Schedule</h1>
          <button 
            onClick={() => refetch()} 
            className="px-4 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Refresh Shifts
          </button>
        </div>
        
        {errorDetails && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error connecting to Connecteam API</AlertTitle>
            <AlertDescription className="max-h-40 overflow-auto">
              <p>There was an issue fetching shifts from Connecteam. Please check:</p>
              <ul className="list-disc list-inside ml-4 mt-2">
                <li>Your API key is correct in Supabase secrets</li>
                <li>Your Connecteam account has the necessary permissions</li>
                <li>The API endpoint is accessible from the Supabase edge function</li>
              </ul>
              <div className="mt-2 p-2 bg-gray-900 text-white text-xs rounded">
                <pre>{errorDetails}</pre>
              </div>
            </AlertDescription>
          </Alert>
        )}
        
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
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>
                    {date ? format(date, "MMMM d, yyyy") : "All Shifts"}
                  </CardTitle>
                  <CardDescription>
                    {filteredShifts?.length 
                      ? `${filteredShifts.length} shift${filteredShifts.length !== 1 ? 's' : ''} scheduled`
                      : "No shifts scheduled for this date"}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2 text-gray-500">
                  <CalendarClock className="h-5 w-5" />
                  <span className="text-sm">
                    Showing shifts from {shifts?.length || 0} days
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : error ? (
                <div className="text-center py-6">
                  <AlertCircle className="h-10 w-10 text-red-500 mx-auto mb-2" />
                  <h3 className="text-lg font-medium mb-2">Failed to load shifts</h3>
                  <p className="text-gray-500 mb-4">
                    There was a problem connecting to the Connecteam API.
                  </p>
                  <button 
                    onClick={() => refetch()} 
                    className="px-4 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                  >
                    Try Again
                  </button>
                </div>
              ) : filteredShifts?.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Shift</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Status</TableHead>
                      {date ? null : <TableHead>Date</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredShifts.map((shift: Shift) => (
                      <TableRow key={shift.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-gray-400" />
                            {shift.employee?.name || "Unassigned"}
                          </div>
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
                        {date ? null : (
                          <TableCell>
                            {format(parseISO(shift.startTime), "MMM d, yyyy")}
                          </TableCell>
                        )}
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
