
import React from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useData } from '@/context/DataContext';
import { useShifts } from '@/context/ShiftsContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format, isToday } from 'date-fns';
import { Calendar, Clock, HardDrive, Users } from 'lucide-react';

const Dashboard = () => {
  const { hardDrives } = useData();
  const { shifts, users } = useShifts();

  // Calculate today's stats
  const todayShifts = shifts?.filter(shift => {
    if (!shift.start_time) return false;
    try {
      return isToday(new Date(shift.start_time));
    } catch {
      return false;
    }
  }) || [];

  const activeUsers = users?.length || 0;
  const totalHardDrives = hardDrives?.length || 0;

  // Get upcoming shifts (next 5)
  const upcomingShifts = shifts
    ?.filter(shift => {
      if (!shift.start_time) return false;
      try {
        return new Date(shift.start_time) > new Date();
      } catch {
        return false;
      }
    })
    .sort((a, b) => {
      try {
        return new Date(a.start_time).getTime() - new Date(b.start_time).getTime();
      } catch {
        return 0;
      }
    })
    .slice(0, 5) || [];

  // Get recent hard drive activities (last 5)
  const recentHardDrives = hardDrives
    ?.sort((a, b) => {
      try {
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      } catch {
        return 0;
      }
    })
    .slice(0, 5) || [];

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome to your management dashboard
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Shifts</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{todayShifts.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeUsers}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Hard Drives</CardTitle>
              <HardDrive className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalHardDrives}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Shifts</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{shifts?.length || 0}</div>
            </CardContent>
          </Card>
        </div>

        {/* Content Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Today's Shifts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Today's Shifts
              </CardTitle>
            </CardHeader>
            <CardContent>
              {todayShifts.length === 0 ? (
                <p className="text-muted-foreground">No shifts scheduled for today</p>
              ) : (
                <div className="space-y-3">
                  {todayShifts.map((shift) => {
                    const user = users?.find(u => u.id === shift.user_id);
                    return (
                      <div key={shift.id} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{shift.title}</p>
                          <p className="text-sm text-muted-foreground">{user?.username}</p>
                        </div>
                        <div className="text-right">
                          <Badge variant="outline">
                            {shift.start_time && format(new Date(shift.start_time), 'HH:mm')}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upcoming Shifts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Upcoming Shifts
              </CardTitle>
            </CardHeader>
            <CardContent>
              {upcomingShifts.length === 0 ? (
                <p className="text-muted-foreground">No upcoming shifts</p>
              ) : (
                <div className="space-y-3">
                  {upcomingShifts.map((shift) => {
                    const user = users?.find(u => u.id === shift.user_id);
                    return (
                      <div key={shift.id} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{shift.title}</p>
                          <p className="text-sm text-muted-foreground">{user?.username}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm">
                            {shift.start_time && format(new Date(shift.start_time), 'MMM d, HH:mm')}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
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
                <p className="text-muted-foreground">No hard drives registered</p>
              ) : (
                <div className="space-y-3">
                  {recentHardDrives.map((drive) => (
                    <div key={drive.id} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{drive.serialNumber}</p>
                        <p className="text-sm text-muted-foreground">{drive.capacity}</p>
                      </div>
                      <div className="text-right">
                        <Badge variant="default">
                          Active
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <a
                  href="/shifts-schedule"
                  className="block w-full p-3 text-left border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <p className="font-medium">Manage Shifts</p>
                  <p className="text-sm text-muted-foreground">View and manage staff schedules</p>
                </a>
                <a
                  href="/hard-drives"
                  className="block w-full p-3 text-left border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <p className="font-medium">Hard Drive Inventory</p>
                  <p className="text-sm text-muted-foreground">Track hard drive status and location</p>
                </a>
                <a
                  href="/task-manager"
                  className="block w-full p-3 text-left border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <p className="font-medium">Task Management</p>
                  <p className="text-sm text-muted-foreground">Create and assign tasks</p>
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
};

export default Dashboard;
