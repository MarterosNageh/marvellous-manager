import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import type { Shift, ScheduleUser, ShiftTemplate } from '@/types/schedule';
import { RecurrenceAction } from '@/types';
import { AlertTriangle } from 'lucide-react';

interface EditShiftDialogProps {
  shift: Shift;
  onClose: () => void;
  onUpdate: (shiftId: string, data: Partial<Shift>, recurrenceAction: RecurrenceAction) => Promise<void>;
  users: ScheduleUser[];
  templates: ShiftTemplate[];
}

const EditShiftDialog: React.FC<EditShiftDialogProps> = ({ shift, onClose, onUpdate, users, templates }) => {
  const [formData, setFormData] = useState<Partial<Shift>>({
    ...shift,
    start_time: shift.start_time.slice(0, 16),
    end_time: shift.end_time.slice(0, 16),
  });
  const [showUpdatePatternDialog, setShowUpdatePatternDialog] = useState(false);
  const [recurrenceAction, setRecurrenceAction] = useState<RecurrenceAction>('this');
  const [selectedTemplate, setSelectedTemplate] = useState('');

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplate(templateId);
    const template = templates.find((t) => t.id === templateId);
    if (template) {
      const currentStartDate = new Date(formData.start_time || new Date());
      const currentEndDate = new Date(formData.end_time || new Date());

      const [startHours, startMinutes] = template.start_time.split(':');
      currentStartDate.setHours(parseInt(startHours), parseInt(startMinutes));

      const [endHours, endMinutes] = template.end_time.split(':');
      currentEndDate.setHours(parseInt(endHours), parseInt(endMinutes));

      if (currentEndDate < currentStartDate) {
        currentEndDate.setDate(currentEndDate.getDate() + 1);
      }

      setFormData((prev) => ({
        ...prev,
        shift_type: template.shift_type,
        start_time: currentStartDate.toISOString().slice(0, 16),
        end_time: currentEndDate.toISOString().slice(0, 16),
        color: template.color || (template.shift_type === 'night' ? '#EDE7F6' : template.shift_type === 'over night' ? '#FFF3E0' : '#E3F2FD')
      }));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleUpdateClick = () => {
    setShowUpdatePatternDialog(true);
  };

  const handleConfirmUpdate = async () => {
    try {
        const dataToUpdate: Partial<Shift> = {
            ...formData,
            start_time: new Date(formData.start_time!).toISOString(),
            end_time: new Date(formData.end_time!).toISOString(),
        };
      await onUpdate(shift.id, dataToUpdate, recurrenceAction);
      onClose();
    } catch (error) {
      console.error("Failed to update shift", error);
    }
  };

  return (
    <>
      <Dialog open={!showUpdatePatternDialog} onOpenChange={(open) => !open && onClose()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Shift</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="template" className="text-right">
                Template
              </Label>
              <Select
                value={selectedTemplate}
                onValueChange={handleTemplateChange}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select template" />
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
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="user_id" className="text-right">
                User
              </Label>
              <Select
                name="user_id"
                value={formData.user_id}
                onValueChange={(value) => handleSelectChange('user_id', value)}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select user" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.username}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="shift_type" className="text-right">
                Shift Type
              </Label>
              <Select
                name="shift_type"
                value={formData.shift_type}
                onValueChange={(value) => handleSelectChange('shift_type', value)}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select shift type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="morning">Morning</SelectItem>
                  <SelectItem value="night">Night</SelectItem>
                  <SelectItem value="on-call">On-Call</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="start_time" className="text-right">
                Start Time
              </Label>
              <Input
                id="start_time"
                name="start_time"
                type="datetime-local"
                value={formData.start_time}
                onChange={handleChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="end_time" className="text-right">
                End Time
              </Label>
              <Input
                id="end_time"
                name="end_time"
                type="datetime-local"
                value={formData.end_time}
                onChange={handleChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="notes" className="text-right">
                Notes
              </Label>
              <Textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleUpdateClick}>Update</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={showUpdatePatternDialog} onOpenChange={setShowUpdatePatternDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Update</DialogTitle>
            <DialogDescription>
                Choose how to apply this shift update.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
              <div className="flex items-center gap-2 text-amber-600">
                <AlertTriangle className="h-5 w-5" />
                <p className="font-semibold">Update Shift</p>
              </div>
            <RadioGroup
                value={recurrenceAction}
                onValueChange={(value) => setRecurrenceAction(value as RecurrenceAction)}
                className="space-y-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="this" id="this" />
                  <Label htmlFor="this">Update this shift only</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="future" id="future" />
                  <Label htmlFor="future">Update this and future shifts</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="previous" id="previous" />
                  <Label htmlFor="previous">Update this and previous shifts</Label>
                </div>
              </RadioGroup>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUpdatePatternDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmUpdate}>Confirm Update</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default EditShiftDialog; 