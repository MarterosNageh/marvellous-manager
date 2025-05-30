
import React, { useMemo } from 'react';
import { MainLayout } from "@/components/layout/MainLayout";
import { useAuth } from "@/context/AuthContext";
import { useTask } from "@/context/TaskContext";
import { useShifts } from "@/context/ShiftsContext";
import { useData } from "@/context/DataContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { 
  Calendar, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  HardDrive, 
  BarChart3, 
  TrendingUp, 
  Users,
  Activity,
  User,
  Plus,
  AlertTriangle
} from "lucide-react";
import { ShiftsProvider } from '@/context/ShiftsContext';
import { format } from 'date-fns';
import { TaskBoard } from '@/components/tasks/TaskBoard';

const DashboardContent = () => {
  const { currentUser, users } = useAuth();
  const { tasks, projects } = useTask();
  const { shifts, shiftRequests } = useShifts();
  const { hardDrives } = useData();

  // Helper function to get tasks by status
  const getTasksByStatus = (status: string) => {
    const statusMap: { [key: string]: string } = {
      "To Do": "pending",
      "In Progress": "in_progress", 
      "Done": "completed"
    };
    return tasks.filter(task => task.status === statusMap[status]);
  };

  const todoTasks = getTasksByStatus("To Do");
  const inProgressTasks = getTasksByStatus("In Progress");
  const completedTasks = getTasksByStatus("Done");
  
  const currentShifts = shifts.filter(shift => shift.status === 'scheduled');
  const todayShifts = useMemo(() => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    return shifts.filter(shift => {
      const shiftDate = new Date(shift.start_time).toISOString().split('T')[0];
      return shiftDate === todayStr && shift.status === 'scheduled';
    });
  }, [shifts]);

  const currentlyWorking = useMemo(() => {
    const now = new Date();
    return shifts.filter(shift => {
      const shiftStart = new Date(shift.start_time);
      const shiftEnd = new Date(shift.end_time);
      return shiftStart <= now && shiftEnd >= now && shift.status === 'scheduled';
    });
  }, [shifts]);

  // Time off requests for today
  const todayTimeOffRequests = useMemo(() => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    return shiftRequests.filter(request => {
      if (request.request_type !== 'time_off' || request.status !== 'approved') return false;
      const startDate = new Date(request.start_date).toISOString().split('T')[0];
      const endDate = request.end_date ? new Date(request.end_date).toISOString().split('T')[0] : startDate;
      return todayStr >= startDate && todayStr <= endDate;
    });
  }, [shiftRequests]);

  // Extra work requests for today
  const todayExtraWorkRequests = useMemo(() => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    return shiftRequests.filter(request => {
      if (request.request_type !== 'extra_work' || request.status !== 'approved') return false;
      const startDate = new Date(request.start_date).toISOString().split('T')[0];
      return todayStr === startDate;
    });
  }, [shiftRequests]);

  const upcomingShifts = useMemo(() => {
    const now = new Date();
    return shifts.filter(shift => {
      const shiftStart = new Date(shift.start_time);
      return shiftStart > now && shift.status === 'scheduled';
    }).slice(0, 5);
  }, [shifts]);

  const completionPercentage = tasks.length > 0 ? (completedTasks.length / tasks.length) * 100 : 0;

  // Hard drives by project
  const hardDrivesByProject = useMemo(() => {
    const projectMap = new Map();
    
    hardDrives.forEach(drive => {
      if (drive.project_id) {
        const project = projects.find(p => p.id === drive.project_id);
        const projectName = project?.name || 'Unknown Project';
        
        if (!projectMap.has(projectName)) {
          projectMap.set(projectName, []);
        }
        projectMap.get(projectName).push(drive);
      }
    });
    
    return Array.from(projectMap.entries()).map(([name, drives]) => ({
      projectName: name,
      drives: drives as typeof hardDrives,
      count: drives.length
    }));
  }, [hardDrives, projects]);

  // Low space indicator
  const lowSpaceHardDrives = useMemo(() => {
    return hardDrives.filter(drive => {
      // Check if it's a backup drive
      const isBackupDrive = drive.name.includes('BK') || drive.name.includes('Backup');
      if (!isBackupDrive) return false;

      // Parse capacity and free space
      const capacity = parseFloat(drive.capacity?.replace(/[^\d.]/g, '') || '0');
      const freeSpace = parseFloat(drive.free_space?.replace(/[^\d.]/g, '') || '0');
      
      if (capacity === 0) return false;
      
      const freePercentage = (freeSpace / capacity) * 100;
      return freePercentage <= 15;
    });
  }, [hardDrives]);

  // Project utilization
  const projectUtilization = useMemo(() => {
    return projects.map(project => {
      const projectTasks = tasks.filter(task => task.project_id === project.id);
      const completedProjectTasks = projectTasks.filter(task => task.status === 'completed');
      const utilization = projectTasks.length > 0 ? (completedProjectTasks.length / projectTasks.length) * 100 : 0;
      
      return {
        ...project,
        totalTasks: projectTasks.length,
        completedTasks: completedProjectTasks.length,
        utilization: Math.round(utilization)
      };
    });
  }, [projects, tasks]);

  // Tasks per user
  const tasksPerUser = useMemo(() => {
    return users.map(user => {
      const userTasks = tasks.filter(task => task.created_by === user.id);
      const userCompletedTasks = userTasks.filter(task => task.status === 'completed');
      const userInProgressTasks = userTasks.filter(task => task.status === 'in_progress');
      const userPendingTasks = userTasks.filter(task => task.status === 'pending');
      
      return {
        user,
        totalTasks: userTasks.length,
        completedTasks: userCompletedTasks.length,
        inProgressTasks: userInProgressTasks.length,
        pendingTasks: userPendingTasks.length
      };
    }).filter(item => item.totalTasks > 0);
  }, [users, tasks]);

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here's what's happening in your workspace.
          </p>
        </div>

        {/* Overview Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tasks.length}</div>
              <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                <span>{completedTasks.length} completed</span>
                <Badge variant="secondary">{Math.round(completionPercentage)}%</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{projects.length}</div>
              <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                <TrendingUp className="h-3 w-3" />
                <span>Active projects</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Hard Drives</CardTitle>
              <HardDrive className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{hardDrives.length}</div>
              <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                <Activity className="h-3 w-3" />
                <span>Devices tracked</span>
                {lowSpaceHardDrives.length > 0 && (
                  <Badge variant="destructive">{lowSpaceHardDrives.length} low space</Badge>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Shifts</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{todayShifts.length}</div>
              <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                <Users className="h-3 w-3" />
                <span>{currentlyWorking.length} currently working</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Alerts Section */}
        {(lowSpaceHardDrives.length > 0 || todayTimeOffRequests.length > 0 || todayExtraWorkRequests.length > 0) && (
          <Card className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950">
            <CardHeader>
              <CardTitle className="flex items-center text-orange-800 dark:text-orange-200">
                <AlertTriangle className="mr-2 h-5 w-5" />
                Today's Alerts
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {lowSpaceHardDrives.length > 0 && (
                <div className="text-sm text-orange-700 dark:text-orange-300">
                  ⚠️ {lowSpaceHardDrives.length} hard drive(s) have low space (≤15%): {lowSpaceHardDrives.map(d => d.name).join(', ')}
                </div>
              )}
              {todayTimeOffRequests.length > 0 && (
                <div className="text-sm text-orange-700 dark:text-orange-300">
                  🏖️ {todayTimeOffRequests.length} employee(s) on time off today: {todayTimeOffRequests.map(r => r.user?.username).join(', ')}
                </div>
              )}
              {todayExtraWorkRequests.length > 0 && (
                <div className="text-sm text-orange-700 dark:text-orange-300">
                  💼 {todayExtraWorkRequests.length} employee(s) working extra today: {todayExtraWorkRequests.map(r => r.user?.username).join(', ')}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Main Content */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
            <TabsTrigger value="projects">Projects</TabsTrigger>
            <TabsTrigger value="shifts">Shifts</TabsTrigger>
            <TabsTrigger value="devices">Devices</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {/* Task Progress */}
              <Card>
                <CardHeader>
                  <CardTitle>Task Progress</CardTitle>
                  <CardDescription>
                    Overall completion rate across all projects
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Overall Progress</span>
                      <span>{Math.round(completionPercentage)}%</span>
                    </div>
                    <Progress value={completionPercentage} className="h-2" />
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="text-center">
                      <div className="font-bold text-green-600">{completedTasks.length}</div>
                      <div className="text-muted-foreground">Completed</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-blue-600">{inProgressTasks.length}</div>
                      <div className="text-muted-foreground">In Progress</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-gray-600">{todoTasks.length}</div>
                      <div className="text-muted-foreground">To Do</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Currently Working */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Currently Working
                  </CardTitle>
                  <CardDescription>
                    Employees currently on shift
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {currentlyWorking.length > 0 ? (
                    <div className="space-y-3">
                      {currentlyWorking.map((shift) => (
                        <div key={shift.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <div>
                            <div className="font-medium">{shift.user?.username}</div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">{shift.title}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium">
                              {format(new Date(shift.start_time), 'HH:mm')} - {format(new Date(shift.end_time), 'HH:mm')}
                            </div>
                            <Badge variant="secondary" className="mt-1">
                              {shift.shift_type}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No one is currently working</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Hard Drives by Project */}
            <Card>
              <CardHeader>
                <CardTitle>Hard Drives by Project</CardTitle>
                <CardDescription>Distribution of hard drives across projects</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {hardDrivesByProject.map((item) => (
                    <div key={item.projectName} className="p-4 border rounded-lg">
                      <div className="font-medium">{item.projectName}</div>
                      <div className="text-2xl font-bold mt-2">{item.count}</div>
                      <div className="text-sm text-gray-600">Hard Drives</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Project Utilization */}
            <Card>
              <CardHeader>
                <CardTitle>Project Utilization</CardTitle>
                <CardDescription>Task completion rate by project</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {projectUtilization.map((project) => (
                    <div key={project.id} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{project.name}</span>
                        <span className="text-sm text-gray-600">{project.utilization}%</span>
                      </div>
                      <Progress value={project.utilization} className="h-2" />
                      <div className="text-xs text-gray-500">
                        {project.completedTasks} of {project.totalTasks} tasks completed
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Tasks per User */}
            <Card>
              <CardHeader>
                <CardTitle>Tasks per User</CardTitle>
                <CardDescription>Task distribution and progress by team member</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {tasksPerUser.map((item) => (
                    <div key={item.user.id} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium">{item.user.username}</span>
                        <span className="text-sm text-gray-600">{item.totalTasks} total tasks</span>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div className="text-center">
                          <div className="font-bold text-green-600">{item.completedTasks}</div>
                          <div className="text-gray-600">Completed</div>
                        </div>
                        <div className="text-center">
                          <div className="font-bold text-blue-600">{item.inProgressTasks}</div>
                          <div className="text-gray-600">In Progress</div>
                        </div>
                        <div className="text-center">
                          <div className="font-bold text-gray-600">{item.pendingTasks}</div>
                          <div className="text-gray-600">Pending</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Upcoming Activities */}
            <div className="grid gap-4 md:grid-cols-2">
              {/* Recent Projects */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Projects</CardTitle>
                  <CardDescription>Latest project activities</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {projects.slice(0, 5).map((project) => (
                      <div key={project.id} className="flex items-center space-x-3">
                        <div className={`w-2 h-2 rounded-full ${
                          project.status === 'active' ? 'bg-green-500' : 'bg-gray-300'
                        }`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{project.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {project.description || 'No description'}
                          </p>
                        </div>
                        <Badge variant={project.status === 'active' ? 'default' : 'secondary'}>
                          {project.status || 'active'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Upcoming Shifts */}
              <Card>
                <CardHeader>
                  <CardTitle>Upcoming Shifts</CardTitle>
                  <CardDescription>Next scheduled shifts</CardDescription>
                </CardHeader>
                <CardContent>
                  {upcomingShifts.length > 0 ? (
                    <div className="space-y-3">
                      {upcomingShifts.map((shift) => (
                        <div key={shift.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <div>
                            <div className="font-medium">{shift.user?.username}</div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">{shift.title}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium">
                              {format(new Date(shift.start_time), 'MMM d, HH:mm')}
                            </div>
                            <Badge variant="outline" className="mt-1">
                              {shift.shift_type}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No upcoming shifts</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="tasks" className="space-y-4">
            <TaskBoard />
          </TabsContent>

          <TabsContent value="projects" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Projects</CardTitle>
                  <CardDescription>Manage your projects</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">Project List</h3>
                        <p className="text-sm text-muted-foreground">View all projects</p>
                      </div>
                      <Button variant="outline">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Project
                      </Button>
                    </div>
                    <div className="grid gap-4">
                      {projects.map((project) => (
                        <div key={project.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <div>
                            <div className="font-medium">{project.name}</div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">{project.description}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium">
                              {project.status}
                            </div>
                            <Badge variant={project.status === 'active' ? 'default' : 'secondary'}>
                              {project.status.replace('_', ' ')}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Project Status</CardTitle>
                  <CardDescription>Track project progress</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">Project Status</h3>
                        <p className="text-sm text-muted-foreground">View project statuses</p>
                      </div>
                      <Button variant="outline">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Status
                      </Button>
                    </div>
                    <div className="grid gap-4">
                      <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div>
                          <div className="font-medium">Active</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">Projects in progress</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">
                            3
                          </div>
                          <Badge variant="default">
                            Active
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div>
                          <div className="font-medium">Completed</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">Projects completed</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">
                            2
                          </div>
                          <Badge variant="default">
                            Completed
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div>
                          <div className="font-medium">Pending</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">Projects pending</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">
                            1
                          </div>
                          <Badge variant="default">
                            Pending
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="shifts" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Shifts</CardTitle>
                  <CardDescription>Manage your shifts</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">Shift List</h3>
                        <p className="text-sm text-muted-foreground">View all shifts</p>
                      </div>
                      <Button variant="outline">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Shift
                      </Button>
                    </div>
                    <div className="grid gap-4">
                      {shifts.map((shift) => (
                        <div key={shift.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <div>
                            <div className="font-medium">{shift.title}</div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">{shift.description}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium">
                              {shift.status}
                            </div>
                            <Badge variant={shift.status === 'scheduled' ? 'default' : 'secondary'}>
                              {shift.status.replace('_', ' ')}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Shift Status</CardTitle>
                  <CardDescription>Track shift progress</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">Shift Status</h3>
                        <p className="text-sm text-muted-foreground">View shift statuses</p>
                      </div>
                      <Button variant="outline">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Status
                      </Button>
                    </div>
                    <div className="grid gap-4">
                      <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div>
                          <div className="font-medium">Scheduled</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">Shifts scheduled</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">
                            3
                          </div>
                          <Badge variant="default">
                            Scheduled
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div>
                          <div className="font-medium">Completed</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">Shifts completed</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">
                            2
                          </div>
                          <Badge variant="default">
                            Completed
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div>
                          <div className="font-medium">Pending</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">Shifts pending</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">
                            1
                          </div>
                          <Badge variant="default">
                            Pending
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="devices" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Devices</CardTitle>
                  <CardDescription>Manage your devices</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">Device List</h3>
                        <p className="text-sm text-muted-foreground">View all devices</p>
                      </div>
                      <Button variant="outline">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Device
                      </Button>
                    </div>
                    <div className="grid gap-4">
                      {hardDrives.map((device) => (
                        <div key={device.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <div>
                            <div className="font-medium">{device.name}</div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">{device.description}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium">
                              {device.status}
                            </div>
                            <Badge variant={device.status === 'available' ? 'default' : 'secondary'}>
                              {device.status.replace('_', ' ')}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Device Status</CardTitle>
                  <CardDescription>Track device progress</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">Device Status</h3>
                        <p className="text-sm text-muted-foreground">View device statuses</p>
                      </div>
                      <Button variant="outline">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Status
                      </Button>
                    </div>
                    <div className="grid gap-4">
                      <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div>
                          <div className="font-medium">Available</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">Devices available</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">
                            3
                          </div>
                          <Badge variant="default">
                            Available
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div>
                          <div className="font-medium">In Use</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">Devices in use</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">
                            2
                          </div>
                          <Badge variant="default">
                            In Use
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div>
                          <div className="font-medium">Pending</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">Devices pending</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">
                            1
                          </div>
                          <Badge variant="default">
                            Pending
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
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
