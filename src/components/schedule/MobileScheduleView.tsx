import React, { useState, useEffect } from 'react';
import { format, addDays, isSameDay, startOfWeek, isToday } from 'date-fns';
import { Plus, Calendar, Clock, Users, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSchedule } from '@/context/ScheduleContext';
import { useAuth } from '@/context/AuthContext';
import { Shift, ScheduleUser } from '@/types/schedule';
import { shiftsTable, usersTable } from '@/integrations/supabase/tables/schedule';
import { cn } from '@/lib/utils';
import ShiftDialog from './ShiftDialog';

const MobileScheduleView = () => {
  const { currentUser } = useAuth();
  const { shifts, templates, createShift, updateShift, refreshData } = useSchedule();
  const { users } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [localUsers, setLocalUsers] = useState<ScheduleUser[]>([]);
  const [currentView, setCurrentView] = useState<'shifts' | 'requests' | 'open-shifts' | 'time-clock'>('shifts');
  const [showShiftDialog, setShowShiftDialog] = useState(false);
  const [editingShift, setEditingShift] = useState<Shift | null>(null);
  const [prefilledShift, setPrefilledShift] = useState<Partial<Shift> | null>(null);

  useEffect(() => {
    // Use users from AuthContext if available, else fallback to DB fetch
    if (users && users.length > 0) {
      // Separate operational users from producers
      const operationalUsers = users
        .filter(user => user.role !== 'producer')
        .map(user => ({
          id: user.id,
          username: user.username,
          role: (user.role === 'admin' || user.role === 'senior' || user.role === 'operator') ? user.role : 'operator',
          title: user.title || '',
          balance: 0
        })) as ScheduleUser[];

      const producerUsers = users
        .filter(user => user.role === 'producer')
        .map(user => ({
          id: user.id,
          username: user.username,
          role: 'producer' as const,
          title: user.title || '',
          balance: 0
        })) as ScheduleUser[];

      setLocalUsers([...operationalUsers, ...producerUsers]);
    } else {
      // fallback: fetch from DB (legacy)
      const loadUsers = async () => {
        try {
          const usersData = await usersTable.getAll();
          
          // Separate operational users from producers
          const operationalUsers = usersData
            .filter(user => user.role !== 'producer')
            .map(user => ({
              id: user.id,
              username: user.username,
              role: (user.role === 'admin' || user.role === 'senior' || user.role === 'operator') ? user.role : 'operator',
              title: user.title || '',
              balance: 0
            }));

          const producerUsers = usersData
            .filter(user => user.role === 'producer')
            .map(user => ({
              id: user.id,
              username: user.username,
              role: 'producer' as const,
              title: user.title || '',
              balance: 0
            }));

          setLocalUsers([...operationalUsers, ...producerUsers]);
        } catch (error) {
          console.error('Error loading users:', error);
        }
      };
      loadUsers();
    }
  }, [users]);

  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 0 });
  const weekDates = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const getShiftsForDate = (date: Date) => {
    return shifts.filter(shift => isSameDay(new Date(shift.start_time), date));
  };

  const getUserShiftsForDate = (date: Date, userId: string) => {
    return shifts.filter(shift => 
      isSameDay(new Date(shift.start_time), date) && shift.user_id === userId
    );
  };

  const getShiftColor = (shiftType: string) => {
    const colors: Record<string, string> = {
      'morning': '#10B981',
      'night': '#8B5CF6', 
      'over night': '#F59E0B',
      'day-off': '#6B7280'
    };
    return colors[shiftType] || '#3B82F6';
  };

  const ShiftCard = ({ shift, user }: { shift: Shift; user?: ScheduleUser }) => {
    const startTime = format(new Date(shift.start_time), 'h:mm a');
    const endTime = format(new Date(shift.end_time), 'h:mm a');
    const isAdmin = currentUser?.role === 'admin';
    return (
      <div 
        className="p-3 rounded-lg mb-2 cursor-pointer hover:bg-blue-50 transition-colors"
        style={{ backgroundColor: shift.color || getShiftColor(shift.shift_type) + '20' }}
        onClick={() => {
          if (isAdmin) {
            setEditingShift(shift);
            setShowShiftDialog(true);
          }
        }}
      >
        <div className="flex justify-between items-start mb-1">
          <span className="font-medium text-sm">{`${startTime} - ${endTime}`}</span>
          <div 
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: shift.color || getShiftColor(shift.shift_type) }}
          />
        </div>
        <div className="text-xs text-gray-600 mb-1">{user?.username || 'Unknown User'}</div>
        <div className="text-xs text-gray-500 capitalize">{shift.shift_type}</div>
        {shift.notes && (
          <div className="text-xs text-gray-500 mt-1">{shift.notes}</div>
        )}
      </div>
    );
  };

  const renderShiftsView = () => {
    if (currentView === 'shifts') {
      const todayShifts = getShiftsForDate(selectedDate);
      
      return (
        <div className="space-y-4">
          {/* Date navigation */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setSelectedDate(addDays(selectedDate, -1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <div className="text-center">
              <div className="text-lg font-semibold">
                {format(selectedDate, 'MMM d')}
              </div>
              <div className="text-sm text-gray-500">
                {format(selectedDate, 'EEEE')}
              </div>
            </div>
            
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setSelectedDate(addDays(selectedDate, 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Today button */}
          {!isToday(selectedDate) && (
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => setSelectedDate(new Date())}
            >
              Go to Today
            </Button>
          )}

          {/* Shifts for selected date */}
          <div>
            <h3 className="font-medium mb-3">
              Shifts for {format(selectedDate, 'MMMM d, yyyy')}
            </h3>
            
            {todayShifts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No shifts scheduled for this day</p>
              </div>
            ) : (
              <div>
                {todayShifts.map(shift => {
                  const user = localUsers.find(u => u.id === shift.user_id);
                  return (
                    <ShiftCard key={shift.id} shift={shift} user={user} />
                  );
                })}
              </div>
            )}
          </div>

          {/* Week overview */}
          <div>
            <h3 className="font-medium mb-3">Week Overview</h3>
            <div className="grid grid-cols-7 gap-1">
              {weekDates.map((date, index) => {
                const dayShifts = getShiftsForDate(date);
                const isSelected = isSameDay(date, selectedDate);
                const isCurrentDay = isToday(date);
                
                return (
                  <button
                    key={index}
                    onClick={() => setSelectedDate(date)}
                    className={cn(
                      "p-2 rounded-lg text-center relative",
                      isSelected ? "bg-blue-500 text-white" : "bg-gray-50",
                      isCurrentDay && !isSelected && "bg-blue-100"
                    )}
                  >
                    <div className="text-xs font-medium">
                      {format(date, 'EEE')}
                    </div>
                    <div className="text-sm">
                      {format(date, 'd')}
                    </div>
                    {dayShifts.length > 0 && (
                      <div className="absolute -top-1 -right-1">
                        <Badge variant="secondary" className="h-5 w-5 p-0 text-xs">
                          {dayShifts.length}
                        </Badge>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      );
    }

    // Placeholder for other views
    return (
      <div className="text-center py-8 text-gray-500">
        <p>Coming soon...</p>
      </div>
    );
  };

  // Add Shift handler
  const handleAddShift = () => {
    if (currentUser?.role !== 'admin') return;
    // Prefill with selected date
    setPrefilledShift({
      start_time: format(selectedDate, 'yyyy-MM-dd') + 'T09:00:00.000Z',
      end_time: format(selectedDate, 'yyyy-MM-dd') + 'T17:00:00.000Z',
      shift_type: 'morning',
      title: 'Morning Shift',
      description: '',
      notes: '',
      status: 'active',
      color: '#E3F2FD',
      repeat_days: []
    });
    setEditingShift(null);
    setShowShiftDialog(true);
  };

  // Save handler for ShiftDialog
  const handleSaveShift = async (shiftData: any) => {
    try {
      if (editingShift) {
        // Edit mode
        await updateShift(editingShift.id, shiftData, 'this');
      } else {
        // Add mode
        await createShift(shiftData);
      }
      setShowShiftDialog(false);
      setEditingShift(null);
      setPrefilledShift(null);
      if (refreshData) await refreshData();
    } catch (error) {
      // Error handled in context
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Your Shifts</h1>

        </div>
      </div>

     
      {/* Content */}
      <div className="p-4">
        {renderShiftsView()}
      </div>

      {/* FAB for adding shifts (admin only) */}
      {currentUser?.role === 'admin' && (
        <div className="fixed bottom-6 right-6">
          <Button size="lg" className="rounded-full h-14 w-14 shadow-lg" onClick={handleAddShift}>
            <Plus className="h-6 w-6" />
          </Button>
        </div>
      )}
      {/* ShiftDialog for add/edit */}
      {showShiftDialog && (
        <ShiftDialog
          shift={editingShift || (prefilledShift as Shift) || undefined}
          onClose={() => {
            setShowShiftDialog(false);
            setEditingShift(null);
            setPrefilledShift(null);
          }}
          onSave={handleSaveShift}
          templates={templates}
          users={localUsers}
        />
      )}
    </div>
  );
};

export default MobileScheduleView;
