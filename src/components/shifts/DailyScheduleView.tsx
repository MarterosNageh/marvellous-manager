
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Clock, User } from 'lucide-react';
import { useShifts } from '@/context/ShiftsContext';
import { useAuth } from '@/context/AuthContext';
import { isSameDay, format } from 'date-fns';

export const DailyScheduleView = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const { shifts, users } = useShifts();
  const { currentUser } = useAuth();

  // Filter shifts for current day
  const todayShifts = shifts.filter(shift => {
    const shiftDate = new Date(shift.start_time);
    return isSameDay(shiftDate, currentDate);
  });

  // Sort shifts by start time
  const sortedShifts = todayShifts.sort((a, b) => 
    new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
  );

  // Get currently working shifts
  const getCurrentlyWorking = () => {
    const now = new Date();
    return sortedShifts.filter(shift => {
      const startTime = new Date(shift.start_time);
      const endTime = new Date(shift.end_time);
      return startTime <= now && endTime >= now;
    });
  };

  const handlePreviousDay = () => {
    const previousDay = new Date(currentDate);
    previousDay.setDate(currentDate.getDate() - 1);
    setCurrentDate(previousDay);
  };

  const handleNextDay = () => {
    const nextDay = new Date(currentDate);
    nextDay.setDate(currentDate.getDate() + 1);
    setCurrentDate(nextDay);
  };

  const currentlyWorking = getCurrentlyWorking();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h3 className="text-lg font-semibold">
            {format(currentDate, 'EEEE, MMMM d, yyyy')}
          </h3>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={handlePreviousDay}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleNextDay}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Currently Working */}
      {currentlyWorking.length > 0 && (
        <Card className="bg-green-50 border-green-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-green-800">Currently Working</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {currentlyWorking.map((shift) => {
              const user = users.find(u => u.id === shift.user_id);
              return (
                <div key={shift.id} className="bg-white rounded-lg p-4 border border-green-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <User className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium">{user?.username}</p>
                        <p className="text-sm text-gray-600">{shift.title}</p>
                        <p className="text-xs text-gray-500">
                          {format(new Date(shift.start_time), 'HH:mm')} - {format(new Date(shift.end_time), 'HH:mm')}
                        </p>
                      </div>
                    </div>
                    <Badge className="bg-green-100 text-green-800">Active</Badge>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* All Shifts for the Day */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Daily Schedule ({sortedShifts.length} shifts)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {sortedShifts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Clock className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No shifts scheduled for this day</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sortedShifts.map((shift) => {
                const user = users.find(u => u.id === shift.user_id);
                const isCurrentlyWorking = currentlyWorking.some(cs => cs.id === shift.id);
                
                return (
                  <div 
                    key={shift.id} 
                    className={`p-4 rounded-lg border ${
                      isCurrentlyWorking 
                        ? 'bg-green-50 border-green-200' 
                        : 'bg-white border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="text-center">
                          <div className="text-sm font-medium text-gray-900">
                            {format(new Date(shift.start_time), 'HH:mm')}
                          </div>
                          <div className="text-xs text-gray-500">to</div>
                          <div className="text-sm font-medium text-gray-900">
                            {format(new Date(shift.end_time), 'HH:mm')}
                          </div>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{shift.title}</h4>
                          <p className="text-sm text-gray-600">{user?.username}</p>
                          {shift.notes && (
                            <p className="text-xs text-gray-500 mt-1">{shift.notes}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={shift.shift_type === 'morning' ? 'default' : 'secondary'}>
                          {shift.shift_type}
                        </Badge>
                        {isCurrentlyWorking && (
                          <Badge className="bg-green-100 text-green-800">Active</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
