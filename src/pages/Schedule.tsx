import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useSchedule } from "@/context/ScheduleContext";
import {
  Card,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Badge,
} from '@/components/ui';
import { ViewType, ScheduleUser, ShiftTemplate, Shift } from '@/types/schedule';
import WeeklyView from '@/components/schedule/WeeklyView';
import DailyView from '@/components/schedule/DailyView';
import MonthlyView from '@/components/schedule/MonthlyView';
import RequestsView from '@/components/schedule/RequestsView';
import { Plus, ChevronLeft, ChevronRight, Settings, Calendar, User } from 'lucide-react';
import { ErrorBoundary } from 'react-error-boundary';
import { addDays, format, startOfWeek, endOfWeek, addWeeks, subWeeks } from 'date-fns';
import { usersTable, templatesTable, shiftsTable } from '@/integrations/supabase/tables';
import ShiftDialog from '@/components/schedule/ShiftDialog';
import ShiftTemplateDialog from '@/components/schedule/ShiftTemplateDialog';

function ErrorFallback({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-[400px] p-4">
      <h2 className="text-xl font-semibold mb-4">Something went wrong:</h2>
      <pre className="text-red-600 mb-4">{error.message}</pre>
      <Button onClick={resetErrorBoundary}>Try again</Button>
    </div>
  );
}

const Schedule = () => {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('shifts');
  const [viewType, setViewType] = useState<ViewType>('weekly');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [users, setUsers] = useState<ScheduleUser[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [showShiftDialog, setShowShiftDialog] = useState(false);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ShiftTemplate | null>(null);
  const [templates, setTemplates] = useState<ShiftTemplate[]>([]);
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);

  const startDate = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const endDate = endOfWeek(selectedDate, { weekStartsOn: 1 });

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const usersData = await usersTable.getAll();
        setUsers(usersData);
      } catch (error) {
        console.error('Error loading initial data:', error);
        toast({
          title: "Error loading data",
          description: "Please try again later",
          variant: "destructive",
        });
      }
    };

    loadInitialData();
  }, [toast]);

  const loadTemplates = async () => {
    try {
      const templatesData = await templatesTable.getAll();
      console.log('Schedule - Loaded templates:', templatesData);
      setTemplates(templatesData);
    } catch (error) {
      console.error('Error loading templates:', error);
      toast({
        title: "Error loading templates",
        description: "Please try again later",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  // Filter users based on role
  const filteredUsers = users.filter(user => 
    roleFilter === "all" || user.role === roleFilter
  );

  const handleUserToggle = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSaveShift = async (shiftData: Partial<Shift>) => {
    try {
      if (!currentUser?.id) {
        toast({
          title: "Error",
          description: "You must be logged in to create shifts",
          variant: "destructive",
        });
        return;
      }

      console.log('Saving shift with data:', shiftData);

      // Create or update the shift
      if (selectedShift?.id) {
        await shiftsTable.update(selectedShift.id, {
          user_id: shiftData.user_id,
          start_time: shiftData.start_time,
          end_time: shiftData.end_time,
          shift_type: shiftData.shift_type,
          notes: shiftData.notes,
          created_by: currentUser.id,
          title: `${shiftData.shift_type} Shift`,
          status: 'active',
          role: shiftData.role,
        });
        toast({
          title: "Success",
          description: "Shift updated successfully",
        });
      } else {
        await shiftsTable.create({
          user_id: shiftData.user_id!,
          start_time: shiftData.start_time!,
          end_time: shiftData.end_time!,
          shift_type: shiftData.shift_type!,
          notes: shiftData.notes,
          created_by: currentUser.id,
          title: `${shiftData.shift_type} Shift`,
          status: 'active',
          role: shiftData.role,
        });
        toast({
          title: "Success",
          description: "Shift created successfully",
        });
      }

      setShowShiftDialog(false);
      // Reload shifts data
      const startDateStr = startOfWeek(selectedDate, { weekStartsOn: 1 }).toISOString();
      const endDateStr = endOfWeek(selectedDate, { weekStartsOn: 1 }).toISOString();
      const shiftsData = await shiftsTable.getByDateRange(startDateStr, endDateStr);
      setShifts(shiftsData);
    } catch (error) {
      console.error('Error saving shift:', error);
      toast({
        title: "Error",
        description: "Failed to save shift. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSaveTemplate = async (templateData: Partial<ShiftTemplate>) => {
    try {
      if (!currentUser?.isAdmin && currentUser?.role !== 'admin') {
        console.log('Permission denied - User:', {
          id: currentUser?.id,
          role: currentUser?.role,
          isAdmin: currentUser?.isAdmin
        });
        toast({
          title: "Permission Denied",
          description: "Only administrators can manage templates",
          variant: "destructive",
        });
        return;
      }

      console.log('Creating template with data:', templateData);
      if (selectedTemplate?.id) {
        await templatesTable.update(selectedTemplate.id, {
          name: templateData.name!,
          shift_type: templateData.shift_type!,
          start_time: templateData.start_time!,
          end_time: templateData.end_time!,
          color: templateData.color,
        });
        toast({
          title: "Success",
          description: "Template updated successfully",
        });
      } else {
        await templatesTable.create({
          name: templateData.name!,
          shift_type: templateData.shift_type!,
          start_time: templateData.start_time!,
          end_time: templateData.end_time!,
          color: templateData.color,
        });
        toast({
          title: "Success",
          description: "Template created successfully",
        });
      }
      setShowTemplateDialog(false);
      setSelectedTemplate(null);
      // Reload templates
      loadTemplates();
    } catch (error) {
      console.error('Error saving template:', error);
      toast({
        title: "Error",
        description: "Failed to save template. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handlePreviousWeek = () => {
    setSelectedDate(subWeeks(selectedDate, 1));
  };

  const handleNextWeek = () => {
    setSelectedDate(addWeeks(selectedDate, 1));
  };

  const handleEditShift = (shift: Shift) => {
    // Implementation of edit shift logic
  };

  const handleDeleteShift = (shiftId: string) => {
    // Implementation of delete shift logic
  };

  const handleCreateShift = () => {
    // Implementation of create shift logic
  };

  return (
    <MainLayout>
      <div className="container mx-auto py-6 space-y-6">
        <ErrorBoundary
          FallbackComponent={ErrorFallback}
          onReset={() => window.location.reload()}
        >
          <Card>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-6 border-b">
                <div className="flex items-center justify-between w-full">
                  <TabsList>
                    <TabsTrigger value="shifts">Shifts</TabsTrigger>
                    <TabsTrigger value="requests">Requests</TabsTrigger>
                  </TabsList>

                  {activeTab === 'shifts' && (
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => setShowShiftDialog(true)}
                        size="sm"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Shift
                      </Button>
                      {currentUser?.role === 'admin' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowTemplateDialog(true)}
                        >
                          <Settings className="h-4 w-4 mr-1" />
                          Templates
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <TabsContent value="shifts" className="p-6">
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                  <Select value={viewType} onValueChange={(value: ViewType) => setViewType(value)}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Select view" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily View</SelectItem>
                      <SelectItem value="weekly">Weekly View</SelectItem>
                      <SelectItem value="monthly">Monthly View</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter by role">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          {roleFilter === "all" ? "All Roles" : roleFilter}
                        </div>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      <SelectItem value="operator">Operators</SelectItem>
                      <SelectItem value="senior">Senior Staff</SelectItem>
                      <SelectItem value="admin">Admins</SelectItem>
                    </SelectContent>
                  </Select>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handlePreviousWeek}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="min-w-[200px] text-center font-medium">
                      {format(startDate, 'MMM d')} - {format(endDate, 'MMM d, yyyy')}
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleNextWeek}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedDate(new Date())}
                    >
                      <Calendar className="h-4 w-4 mr-1" />
                      Today
                    </Button>
                  </div>
                </div>

                <ErrorBoundary fallback={<div>Error loading schedule view</div>}>
                  {viewType === 'daily' && (
                    <DailyView
                      selectedDate={selectedDate}
                      onEditShift={handleEditShift}
                      onDeleteShift={handleDeleteShift}
                      onDateChange={setSelectedDate}
                      users={filteredUsers}
                      shifts={shifts}
                    />
                  )}
                  {viewType === 'weekly' && (
                    <WeeklyView
                      startDate={selectedDate}
                      selectedDate={selectedDate}
                      users={filteredUsers}
                      shifts={shifts}
                      onAddShift={handleCreateShift}
                      onDateChange={setSelectedDate}
                      onEditShift={handleEditShift}
                      onDeleteShift={handleDeleteShift}
                    />
                  )}
                  {viewType === 'monthly' && (
                    <MonthlyView
                      selectedDate={selectedDate}
                      onEditShift={handleEditShift}
                      onDeleteShift={handleDeleteShift}
                      onDateChange={setSelectedDate}
                      users={filteredUsers}
                      shifts={shifts}
                    />
                  )}
                </ErrorBoundary>
              </TabsContent>

              <TabsContent value="requests" className="p-6">
                <RequestsView users={users} />
              </TabsContent>
            </Tabs>
          </Card>
        </ErrorBoundary>
      </div>

      {showShiftDialog && (
        <ShiftDialog
          users={users}
          onClose={() => setShowShiftDialog(false)}
          onSave={handleSaveShift}
          templates={templates}
        />
      )}

      {showTemplateDialog && (
        <ShiftTemplateDialog
          template={selectedTemplate}
          onClose={() => {
            setShowTemplateDialog(false);
            setSelectedTemplate(null);
            loadTemplates(); // Reload templates after closing the dialog
          }}
          onSave={handleSaveTemplate}
        />
      )}
    </MainLayout>
  );
};

export default Schedule;