import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { ScheduleProvider } from "@/context/ScheduleContext";
import { ShiftsProvider } from "@/context/ShiftsContext";
import { useAuth } from "@/context/AuthContext";
import ShiftsView from "@/components/schedule/ShiftsView";
import RequestsView from "@/components/schedule/RequestsView";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, ClipboardList } from "lucide-react";

const Schedule = () => {
  const { users } = useAuth();

  return (
    <ScheduleProvider>
      <ShiftsProvider>
      <MainLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold tracking-tight">Schedule</h1>
          </div>

          <Tabs defaultValue="shifts" className="w-full">
            <TabsList>
              <TabsTrigger value="shifts" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Shifts
              </TabsTrigger>
              <TabsTrigger value="requests" className="flex items-center gap-2">
                <ClipboardList className="h-4 w-4" />
                Requests
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="shifts" className="mt-6">
              <ShiftsView />
            </TabsContent>
            
            <TabsContent value="requests" className="mt-6">
                <RequestsView users={users || []} />
            </TabsContent>
          </Tabs>
        </div>
      </MainLayout>
      </ShiftsProvider>
    </ScheduleProvider>
  );
};

export default Schedule;
