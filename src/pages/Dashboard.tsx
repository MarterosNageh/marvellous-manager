
import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { useAuth } from "@/context/AuthContext";
import { useTasks } from "@/context/TaskContext";
import { useShifts } from "@/context/ShiftsContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Users, CheckCircle, Clock, Calendar, User, MapPin } from "lucide-react";
import { TaskUtilizationTable } from "@/components/dashboard/TaskUtilizationTable";
import { TaskBoard } from "@/components/tasks/TaskBoard";
import { CreateTaskDialog } from "@/components/tasks/CreateTaskDialog";
import { format } from "date-fns";
import { ShiftsProvider } from "@/context/ShiftsContext";

const DashboardContent = () => {
  const { currentUser } = useAuth();
  const { tasks, getTasksByStatus } = useTasks();
  const { getCurrentShifts, getTodayShifts, loading: shiftsLoading } = useShifts();
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);

  const todoTasks = getTasksByStatus("To Do");
  const inProgressTasks = getTasksByStatus("In Progress");
  const completedTasks = getTasksByStatus("Done");
  
  const currentShifts = getCurrentShifts();
  const todayShifts = getTodayShifts();

  const getShiftTypeColor = (type: string) => {
    switch (type) {
      case 'morning':
        return 'bg-blue-100 text-blue-800';
      case 'evening':
        return 'bg-orange-100 text-orange-800';
      case 'night':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Welcome back, {currentUser?.username}!
            </h1>
            <p className="text-muted-foreground">
              Here's what's happening with your team today.
            </p>
          </div>
          {currentUser?.isAdmin && (
            <Button onClick={() => setIsCreateTaskOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Task
            </Button>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tasks.length}</div>
              <p className="text-xs text-muted-foreground">
                {completedTasks.length} completed
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Progress</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{inProgressTasks.length}</div>
              <p className="text-xs text-muted-foreground">
                {todoTasks.length} pending
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Working Now</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {shiftsLoading ? '...' : currentShifts.length}
              </div>
              <p className="text-xs text-muted-foreground">
                {shiftsLoading ? 'Loading...' : `${todayShifts.length} shifts today`}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Schedule</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {shiftsLoading ? '...' : todayShifts.length}
              </div>
              <p className="text-xs text-muted-foreground">
                Total shifts scheduled
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Current Shifts Section */}
        {!shiftsLoading && currentShifts.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Currently Working ({currentShifts.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {currentShifts.map((shift) => (
                  <div
                    key={shift.id}
                    className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  >
                    <div className="bg-green-100 dark:bg-green-900 p-2 rounded-full">
                      <User className="h-4 w-4 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">
                          {shift.user?.username}
                        </span>
                        <Badge 
                          variant="secondary" 
                          className={getShiftTypeColor(shift.shift_type)}
                        >
                          {shift.shift_type}
                        </Badge>
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        {shift.title}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {format(new Date(shift.start_time), 'HH:mm')} - 
                          {format(new Date(shift.end_time), 'HH:mm')}
                        </div>
                        {shift.role && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {shift.role}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Task Board */}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <TaskBoard />
          </div>
          <div>
            <TaskUtilizationTable />
          </div>
        </div>

        {/* Create Task Dialog */}
        <CreateTaskDialog 
          open={isCreateTaskOpen}
          onOpenChange={setIsCreateTaskOpen}
        />
      </div>
    </MainLayout>
  );
};

const Dashboard = () => {
  return (
    <ShiftsProvider>
      <DashboardContent />
    </ShiftsProvider>
  );
};

export default Dashboard;
