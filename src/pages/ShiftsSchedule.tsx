
import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { DailyScheduleView } from "@/components/shifts/DailyScheduleView";
import { WeeklyScheduleView } from "@/components/shifts/WeeklyScheduleView";
import { MonthlyScheduleView } from "@/components/shifts/MonthlyScheduleView";
import { EmployeeShiftsList } from "@/components/shifts/EmployeeShiftsList";
import { ShiftRequestsPanel } from "@/components/shifts/ShiftRequestsPanel";
import { CreateShiftDialog } from "@/components/shifts/CreateShiftDialog";
import { Plus } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const ShiftsSchedule = () => {
  const { currentUser } = useAuth();
  const [createShiftOpen, setCreateShiftOpen] = useState(false);
  
  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Staff Schedule</h1>
          {currentUser?.isAdmin && (
            <CreateShiftDialog 
              open={createShiftOpen} 
              onOpenChange={setCreateShiftOpen}
            >
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Shift
              </Button>
            </CreateShiftDialog>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Tabs defaultValue="daily">
              <TabsList className="mb-4">
                <TabsTrigger value="daily">Daily</TabsTrigger>
                <TabsTrigger value="weekly">Weekly</TabsTrigger>
                <TabsTrigger value="monthly">Monthly</TabsTrigger>
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
            </Tabs>
          </div>
          
          <div className="space-y-6">
            <EmployeeShiftsList />
            <ShiftRequestsPanel />
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default ShiftsSchedule;
