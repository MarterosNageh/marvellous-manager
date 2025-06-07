
import React, { useState, useEffect } from 'react';
import { useShifts } from '@/context/ShiftsContext';
import { format, isToday, isThisWeek } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Clock, User, MapPin } from 'lucide-react';

export const EmployeeShiftsList = () => {
  const { shifts, users } = useShifts();
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const user = localStorage.getItem('currentUser');
    if (user) {
      setCurrentUser(JSON.parse(user));
    }
  }, []);

  const userShifts = shifts?.filter(shift => 
    currentUser && shift.user_id === currentUser.id
  ) || [];

  const todayShifts = userShifts.filter(shift => {
    if (!shift.start_time) return false;
    try {
      return isToday(new Date(shift.start_time));
    } catch {
      return false;
    }
  });

  const thisWeekShifts = userShifts.filter(shift => {
    if (!shift.start_time) return false;
    try {
      return isThisWeek(new Date(shift.start_time));
    } catch {
      return false;
    }
  });

  const upcomingShifts = userShifts.filter(shift => {
    if (!shift.start_time) return false;
    try {
      const shiftDate = new Date(shift.start_time);
      return shiftDate > new Date() && !isThisWeek(shiftDate);
    } catch {
      return false;
    }
  });

  const renderShiftCard = (shift: any) => {
    const user = users?.find(u => u.id === shift.user_id);
    
    return (
      <Card key={shift.id} className="mb-4">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">{shift.title}</CardTitle>
            <Badge 
              variant={shift.status === 'completed' ? 'default' : 
                      shift.status === 'cancelled' ? 'destructive' : 'secondary'}
            >
              {shift.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <span className="text-sm">
                {shift.start_time && format(new Date(shift.start_time), 'EEEE, MMMM d, yyyy')}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-500" />
              <span className="text-sm">
                {shift.start_time && format(new Date(shift.start_time), 'HH:mm')} - 
                {shift.end_time && format(new Date(shift.end_time), 'HH:mm')}
              </span>
            </div>
          </div>
          
          {shift.description && (
            <p className="text-sm text-gray-600">{shift.description}</p>
          )}
          
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${
              isToday(new Date(shift.start_time)) ? 'bg-green-500' : 'bg-blue-500'
            }`} />
            <span className="text-xs text-gray-500">
              {isToday(new Date(shift.start_time)) ? 'Today' : 'Scheduled'}
            </span>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (!currentUser) {
    return (
      <div className="text-center p-6">
        <User className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-medium">Please log in</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Log in to view your assigned shifts.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">My Shifts</h2>
        <p className="text-muted-foreground">
          View and manage your assigned shifts
        </p>
      </div>

      <Tabs defaultValue="today" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="today">
            Today ({todayShifts.length})
          </TabsTrigger>
          <TabsTrigger value="week">
            This Week ({thisWeekShifts.filter(shift => 
              !isThisWeek(new Date(shift.start_time)) || 
              !isToday(new Date(shift.start_time))
            ).length})
          </TabsTrigger>
          <TabsTrigger value="upcoming">
            Upcoming ({upcomingShifts.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="today" className="mt-6">
          {todayShifts.length === 0 ? (
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <Calendar className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-medium">No shifts today</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    You don't have any shifts scheduled for today.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div>
              {todayShifts.map(renderShiftCard)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="week" className="mt-6">
          {thisWeekShifts.length === 0 ? (
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <Calendar className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-medium">No shifts this week</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    You don't have any shifts scheduled for this week.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div>
              {thisWeekShifts
                .filter(shift => !isToday(new Date(shift.start_time)))
                .map(renderShiftCard)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="upcoming" className="mt-6">
          {upcomingShifts.length === 0 ? (
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <Calendar className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-medium">No upcoming shifts</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    You don't have any shifts scheduled beyond this week.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div>
              {upcomingShifts.map(renderShiftCard)}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
