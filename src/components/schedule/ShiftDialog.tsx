import { useEffect, useState } from 'react';
import { format, addDays } from 'date-fns';
import { ShiftDialogProps } from '@/types/schedule';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Input,
  Label,
  Textarea,
  Badge,
  DialogDescription,
} from '@/components/ui';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Check, ChevronsUpDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/AuthContext';

interface ShiftFormData {
  user_id: string;
  shift_type: string;
  start_time: string;
  end_time: string;
  notes?: string;
  repeat_days?: string[];
  color: string;
}

const shiftTypes = [
  { value: 'morning', label: 'Morning Shift', defaultColor: '#E3F2FD' },
  { value: 'night', label: 'Night Shift', defaultColor: '#EDE7F6' },
  { value: 'over night', label: 'Over Night Shift', defaultColor: '#FFF3E0' },
];

const weekDays = [
  { value: 'monday', label: 'Monday' },
  { value: 'tuesday', label: 'Tuesday' },
  { value: 'wednesday', label: 'Wednesday' },
  { value: 'thursday', label: 'Thursday' },
  { value: 'friday', label: 'Friday' },
  { value: 'saturday', label: 'Saturday' },
  { value: 'sunday', label: 'Sunday' },
];

export default function ShiftDialog({
  shift,
  onClose,
  onSave,
  templates,
  users,
}: ShiftDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [repeatEnabled, setRepeatEnabled] = useState(false);
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [operatorDropdownOpen, setOperatorDropdownOpen] = useState(false);
  const { users: authUsers } = useAuth();

  console.log('ShiftDialog - Received templates:', templates);
  console.log('ShiftDialog - Auth users:', authUsers);

  const [formData, setFormData] = useState<ShiftFormData>({
    user_id: shift?.user_id || '',
    shift_type: shift?.shift_type || 'morning',
    start_time: shift ? format(new Date(shift.start_time), "HH:mm") : '',
    end_time: shift ? format(new Date(shift.end_time), "HH:mm") : '',
    notes: shift?.notes || '',
    repeat_days: [],
    color: shift?.color || '',
  });

  useEffect(() => {
    if (shift) {
      setFormData({
        user_id: shift.user_id,
        shift_type: shift.shift_type,
        start_time: format(new Date(shift.start_time), "HH:mm"),
        end_time: format(new Date(shift.end_time), "HH:mm"),
        notes: shift.notes,
        repeat_days: [],
        color: shift.color,
      });
    }
  }, [shift]);

  const handleTemplateChange = (templateId: string) => {
    console.log('Selected template ID:', templateId);
    setSelectedTemplate(templateId);
    const template = templates.find((t) => t.id === templateId);
    console.log('Found template:', template);
    if (template) {
      setFormData((prev) => ({
        ...prev,
        shift_type: template.shift_type,
        start_time: template.start_time,
        end_time: template.end_time,
        color: template.color || shiftTypes.find(t => t.value === template.shift_type)?.defaultColor || '#E3F2FD'
      }));
    }
  };

  const handleDayToggle = (day: string) => {
    setSelectedDays((prev) =>
      prev.includes(day)
        ? prev.filter((d) => d !== day)
        : [...prev, day]
    );
  };

  const getSelectedUser = () => {
    return authUsers.find((user) => user.id === formData.user_id);
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <Badge className="ml-2 bg-purple-500">Admin</Badge>;
      case 'senior':
        return <Badge className="ml-2 bg-blue-500">Senior</Badge>;
      case 'operator':
        return <Badge className="ml-2 bg-green-500">Operator</Badge>;
      default:
        return null;
    }
  };

  const createRepeatingShifts = async (baseShiftData: any, repeatDays: string[]) => {
    const dayMapping = {
      'monday': 1,
      'tuesday': 2,
      'wednesday': 3,
      'thursday': 4,
      'friday': 5,
      'saturday': 6,
      'sunday': 0
    };

    // Create shifts for the next 4 weeks for each selected day
    const shiftsToCreate = [];
    for (let week = 0; week < 4; week++) {
      for (const day of repeatDays) {
        const dayIndex = dayMapping[day as keyof typeof dayMapping];
        const shiftDate = new Date();
        
        // Find the next occurrence of this day
        const daysUntilTarget = (dayIndex - shiftDate.getDay() + 7) % 7;
        shiftDate.setDate(shiftDate.getDate() + daysUntilTarget + (week * 7));
        
        // Create a new shift for this day
        const startDateTime = new Date(shiftDate);
        const endDateTime = new Date(shiftDate);
        
        // Parse the time from baseShiftData
        const startTime = new Date(baseShiftData.start_time);
        const endTime = new Date(baseShiftData.end_time);
        
        // Set hours and minutes from the base shift
        startDateTime.setHours(startTime.getHours(), startTime.getMinutes(), 0, 0);
        endDateTime.setHours(endTime.getHours(), endTime.getMinutes(), 0, 0);
        
        // If end time is before start time, assume it's for the next day
        if (endDateTime < startDateTime) {
          endDateTime.setDate(endDateTime.getDate() + 1);
        }

        shiftsToCreate.push({
          user_id: baseShiftData.user_id,
          shift_type: baseShiftData.shift_type,
          start_time: startDateTime.toISOString(),
          end_time: endDateTime.toISOString(),
          notes: baseShiftData.notes || '',
          color: baseShiftData.color
        });
      }
    }

    try {
      console.log('Creating repeating shifts:', shiftsToCreate);
      // Create all shifts
      for (const shiftData of shiftsToCreate) {
        await onSave(shiftData);
      }
      toast({ title: "Success", description: "Repeating shifts created successfully." });
    } catch (error) {
      console.error('Error creating repeating shifts:', error);
      toast({ 
        title: "Error", 
        description: "Failed to create repeating shifts. Please try again.",
        variant: "destructive"
      });
      throw error; // Re-throw to be caught by the parent handler
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validate required fields
      if (!formData.user_id || !formData.shift_type || !formData.start_time || !formData.end_time) {
        toast({
          title: "Error",
          description: "Please fill in all required fields",
          variant: "destructive",
        });
        return;
      }

      // Convert time strings to ISO format
      const startDate = new Date();
      const endDate = new Date();
      const [startHours, startMinutes] = formData.start_time.split(':');
      const [endHours, endMinutes] = formData.end_time.split(':');
      
      startDate.setHours(parseInt(startHours), parseInt(startMinutes), 0);
      endDate.setHours(parseInt(endHours), parseInt(endMinutes), 0);
      
      // If end time is before start time, assume it's for the next day
      if (endDate < startDate) {
        endDate.setDate(endDate.getDate() + 1);
      }

      const shiftData = {
        user_id: formData.user_id,
        shift_type: formData.shift_type,
        start_time: startDate.toISOString(),
        end_time: endDate.toISOString(),
        notes: formData.notes || '',
        color: selectedTemplate ? 
          templates.find(t => t.id === selectedTemplate)?.color || 
          shiftTypes.find(t => t.value === formData.shift_type)?.defaultColor || 
          '#E3F2FD' : 
          shiftTypes.find(t => t.value === formData.shift_type)?.defaultColor || 
          '#E3F2FD'
      };

      console.log('Submitting shift data:', shiftData);

      if (repeatEnabled && selectedDays.length > 0) {
        await createRepeatingShifts(shiftData, selectedDays);
      } else {
        await onSave(shiftData);
      }

      onClose();
    } catch (error) {
      console.error('Error submitting shift:', error);
      toast({
        title: "Error",
        description: "Failed to save shift. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {shift ? 'Edit Shift' : 'Create Shift'}
          </DialogTitle>
          <DialogDescription>
            {shift 
              ? 'Edit the shift details below.' 
              : 'Create a new shift by filling out the details below.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="template">Template (Optional)</Label>
              <Select
                value={selectedTemplate}
                onValueChange={handleTemplateChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a template" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Operator</Label>
              <Select
                value={formData.user_id}
                onValueChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    user_id: value,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue>
                    {formData.user_id ? (
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-medium">
                          {getSelectedUser()?.username.charAt(0).toUpperCase()}
                        </div>
                        <span>{getSelectedUser()?.username}</span>
                        {getRoleBadge(getSelectedUser()?.role || '')}
                      </div>
                    ) : (
                      "Select an operator"
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {authUsers.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-medium">
                          {user.username.charAt(0).toUpperCase()}
                        </div>
                        <span>{user.username}</span>
                        {getRoleBadge(user.role)}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="shift_type">Shift Type</Label>
              <Select
                value={formData.shift_type}
                onValueChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    shift_type: value,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select shift type" />
                </SelectTrigger>
                <SelectContent>
                  {shiftTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="start_time">Start Time</Label>
              <Input
                id="start_time"
                type="time"
                value={formData.start_time}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    start_time: e.target.value,
                  }))
                }
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="end_time">End Time</Label>
              <Input
                id="end_time"
                type="time"
                value={formData.end_time}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, end_time: e.target.value }))
                }
              />
            </div>

            <div className="grid gap-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="repeat"
                  checked={repeatEnabled}
                  onCheckedChange={(checked) => setRepeatEnabled(checked as boolean)}
                />
                <Label htmlFor="repeat">Repeat weekly for 4 weeks</Label>
              </div>
            </div>

            {repeatEnabled && (
              <div className="grid gap-2">
                <Label>Select days to repeat</Label>
                <div className="grid grid-cols-2 gap-2">
                  {weekDays.map((day) => (
                    <div key={day.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={day.value}
                        checked={selectedDays.includes(day.value)}
                        onCheckedChange={() => handleDayToggle(day.value)}
                      />
                      <Label htmlFor={day.value}>{day.label}</Label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes || ''}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, notes: e.target.value }))
                }
                placeholder="Add any additional notes..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : shift ? 'Save Changes' : 'Create Shift'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
