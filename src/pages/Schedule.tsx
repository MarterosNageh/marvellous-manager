
import { useAuth } from "@/context/AuthContext";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, User, Users, Settings, Plus } from "lucide-react";
import { useState } from "react";
import { useSchedule } from "@/context/ScheduleContext";
import DailyView from "@/components/schedule/DailyView";
import WeeklyView from "@/components/schedule/WeeklyView";
import MonthlyView from "@/components/schedule/MonthlyView";
import ShiftsView from "@/components/schedule/ShiftsView";
import RequestsView from "@/components/schedule/RequestsView";
import ShiftDialog from "@/components/schedule/ShiftDialog";
import MobileScheduleView from "@/components/schedule/MobileScheduleView";
import { useIsMobile } from "@/hooks/use-mobile";

const Schedule = () => {
  const { currentUser } = useAuth();
  const { shifts, templates, loading } = useSchedule();
  const [currentView, setCurrentView] = useState<'daily' | 'weekly' | 'monthly' | 'shifts' | 'requests'>('weekly');
  const [showShiftDialog, setShowShiftDialog] = useState(false);
  const isMobile = useIsMobile();

  const views = [
    { key: 'daily' as const, label: 'Daily', icon: Calendar },
    { key: 'weekly' as const, label: 'Weekly', icon: Calendar },
    { key: 'monthly' as const, label: 'Monthly', icon: Calendar },
    { key: 'shifts' as const, label: 'Shifts', icon: Clock },
    { key: 'requests' as const, label: 'Requests', icon: Users },
  ];

  const stats = [
    {
      title: "Total Shifts",
      value: shifts.length,
      icon: Clock,
      description: "Active shifts"
    },
    {
      title: "Your Role",
      value: currentUser?.role || 'Unknown',
      icon: User,
      description: currentUser?.username || 'Not logged in'
    }
  ];

  if (isMobile) {
    return (
      <MainLayout>
        <MobileScheduleView />
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Schedule Management</h1>
          <Button onClick={() => setShowShiftDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Shift
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">{stat.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* View Tabs */}
        <div className="flex space-x-2 border-b">
          {views.map((view) => (
            <Button
              key={view.key}
              variant={currentView === view.key ? "default" : "ghost"}
              onClick={() => setCurrentView(view.key)}
              className="flex items-center space-x-2"
            >
              <view.icon className="h-4 w-4" />
              <span>{view.label}</span>
            </Button>
          ))}
        </div>

        {/* View Content */}
        <div className="space-y-4">
          {currentView === 'daily' && <DailyView selectedDate={new Date()} onEditShift={() => {}} onDeleteShift={() => {}} onDateChange={() => {}} shifts={shifts} users={[]} />}
          {currentView === 'weekly' && <WeeklyView startDate={new Date()} selectedDate={new Date()} shifts={shifts} onAddShift={() => setShowShiftDialog(true)} onDateChange={() => {}} onEditShift={() => {}} onDeleteShift={() => {}} onUpdateShift={() => {}} users={[]} refreshData={() => {}} />}
          {currentView === 'monthly' && <MonthlyView selectedDate={new Date()} onEditShift={() => {}} onDeleteShift={() => {}} onDateChange={() => {}} shifts={shifts} users={[]} />}
          {currentView === 'shifts' && <ShiftsView />}
          {currentView === 'requests' && <RequestsView users={[]} />}
        </div>

        {showShiftDialog && (
          <ShiftDialog
            open={showShiftDialog}
            onClose={() => setShowShiftDialog(false)}
            onSave={() => setShowShiftDialog(false)}
            templates={templates}
            users={[]}
          />
        )}
      </div>
    </MainLayout>
  );
};

export default Schedule;
