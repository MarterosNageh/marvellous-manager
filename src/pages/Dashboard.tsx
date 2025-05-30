import React, { useMemo } from 'react';
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  TrendingUp, 
  Users, 
  HardDrive, 
  FolderOpen, 
  Clock, 
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Zap
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useShifts } from "@/context/ShiftsContext";
import { ShiftsProvider } from "@/context/ShiftsContext";
import { format } from 'date-fns';

const DashboardContent = () => {
  const { currentUser, users } = useAuth();
  const { shifts, shiftRequests } = useShifts();

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    }
  });

  const { data: hardDrives = [] } = useQuery({
    queryKey: ['hard_drives'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hard_drives')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    }
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          task_assignments(user_id)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    }
  });

  // Current and today's shifts
  const currentShifts = useMemo(() => {
    const now = new Date();
    return shifts.filter(shift => {
      const shiftStart = new Date(shift.start_time);
      const shiftEnd = new Date(shift.end_time);
      return shiftStart <= now && shiftEnd >= now && shift.status === 'scheduled';
    });
  }, [shifts]);

  const todayShifts = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    return shifts.filter(shift => {
      const shiftDate = new Date(shift.start_time);
      return shiftDate >= today && shiftDate < tomorrow && shift.status === 'scheduled';
    });
  }, [shifts]);

  // Time off and extra shift requests
  const timeOffRequests = useMemo(() => {
    return shiftRequests.filter(req => req.request_type === 'time_off' && req.status === 'pending');
  }, [shiftRequests]);

  const extraShiftRequests = useMemo(() => {
    return shiftRequests.filter(req => req.request_type === 'extra_shift' && req.status === 'pending');
  }, [shiftRequests]);

  // Project statistics
  const projectStats = useMemo(() => {
    const total = projects.length;
    const active = projects.filter(p => p.status === 'active').length;
    const completed = projects.filter(p => p.status === 'completed').length;
    return { total, active, completed };
  }, [projects]);

  // Hard drive statistics
  const hardDriveStats = useMemo(() => {
    const total = hardDrives.length;
    const available = hardDrives.filter(hd => hd.status === 'available').length;
    const inUse = hardDrives.filter(hd => hd.status === 'in_use').length;
    const backup = hardDrives.filter(hd => hd.status === 'backup').length;
    return { total, available, inUse, backup };
  }, [hardDrives]);

  // Low space alerts by project
  const lowSpaceAlerts = useMemo(() => {
    const projectAlerts = [];
    
    projects.forEach(project => {
      const projectHardDrives = hardDrives.filter(hd => hd.project_id === project.id);
      
      if (projectHardDrives.length > 0) {
        // Get the latest hard drive (most recent backup)
        const latestHardDrive = projectHardDrives
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
        
        // Check if the latest hard drive has low space (less than 20% free)
        if (latestHardDrive.free_space && latestHardDrive.capacity) {
          const freeSpaceNum = parseFloat(latestHardDrive.free_space.replace(/[^\d.]/g, ''));
          const capacityNum = parseFloat(latestHardDrive.capacity.replace(/[^\d.]/g, ''));
          const freeSpacePercent = (freeSpaceNum / capacityNum) * 100;
          
          if (freeSpacePercent < 20) {
            projectAlerts.push({
              project: project.name,
              hardDrive: latestHardDrive.name,
              freeSpace: latestHardDrive.free_space,
              capacity: latestHardDrive.capacity,
              freeSpacePercent
            });
          }
        }
      }
    });
    
    return projectAlerts;
  }, [projects, hardDrives]);

  // Hard drives by project
  const hardDrivesByProject = useMemo(() => {
    return projects.map(project => {
      const projectHardDrives = hardDrives.filter(hd => hd.project_id === project.id);
      return {
        projectName: project.name,
        count: projectHardDrives.length,
        available: projectHardDrives.filter(hd => hd.status === 'available').length,
        inUse: projectHardDrives.filter(hd => hd.status === 'in_use').length,
        backup: projectHardDrives.filter(hd => hd.status === 'backup').length
      };
    }).filter(item => item.count > 0);
  }, [projects, hardDrives]);

  // Project and task utilization
  const projectUtilization = useMemo(() => {
    return projects.map(project => {
      const projectTasks = tasks.filter(task => task.project_id === project.id);
      const completedTasks = projectTasks.filter(task => task.status === 'completed');
      const progress = projectTasks.length > 0 ? (completedTasks.length / projectTasks.length) * 100 : 0;
      
      return {
        name: project.name,
        totalTasks: projectTasks.length,
        completedTasks: completedTasks.length,
        progress
      };
    });
  }, [projects, tasks]);

  // Tasks per user
  const tasksPerUser = useMemo(() => {
    return users.map(user => {
      const userTasks = tasks.filter(task => 
        task.task_assignments?.some(assignment => assignment.user_id === user.id)
      );
      const completedTasks = userTasks.filter(task => task.status === 'completed');
      
      return {
        username: user.username,
        totalTasks: userTasks.length,
        completedTasks: completedTasks.length,
        pendingTasks: userTasks.filter(task => task.status === 'pending').length,
        inProgressTasks: userTasks.filter(task => task.status === 'in_progress').length
      };
    }).filter(user => user.totalTasks > 0);
  }, [users, tasks]);

  return (
    <MainLayout>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-lg">
                <TrendingUp className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Dashboard
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Welcome back, {currentUser?.username}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Current Activity Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Currently Working */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-green-700 dark:text-green-300">
                  <Clock className="mr-2 h-5 w-5" />
                  Currently Working ({currentShifts.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {currentShifts.length > 0 ? (
                  <div className="space-y-2">
                    {currentShifts.map((shift) => (
                      <div key={shift.id} className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-950 rounded">
                        <div className="flex items-center space-x-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-xs">
                              {shift.user?.username?.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-medium">{shift.user?.username}</span>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {shift.shift_type}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No one is currently working</p>
                )}
              </CardContent>
            </Card>

            {/* Today's Shifts */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-blue-700 dark:text-blue-300">
                  <Calendar className="mr-2 h-5 w-5" />
                  Today's Shifts ({todayShifts.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {todayShifts.length > 0 ? (
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {todayShifts.map((shift) => (
                      <div key={shift.id} className="flex items-center justify-between p-2 bg-blue-50 dark:bg-blue-950 rounded">
                        <div className="flex items-center space-x-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-xs">
                              {shift.user?.username?.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-medium">{shift.user?.username}</span>
                        </div>
                        <span className="text-xs text-gray-600">
                          {format(new Date(shift.start_time), 'HH:mm')} - {format(new Date(shift.end_time), 'HH:mm')}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No shifts scheduled for today</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Alerts Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Time Off Requests */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-orange-700 dark:text-orange-300">
                  <AlertTriangle className="mr-2 h-5 w-5" />
                  Time Off Requests ({timeOffRequests.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {timeOffRequests.length > 0 ? (
                  <div className="space-y-2">
                    {timeOffRequests.slice(0, 3).map((request) => {
                      const user = users.find(u => u.id === request.user_id);
                      return (
                        <div key={request.id} className="flex items-center justify-between p-2 bg-orange-50 dark:bg-orange-950 rounded">
                          <span className="text-sm font-medium">{user?.username}</span>
                          <Badge variant="outline" className="text-xs">Pending</Badge>
                        </div>
                      );
                    })}
                    {timeOffRequests.length > 3 && (
                      <p className="text-xs text-gray-500">+{timeOffRequests.length - 3} more requests</p>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No pending time off requests</p>
                )}
              </CardContent>
            </Card>

            {/* Extra Shift Requests */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-purple-700 dark:text-purple-300">
                  <Zap className="mr-2 h-5 w-5" />
                  Extra Shift Requests ({extraShiftRequests.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {extraShiftRequests.length > 0 ? (
                  <div className="space-y-2">
                    {extraShiftRequests.slice(0, 3).map((request) => {
                      const user = users.find(u => u.id === request.user_id);
                      return (
                        <div key={request.id} className="flex items-center justify-between p-2 bg-purple-50 dark:bg-purple-950 rounded">
                          <span className="text-sm font-medium">{user?.username}</span>
                          <Badge variant="outline" className="text-xs">Pending</Badge>
                        </div>
                      );
                    })}
                    {extraShiftRequests.length > 3 && (
                      <p className="text-xs text-gray-500">+{extraShiftRequests.length - 3} more requests</p>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No pending extra shift requests</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center">
                  <FolderOpen className="mr-2 h-4 w-4" />
                  Total Projects
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{projectStats.total}</div>
                <p className="text-xs text-gray-600">
                  {projectStats.active} active, {projectStats.completed} completed
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center">
                  <HardDrive className="mr-2 h-4 w-4" />
                  Hard Drives
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{hardDriveStats.total}</div>
                <p className="text-xs text-gray-600">
                  {hardDriveStats.available} available, {hardDriveStats.inUse} in use
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center">
                  <Users className="mr-2 h-4 w-4" />
                  Team Members
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{users.length}</div>
                <p className="text-xs text-gray-600">
                  {currentShifts.length} currently working
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center">
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Tasks
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{tasks.length}</div>
                <p className="text-xs text-gray-600">
                  {tasks.filter(t => t.status === 'completed').length} completed
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Low Space Alerts */}
          {lowSpaceAlerts.length > 0 && (
            <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
              <CardHeader>
                <CardTitle className="flex items-center text-red-800 dark:text-red-200">
                  <AlertTriangle className="mr-2 h-5 w-5" />
                  Low Backup Space Alerts
                </CardTitle>
                <CardDescription className="text-red-700 dark:text-red-300">
                  Latest backup drives with low space by project
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {lowSpaceAlerts.map((alert, index) => (
                    <div key={index} className="p-3 bg-white dark:bg-red-900 rounded border">
                      <div className="font-medium text-red-800 dark:text-red-200">
                        {alert.project}
                      </div>
                      <div className="text-sm text-red-600 dark:text-red-400">
                        Drive: {alert.hardDrive}
                      </div>
                      <div className="text-sm text-red-600 dark:text-red-400">
                        Free: {alert.freeSpace} / {alert.capacity}
                      </div>
                      <Progress 
                        value={100 - alert.freeSpacePercent} 
                        className="mt-2 h-2"
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Analytics Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Hard Drives by Project */}
            <Card>
              <CardHeader>
                <CardTitle>Hard Drives by Project</CardTitle>
                <CardDescription>Storage allocation across projects</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {hardDrivesByProject.slice(0, 5).map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="font-medium">{item.projectName}</div>
                        <div className="text-sm text-gray-600">
                          {item.available} available, {item.inUse} in use, {item.backup} backup
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">{item.count}</div>
                        <div className="text-xs text-gray-500">drives</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Project Utilization */}
            <Card>
              <CardHeader>
                <CardTitle>Project Progress</CardTitle>
                <CardDescription>Task completion by project</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {projectUtilization.slice(0, 5).map((project, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{project.name}</span>
                        <span className="text-sm text-gray-600">
                          {project.completedTasks}/{project.totalTasks} tasks
                        </span>
                      </div>
                      <Progress value={project.progress} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tasks per User */}
          <Card>
            <CardHeader>
              <CardTitle>Tasks per User</CardTitle>
              <CardDescription>Workload distribution across team members</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {tasksPerUser.slice(0, 6).map((user, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>{user.username.charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{user.username}</span>
                    </div>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Total:</span>
                        <span className="font-medium">{user.totalTasks}</span>
                      </div>
                      <div className="flex justify-between text-green-600">
                        <span>Completed:</span>
                        <span>{user.completedTasks}</span>
                      </div>
                      <div className="flex justify-between text-blue-600">
                        <span>In Progress:</span>
                        <span>{user.inProgressTasks}</span>
                      </div>
                      <div className="flex justify-between text-orange-600">
                        <span>Pending:</span>
                        <span>{user.pendingTasks}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
};

const Dashboard = () => (
  <ShiftsProvider>
    <DashboardContent />
  </ShiftsProvider>
);

export default Dashboard;
