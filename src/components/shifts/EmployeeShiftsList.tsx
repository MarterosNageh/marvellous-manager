import React, { useState } from 'react';
import { useShifts } from '@/context/ShiftsContext';
import { format, isToday, isThisWeek } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Clock, User, MapPin } from 'lucide-react';

const EmployeeShiftsList = () => {
  const { shifts, employees } = useShifts();
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);

  const today = new Date();

  const employeeShifts = selectedEmployeeId
    ? shifts?.filter(shift => shift.employee_id === selectedEmployeeId)
    : [];

  const upcomingShifts = employeeShifts?.filter(shift => new Date(shift.start_time) >= today)
    .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

  const pastShifts = employeeShifts?.filter(shift => new Date(shift.start_time) < today)
    .sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime());

  return (
    <div>
      <Card>
        <CardHeader>
          <CardTitle>Employee Shifts</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="upcoming">
            <TabsList>
              <TabsTrigger value="upcoming">Upcoming Shifts</TabsTrigger>
              <TabsTrigger value="past">Past Shifts</TabsTrigger>
            </TabsList>
            <div className="mb-4">
              <label htmlFor="employee" className="block text-sm font-medium text-gray-700">
                Select Employee:
              </label>
              <select
                id="employee"
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                value={selectedEmployeeId || ''}
                onChange={(e) => setSelectedEmployeeId(e.target.value === '' ? null : e.target.value)}
              >
                <option value="">All Employees</option>
                {employees?.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.name}
                  </option>
                ))}
              </select>
            </div>
            <TabsContent value="upcoming">
              {upcomingShifts && upcomingShifts.length > 0 ? (
                <div className="grid gap-4">
                  {upcomingShifts.map((shift) => (
                    <Card key={shift.id}>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          {format(new Date(shift.start_time), 'EEE, MMM dd, yyyy')}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="grid gap-1">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          {format(new Date(shift.start_time), 'h:mm a')} - {format(new Date(shift.end_time), 'h:mm a')}
                        </div>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          {employees?.find(emp => emp.id === shift.employee_id)?.name}
                        </div>
                        {shift.location && (
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            {shift.location}
                          </div>
                        )}
                        {isToday(new Date(shift.start_time)) && (
                          <Badge variant="secondary">Today</Badge>
                        )}
                        {isThisWeek(new Date(shift.start_time)) && !isToday(new Date(shift.start_time)) && (
                          <Badge variant="outline">This Week</Badge>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <p>No upcoming shifts for the selected employee.</p>
              )}
            </TabsContent>
            <TabsContent value="past">
              {pastShifts && pastShifts.length > 0 ? (
                <div className="grid gap-4">
                  {pastShifts.map((shift) => (
                    <Card key={shift.id}>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          {format(new Date(shift.start_time), 'EEE, MMM dd, yyyy')}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="grid gap-1">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          {format(new Date(shift.start_time), 'h:mm a')} - {format(new Date(shift.end_time), 'h:mm a')}
                        </div>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          {employees?.find(emp => emp.id === shift.employee_id)?.name}
                        </div>
                        {shift.location && (
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            {shift.location}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <p>No past shifts for the selected employee.</p>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmployeeShiftsList;
