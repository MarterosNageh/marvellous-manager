import React, { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useShifts } from '@/context/ShiftsContext';
import { useData } from '@/context/DataContext';
import { format, isToday } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CalendarDays, Users, Clock, CheckCircle, AlertTriangle, BarChart3, HardDrive, FileText, Calendar } from 'lucide-react';

const Dashboard = () => {
  const { tasks } = useData();
  const { shifts } = useShifts();
  const [completedTasks, setCompletedTasks] = useState(0);
  const [overdueTasks, setOverdueTasks] = useState(0);
  const [totalShifts, setTotalShifts] = useState(0);
  const [totalEmployees, setTotalEmployees] = useState(0);
  const [totalProjects, setTotalProjects] = useState(0);
  const [totalStorage, setTotalStorage] = useState(0);
  const [totalDocuments, setTotalDocuments] = useState(0);
  const [upcomingEvents, setUpcomingEvents] = useState([]);

  useEffect(() => {
    // Mock data for demonstration
    setCompletedTasks(tasks.filter(task => task.status === 'completed').length);
    setOverdueTasks(tasks.filter(task => task.status !== 'completed' && new Date(task.due_date) < new Date()).length);
    setTotalShifts(shifts.length);
    setTotalEmployees(50);
    setTotalProjects(15);
    setTotalStorage(250);
    setTotalDocuments(120);
    setUpcomingEvents([
      { id: 1, title: 'Team Meeting', date: format(addDays(new Date(), 2), 'MMMM dd, yyyy'), time: '10:00 AM' },
      { id: 2, title: 'Project Deadline', date: format(addDays(new Date(), 7), 'MMMM dd, yyyy'), time: '5:00 PM' },
    ]);
  }, [tasks, shifts]);

  const addDays = (date: Date, days: number) => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Here&apos;s an overview of your tasks, shifts, and team activity today {format(new Date(), 'MMMM dd, yyyy')}.
        </p>
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Completed Tasks
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completedTasks}</div>
              <p className="text-xs text-muted-foreground">
                {tasks.length > 0 ? `+${((completedTasks / tasks.length) * 100).toFixed(0)}% from last month` : 'No tasks yet'}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Overdue Tasks
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overdueTasks}</div>
              <p className="text-xs text-muted-foreground">
                {tasks.length > 0 ? `${((overdueTasks / tasks.length) * 100).toFixed(0)}% of total tasks` : 'No tasks yet'}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Shifts
              </CardTitle>
              <Clock className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalShifts}</div>
              <p className="text-xs text-muted-foreground">
                {isToday(new Date()) ? "Today's shifts" : "Total shifts scheduled"}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Employees
              </CardTitle>
              <Users className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalEmployees}</div>
              <p className="text-xs text-muted-foreground">
                Active employees
              </p>
            </CardContent>
          </Card>
        </div>
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
          <Card className="col-span-1 md:col-span-1">
            <CardHeader>
              <CardTitle>Project Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Total Projects</span>
                  <span>{totalProjects}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Active Projects</span>
                  <span>10</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Completed Projects</span>
                  <span>5</span>
                </div>
                <Progress value={65} />
              </div>
            </CardContent>
          </Card>
          <Card className="col-span-1 md:col-span-1">
            <CardHeader>
              <CardTitle>Resource Usage</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Storage</span>
                  <span>{totalStorage} GB</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Documents</span>
                  <span>{totalDocuments}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Bandwidth</span>
                  <span>500 GB</span>
                </div>
                <Progress value={80} />
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Upcoming Events</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {upcomingEvents.map(event => (
                <div key={event.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{event.title}</p>
                    <p className="text-xs text-muted-foreground">
                      <Calendar className="mr-2 inline-block h-4 w-4" />
                      {event.date}
                      <Clock className="ml-2 mr-2 inline-block h-4 w-4" />
                      {event.time}
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    View
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Team Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">New Tasks Created</span>
                  <span>10</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Tasks Completed</span>
                  <span>8</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Comments Added</span>
                  <span>25</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
};

export default Dashboard;
