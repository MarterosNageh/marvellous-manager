
import React, { useState } from 'react';
import { useShifts } from '@/context/ShiftsContext';
import { useAuth } from '@/context/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ShiftFormData } from '@/types/shiftTypes';
import { Calendar, Clock, Repeat, User } from 'lucide-react';

interface CreateShiftDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CreateShiftDialog: React.FC<CreateShiftDialogProps> = ({
  open,
  onOpenChange
}) => {
  const { createShift } = useShifts();
  const { users } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showCustomHours, setShowCustomHours] = useState(false);
  const [showRepeatOptions, setShowRepeatOptions] = useState(false);
  
  const [formData, setFormData] = useState<ShiftFormData>({
    user_id: '',
    title: '',
    start_time: '',
    end_time: '',
    shift_type: 'morning',
    role: '',
    notes: '',
    repeat_pattern: 'none',
    repeat_end_date: '',
    custom_schedule: {
      start_hour: 9,
      start_minute: 0,
      end_hour: 17,
      end_minute: 0,
      break_duration: 60
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.user_id || !formData.title || !formData.start_time || !formData.end_time) {
      return;
    }

    setLoading(true);
    const success = await createShift(formData);
    if (success) {
      setFormData({
        user_id: '',
        title: '',
        start_time: '',
        end_time: '',
        shift_type: 'morning',
        role: '',
        notes: '',
        repeat_pattern: 'none',
        repeat_end_date: '',
        custom_schedule: {
          start_hour: 9,
          start_minute: 0,
          end_hour: 17,
          end_minute: 0,
          break_duration: 60
        }
      });
      setShowCustomHours(false);
      setShowRepeatOptions(false);
      onOpenChange(false);
    }
    setLoading(false);
  };

  const handleInputChange = (field: keyof ShiftFormData, value: any) => {
    if (field === 'shift_type' && value === 'custom') {
      setShowCustomHours(true);
    } else if (field === 'shift_type' && value !== 'custom') {
      setShowCustomHours(false);
    }
    
    if (field === 'repeat_pattern' && value !== 'none') {
      setShowRepeatOptions(true);
    } else if (field === 'repeat_pattern' && value === 'none') {
      setShowRepeatOptions(false);
    }
    
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCustomScheduleChange = (field: string, value: number) => {
    setFormData(prev => ({
      ...prev,
      custom_schedule: {
        ...prev.custom_schedule!,
        [field]: value
      }
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Create New Shift
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <User className="h-4 w-4" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="employee">Employee *</Label>
                <Select value={formData.user_id} onValueChange={(value) => handleInputChange('user_id', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an employee" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.username} {user.isAdmin ? '(Admin)' : '(Employee)'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Shift Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="e.g., Front Desk Shift"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Role/Position</Label>
                <Input
                  id="role"
                  value={formData.role}
                  onChange={(e) => handleInputChange('role', e.target.value)}
                  placeholder="e.g., Supervisor, Cashier"
                />
              </div>
            </CardContent>
          </Card>

          {/* Schedule Information */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Schedule
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="shift_type">Shift Type</Label>
                <Select value={formData.shift_type} onValueChange={(value: any) => handleInputChange('shift_type', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="morning">Morning (6:00 - 14:00)</SelectItem>
                    <SelectItem value="evening">Evening (14:00 - 22:00)</SelectItem>
                    <SelectItem value="night">Night (22:00 - 6:00)</SelectItem>
                    <SelectItem value="custom">Custom Hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {showCustomHours && (
                <Card className="border-dashed">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs">Custom Schedule</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Start Hour</Label>
                        <Select 
                          value={formData.custom_schedule?.start_hour.toString()} 
                          onValueChange={(value) => handleCustomScheduleChange('start_hour', parseInt(value))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: 24 }, (_, i) => (
                              <SelectItem key={i} value={i.toString()}>
                                {i.toString().padStart(2, '0')}:00
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>End Hour</Label>
                        <Select 
                          value={formData.custom_schedule?.end_hour.toString()} 
                          onValueChange={(value) => handleCustomScheduleChange('end_hour', parseInt(value))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: 24 }, (_, i) => (
                              <SelectItem key={i} value={i.toString()}>
                                {i.toString().padStart(2, '0')}:00
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Break Duration (minutes)</Label>
                      <Input
                        type="number"
                        value={formData.custom_schedule?.break_duration}
                        onChange={(e) => handleCustomScheduleChange('break_duration', parseInt(e.target.value) || 0)}
                        placeholder="60"
                        min="0"
                        max="480"
                      />
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start_time">Start Time *</Label>
                  <Input
                    id="start_time"
                    type="datetime-local"
                    value={formData.start_time}
                    onChange={(e) => handleInputChange('start_time', e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end_time">End Time *</Label>
                  <Input
                    id="end_time"
                    type="datetime-local"
                    value={formData.end_time}
                    onChange={(e) => handleInputChange('end_time', e.target.value)}
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Repetition Options */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Repeat className="h-4 w-4" />
                Repetition
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="repeat_pattern">Repeat Pattern</Label>
                <Select value={formData.repeat_pattern} onValueChange={(value: any) => handleInputChange('repeat_pattern', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Repeat</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="biweekly">Bi-weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {showRepeatOptions && (
                <div className="space-y-2">
                  <Label htmlFor="repeat_end_date">Repeat Until</Label>
                  <Input
                    id="repeat_end_date"
                    type="date"
                    value={formData.repeat_end_date}
                    onChange={(e) => handleInputChange('repeat_end_date', e.target.value)}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Additional Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Additional notes or instructions"
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Shift'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
