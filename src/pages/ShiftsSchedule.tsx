
import React, { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { ShiftsProvider } from '@/context/ShiftsContext';
import { DailyScheduleView } from '@/components/shifts/DailyScheduleView';
import WeeklyScheduleView from '@/components/shifts/WeeklyScheduleView';
import MonthlyScheduleView from '@/components/shifts/MonthlyScheduleView';
import { EmployeeShiftsList } from '@/components/shifts/EmployeeShiftsList';
import { ShiftRequestsPanel } from '@/components/shifts/ShiftRequestsPanel';
import { CreateShiftDialog } from '@/components/shifts/CreateShiftDialog';
import { ShiftRequestDialog } from '@/components/shifts/ShiftRequestDialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Calendar, Users, MessageSquare } from 'lucide-react';

const ShiftsSchedule = () => {
  const [createShiftOpen, setCreateShiftOpen] = useState(false);
  const [requestShiftOpen, setRequestShiftOpen] = useState(false);

  return (
    <ShiftsProvider>
      <MainLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold tracking-tight">Shifts Schedule</h1>
            <div className="flex gap-2">
              <ShiftRequestDialog open={requestShiftOpen} onOpenChange={setRequestShiftOpen}>
                <Button variant="outline" onClick={() => setRequestShiftOpen(true)}>
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Request Shift
                </Button>
              </ShiftRequestDialog>
              <CreateShiftDialog open={createShiftOpen} onOpenChange={setCreateShiftOpen}>
                <Button onClick={() => setCreateShiftOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Shift
                </Button>
              </CreateShiftDialog>
            </div>
          </div>

          <Tabs defaultValue="daily" className="w-full">
            <TabsList>
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
              <TabsTrigger value="employees" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Employees
              </TabsTrigger>
              <TabsTrigger value="requests" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Requests
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="daily" className="mt-6">
              <DailyScheduleView />
            </TabsContent>
            
            <TabsContent value="weekly" className="mt-6">
              <WeeklyScheduleView />
            </TabsContent>
            
            <TabsContent value="monthly" className="mt-6">
              <MonthlyScheduleView />
            </TabsContent>
            
            <TabsContent value="employees" className="mt-6">
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
