import { useEffect, useState } from 'react';
import { ShiftTemplate } from '@/types/schedule';
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
  DialogDescription,
} from '@/components/ui';

const shiftTypes = [
  { value: 'morning', label: 'Morning Shift', defaultColor: '#E3F2FD' },
  { value: 'night', label: 'Night Shift', defaultColor: '#EDE7F6' },
  { value: 'overnight', label: 'Overnight Shift', defaultColor: '#FFF3E0' },
];

interface ShiftTemplateDialogProps {
  template: ShiftTemplate | null;
  onClose: () => void;
  onSave: (template: Partial<ShiftTemplate>) => Promise<void>;
}

interface TemplateFormData {
  name: string;
  shift_type: string;
  start_time: string;
  end_time: string;
  color: string;
}

export default function ShiftTemplateDialog({
  template,
  onClose,
  onSave,
}: ShiftTemplateDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<TemplateFormData>({
    name: '',
    shift_type: 'morning',
    start_time: '09:00',
    end_time: '17:00',
    color: shiftTypes[0].defaultColor,
  });

  useEffect(() => {
    if (template) {
      setFormData({
        name: template.name,
        shift_type: template.shift_type,
        start_time: template.start_time,
        end_time: template.end_time,
        color: template.color || shiftTypes.find(t => t.value === template.shift_type)?.defaultColor || '#E3F2FD',
      });
    } else {
      setFormData({
        name: '',
        shift_type: 'morning',
        start_time: '09:00',
        end_time: '17:00',
        color: shiftTypes[0].defaultColor,
      });
    }
  }, [template]);

  const handleShiftTypeChange = (value: string) => {
    const selectedType = shiftTypes.find(t => t.value === value);
    setFormData(prev => ({
      ...prev,
      shift_type: value,
      color: selectedType?.defaultColor || prev.color,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.start_time || !formData.end_time) {
      return;
    }

    try {
      setIsLoading(true);
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Error saving template:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {template ? 'Edit Template' : 'Create Template'}
          </DialogTitle>
          <DialogDescription>
            {template 
              ? 'Edit the shift template details below.' 
              : 'Create a new shift template by filling out the details below.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Template Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="Enter template name"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="shift_type">Shift Type</Label>
              <Select
                value={formData.shift_type}
                onValueChange={handleShiftTypeChange}
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
              <Label htmlFor="color">Template Color</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="color"
                  type="color"
                  value={formData.color}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, color: e.target.value }))
                  }
                  className="w-16 h-8 p-1"
                />
                <div 
                  className="flex-1 h-8 rounded border"
                  style={{ backgroundColor: formData.color }}
                />
              </div>
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
              {isLoading ? 'Saving...' : template ? 'Save Changes' : 'Create Template'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 