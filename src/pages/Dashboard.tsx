import { useState, useEffect } from "react";
import { format, isToday } from 'date-fns';
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import { 
  HardDrive, 
  Package, 
  Users, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle,
  Clock,
  Calendar,
  Activity,
  FileText,
  Settings
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface HardDriveData {
  id: string;
  name: string;
  capacity_gb: number;
  available_gb: number;
  status: 'active' | 'inactive' | 'error';
  project_id: string | null;
}

interface ProjectData {
  id: string;
  name: string;
  status: 'active' | 'inactive' | 'completed';
  start_date: string;
  end_date: string | null;
}

interface TaskData {
  id: string;
  title: string;
  status: 'open' | 'in progress' | 'completed' | 'blocked';
  priority: 'high' | 'medium' | 'low';
  project_id: string;
  created_at: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }: any) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

const Dashboard = () => {
  const { currentUser } = useAuth();
  const [stats, setStats] = useState({
    totalHardDrives: 0,
    availableHardDrives: 0,
    totalProjects: 0,
    activeProjects: 0,
    totalUsers: 0,
    completedTasks: 0
  });

  // Hard drives query
  const { data: hardDrives } = useQuery({
    queryKey: ['hardDrives'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hard_drives')
        .select('*');
      if (error) throw error;
      return data as HardDriveData[];
    }
  });

  // Projects query
  const { data: projects } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('*');
      if (error) throw error;
      return data as ProjectData[];
    }
  });

  // Users query
  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('auth_users')
        .select('*');
      if (error) throw error;
      return data;
    }
  });

  // Tasks query
  const { data: tasks } = useQuery({
    queryKey: ['tasks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('*');
      if (error) throw error;
      return data as TaskData[];
    }
  });

  // Today's shifts query
  const { data: todayShifts } = useQuery({
    queryKey: ['todayShifts'],
    queryFn: async () => {
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).toISOString();
      
      const { data, error } = await supabase
        .from('shifts')
        .select(`
          *,
          auth_users!shifts_user_id_fkey(username)
        `)
        .gte('start_time', startOfDay)
        .lt('start_time', endOfDay)
        .eq('status', 'scheduled');
      
      if (error) throw error;
      return data || [];
    }
  });

  useEffect(() => {
    if (hardDrives && projects && users && tasks) {
      const totalCapacity = hardDrives.reduce((sum, drive) => sum + drive.capacity_gb, 0);
      const availableCapacity = hardDrives.reduce((sum, drive) => sum + drive.available_gb, 0);
      const activeProjectsCount = projects.filter(project => project.status === 'active').length;
      const completedTasksCount = tasks.filter(task => task.status === 'completed').length;

      setStats({
        totalHardDrives: hardDrives.length,
        availableHardDrives: availableCapacity,
        totalProjects: projects.length,
        activeProjects: activeProjectsCount,
        totalUsers: users.length,
        completedTasks: completedTasksCount
      });
    }
  }, [hardDrives, projects, users, tasks]);

  const renderShiftCard = (shift: any) => {
    const shiftStart = new Date(shift.start_time);
    const isCurrentShift = isToday(shiftStart);
    
    return (
      <Card key={shift.id} className="mb-3">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium">{shift.title}</h4>
            <Badge variant={shift.status === 'completed' ? 'default' : 'secondary'}>
              {shift.status}
            </Badge>
          </div>
          <div className="text-sm text-gray-600 space-y-1">
            <div className="flex items-center gap-2">
              <Users className="h-3 w-3" />
              <span>{shift.auth_users?.username || 'Unassigned'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-3 w-3" />
              <span>
                {format(new Date(shift.start_time), 'HH:mm')} - 
                {format(new Date(shift.end_time), 'HH:mm')}
              </span>
            </div>
            {shift.description && (
              <div className="flex items-start gap-2">
                <FileText className="h-3 w-3 mt-0.5" />
                <span>{shift.description}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  const hardDriveStatusData = hardDrives?.reduce((acc: any, drive: HardDriveData) => {
    const status = drive.status;
    if (acc[status]) {
      acc[status]++;
    } else {
      acc[status] = 1;
    }
    return acc;
  }, {}) || {};

  const hardDriveStatusPieData = Object.entries(hardDriveStatusData).map(([name, value]) => ({
    name,
    value: value as number
  }));

  const taskStatusData = tasks?.reduce((acc: any, task: TaskData) => {
    const status = task.status;
    if (acc[status]) {
      acc[status]++;
    } else {
      acc[status] = 1;
    }
    return acc;
  }, {}) || {};

  const taskStatusPieData = Object.entries(taskStatusData).map(([name, value]) => ({
    name,
    value: value as number
  }));

  const projectStatusData = projects?.reduce((acc: any, project: ProjectData) => {
    const status = project.status;
    if (acc[status]) {
      acc[status]++;
    } else {
      acc[status] = 1;
    }
    return acc;
  }, {}) || {};

  const projectStatusPieData = Object.entries(projectStatusData).map(([name, value]) => ({
    name,
    value: value as number
  }));

  const taskPriorityData = tasks?.reduce((acc: any, task: TaskData) => {
    const priority = task.priority;
    if (acc[priority]) {
      acc[priority]++;
    } else {
      acc[priority] = 1;
    }
    return acc;
  }, {}) || {};

  const taskPriorityPieData = Object.entries(taskPriorityData).map(([name, value]) => ({
    name,
    value: value as number
  }));

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {currentUser?.username}! Here's what's happening today.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HardDrive className="h-5 w-5" />
                Total Hard Drives
              </CardTitle>
              <CardDescription>
                Total number of hard drives in the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalHardDrives}</div>
              <p className="text-sm text-muted-foreground">
                {hardDrives && hardDrives.length > 0 ? 'Click to view details' : 'No hard drives found'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Available Capacity
              </CardTitle>
              <CardDescription>
                Total available storage capacity
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.availableHardDrives} GB</div>
              <p className="text-sm text-muted-foreground">
                {hardDrives && hardDrives.length > 0 ? 'Click to manage storage' : 'No storage devices found'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Total Users
              </CardTitle>
              <CardDescription>
                Number of registered users
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
              <p className="text-sm text-muted-foreground">
                {users && users.length > 0 ? 'Click to manage users' : 'No users registered'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Completed Tasks
              </CardTitle>
              <CardDescription>
                Number of tasks completed
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completedTasks}</div>
              <p className="text-sm text-muted-foreground">
                {tasks && tasks.length > 0 ? 'Click to view task details' : 'No tasks found'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Today's Schedule Section */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Today's Schedule
              </CardTitle>
              <CardDescription>
                Shifts scheduled for today
              </CardDescription>
            </CardHeader>
            <CardContent>
              {todayShifts && todayShifts.length > 0 ? (
                <div className="space-y-2">
                  {todayShifts.slice(0, 3).map(renderShiftCard)}
                  {todayShifts.length > 3 && (
                    <p className="text-sm text-gray-500 text-center pt-2">
                      +{todayShifts.length - 3} more shifts
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-center py-6">
                  <Calendar className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No shifts scheduled for today</p>
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HardDrive className="h-5 w-5" />
                Hard Drive Status
              </CardTitle>
              <CardDescription>
                Status of hard drives in the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              {hardDriveStatusPieData && hardDriveStatusPieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={hardDriveStatusPieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={renderCustomizedLabel}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {
                        hardDriveStatusPieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))
                      }
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-6">
                  <HardDrive className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No hard drive status data available</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Task Status
              </CardTitle>
              <CardDescription>
                Status of tasks in the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              {taskStatusPieData && taskStatusPieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={taskStatusPieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={renderCustomizedLabel}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {
                        taskStatusPieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))
                      }
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-6">
                  <Activity className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No task status data available</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Project Status
              </CardTitle>
              <CardDescription>
                Status of projects in the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              {projectStatusPieData && projectStatusPieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={projectStatusPieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={renderCustomizedLabel}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {
                        projectStatusPieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))
                      }
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-6">
                  <Settings className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No project status data available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
};

export default Dashboard;
