
import React, { useState, useEffect } from 'react';
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/context/AuthContext";
import { useData } from "@/context/DataContext";
import { supabase } from "@/integrations/supabase/client";
import { 
  HardDrive, 
  Calendar, 
  Users, 
  Clock, 
  AlertTriangle, 
  UserX,
  BarChart3
} from "lucide-react";
import { format } from 'date-fns';

interface DashboardShift {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
  user_id: string;
  status: string;
  username?: string;
}

interface ShiftRequest {
  id: string;
  request_type: string;
  status: string;
  start_date: string;
  end_date?: string;
  reason?: string;
  user_id: string;
  username?: string;
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
  const { hardDrives } = useData();
  const [currentShifts, setCurrentShifts] = useState<DashboardShift[]>([]);
  const [todayTimeOffRequests, setTodayTimeOffRequests] = useState<ShiftRequest[]>([]);
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
            id,
            title,
            start_time,
            end_time,
            user_id,
            status,
            auth_users!shifts_user_id_fkey(username)
          `)
          .lte('start_time', now)
          .gte('end_time', now)
          .eq('status', 'scheduled');

        if (currentShiftsData) {
          const shiftsWithUsers = currentShiftsData.map(shift => ({
            ...shift,
            username: shift.auth_users?.username || 'Unknown'
          }));
          setCurrentShifts(shiftsWithUsers);
        }

        // Fetch today's time-off requests
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        const { data: requestsData } = await supabase
          .from('shift_requests')
          .select(`
            id,
            request_type,
            status,
            start_date,
            end_date,
            reason,
            user_id,
            auth_users!shift_requests_user_id_fkey(username)
          `)
          .eq('request_type', 'time_off')
          .gte('start_date', todayStart.toISOString())
          .lte('start_date', todayEnd.toISOString());

        if (requestsData) {
          const requestsWithUsers = requestsData.map(request => ({
            ...request,
            username: request.auth_users?.username || 'Unknown'
          }));
          setTodayTimeOffRequests(requestsWithUsers);
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
    return hardDrives
      .filter(hd => hd.name.includes('BK') && hd.status === 'available')
      .filter(hd => hd.freeSpace && hd.freeSpace !== 'N/A' && hd.freeSpace.trim() !== '')
      .map(hd => {
        const getFreeSpacePercentage = (freeSpace: string, capacity: string) => {
          const free = parseFloat(freeSpace.replace(/[^\d.]/g, '')) || 0;
          const total = parseFloat(capacity.replace(/[^\d.]/g, '')) || 1;
          return (free / total) * 100;
        };

        const freeSpacePercent = getFreeSpacePercentage(hd.freeSpace, hd.capacity || '1TB');
        const isLowSpace = freeSpacePercent < 20;

        return isLowSpace ? {
          id: hd.id,
          name: hd.name,
          freeSpacePercent,
          capacity: hd.capacity,
          freeSpace: hd.freeSpace
        } : null;
      })
      .filter(Boolean);
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
        {/* Welcome Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Welcome Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">
                Welcome back, {currentUser?.username}
              </CardTitle>
              <CardDescription>
                Here's what's happening with your organization today.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Clock className="h-5 w-5 text-blue-600" />
                  <span className="text-sm font-medium">
                    {format(new Date(), 'EEEE, MMMM d, yyyy')}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Currently Working & Time Off */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-green-600" />
                Staff Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Currently Working */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-green-700">Currently Working</span>
                  <Badge variant="secondary">{currentShifts.length}</Badge>
                </div>
                {currentShifts.length === 0 ? (
                  <p className="text-sm text-gray-500">No one is currently working</p>
                ) : (
                  <div className="space-y-2">
                    {currentShifts.slice(0, 3).map((shift) => (
                      <div key={shift.id} className="flex items-center space-x-2">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="bg-green-100 text-green-700 text-xs">
                            {shift.username?.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{shift.username}</span>
                        <span className="text-xs text-gray-500">
                          until {format(new Date(shift.end_time), 'HH:mm')}
                        </span>
                      </div>
                    ))}
                    {currentShifts.length > 3 && (
                      <p className="text-xs text-gray-500">+{currentShifts.length - 3} more</p>
                    )}
                  </div>
                )}
              </div>

              {/* Time Off Today */}
              {todayTimeOffRequests.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-orange-700 flex items-center gap-1">
                      <UserX className="h-4 w-4" />
                      Time Off Today
                    </span>
                    <Badge variant="outline">{todayTimeOffRequests.length}</Badge>
                  </div>
                  <div className="space-y-1">
                    {todayTimeOffRequests.map((request) => (
                      <div key={request.id} className="flex items-center space-x-2">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="bg-orange-100 text-orange-700 text-xs">
                            {request.username?.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{request.username}</span>
                        <Badge variant="outline" className="text-xs">
                          {request.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Alerts and Recent Hard Drives */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Hard Drives */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HardDrive className="h-5 w-5" />
                Recent Hard Drives
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {hardDrives.slice(0, 5).map((hardDrive) => (
                  <div key={hardDrive.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <HardDrive className="h-6 w-6 text-blue-600" />
                      <div>
                        <p className="font-medium text-sm">{hardDrive.name}</p>
                        <p className="text-xs text-gray-500">{hardDrive.serialNumber}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={hardDrive.status === 'available' ? 'default' : 'secondary'} className="text-xs">
                        {hardDrive.status}
                      </Badge>
                      <p className="text-xs text-gray-500 mt-1">
                        {hardDrive.capacity || 'Unknown'}
                      </p>
                    </div>
                  </div>
                ))}
                {hardDrives.length === 0 && (
                  <div className="text-center py-4 text-gray-500 text-sm">
                    No hard drives available
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Backup Drive Storage Alerts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                Backup Drive Storage Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              {backupDriveAlerts.length === 0 ? (
                <div className="text-center py-4 text-gray-500 text-sm">
                  No storage alerts for backup drives
                </div>
              ) : (
                <div className="space-y-3">
                  {backupDriveAlerts.map((alert, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                      <div className="flex items-center space-x-3">
                        <HardDrive className="h-6 w-6 text-red-600" />
                        <div>
                          <p className="font-medium text-sm">{alert.name}</p>
                          <p className="text-xs text-gray-600">
                            {alert.freeSpace} free of {alert.capacity}
                          </p>
                        </div>
                      </div>
                      <Badge variant="destructive" className="text-xs">
                        {alert.freeSpacePercent.toFixed(1)}% free
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* User Task Utilization Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              User Task Utilization
            </CardTitle>
            <CardDescription>
              Task completion rates and workload distribution
            </CardDescription>
          </CardHeader>
          <CardContent>
            {userUtilization.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No user task data available
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-4 font-medium">User</th>
                      <th className="text-center py-2 px-4 font-medium">Total Tasks</th>
                      <th className="text-center py-2 px-4 font-medium">Completed</th>
                      <th className="text-center py-2 px-4 font-medium">In Progress</th>
                      <th className="text-center py-2 px-4 font-medium">Completion Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userUtilization.map((user) => (
                      <tr key={user.userId} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-2">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="bg-blue-100 text-blue-600 text-xs">
                                {user.username.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{user.username}</span>
                          </div>
                        </td>
                        <td className="text-center py-3 px-4">{user.totalTasks}</td>
                        <td className="text-center py-3 px-4">
                          <Badge variant="default" className="bg-green-100 text-green-800">
                            {user.completedTasks}
                          </Badge>
                        </td>
                        <td className="text-center py-3 px-4">
                          <Badge variant="secondary">
                            {user.inProgressTasks}
                          </Badge>
                        </td>
                        <td className="text-center py-3 px-4">
                          <div className="flex items-center justify-center space-x-2">
                            <div className="w-16 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full" 
                                style={{ width: `${user.completionRate}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-medium">{user.completionRate}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default Dashboard;
