
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
}

const Dashboard = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    totalTasks: 0,
    completedTasks: 0,
    upcomingShifts: 0,
    pendingRequests: 0,
    weeklyHours: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!currentUser?.id) return;

      try {
        setIsLoading(true);
        
        // Fetch tasks
        const { data: tasks } = await supabase
          .from('tasks')
          .select('*')
          .or(`created_by.eq.${currentUser.id},id.in.(${await getUserTaskIds()})`);

        // Fetch shifts for current week
        const weekStart = startOfWeek(new Date());
        const weekEnd = endOfWeek(new Date());
        
        const { data: shifts } = await supabase
          .from('shifts')
          .select('*')
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
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [currentUser]);

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
