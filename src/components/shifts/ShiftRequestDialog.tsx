import React, { useState, useEffect } from 'react';
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
import { format } from 'date-fns';
import { toast } from '@/components/ui/use-toast';
import { Checkbox } from '@/components/ui/checkbox';

interface ShiftRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  users?: ScheduleUser[];
  initialData?: Partial<ShiftRequest>;
}

const requestTypeOptions = [
  { value: 'day-off', label: 'Day Off Request', icon: Calendar },
  { value: 'unpaid-leave', label: 'Unpaid Leave', icon: Clock },
  { value: 'extra-days', label: 'Extra Days', icon: User, adminOnly: true },
  { value: 'public-holiday', label: 'Public Holiday', icon: Users, adminOnly: true }
];

export const ShiftRequestDialog: React.FC<ShiftRequestDialogProps> = ({
  open,
  onOpenChange,
  users,
  initialData
}) => {
  const { currentUser } = useAuth();
  const { createShiftRequest, updateShiftRequest } = useShifts();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'senior';
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  const [formData, setFormData] = useState<Partial<ShiftRequest>>({
    request_type: 'day-off',
    start_date: '',
    end_date: '',
    reason: '',
    user_id: currentUser?.id || '',
    ...initialData
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        start_date: initialData.start_date ? format(new Date(initialData.start_date), 'yyyy-MM-dd') : '',
        end_date: initialData.end_date ? format(new Date(initialData.end_date), 'yyyy-MM-dd') : '',
      });
    }
  }, [initialData]);

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

      if (initialData?.id) {
        // Update existing request
        await updateShiftRequest(initialData.id, requestData);
      } else {
        // Create new request
        await createShiftRequest(requestData);
      }
      
      onOpenChange(false);
      // Reset form
      setFormData({
        request_type: 'day-off',
        start_date: '',
        end_date: '',
        reason: '',
        user_id: currentUser?.id || ''
      });
    } catch (error) {
      console.error('Error submitting request:', error);
      toast({
        title: "Error",
        description: "Failed to submit request",
        variant: "destructive",
      });
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
              <Label htmlFor="user_id">Select Users</Label>
              <div className="border rounded-md p-2">
                {users.map(user => (
                  <div key={user.id} className="flex items-center space-x-2 py-1">
                    <Checkbox
                      checked={selectedUsers.includes(user.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedUsers(prev => [...prev, user.id]);
                        } else {
                          setSelectedUsers(prev => prev.filter(id => id !== user.id));
                        }
                      }}
                    />
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs">
                        {user.username.substring(0, 2).toUpperCase()}
                      </div>
                      <span>{user.username}</span>
                    </div>
                  </div>
                ))}
              </div>
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
                {requestTypeOptions
                  .filter(option => !option.adminOnly || isAdmin)
                  .map(option => (
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
