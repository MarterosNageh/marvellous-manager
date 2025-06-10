
import React, { useState } from 'react';
import { useShifts } from '@/context/ShiftsContext';
import { useAuth } from '@/context/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Button,
  Input,
  Label,
  Textarea,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui';
import { Calendar, Clock, User, Users } from 'lucide-react';
import { ShiftRequest } from '@/types/shiftTypes';
import { ScheduleUser } from '@/types/schedule';

interface ShiftRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  users?: ScheduleUser[];
  initialData?: Partial<ShiftRequest>;
}

const requestTypeOptions = [
  { value: 'time_off', label: 'Time Off Request', icon: Calendar },
  { value: 'extra_work', label: 'Extra Work Request', icon: Clock },
  { value: 'shift_change', label: 'Shift Change Request', icon: User },
  { value: 'custom_shift', label: 'Custom Shift Request', icon: Users },
];

export const ShiftRequestDialog: React.FC<ShiftRequestDialogProps> = ({
  open,
  onOpenChange,
  users,
  initialData
}) => {
  const { currentUser } = useAuth();
  const { createShiftRequest } = useShifts();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'senior';

  const [formData, setFormData] = useState<Partial<ShiftRequest>>({
    request_type: 'time_off',
    start_date: '',
    end_date: '',
    reason: '',
    user_id: currentUser?.id || '',
    ...initialData
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.request_type || !formData.start_date || !formData.end_date) {
      return;
    }

    try {
      setIsSubmitting(true);
      
      const requestData: Omit<ShiftRequest, 'id' | 'created_at' | 'updated_at'> = {
        user_id: formData.user_id || currentUser?.id || '',
        request_type: formData.request_type,
        start_date: formData.start_date,
        end_date: formData.end_date,
        reason: formData.reason || '',
        status: 'pending',
        requested_shift_details: formData.requested_shift_details
      };

      const success = await createShiftRequest(requestData);
      
      if (success) {
        onOpenChange(false);
        // Reset form
        setFormData({
          request_type: 'time_off',
          start_date: '',
          end_date: '',
          reason: '',
          user_id: currentUser?.id || ''
        });
      }
    } catch (error) {
      console.error('Error submitting request:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedRequestType = requestTypeOptions.find(opt => opt.value === formData.request_type);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {selectedRequestType && <selectedRequestType.icon className="h-5 w-5" />}
            Submit Request
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* User Selection for Admins */}
          {isAdmin && users && (
            <div className="space-y-2">
              <Label htmlFor="user_id">Select User</Label>
              <Select
                value={formData.user_id}
                onValueChange={(value) => setFormData(prev => ({ ...prev, user_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a user" />
                </SelectTrigger>
                <SelectContent>
                  {users.map(user => (
                    <SelectItem key={user.id} value={user.id}>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs">
                          {user.username.substring(0, 2).toUpperCase()}
                        </div>
                        {user.username}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Request Type */}
          <div className="space-y-2">
            <Label htmlFor="request_type">Request Type</Label>
            <Select
              value={formData.request_type}
              onValueChange={(value: ShiftRequest['request_type']) => 
                setFormData(prev => ({ ...prev, request_type: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select request type" />
              </SelectTrigger>
              <SelectContent>
                {requestTypeOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center gap-2">
                      <option.icon className="h-4 w-4" />
                      {option.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_date">Start Date</Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_date">End Date</Label>
              <Input
                id="end_date"
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                required
              />
            </div>
          </div>

          {/* Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason">Reason/Notes</Label>
            <Textarea
              id="reason"
              placeholder="Please provide details for your request..."
              value={formData.reason}
              onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
              rows={3}
            />
          </div>

          {/* Custom Shift Details (for custom_shift requests) */}
          {formData.request_type === 'custom_shift' && (
            <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
              <h4 className="font-medium">Custom Shift Details</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="shift_title">Shift Title</Label>
                  <Input
                    id="shift_title"
                    placeholder="e.g., Special Event"
                    value={formData.requested_shift_details?.title || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      requested_shift_details: {
                        ...prev.requested_shift_details,
                        title: e.target.value,
                        shift_type: prev.requested_shift_details?.shift_type || '',
                        role: prev.requested_shift_details?.role || ''
                      }
                    }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="shift_role">Role</Label>
                  <Input
                    id="shift_role"
                    placeholder="e.g., Operator"
                    value={formData.requested_shift_details?.role || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      requested_shift_details: {
                        ...prev.requested_shift_details,
                        title: prev.requested_shift_details?.title || '',
                        shift_type: prev.requested_shift_details?.shift_type || '',
                        role: e.target.value
                      }
                    }))}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Shift Swap Details */}
          {formData.request_type === 'shift_change' && (
            <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
              <h4 className="font-medium">Shift Swap Details</h4>
              <div className="space-y-2">
                <Label>Target User for Swap</Label>
                {users && (
                  <Select
                    value={formData.requested_shift_details?.role || ''}
                    onValueChange={(value) => setFormData(prev => ({
                      ...prev,
                      requested_shift_details: {
                        ...prev.requested_shift_details,
                        title: prev.requested_shift_details?.title || '',
                        shift_type: prev.requested_shift_details?.shift_type || '',
                        role: value
                      }
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select user to swap with" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.filter(u => u.id !== formData.user_id).map(user => (
                        <SelectItem key={user.id} value={user.id}>
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-white text-xs">
                              {user.username.substring(0, 2).toUpperCase()}
                            </div>
                            {user.username}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-blue-500 hover:bg-blue-600"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Request'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
