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
import { useToast } from '@/hooks/use-toast';

const shiftTypes = [
  { value: 'morning', label: 'Morning Shift', defaultColor: '#E3F2FD' },
  { value: 'night', label: 'Night Shift', defaultColor: '#EDE7F6' },
  { value: 'over night', label: 'Over Night Shift', defaultColor: '#FFF3E0' },
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
  const { toast } = useToast();
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
    
    // Validate required fields
    if (!formData.name || !formData.start_time || !formData.end_time) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      
      // Convert time strings to proper format if needed
      const templateData: Partial<ShiftTemplate> = {
        name: formData.name,
        shift_type: formData.shift_type,
        start_time: formData.start_time,
        end_time: formData.end_time,
        color: formData.color,
      };

      console.log('Saving template data:', templateData);
      await onSave(templateData);
      onClose();
    } catch (error) {
      console.error('Error saving template:', error);
      toast({
        title: "Error",
        description: "Failed to save template. Please try again.",
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
                required
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
                required
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
                required
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