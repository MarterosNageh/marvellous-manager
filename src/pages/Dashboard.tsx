
import React, { useEffect, useState } from 'react';
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Users, 
  Calendar, 
  HardDrive, 
  AlertTriangle,
  UserCheck,
  Coffee,
  Clock
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { ShiftsProvider } from '@/context/ShiftsContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, isToday } from 'date-fns';

const DashboardContent = () => {
  const { currentUser, users } = useAuth();

  // Fetch shifts for dashboard
  const { data: shifts = [] } = useQuery({
    queryKey: ['shifts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shifts')
        .select('*')
        .order('start_time', { ascending: true });
      
      if (error) throw error;
      return data;
    }
  });

  // Fetch hard drives
  const { data: hardDrives = [] } = useQuery({
    queryKey: ['hardDrives'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hard_drives')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  // Fetch tasks for utilization
  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          task_assignments!inner(user_id)
        `);
      
      if (error) throw error;
      return data;
    }
  });

  // Get today's shifts
  const todayShifts = shifts.filter(shift => {
    const shiftDate = new Date(shift.start_time);
    return isToday(shiftDate) && shift.status === 'scheduled';
  });

  // Get current working employees
  const getCurrentShifts = () => {
    const now = new Date();
    return shifts.filter(shift => {
      const shiftStart = new Date(shift.start_time);
      const shiftEnd = new Date(shift.end_time);
      return shiftStart <= now && shiftEnd >= now && shift.status === 'scheduled';
    });
  };

  const currentShifts = getCurrentShifts();

  // Get employees on day off (not scheduled today)
  const getEmployeesOnDayOff = () => {
    const scheduledUserIds = todayShifts.map(shift => shift.user_id);
    return users.filter(user => !scheduledUserIds.includes(user.id));
  };

  const employeesOnDayOff = getEmployeesOnDayOff();

  // Parse storage capacity and free space
  const parseStorageSize = (sizeStr: string): number => {
    if (!sizeStr || sizeStr === 'N/A' || sizeStr === '' || sizeStr === '0') return 0;
    
    const cleanStr = sizeStr.replace(/[^0-9.]/g, '');
    const num = parseFloat(cleanStr);
    
    if (sizeStr.toUpperCase().includes('TB')) return num * 1000;
    if (sizeStr.toUpperCase().includes('GB')) return num;
    return num;
  };

  // Get backup drives with low storage (< 15% free space)
  const getBackupDriveAlerts = () => {
    const backupDrives = hardDrives
      .filter(drive => drive.name.includes('BK'))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    const alerts = [];
    
    for (const drive of backupDrives) {
      const capacity = parseStorageSize(drive.capacity || '');
      const freeSpace = parseStorageSize(drive.free_space || '');
      
      if (capacity > 0 && freeSpace > 0) {
        const usedSpace = capacity - freeSpace;
        const usagePercent = (usedSpace / capacity) * 100;
        
        if (usagePercent > 85) { // More than 85% used = less than 15% free
          alerts.push({
            ...drive,
            usagePercent: Math.round(usagePercent),
            freePercent: Math.round((freeSpace / capacity) * 100)
          });
        }
      }
    }
    
    return alerts;
  };

  const storageAlerts = getBackupDriveAlerts();

  // Get recent hard drives (last 5)
  const recentHardDrives = hardDrives.slice(0, 5);

  // Calculate user task utilization
  const getUserTaskUtilization = () => {
    const userStats = users.map(user => {
      const userTasks = tasks.filter(task => 
        task.task_assignments?.some((assignment: any) => assignment.user_id === user.id)
      );
      
      const completedTasks = userTasks.filter(task => task.status === 'completed').length;
      const inProgressTasks = userTasks.filter(task => task.status === 'in_progress').length;
      const todoTasks = userTasks.filter(task => task.status === 'todo').length;
      const totalTasks = userTasks.length;
      
      const utilizationRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
      
      return {
        user,
        totalTasks,
        completedTasks,
        inProgressTasks,
        todoTasks,
        utilizationRate
      };
    });
    
    return userStats.sort((a, b) => b.utilizationRate - a.utilizationRate);
  };

  const userUtilization = getUserTaskUtilization();

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {currentUser?.username}! Here's what's happening today.
          </p>
        </div>

        {/* Main Grid - 2x2 Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Today's Shifts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Today's Shifts ({todayShifts.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {todayShifts.length === 0 ? (
                <div className="text-center py-4 text-gray-500">
                  <Calendar className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  <p>No shifts scheduled for today</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {todayShifts.slice(0, 3).map((shift) => {
                    const user = users.find(u => u.id === shift.user_id);
                    return (
                      <div key={shift.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs bg-blue-100 text-blue-600">
                              {user?.username?.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-sm">{user?.username}</p>
                            <p className="text-xs text-gray-600">{shift.title}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500">
                            {format(new Date(shift.start_time), 'HH:mm')} - {format(new Date(shift.end_time), 'HH:mm')}
                          </p>
                          <Badge variant="outline" className="text-xs">
                            {shift.shift_type}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                  {todayShifts.length > 3 && (
                    <p className="text-xs text-gray-500 text-center">
                      +{todayShifts.length - 3} more shifts
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Currently Working & Day Off */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="h-5 w-5" />
                Staff Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Currently Working */}
                <div>
                  <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                    <Clock className="h-4 w-4 text-green-600" />
                    Currently Working ({currentShifts.length})
                  </h4>
                  {currentShifts.length === 0 ? (
                    <p className="text-xs text-gray-500">No one is currently working</p>
                  ) : (
                    <div className="space-y-2">
                      {currentShifts.slice(0, 2).map((shift) => {
                        const user = users.find(u => u.id === shift.user_id);
                        return (
                          <div key={shift.id} className="flex items-center space-x-2">
                            <Avatar className="h-6 w-6">
                              <AvatarFallback className="text-xs bg-green-100 text-green-600">
                                {user?.username?.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-xs">{user?.username}</span>
                          </div>
                        );
                      })}
                      {currentShifts.length > 2 && (
                        <p className="text-xs text-gray-500">+{currentShifts.length - 2} more</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Day Off */}
                <div>
                  <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                    <Coffee className="h-4 w-4 text-orange-600" />
                    Day Off ({employeesOnDayOff.length})
                  </h4>
                  {employeesOnDayOff.length === 0 ? (
                    <p className="text-xs text-gray-500">Everyone is scheduled today</p>
                  ) : (
                    <div className="space-y-2">
                      {employeesOnDayOff.slice(0, 2).map((user) => (
                        <div key={user.id} className="flex items-center space-x-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-xs bg-orange-100 text-orange-600">
                              {user.username?.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs">{user.username}</span>
                        </div>
                      ))}
                      {employeesOnDayOff.length > 2 && (
                        <p className="text-xs text-gray-500">+{employeesOnDayOff.length - 2} more</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Hard Drives */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HardDrive className="h-5 w-5" />
                Recent Hard Drives
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentHardDrives.length === 0 ? (
                <div className="text-center py-4 text-gray-500">
                  <HardDrive className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  <p>No hard drives found</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentHardDrives.map((drive) => (
                    <div key={drive.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-sm">{drive.name}</p>
                        <p className="text-xs text-gray-600">{drive.capacity}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">
                          {format(new Date(drive.created_at), 'MMM d')}
                        </p>
                        <Badge variant="outline" className="text-xs">
                          Available
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Backup Drive Storage Alerts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                Backup Drive Storage Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              {storageAlerts.length === 0 ? (
                <div className="text-center py-4 text-gray-500">
                  <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  <p>No storage alerts</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {storageAlerts.map((drive) => (
                    <div key={drive.id} className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div>
                        <p className="font-medium text-sm text-red-800">{drive.name}</p>
                        <p className="text-xs text-red-600">
                          {drive.freePercent}% free space remaining
                        </p>
                      </div>
                      <Badge variant="destructive" className="text-xs">
                        {drive.usagePercent}% used
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
              <Users className="h-5 w-5" />
              User Task Utilization
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-medium">User</th>
                    <th className="text-center p-3 font-medium">Total Tasks</th>
                    <th className="text-center p-3 font-medium">Completed</th>
                    <th className="text-center p-3 font-medium">In Progress</th>
                    <th className="text-center p-3 font-medium">To Do</th>
                    <th className="text-center p-3 font-medium">Utilization Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {userUtilization.map((userStat) => (
                    <tr key={userStat.user.id} className="border-b hover:bg-gray-50">
                      <td className="p-3">
                        <div className="flex items-center space-x-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-xs">
                              {userStat.user.username?.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{userStat.user.username}</span>
                        </div>
                      </td>
                      <td className="text-center p-3">{userStat.totalTasks}</td>
                      <td className="text-center p-3">
                        <Badge variant="outline" className="bg-green-50 text-green-700">
                          {userStat.completedTasks}
                        </Badge>
                      </td>
                      <td className="text-center p-3">
                        <Badge variant="outline" className="bg-blue-50 text-blue-700">
                          {userStat.inProgressTasks}
                        </Badge>
                      </td>
                      <td className="text-center p-3">
                        <Badge variant="outline" className="bg-gray-50 text-gray-700">
                          {userStat.todoTasks}
                        </Badge>
                      </td>
                      <td className="text-center p-3">
                        <Badge 
                          variant="outline" 
                          className={
                            userStat.utilizationRate >= 80 ? "bg-green-50 text-green-700" :
                            userStat.utilizationRate >= 60 ? "bg-yellow-50 text-yellow-700" :
                            "bg-red-50 text-red-700"
                          }
                        >
                          {userStat.utilizationRate}%
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

const Dashboard = () => {
  return (
    <ShiftsProvider>
      <DashboardContent />
    </ShiftsProvider>
  );
};

export default Dashboard;
