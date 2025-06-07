
import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { ShiftsProvider } from "@/context/ShiftsContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { CreateShiftDialog } from "@/components/shifts/CreateShiftDialog";
import { WeeklyScheduleView } from "@/components/shifts/WeeklyScheduleView";
import { MonthlyScheduleView } from "@/components/shifts/MonthlyScheduleView";
import { DailyScheduleView } from "@/components/shifts/DailyScheduleView";
import { EmployeeShiftsList } from "@/components/shifts/EmployeeShiftsList";
import { ShiftRequestsPanel } from "@/components/shifts/ShiftRequestsPanel";
import { Plus, Calendar, Users, Clock, FileText } from "lucide-react";

const ShiftsSchedule = () => {
  return (
    <ShiftsProvider>
      <MainLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Shifts Schedule</h1>
              <p className="text-muted-foreground">
                Manage team schedules and shift assignments
              </p>
            </div>
            <CreateShiftDialog>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Shift
              </Button>
            </CreateShiftDialog>
          </div>

          <Tabs defaultValue="weekly" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="daily" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Daily
              </TabsTrigger>
              <TabsTrigger value="weekly" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Weekly
              </TabsTrigger>
              <TabsTrigger value="monthly" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Monthly
              </TabsTrigger>
              <TabsTrigger value="my-shifts" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                My Shifts
              </TabsTrigger>
              <TabsTrigger value="requests" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Requests
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="daily" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Daily Schedule
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <DailyScheduleView />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="weekly" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Weekly Schedule
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <WeeklyScheduleView />
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="monthly" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Monthly Schedule
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <MonthlyScheduleView />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="my-shifts" className="mt-6">
              <EmployeeShiftsList />
            </TabsContent>

            <TabsContent value="requests" className="mt-6">
              <ShiftRequestsPanel />
            </TabsContent>
          </Tabs>
        </div>
      </MainLayout>
    </ShiftsProvider>
  );
};

export default ShiftsSchedule;
