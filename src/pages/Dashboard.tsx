
import React, { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Clock, User, AlertTriangle, HardDrive } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

interface HardDrive {
  id: string;
  name: string;
  capacity: string;
  free_space: string;
  status: string;
  created_at: string;
}

interface Shift {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
  user_id: string;
  status: string;
}

interface ShiftRequest {
  id: string;
  request_type: string;
  status: string;
  start_date: string;
  end_date: string | null;
  user_id: string;
}

interface TaskUtilization {
  user_id: string;
  username: string;
  total_tasks: number;
  completed_tasks: number;
  in_progress_tasks: number;
  pending_tasks: number;
  completion_rate: number;
}

const Dashboard = () => {
  const { currentUser, users } = useAuth();
  const [currentlyWorking, setCurrentlyWorking] = useState<(Shift & { username: string })[]>([]);
  const [todayTimeOff, setTodayTimeOff] = useState<(ShiftRequest & { username: string })[]>([]);
  const [storageAlerts, setStorageAlerts] = useState<HardDrive[]>([]);
  const [recentHards, setRecentHards] = useState<HardDrive[]>([]);
  const [taskUtilization, setTaskUtilization] = useState<TaskUtilization[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

      // Fetch currently working shifts
      const { data: shifts } = await supabase
        .from('shifts')
        .select('*, auth_users!shifts_user_id_fkey(username)')
        .eq('status', 'scheduled')
        .lte('start_time', now.toISOString())
        .gte('end_time', now.toISOString());

      if (shifts) {
        const workingShifts = shifts.map(shift => ({
          ...shift,
          username: shift.auth_users?.username || 'Unknown'
        }));
        setCurrentlyWorking(workingShifts);
      }

      // Fetch today's time off requests
      const { data: timeOffData } = await supabase
        .from('shift_requests')
        .select('*, auth_users!shift_requests_user_id_fkey(username)')
        .eq('status', 'approved')
        .gte('start_date', today.toISOString())
        .lt('start_date', tomorrow.toISOString());

      if (timeOffData) {
        const timeOffRequests = timeOffData.map(request => ({
          ...request,
          username: request.auth_users?.username || 'Unknown'
        }));
        setTodayTimeOff(timeOffRequests);
      }

      // Fetch hard drives for storage alerts and recent drives
      const { data: hardDrives } = await supabase
        .from('hard_drives')
        .select('*')
        .order('created_at', { ascending: false });

      if (hardDrives) {
        // Filter and sort drives for storage alerts
        const bkDrives = hardDrives
          .filter(drive => 
            drive.name.includes('BK') && 
            drive.free_space && 
            drive.capacity &&
            drive.free_space !== '0' &&
            drive.free_space.toLowerCase() !== 'n/a' &&
            drive.free_space.toLowerCase() !== 'empty' &&
            drive.capacity !== '0' &&
            drive.capacity.toLowerCase() !== 'n/a' &&
            drive.capacity.toLowerCase() !== 'empty'
          )
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

        const alerts: HardDrive[] = [];
        
        for (const drive of bkDrives) {
          const freeSpaceStr = drive.free_space.replace(/[^\d.]/g, '');
          const capacityStr = drive.capacity.replace(/[^\d.]/g, '');
          
          const freeSpace = parseFloat(freeSpaceStr);
          const capacity = parseFloat(capacityStr);
          
          if (!isNaN(freeSpace) && !isNaN(capacity) && capacity > 0) {
            const freePercentage = (freeSpace / capacity) * 100;
            if (freePercentage < 15) {
              alerts.push(drive);
            }
          }
        }

        setStorageAlerts(alerts);
        setRecentHards(hardDrives.slice(0, 5));
      }

      // Fetch task utilization
      const { data: tasks } = await supabase
        .from('tasks')
        .select('created_by, status')
        .not('created_by', 'is', null);

      if (tasks && users.length > 0) {
        const utilization = users.map(user => {
          const userTasks = tasks.filter(task => task.created_by === user.id);
          const completed = userTasks.filter(task => task.status === 'completed').length;
          const inProgress = userTasks.filter(task => task.status === 'in_progress').length;
          const pending = userTasks.filter(task => task.status === 'pending').length;
          const total = userTasks.length;
          
          return {
            user_id: user.id,
            username: user.username,
            total_tasks: total,
            completed_tasks: completed,
            in_progress_tasks: inProgress,
            pending_tasks: pending,
            completion_rate: total > 0 ? Math.round((completed / total) * 100) : 0
          };
        });

        setTaskUtilization(utilization);
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (users.length > 0) {
      fetchDashboardData();
    }
  }, [users]);

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading dashboard...</div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome back, {currentUser?.username}!
          </h1>
          <p className="text-muted-foreground">
            Here's what's happening in your workspace today
          </p>
        </div>

        {/* Top Row - 2 Cards Side by Side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Welcome & Shifts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Today's Shifts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Currently Working */}
                <div>
                  <h4 className="font-medium text-sm mb-2">Currently Working</h4>
                  {currentlyWorking.length === 0 ? (
                    <p className="text-sm text-gray-500">No one is currently working</p>
                  ) : (
                    <div className="space-y-2">
                      {currentlyWorking.map(shift => (
                        <div key={shift.id} className="flex items-center justify-between p-2 bg-green-50 rounded">
                          <div>
                            <p className="font-medium text-sm">{shift.username}</p>
                            <p className="text-xs text-gray-600">{shift.title}</p>
                          </div>
                          <div className="text-xs text-gray-500">
                            {format(new Date(shift.start_time), 'HH:mm')} - {format(new Date(shift.end_time), 'HH:mm')}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Time Off Today */}
                {todayTimeOff.length > 0 && (
                  <div>
                    <h4 className="font-medium text-sm mb-2">Time Off Today</h4>
                    <div className="space-y-2">
                      {todayTimeOff.map(request => (
                        <div key={request.id} className="flex items-center justify-between p-2 bg-blue-50 rounded">
                          <div>
                            <p className="font-medium text-sm">{request.username}</p>
                            <p className="text-xs text-gray-600 capitalize">{request.request_type.replace('_', ' ')}</p>
                          </div>
                          <Badge variant="secondary">Day Off</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Right: Storage Alerts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Backup Drive Storage Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              {storageAlerts.length === 0 ? (
                <p className="text-sm text-gray-500">No storage alerts</p>
              ) : (
                <div className="space-y-2">
                  {storageAlerts.map(drive => {
                    const freeSpaceStr = drive.free_space.replace(/[^\d.]/g, '');
                    const capacityStr = drive.capacity.replace(/[^\d.]/g, '');
                    const freeSpace = parseFloat(freeSpaceStr);
                    const capacity = parseFloat(capacityStr);
                    const freePercentage = capacity > 0 ? Math.round((freeSpace / capacity) * 100) : 0;

                    return (
                      <div key={drive.id} className="flex items-center justify-between p-2 bg-red-50 rounded border border-red-200">
                        <div>
                          <p className="font-medium text-sm">{drive.name}</p>
                          <p className="text-xs text-gray-600">
                            {drive.free_space} free of {drive.capacity}
                          </p>
                        </div>
                        <Badge variant="destructive">{freePercentage}% free</Badge>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Bottom Row - 2 Cards Side by Side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Recent Hard Drives */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HardDrive className="h-5 w-5" />
                Recent Hard Drives
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentHards.length === 0 ? (
                <p className="text-sm text-gray-500">No hard drives found</p>
              ) : (
                <div className="space-y-2">
                  {recentHards.map(drive => (
                    <div key={drive.id} className="flex items-center justify-between p-2 border rounded">
                      <div>
                        <p className="font-medium text-sm">{drive.name}</p>
                        <p className="text-xs text-gray-600">{drive.capacity}</p>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline">{drive.status}</Badge>
                        <p className="text-xs text-gray-500 mt-1">
                          {format(new Date(drive.created_at), 'MMM d')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Right: User Task Utilization */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                User Task Utilization
              </CardTitle>
            </CardHeader>
            <CardContent>
              {taskUtilization.length === 0 ? (
                <p className="text-sm text-gray-500">No task data available</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Completed</TableHead>
                      <TableHead>Rate</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {taskUtilization.map(util => (
                      <TableRow key={util.user_id}>
                        <TableCell className="font-medium">{util.username}</TableCell>
                        <TableCell>{util.total_tasks}</TableCell>
                        <TableCell>{util.completed_tasks}</TableCell>
                        <TableCell>
                          <Badge variant={util.completion_rate >= 80 ? 'default' : 'secondary'}>
                            {util.completion_rate}%
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
};

export default Dashboard;
