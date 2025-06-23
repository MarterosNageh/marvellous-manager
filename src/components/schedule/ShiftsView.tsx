
import { useState } from 'react';
import { format, addWeeks, subWeeks, startOfWeek, endOfWeek, addDays } from 'date-fns';
import { useAuth } from '@/context/AuthContext';
import { useSchedule } from '@/context/ScheduleContext';
import { Button } from '@/components/ui/button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { useIsMobile } from '@/hooks/use-mobile';
import WeeklyView from './WeeklyView';
import DailyView from './DailyView';
import MonthlyView from './MonthlyView';
import MobileScheduleView from './MobileScheduleView';
import ShiftDialog from './ShiftDialog';
import EditShiftDialog from './EditShiftDialog';
import ShiftTemplateDialog from './ShiftTemplateDialog';
import ManageTemplatesDialog from './ManageTemplatesDialog';
import { Plus, ChevronLeft, ChevronRight, Settings, Calendar, Filter } from 'lucide-react';
import { Shift, ShiftTemplate, ViewType } from '@/types/schedule';
import { RecurrenceAction } from '@/types';
import { ErrorBoundary } from 'react-error-boundary';

function ErrorFallback({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-[400px] p-4">
      <h2 className="text-xl font-semibold mb-4">Something went wrong:</h2>
      <pre className="text-red-600 mb-4 text-sm">{error.message}</pre>
      <Button onClick={resetErrorBoundary}>Try again</Button>
    </div>
  );
}

const ShiftsView = () => {
  const { currentUser } = useAuth();
  const { shifts, templates, loading, createShift, updateShift, deleteShift, createTemplate, updateTemplate, deleteTemplate, refreshData } = useSchedule();
  const isMobile = useIsMobile();
  const [viewType, setViewType] = useState<ViewType>('weekly');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showShiftDialog, setShowShiftDialog] = useState(false);
  const [showEditShiftDialog, setShowEditShiftDialog] = useState(false);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [showManageTemplatesDialog, setShowManageTemplatesDialog] = useState(false);
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<ShiftTemplate | null>(null);
  const [shiftTypeFilter, setShiftTypeFilter] = useState<string>("all");

  // Calculate week start from Sunday (weekStartsOn: 0)
  const startDate = startOfWeek(selectedDate, { weekStartsOn: 0 });
  const endDate = addDays(startDate, 6); // End date is 6 days after start date

  const handleOpenEditDialog = (shift: Shift) => {
    setSelectedShift(shift);
    setShowEditShiftDialog(true);
  };
   
  const handleOpenCreateDialog = () => {
    setSelectedShift(null);
    setShowShiftDialog(true);
  };

  const handlePreviousWeek = () => {
    setSelectedDate(subWeeks(selectedDate, 1));
  };

  const handleNextWeek = () => {
    setSelectedDate(addWeeks(selectedDate, 1));
  };

  const handleCreateShift = async (data: Omit<Shift, 'id'>) => {
    try {
      await createShift(data);
    } catch (error) {
      console.error('Error creating shift:', error);
    } finally {
      setShowShiftDialog(false);
    }
  };

  const handleUpdateShift = async (id: string, data: Partial<Shift>, recurrenceAction: RecurrenceAction) => {
    try {
      await updateShift(id, data, recurrenceAction);
      setShowEditShiftDialog(false);
      setSelectedShift(null);
    } catch (error) {
      console.error('Error updating shift:', error);
    }
  };

  const handleDeleteShift = async (shiftId: string, recurrenceAction: RecurrenceAction) => {
    try {
      await deleteShift(shiftId, recurrenceAction);
      setShowEditShiftDialog(false);
      setSelectedShift(null);
    } catch (error) {
      console.error('Error deleting shift:', error);
    }
  };

  const handleEditTemplate = (template: ShiftTemplate) => {
    setSelectedTemplate(template);
    setShowManageTemplatesDialog(false);
    setShowTemplateDialog(true);
  };

  const handleSaveTemplate = async (template: Partial<ShiftTemplate>) => {
    try {
      if (selectedTemplate) {
        await updateTemplate(selectedTemplate.id, template);
      } else {
        // Cast the template to the required type, ensuring required fields are present
        const newTemplate = template as Omit<ShiftTemplate, 'id' | 'created_at'>;
        await createTemplate(newTemplate);
      }
    } catch (error) {
      console.error('Error saving template:', error);
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    try {
      await deleteTemplate(templateId);
    } catch (error) {
      console.error('Error deleting template:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Get unique shift types for filter
  const shiftTypes = [...new Set(shifts.map(shift => shift.shift_type))];

  // Filter shifts based on shift type
  const filteredShifts = shiftTypeFilter === 'all' 
    ? shifts 
    : shifts.filter(shift => shift.shift_type === shiftTypeFilter);

  // Mobile view
  if (isMobile) {
    return (
      <MobileScheduleView
        selectedDate={selectedDate}
        onEditShift={handleOpenEditDialog}
        onDeleteShift={handleDeleteShift}
        onDateChange={setSelectedDate}
        shifts={filteredShifts}
        users={[]}
      />
    );
  }

  return (
    <Card>
      <div className="p-6 space-y-6">
        <div className="flex flex-col sm:flex-row gap-4">
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

          <Select value={shiftTypeFilter} onValueChange={setShiftTypeFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by shift type">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  {shiftTypeFilter === "all" ? "All Shifts" : shiftTypeFilter}
                </div>
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Shifts</SelectItem>
              {shiftTypes.map(type => (
                <SelectItem key={type} value={type}>{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setSelectedDate(new Date())}>
              Today
            </Button>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon" onClick={handlePreviousWeek}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <p className="text-sm text-muted-foreground">
                {format(startDate, 'MMM d')} - {format(endDate, 'MMM d, yyyy')}
              </p>
              <Button variant="outline" size="icon" onClick={handleNextWeek}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {currentUser?.role === 'admin' && (
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={handleOpenCreateDialog}>
                <Plus className="h-4 w-4 mr-1" />
                Add Shift
              </Button>
              <Button variant="outline" onClick={() => setShowManageTemplatesDialog(true)}>
                <Settings className="h-4 w-4 mr-1" />
                Manage Templates
              </Button>
            </div>
          )}
        </div>

        <ErrorBoundary fallback={<div>Error loading schedule view</div>}>
          {viewType === 'daily' && (
            <DailyView
              selectedDate={selectedDate}
              onEditShift={handleOpenEditDialog}
              onDeleteShift={handleDeleteShift}
              onDateChange={setSelectedDate}
              shifts={filteredShifts}
              users={[]}
            />
          )}
          {viewType === 'weekly' && (
            <WeeklyView
              startDate={startDate}
              selectedDate={selectedDate}
              shifts={filteredShifts}
              onAddShift={handleOpenCreateDialog}
              onDateChange={setSelectedDate}
              onEditShift={handleOpenEditDialog}
              onDeleteShift={handleDeleteShift}
              onUpdateShift={handleUpdateShift}
              users={[]}
              refreshData={refreshData}
            />
          )}
          {viewType === 'monthly' && (
            <MonthlyView
              selectedDate={selectedDate}
              onEditShift={handleOpenEditDialog}
              onDeleteShift={handleDeleteShift}
              onDateChange={setSelectedDate}
              shifts={filteredShifts}
              users={[]}
            />
          )}
        </ErrorBoundary>
      </div>

      {showShiftDialog && (
        <ShiftDialog
          onClose={() => setShowShiftDialog(false)}
          onSave={handleCreateShift}
          templates={templates}
          users={[]}
        />
      )}

      {showEditShiftDialog && selectedShift && (
        <EditShiftDialog
          shift={selectedShift}
          onClose={() => {
            setShowEditShiftDialog(false);
            setSelectedShift(null);
          }}
          onUpdate={handleUpdateShift}
          users={[]}
          templates={templates}
        />
      )}

      {showTemplateDialog && (
        <ShiftTemplateDialog
          template={selectedTemplate}
          onClose={() => {
            setShowTemplateDialog(false);
            setSelectedTemplate(null);
          }}
          onSave={handleSaveTemplate}
        />
      )}

      {showManageTemplatesDialog && (
        <ManageTemplatesDialog
          templates={templates}
          onClose={() => setShowManageTemplatesDialog(false)}
          onEdit={handleEditTemplate}
          onDelete={handleDeleteTemplate}
          onSave={handleSaveTemplate}
        />
      )}
    </Card>
  );
};

export default ShiftsView;
