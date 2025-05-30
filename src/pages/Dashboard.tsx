
import React, { useState, useEffect } from 'react';
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/context/AuthContext";
import { useData } from "@/context/DataContext";
import { supabase } from "@/integrations/supabase/client";
import { HardDrive, Calendar, Users, Clock, AlertTriangle, CheckCircle, BarChart, FolderOpen } from "lucide-react";
import { format, isToday, isSameDay } from 'date-fns';

interface DashboardShift {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
  user_id: string;
  status: string;
  user?: {
    username: string;
  };
}

interface ShiftRequest {
  id: string;
  request_type: string;
  status: string;
  start_date: string;
  end_date?: string;
  reason?: string;
  user_id: string;
  user?: {
    username: string;
  };
}

interface ProjectData {
  id: string;
  name: string;
  description?: string;
  status: string;
  created_at: string;
  hardDrives: Array<{
    id: string;
    name: string;
    capacity: string;
    free_space: string;
    status: string;
    created_at: string;
  }>;
  tasks: Array<{
    id: string;
    title: string;
    status: string;
  }>;
}

interface UserUtilization {
  userId: string;
  username: string;
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  completionRate: number;
}

const Dashboard = () => {
  const { currentUser } = useAuth();
  const { projects: dataProjects, hardDrives } = useData();
  const [currentShifts, setCurrentShifts] = useState<DashboardShift[]>([]);
  const [todayTimeOffRequests, setTodayTimeOffRequests] = useState<ShiftRequest[]>([]);
  const [projectsData, setProjectsData] = useState<ProjectData[]>([]);
  const [userUtilization, setUserUtilization] = useState<UserUtilization[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        // Fetch currently active shifts
        const now = new Date().toISOString();
        const { data: currentShiftsData } = await supabase
          .from('shifts')
          .select(`
            *,
            user:auth_users(username)
          `)
          .lte('start_time', now)
          .gte('end_time', now)
          .eq('status', 'scheduled');

        if (currentShiftsData) {
          const shiftsWithUsers = currentShiftsData.map(shift => ({
            ...shift,
            user: { username: shift.user?.username || 'Unknown' }
          }));
          setCurrentShifts(shiftsWithUsers);
        }

        // Fetch today's time-off requests only
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        const { data: requestsData } = await supabase
          .from('shift_requests')
          .select(`
            *,
            user:auth_users(username)
          `)
          .eq('request_type', 'time_off')
          .gte('start_date', todayStart.toISOString())
          .lte('start_date', todayEnd.toISOString());

        if (requestsData) {
          const requestsWithUsers = requestsData.map(request => ({
            ...request,
            user: { username: request.user?.username || 'Unknown' }
          }));
          setTodayTimeOffRequests(requestsWithUsers);
        }

        // Fetch projects with their hard drives and tasks
        const { data: projectsWithData } = await supabase
          .from('projects')
          .select(`
            *,
            hard_drives(*),
            tasks(*)
          `)
          .order('created_at', { ascending: false })
          .limit(5);

        if (projectsWithData) {
          const processedProjects = projectsWithData.map(project => ({
            ...project,
            hardDrives: project.hard_drives || [],
            tasks: project.tasks || []
          }));
          setProjectsData(processedProjects);
        }

        // Fetch user utilization data
        const { data: usersData } = await supabase
          .from('auth_users')
          .select('id, username');

        const { data: tasksData } = await supabase
          .from('tasks')
          .select(`
            *,
            task_assignments(user_id)
          `);

        if (usersData && tasksData) {
          const utilization = usersData.map(user => {
            const userTasks = tasksData.filter(task => 
              task.task_assignments?.some((assignment: any) => assignment.user_id === user.id)
            );
            
            const totalTasks = userTasks.length;
            const completedTasks = userTasks.filter(task => task.status === 'completed').length;
            const inProgressTasks = userTasks.filter(task => task.status === 'in_progress').length;
            const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

            return {
              userId: user.id,
              username: user.username,
              totalTasks,
              completedTasks,
              inProgressTasks,
              completionRate: Math.round(completionRate)
            };
          }).filter(user => user.totalTasks > 0);

          setUserUtilization(utilization);
        }

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Calculate low space alerts for backup drives containing "BK"
  const getBackupDriveAlerts = () => {
    return projectsData.map(project => {
      // Find backup drives containing "BK" in the name
      const backupDrives = project.hardDrives
        .filter(hd => hd.name.includes('BK') && hd.status === 'available')
        .filter(hd => hd.free_space && hd.free_space !== 'N/A' && hd.free_space.trim() !== '')
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      if (backupDrives.length === 0) return null;

      const latestBackup = backupDrives[0];

      const getFreeSpacePercentage = (freeSpace: string, capacity: string) => {
        const free = parseFloat(freeSpace.replace(/[^\d.]/g, '')) || 0;
        const total = parseFloat(capacity.replace(/[^\d.]/g, '')) || 1;
        return (free / total) * 100;
      };

      const freeSpacePercent = getFreeSpacePercentage(latestBackup.free_space, latestBackup.capacity);
      const isLowSpace = freeSpacePercent < 20;

      return isLowSpace ? {
        project: project.name,
        hardDrive: latestBackup.name,
        freeSpacePercent,
        capacity: latestBackup.capacity,
        freeSpace: latestBackup.free_space
      } : null;
    }).filter(Boolean);
  };

  const backupDriveAlerts = getBackupDriveAlerts();

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading dashboard...</div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome back, {currentUser?.username}
          </h1>
          <p className="text-muted-foreground">
            Here's what's happening with your organization today.
          </p>
        </div>

        {/* Currently Working Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-green-600" />
              Currently Working ({currentShifts.length})
            </CardTitle>
            <CardDescription>
              Team members currently on shift
            </CardDescription>
          </CardHeader>
          <CardContent>
            {currentShifts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Clock className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No one is currently working</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {currentShifts.map((shift) => (
                  <div key={shift.id} className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg border border-green-200">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-green-100 text-green-700">
                        {shift.user?.username?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{shift.user?.username}</p>
                      <p className="text-sm text-gray-600">{shift.title}</p>
                      <p className="text-xs text-gray-500">
                        Until {format(new Date(shift.end_time), 'HH:mm')}
                      </p>
                    </div>
                    <Badge className="bg-green-100 text-green-800">Active</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Today's Time Off Requests */}
        {todayTimeOffRequests.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-orange-600" />
                Today's Time Off Requests ({todayTimeOffRequests.length})
              </CardTitle>
              <CardDescription>
                Time off requests for today
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {todayTimeOffRequests.map((request) => (
                  <div key={request.id} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-orange-100 text-orange-700 text-xs">
                          {request.user?.username?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-gray-900">{request.user?.username}</p>
                        <p className="text-sm text-gray-600">
                          {format(new Date(request.start_date), 'MMM d, yyyy')}
                          {request.end_date && ` - ${format(new Date(request.end_date), 'MMM d, yyyy')}`}
                        </p>
                        {request.reason && (
                          <p className="text-xs text-gray-500">{request.reason}</p>
                        )}
                      </div>
                    </div>
                    <Badge variant="outline" className="text-orange-600">
                      {request.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Backup Drive Storage Alerts */}
        {backupDriveAlerts.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                Backup Drive Storage Alerts ({backupDriveAlerts.length})
              </CardTitle>
              <CardDescription>
                Backup drives (BK) with low storage space
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {backupDriveAlerts.map((alert, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200">
                    <div className="flex items-center space-x-3">
                      <HardDrive className="h-8 w-8 text-red-600" />
                      <div>
                        <p className="font-medium text-gray-900">{alert.project}</p>
                        <p className="text-sm text-gray-600">Backup drive: {alert.hardDrive}</p>
                        <p className="text-xs text-gray-500">
                          {alert.freeSpace} free of {alert.capacity}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="destructive">
                        {alert.freeSpacePercent.toFixed(1)}% free
                      </Badge>
                      <p className="text-xs text-gray-500 mt-1">Low Space</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Projects */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderOpen className="h-5 w-5" />
              Recent Projects
            </CardTitle>
            <CardDescription>
              Latest 5 projects in the system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {projectsData.map((project) => (
                <div key={project.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <FolderOpen className="h-8 w-8 text-blue-600" />
                    <div>
                      <p className="font-medium text-gray-900">{project.name}</p>
                      <p className="text-sm text-gray-600">{project.description || 'No description'}</p>
                      <p className="text-xs text-gray-500">
                        Created {format(new Date(project.created_at), 'MMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant={project.status === 'active' ? 'default' : 'secondary'}>
                      {project.status}
                    </Badge>
                    <p className="text-xs text-gray-500 mt-1">
                      {project.tasks.length} tasks, {project.hardDrives.length} drives
                    </p>
                  </div>
                </div>
              ))}
              {projectsData.length === 0 && (
                <div className="text-center py-4 text-gray-500">
                  No projects available
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* User Utilization */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart className="h-5 w-5" />
              User Task Utilization
            </CardTitle>
            <CardDescription>
              Task completion rates by user
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {userUtilization.map((user) => (
                <div key={user.userId} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-blue-100 text-blue-600 text-xs">
                          {user.username.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <h4 className="font-medium">{user.username}</h4>
                    </div>
                    <div className="text-sm text-gray-600">
                      {user.completedTasks}/{user.totalTasks} completed ({user.inProgressTasks} in progress)
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Progress value={user.completionRate} className="flex-1" />
                    <span className="text-sm font-medium w-12 text-right">
                      {user.completionRate}%
                    </span>
                  </div>
                </div>
              ))}
              {userUtilization.length === 0 && (
                <div className="text-center py-4 text-gray-500">
                  No user task data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default Dashboard;
