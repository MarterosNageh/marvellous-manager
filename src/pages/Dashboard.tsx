
import React, { useState, useEffect } from 'react';
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/context/AuthContext";
import { useData } from "@/context/DataContext";
import { supabase } from "@/integrations/supabase/client";
import { HardDrive, Calendar, Users, Clock, AlertTriangle, CheckCircle, BarChart } from "lucide-react";

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

const Dashboard = () => {
  const { currentUser } = useAuth();
  const { projects: dataProjects, hardDrives } = useData();
  const [currentShifts, setCurrentShifts] = useState<DashboardShift[]>([]);
  const [timeOffRequests, setTimeOffRequests] = useState<ShiftRequest[]>([]);
  const [projectsData, setProjectsData] = useState<ProjectData[]>([]);
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

        setCurrentShifts(currentShiftsData || []);

        // Fetch time-off requests (only show if there are any)
        const { data: requestsData } = await supabase
          .from('shift_requests')
          .select(`
            *,
            user:auth_users(username)
          `)
          .eq('request_type', 'time_off')
          .eq('status', 'pending');

        setTimeOffRequests(requestsData || []);

        // Fetch projects with their hard drives and tasks
        const { data: projectsWithData } = await supabase
          .from('projects')
          .select(`
            *,
            hard_drives(*),
            tasks(*)
          `);

        if (projectsWithData) {
          const processedProjects = projectsWithData.map(project => ({
            ...project,
            hardDrives: project.hard_drives || [],
            tasks: project.tasks || []
          }));
          setProjectsData(processedProjects);
        }

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Calculate low space alerts by project (only for latest backup drive)
  const getProjectLowSpaceAlerts = () => {
    return projectsData.map(project => {
      // Find the latest hard drive by creation date
      const latestBackup = project.hardDrives
        .filter(hd => hd.status === 'available')
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

      if (!latestBackup) return null;

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

  const lowSpaceAlerts = getProjectLowSpaceAlerts();

  // Project utilization data
  const getProjectUtilization = () => {
    return projectsData.map(project => {
      const totalTasks = project.tasks.length;
      const completedTasks = project.tasks.filter(task => task.status === 'completed').length;
      const completion = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

      return {
        name: project.name,
        totalTasks,
        completedTasks,
        completion: Math.round(completion),
        status: project.status
      };
    });
  };

  const projectUtilization = getProjectUtilization();

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
        {currentShifts.length > 0 && (
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
                        Until {new Date(shift.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <Badge className="bg-green-100 text-green-800">Active</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Time Off Requests - Only show if there are any */}
        {timeOffRequests.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-orange-600" />
                Pending Time Off Requests ({timeOffRequests.length})
              </CardTitle>
              <CardDescription>
                Time off requests requiring attention
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {timeOffRequests.map((request) => (
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
                          {new Date(request.start_date).toLocaleDateString()} 
                          {request.end_date && ` - ${new Date(request.end_date).toLocaleDateString()}`}
                        </p>
                        {request.reason && (
                          <p className="text-xs text-gray-500">{request.reason}</p>
                        )}
                      </div>
                    </div>
                    <Badge variant="outline" className="text-orange-600">
                      Pending
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Low Space Alerts by Project */}
        {lowSpaceAlerts.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                Storage Alerts ({lowSpaceAlerts.length})
              </CardTitle>
              <CardDescription>
                Latest backup drives with low storage space by project
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {lowSpaceAlerts.map((alert, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200">
                    <div className="flex items-center space-x-3">
                      <HardDrive className="h-8 w-8 text-red-600" />
                      <div>
                        <p className="font-medium text-gray-900">{alert.project}</p>
                        <p className="text-sm text-gray-600">Latest backup: {alert.hardDrive}</p>
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

        {/* Project & Task Utilization */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart className="h-5 w-5" />
              Project Task Progress
            </CardTitle>
            <CardDescription>
              Task completion progress across all projects
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {projectUtilization.map((project) => (
                <div key={project.name} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <h4 className="font-medium">{project.name}</h4>
                      <Badge variant={project.status === 'active' ? 'default' : 'secondary'}>
                        {project.status}
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-600">
                      {project.completedTasks}/{project.totalTasks} tasks
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Progress value={project.completion} className="flex-1" />
                    <span className="text-sm font-medium w-12 text-right">
                      {project.completion}%
                    </span>
                  </div>
                </div>
              ))}
              {projectUtilization.length === 0 && (
                <div className="text-center py-4 text-gray-500">
                  No projects available
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
