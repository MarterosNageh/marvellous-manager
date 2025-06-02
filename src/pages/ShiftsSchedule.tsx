
import React, { useState } from 'react';
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CalendarDays, Clock, Users, Plus, UserCheck } from 'lucide-react';
import { DailyScheduleView } from '@/components/shifts/DailyScheduleView';
import { WeeklyScheduleView } from '@/components/shifts/WeeklyScheduleView';
import { MonthlyScheduleView } from '@/components/shifts/MonthlyScheduleView';
import { EmployeeShiftsList } from '@/components/shifts/EmployeeShiftsList';
import { ShiftRequestsPanel } from '@/components/shifts/ShiftRequestsPanel';
import { CreateShiftDialog } from '@/components/shifts/CreateShiftDialog';
import { ShiftRequestDialog } from '@/components/shifts/ShiftRequestDialog';
import { ShiftsProvider } from '@/context/ShiftsContext';
import { useAuth } from '@/context/AuthContext';

const ShiftsSchedule = () => {
  const { currentUser } = useAuth();
  const [createShiftOpen, setCreateShiftOpen] = useState(false);
  const [requestShiftOpen, setRequestShiftOpen] = useState(false);

  const isManager = currentUser?.role === 'manager' || currentUser?.isAdmin;

  return (
    <ShiftsProvider>
      <MainLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Shift Schedule</h1>
              <p className="text-muted-foreground">
                Manage employee shifts and scheduling
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={() => setRequestShiftOpen(true)}>
                <UserCheck className="h-4 w-4 mr-2" />
                Request Time Off
              </Button>
              {isManager && (
                <Button onClick={() => setCreateShiftOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Shift
                </Button>
              )}
            </div>
          </div>

          <Tabs defaultValue="weekly" className="space-y-4">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="daily" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Daily
              </TabsTrigger>
              <TabsTrigger value="weekly" className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4" />
                Weekly
              </TabsTrigger>
              <TabsTrigger value="monthly" className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4" />
                Monthly
              </TabsTrigger>
              <TabsTrigger value="employees" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Employees
              </TabsTrigger>
              {isManager && (
                <TabsTrigger value="approvals" className="flex items-center gap-2">
                  <UserCheck className="h-4 w-4" />
                  Approvals
                </TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="daily">
              <DailyScheduleView />
            </TabsContent>

            <TabsContent value="weekly">
              <WeeklyScheduleView />
            </TabsContent>

            <TabsContent value="monthly">
              <MonthlyScheduleView />
            </TabsContent>

            <TabsContent value="employees">
              <EmployeeShiftsList />
            </TabsContent>

            {isManager && (
              <TabsContent value="approvals">
                <ShiftRequestsPanel />
              </TabsContent>
            )}
          </Tabs>

          {/* Dialogs */}
          <CreateShiftDialog 
            open={createShiftOpen} 
            onOpenChange={setCreateShiftOpen} 
          />
          
          <ShiftRequestDialog 
            open={requestShiftOpen} 
            onOpenChange={setRequestShiftOpen} 
          />
        </div>
      </MainLayout>
    </ShiftsProvider>
  );
};

export default ShiftsSchedule;
