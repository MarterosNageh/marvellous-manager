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
  User
} from "lucide-react";
import { ShiftsProvider } from '@/context/ShiftsContext';
import { format } from 'date-fns';

const DashboardContent = () => {
  const { currentUser } = useAuth();
  const { tasks, projects } = useTask();
  const { shifts } = useShifts();
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

  const upcomingShifts = useMemo(() => {
    const now = new Date();
    return shifts.filter(shift => {
      const shiftStart = new Date(shift.start_time);
      return shiftStart > now && shift.status === 'scheduled';
    }).slice(0, 5);
  }, [shifts]);

  const completionPercentage = (completedTasks / tasks.length) * 100;

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
                <span>{completedTasks} completed</span>
                <Badge variant="secondary">{completionPercentage}%</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{projects.length}</div>
              <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                <TrendingUp className="h-3 w-3" />
                <span>Projects in progress</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Hard Drives</CardTitle>
              <HardDrive className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{hardDrives.length}</div>
              <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                <Activity className="h-3 w-3" />
                <span>Devices tracked</span>
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
                      <span>{completionPercentage}%</span>
                    </div>
                    <Progress value={completionPercentage} className="h-2" />
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="text-center">
                      <div className="font-bold text-green-600">{completedTasks}</div>
                      <div className="text-muted-foreground">Completed</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-blue-600">{inProgressTasks}</div>
                      <div className="text-muted-foreground">In Progress</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-gray-600">{todoTasks}</div>
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

            {/* Upcoming Activities */}
            <div className="grid gap-4 md:grid-cols-2">
              {/* Recent Tasks */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Tasks</CardTitle>
                  <CardDescription>Latest task activities</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {tasks.slice(0, 5).map((task) => (
                      <div key={task.id} className="flex items-center space-x-3">
                        <div className={`w-2 h-2 rounded-full ${
                          task.status === 'completed' ? 'bg-green-500' : 
                          task.status === 'in_progress' ? 'bg-blue-500' : 'bg-gray-300'
                        }`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{task.title}</p>
                          <p className="text-xs text-muted-foreground">
                            Priority: {task.priority}
                          </p>
                        </div>
                        <Badge variant={task.status === 'completed' ? 'default' : 'secondary'}>
                          {task.status.replace('_', ' ')}
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
