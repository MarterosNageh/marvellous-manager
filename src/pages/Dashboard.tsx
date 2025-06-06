import React, { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Calendar, CheckCircle, Clock, Users, HardDrive, FileText, Bell, Plus } from "lucide-react";
import { TaskUtilizationTable } from "@/components/dashboard/TaskUtilizationTable";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { format, isToday } from 'date-fns';
import { ShiftsProvider } from "@/context/ShiftsContext";

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
    totalUsers: 0,
    totalHardDrives: 0,
    totalNotes: 0,
    activeShifts: 0
  });

  const [recentActivity, setRecentActivity] = useState([]);
  const [tasksByStatus, setTasksByStatus] = useState([]);
  const [tasksByPriority, setTasksByPriority] = useState([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch tasks
      const { data: tasks, error: tasksError } = await supabase
        .from('tasks')
        .select('*');

      if (tasksError) throw tasksError;

      // Fetch users
      const { data: users, error: usersError } = await supabase
        .from('auth_users')
        .select('*');

      if (usersError) throw usersError;

      // Fetch hard drives
      const { data: hardDrives, error: hardDrivesError } = await supabase
        .from('hard_drives')
        .select('*');

      if (hardDrivesError) throw hardDrivesError;

      // Fetch notes
      const { data: notes, error: notesError } = await supabase
        .from('notes')
        .select('*');

      if (notesError) throw notesError;

      // Fetch shifts for today
      const { data: shifts, error: shiftsError } = await supabase
        .from('shifts')
        .select('*');

      if (shiftsError) throw shiftsError;

      // Calculate stats
      const completedTasks = tasks?.filter(task => task.status === 'completed').length || 0;
      const pendingTasks = tasks?.filter(task => task.status === 'pending').length || 0;
      const activeShifts = shifts?.filter(shift => {
        if (!shift.start_time) return false;
        try {
          return isToday(new Date(shift.start_time));
        } catch {
          return false;
        }
      }).length || 0;

      setStats({
        totalTasks: tasks?.length || 0,
        completedTasks,
        pendingTasks,
        totalUsers: users?.length || 0,
        totalHardDrives: hardDrives?.length || 0,
        totalNotes: notes?.length || 0,
        activeShifts
      });

      // Group tasks by status for chart
      const statusGroups = tasks?.reduce((acc, task) => {
        acc[task.status] = (acc[task.status] || 0) + 1;
        return acc;
      }, {}) || {};

      const statusData = Object.entries(statusGroups).map(([status, count]) => ({
        name: status.charAt(0).toUpperCase() + status.slice(1),
        value: count,
        color: getStatusColor(status)
      }));

      setTasksByStatus(statusData);

      // Group tasks by priority for chart
      const priorityGroups = tasks?.reduce((acc, task) => {
        acc[task.priority] = (acc[task.priority] || 0) + 1;
        return acc;
      }, {}) || {};

      const priorityData = Object.entries(priorityGroups).map(([priority, count]) => ({
        name: priority.charAt(0).toUpperCase() + priority.slice(1),
        value: count,
        color: getPriorityColor(priority)
      }));

      setTasksByPriority(priorityData);

      // Recent activity (last 10 tasks)
      const recentTasks = tasks?.slice(-10).reverse().map(task => ({
        id: task.id,
        title: task.title,
        status: task.status,
        created_at: task.created_at,
        type: 'task'
      })) || [];

      setRecentActivity(recentTasks);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#10b981';
      case 'in_progress': return '#f59e0b';
      case 'pending': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#6b7280';
    }
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  return (
    <ShiftsProvider>
      <MainLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <Button onClick={() => window.location.href = '/task-manager'}>
              <Plus className="mr-2 h-4 w-4" />
              Quick Actions
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalTasks}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.completedTasks} completed, {stats.pendingTasks} pending
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalUsers}</div>
                <p className="text-xs text-muted-foreground">
                  Registered users in system
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Hard Drives</CardTitle>
                <HardDrive className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalHardDrives}</div>
                <p className="text-xs text-muted-foreground">
                  Total drives tracked
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Today's Shifts</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.activeShifts}</div>
                <p className="text-xs text-muted-foreground">
                  Active shifts today
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts and Recent Activity */}
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="tasks">Task Analytics</TabsTrigger>
              <TabsTrigger value="activity">Recent Activity</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                  <CardHeader>
                    <CardTitle>Task Status Distribution</CardTitle>
                  </CardHeader>
                  <CardContent className="pl-2">
                    <ResponsiveContainer width="100%" height={350}>
                      <BarChart data={tasksByStatus}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="value" fill="#8884d8" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card className="col-span-3">
                  <CardHeader>
                    <CardTitle>Task Priority Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={350}>
                      <PieChart>
                        <Pie
                          data={tasksByPriority}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {tasksByPriority.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="tasks" className="space-y-4">
              <TaskUtilizationTable />
            </TabsContent>

            <TabsContent value="activity" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>
                    Latest updates across the system
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentActivity.map((activity) => (
                      <div key={activity.id} className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          {activity.type === 'task' && <CheckCircle className="h-4 w-4 text-blue-500" />}
                        </div>
                        <div className="flex-1 space-y-1">
                          <p className="text-sm font-medium leading-none">
                            {activity.title}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {activity.created_at && format(new Date(activity.created_at), 'MMM d, yyyy at h:mm a')}
                          </p>
                        </div>
                        <Badge variant={activity.status === 'completed' ? 'default' : 'secondary'}>
                          {activity.status}
                        </Badge>
                      </div>
                    ))}
                    {recentActivity.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No recent activity to display
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </MainLayout>
    </ShiftsProvider>
  );
};

export default Dashboard;
