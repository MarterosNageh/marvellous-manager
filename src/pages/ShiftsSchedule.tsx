
import React, { useState } from 'react';
import { MainLayout } from "@/components/layout/MainLayout";
import { ShiftsProvider } from '@/context/ShiftsContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Users, Clock, Plus, Filter, Search, BarChart3, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { WeeklyScheduleView } from '@/components/shifts/WeeklyScheduleView';
import { MonthlyScheduleView } from '@/components/shifts/MonthlyScheduleView';
import { DailyScheduleView } from '@/components/shifts/DailyScheduleView';
import { ShiftRequestsPanel } from '@/components/shifts/ShiftRequestsPanel';
import { CreateShiftDialog } from '@/components/shifts/CreateShiftDialog';
import { ShiftRequestDialog } from '@/components/shifts/ShiftRequestDialog';
import { EmployeeShiftsList } from '@/components/shifts/EmployeeShiftsList';
import { ViewMode } from '@/types/shiftTypes';
import { useAuth } from '@/context/AuthContext';

const ShiftsScheduleContent = () => {
  const { currentUser } = useAuth();
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  const isAdmin = currentUser?.isAdmin;
  const isManager = currentUser?.role === 'manager' || currentUser?.isAdmin;

  return (
    <MainLayout>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-lg">
                <Calendar className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Shifts Schedule
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Manage team schedules and shift assignments
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search and Filter */}
              <div className="flex gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search employees..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
                <Select value={filterRole} onValueChange={setFilterRole}>
                  <SelectTrigger className="w-40">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filter by role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="supervisor">Supervisor</SelectItem>
                    <SelectItem value="employee">Employee</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* View Mode Toggle */}
              <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                <Button
                  variant={viewMode === 'day' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('day')}
                  className="text-xs"
                >
                  Day
                </Button>
                <Button
                  variant={viewMode === 'week' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('week')}
                  className="text-xs"
                >
                  Week
                </Button>
                <Button
                  variant={viewMode === 'month' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('month')}
                  className="text-xs"
                >
                  Month
                </Button>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                {/* Request Shift Button for all users */}
                <ShiftRequestDialog>
                  <Button variant="outline">
                    <Clock className="h-4 w-4 mr-2" />
                    Request
                  </Button>
                </ShiftRequestDialog>

                {/* Create Shift Button for admins/managers only */}
                {isManager && (
                  <Button onClick={() => setIsCreateDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Shift
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="p-6">
          <Tabs defaultValue="schedule" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="schedule" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Schedule
              </TabsTrigger>
              <TabsTrigger value="employees" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Employees
              </TabsTrigger>
              <TabsTrigger value="requests" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Requests
              </TabsTrigger>
              {/* Analytics tab only for managers and admins */}
              {isManager && (
                <TabsTrigger value="analytics" className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Analytics
                </TabsTrigger>
              )}
            </TabsList>

            {/* Schedule View */}
            <TabsContent value="schedule" className="space-y-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                {viewMode === 'day' && (
                  <DailyScheduleView 
                    selectedDate={selectedDate}
                    searchTerm={searchTerm}
                    filterRole={filterRole}
                  />
                )}
                {viewMode === 'week' && (
                  <WeeklyScheduleView 
                    selectedDate={selectedDate}
                    searchTerm={searchTerm}
                    filterRole={filterRole}
                  />
                )}
                {viewMode === 'month' && (
                  <MonthlyScheduleView 
                    selectedDate={selectedDate}
                    searchTerm={searchTerm}
                    filterRole={filterRole}
                  />
                )}
              </div>
            </TabsContent>

            {/* Employees View */}
            <TabsContent value="employees" className="space-y-6">
              <EmployeeShiftsList searchTerm={searchTerm} filterRole={filterRole} />
            </TabsContent>

            {/* Requests View */}
            <TabsContent value="requests" className="space-y-6">
              <ShiftRequestsPanel />
            </TabsContent>

            {/* Analytics View - Manager/Admin Only */}
            {isManager && (
              <TabsContent value="analytics" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        Total Shifts This Week
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">247</div>
                      <p className="text-xs text-green-600 flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />
                        +12% from last week
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        Active Employees
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">42</div>
                      <p className="text-xs text-blue-600">8 working now</p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        Pending Requests
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">15</div>
                      <p className="text-xs text-orange-600">Needs approval</p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        Coverage Rate
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">94%</div>
                      <p className="text-xs text-green-600">Above target</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Enhanced Analytics Cards */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Shift Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Morning Shifts</span>
                          <div className="flex items-center gap-2">
                            <div className="w-20 bg-gray-200 rounded-full h-2">
                              <div className="bg-blue-600 h-2 rounded-full" style={{ width: '65%' }}></div>
                            </div>
                            <span className="text-sm font-medium">65%</span>
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Evening Shifts</span>
                          <div className="flex items-center gap-2">
                            <div className="w-20 bg-gray-200 rounded-full h-2">
                              <div className="bg-orange-600 h-2 rounded-full" style={{ width: '25%' }}></div>
                            </div>
                            <span className="text-sm font-medium">25%</span>
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Night Shifts</span>
                          <div className="flex items-center gap-2">
                            <div className="w-20 bg-gray-200 rounded-full h-2">
                              <div className="bg-purple-600 h-2 rounded-full" style={{ width: '10%' }}></div>
                            </div>
                            <span className="text-sm font-medium">10%</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Top Performers</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-xs font-medium">1</span>
                            </div>
                            <span className="text-sm font-medium">John Doe</span>
                          </div>
                          <span className="text-sm text-gray-600">42h this week</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center">
                              <span className="text-xs font-medium">2</span>
                            </div>
                            <span className="text-sm font-medium">Jane Smith</span>
                          </div>
                          <span className="text-sm text-gray-600">38h this week</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center">
                              <span className="text-xs font-medium">3</span>
                            </div>
                            <span className="text-sm font-medium">Mike Johnson</span>
                          </div>
                          <span className="text-sm text-gray-600">35h this week</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            )}
          </Tabs>
        </div>

        {/* Create Shift Dialog */}
        <CreateShiftDialog 
          open={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
        />
      </div>
    </MainLayout>
  );
};

const ShiftsSchedule = () => (
  <ShiftsProvider>
    <ShiftsScheduleContent />
  </ShiftsProvider>
);

export default ShiftsSchedule;
