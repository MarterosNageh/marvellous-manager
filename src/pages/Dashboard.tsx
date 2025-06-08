<<<<<<< HEAD

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, Users, CheckCircle, AlertCircle, Timer } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format, startOfWeek, endOfWeek, isWithinInterval } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';

interface DashboardStats {
  totalTasks: number;
  completedTasks: number;
  upcomingShifts: number;
  pendingRequests: number;
  weeklyHours: number;
=======
import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { TaskUtilizationTable } from "@/components/dashboard/TaskUtilizationTable";
import { HardDrive, ArrowRight, Boxes, Users, BarChart2, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";
import { isToday, format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// Types for Dashboard
interface HardDriveData {
  id: string;
  name: string;
  serial_number: string;
  status: string;
  project_id: string;
  capacity: string;
  free_space: string;
  data: string;
  cables: any;
  created_at: string;
  updated_at: string;
  project?: {
    name: string;
  };
}

interface ProjectData {
  id: string;
  name: string;
  description: string;
  type: string;
  status: string;
  created_at: string;
}

interface ShiftData {
  id: string;
  user_id: string;
  start_time: string;
  end_time: string;
  shift_type: string;
  status: string;
  user: {
    username: string;
    role: string;
  } | null;
}

interface DayOffUser {
  user: {
    username: string;
    role: string;
  } | null;
}

interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ReactNode;
>>>>>>> 2c1f89f (dashboard)
}

const Dashboard = () => {
  const { currentUser } = useAuth();
<<<<<<< HEAD
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    totalTasks: 0,
    completedTasks: 0,
    upcomingShifts: 0,
    pendingRequests: 0,
    weeklyHours: 0
=======
  const [hardDrives, setHardDrives] = useState<HardDriveData[]>([]);
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [currentShifts, setCurrentShifts] = useState<ShiftData[]>([]);
  const [dayOffUsers, setDayOffUsers] = useState<{ username: string; role: string }[]>([]);
  const [stats, setStats] = useState({
    totalHardDrives: 0,
    availableHardDrives: 0,
    totalProjects: 0,
    activeProjects: 0,
    totalUsers: 0,
    lowSpaceHardDrives: 0
>>>>>>> 2c1f89f (dashboard)
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!currentUser?.id) return;

      try {
<<<<<<< HEAD
        setIsLoading(true);
        
        // Fetch tasks
        const { data: tasks } = await supabase
          .from('tasks')
          .select('*')
          .or(`created_by.eq.${currentUser.id},id.in.(${await getUserTaskIds()})`);

        // Fetch shifts for current week
        const weekStart = startOfWeek(new Date());
        const weekEnd = endOfWeek(new Date());
=======
        // Fetch Hard Drives with Project Info
        const { data: hardDrivesData, error: hardDrivesError } = await supabase
          .from('hard_drives')
          .select('*, project:projects(name)')
          .order('created_at', { ascending: false });
>>>>>>> 2c1f89f (dashboard)
        
        const { data: shifts } = await supabase
          .from('shifts')
          .select('*')
<<<<<<< HEAD
          .eq('user_id', currentUser.id)
          .gte('start_time', weekStart.toISOString())
          .lte('start_time', weekEnd.toISOString());

        // Fetch pending requests
        const { data: requests } = await supabase
          .from('shift_requests')
          .select('*')
          .eq('user_id', currentUser.id)
          .eq('status', 'pending');

        // Calculate weekly hours
        let weeklyHours = 0;
        if (shifts) {
          weeklyHours = shifts.reduce((total, shift) => {
            const start = new Date(shift.start_time);
            const end = new Date(shift.end_time);
            const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
            return total + hours;
          }, 0);
        }

        setStats({
          totalTasks: tasks?.length || 0,
          completedTasks: tasks?.filter(t => t.status === 'completed').length || 0,
          upcomingShifts: shifts?.length || 0,
          pendingRequests: requests?.length || 0,
          weeklyHours: Math.round(weeklyHours * 10) / 10
=======
          .order('created_at', { ascending: false });
        
        if (projectsError) throw projectsError;
        setProjects(projectsData as ProjectData[]);

        // Fetch Current Shifts
        const now = new Date().toISOString();
        const { data: shiftsData, error: shiftsError } = await supabase
          .from('shifts')
          .select('*, user:auth_users(username, role)')
          .lte('start_time', now)
          .gte('end_time', now)
          .eq('status', 'active');

        if (shiftsError) throw shiftsError;
        setCurrentShifts((shiftsData as any[]).map(shift => ({
          id: shift.id,
          user_id: shift.user_id,
          start_time: shift.start_time,
          end_time: shift.end_time,
          shift_type: shift.shift_type,
          status: shift.status,
          user: shift.user
        })) as ShiftData[]);

        // Fetch Day Off Users (users with approved time off requests for today)
        const today = new Date().toISOString().split('T')[0];
        const { data: dayOffData, error: dayOffError } = await supabase
          .from('shift_requests')
          .select('user:auth_users!user_id(username, role)')
          .eq('status', 'approved')
          .eq('request_type', 'time_off')
          .lte('start_date', today)
          .gte('end_date', today);

        if (dayOffError) throw dayOffError;
        setDayOffUsers((dayOffData as DayOffUser[]).map(d => d.user).filter((user): user is NonNullable<typeof user> => user !== null));
        
        // Get Stats
        const [
          { count: totalHardDrives },
          { count: availableHardDrives },
          { count: totalProjects },
          { count: activeProjects },
          { count: totalUsers }
        ] = await Promise.all([
          supabase.from('hard_drives').select('*', { count: 'exact', head: true }),
          supabase.from('hard_drives').select('*', { count: 'exact', head: true }).eq('status', 'available'),
          supabase.from('projects').select('*', { count: 'exact', head: true }),
          supabase.from('projects').select('*', { count: 'exact', head: true }).eq('status', 'active'),
          supabase.from('auth_users').select('*', { count: 'exact', head: true })
        ]);

        // Calculate low space hard drives from the fetched data
        const lowSpaceHardDrives = hardDrivesData.filter(drive => {
          const freeSpace = parseFloat(drive.free_space);
          const capacity = parseFloat(drive.capacity);
          return !isNaN(freeSpace) && !isNaN(capacity) && (freeSpace / capacity) * 100 < 20;
        }).length;
        
        setStats({
          totalHardDrives: totalHardDrives || 0,
          availableHardDrives: availableHardDrives || 0,
          totalProjects: totalProjects || 0,
          activeProjects: activeProjects || 0,
          totalUsers: totalUsers || 0,
          lowSpaceHardDrives
>>>>>>> 2c1f89f (dashboard)
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [currentUser]);

<<<<<<< HEAD
  const getUserTaskIds = async () => {
    if (!currentUser?.id) return '';
    
    const { data: assignments } = await supabase
      .from('task_assignments')
      .select('task_id')
      .eq('user_id', currentUser.id);
    
    return assignments?.map(a => a.task_id).join(',') || '';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
=======
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  // Rendering logic
  return (
    <MainLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        
        {/* Top Row: Greeting and Current Shift Status */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Greeting Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">{getGreeting()}, {currentUser?.username}!</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Welcome to your dashboard. Here's an overview of your workspace.
              </p>
              {currentUser?.role && (
                <Badge className="mt-2" variant="outline">
                  {currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1)}
                </Badge>
              )}
            </CardContent>
          </Card>

          {/* Current Shift Status */}
          <Card>
            <CardHeader>
              <CardTitle>Shift Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">Currently On Shift</h3>
                {currentShifts.length > 0 ? (
                  <div className="space-y-2">
                    {currentShifts.map(shift => (
                      <div key={shift.id} className="flex items-center justify-between">
                        <span>{shift.user?.username}</span>
                        <Badge>{shift.shift_type}</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No one is currently on shift</p>
                )}
              </div>
              <div>
                <h3 className="font-medium mb-2">Day Off</h3>
                {dayOffUsers.length > 0 ? (
                  <div className="space-y-2">
                    {dayOffUsers.map((user, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span>{user.username}</span>
                        <Badge variant="outline">{user.role}</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No one is off today</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Statistics Cards */}
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
          <StatsCard 
            title="Total Projects" 
            value={stats.totalProjects} 
            description={`${stats.activeProjects} active`}
            icon={<Boxes className="h-4 w-4" />} 
          />
          <StatsCard 
            title="Hard Drives" 
            value={stats.totalHardDrives} 
            description={`${stats.availableHardDrives} available`}
            icon={<HardDrive className="h-4 w-4" />} 
          />
          <StatsCard 
            title="Task Utilization" 
            value="86%" 
            description="Last 30 days"
            icon={<BarChart2 className="h-4 w-4" />} 
          />
          <StatsCard 
            title="Low Space Drives" 
            value={stats.lowSpaceHardDrives}
            description="< 20% free space"
            icon={<AlertTriangle className="h-4 w-4" />} 
          />
        </div>

        {/* Low Space Hard Drives by Project */}
        <Card>
          <CardHeader>
            <CardTitle>Low Space Hard Drives</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {projects.map(project => {
                const projectDrives = hardDrives
                  .filter(drive => 
                    drive.project_id === project.id && 
                    parseInt(drive.free_space) / parseInt(drive.capacity) * 100 < 20
                  )
                  // Sort by created_at in descending order (newest first)
                  .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                  // Take only the first (latest) drive
                  .slice(0, 1);
                
                if (projectDrives.length === 0) return null;

                // Since we're only showing one drive per project, we can directly use projectDrives[0]
                const drive = projectDrives[0];
                const freeSpacePercentage = (parseInt(drive.free_space) / parseInt(drive.capacity)) * 100;
                const isCritical = freeSpacePercentage < 15;
                
                return (
                  <div key={project.id} className="space-y-2">
                    <h3 className="font-medium">{project.name}</h3>
                    <div 
                      className={cn(
                        "flex items-center justify-between p-2 border rounded-lg transition-colors",
                        isCritical 
                          ? "bg-red-400 border-red-400 text-white" 
                          : "bg-white border-gray-200"
                      )}
                    >
                      <div>
                        <p className="font-medium">{drive.name}</p>
                        <div className="flex items-center gap-2">
                          <p className={cn(
                            "text-sm",
                            isCritical ? "text-white/90" : "text-muted-foreground"
                          )}>
                            {freeSpacePercentage.toFixed(1)}% free
                          </p>
                          <span className={cn(
                            "text-xs",
                            isCritical ? "text-white/75" : "text-muted-foreground/75"
                          )}>
                            • Added {format(new Date(drive.created_at), 'MMM d, yyyy')}
                          </span>
                        </div>
                      </div>
                      <Button 
                        variant={isCritical ? "secondary" : "outline"} 
                        size="sm" 
                        asChild
                      >
                        <Link to={`/hard-drives/${drive.id}`}>
                          Details
                        </Link>
                      </Button>
                    </div>
                  </div>
                );
              })}
              {!hardDrives.some(drive => parseInt(drive.free_space) / parseInt(drive.capacity) * 100 < 20) && (
                <p className="text-center text-muted-foreground py-4">
                  No hard drives with low space
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Task Utilization Table */}
        <TaskUtilizationTable />
>>>>>>> 2c1f89f (dashboard)
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {currentUser?.username}
          </p>
        </div>
        <Badge variant="outline" className="text-sm">
          {format(new Date(), 'EEEE, MMMM d, yyyy')}
        </Badge>
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
              {stats.completedTasks} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Weekly Hours</CardTitle>
            <Timer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.weeklyHours}h</div>
            <p className="text-xs text-muted-foreground">
              This week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Shifts</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.upcomingShifts}</div>
            <p className="text-xs text-muted-foreground">
              This week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingRequests}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting approval
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Schedule
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              View your schedule and manage shifts
            </p>
            <Button onClick={() => navigate('/schedule')} className="w-full">
              View Schedule
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Manage your tasks and projects
            </p>
            <Button onClick={() => navigate('/task-manager')} className="w-full">
              View Tasks
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Team
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Collaborate with your team
            </p>
            <Button onClick={() => navigate('/notes')} className="w-full">
              Team Notes
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
