import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { Clock, User, Users } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import { z } from 'zod';
import { SwapRequest, LeaveRequest, LeaveType, Shift } from '@/types/schedule';
import { shiftsTable, swapRequestsTable, leaveRequestsTable } from '@/integrations/supabase/tables/schedule';

// Form schema
const formSchema = z.object({
  request_type: z.enum(['day-off', 'unpaid-leave', 'extra-day', 'public-holiday', 'swap']),
  start_date: z.string(),
  end_date: z.string(),
  reason: z.string().min(1, 'Reason is required'),
  notes: z.string().optional(),
  requested_users: z.array(z.string()).optional(),
  proposed_shift_id: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface ShiftRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUser: { id: string; role: string };
  users: { id: string; username: string }[];
  initialData?: Partial<Shift>;
  selectedShift?: Shift;
  onRequestsUpdate?: () => void;
}

const requestTypes = [
  { value: 'day-off' as const, label: 'Day Off', icon: Clock, adminOnly: false },
  { value: 'unpaid-leave' as const, label: 'Unpaid Leave', icon: Clock, adminOnly: false },
  { value: 'extra-day' as const, label: 'Extra Day', icon: User, adminOnly: true },
  { value: 'public-holiday' as const, label: 'Public Holiday', icon: Users, adminOnly: true },
  { value: 'swap' as const, label: 'Swap', icon: User, adminOnly: false },
] as const;

type RequestType = typeof requestTypes[number]['value'];

export function ShiftRequestDialog({
  open,
  onOpenChange,
  currentUser,
  users,
  initialData,
  selectedShift,
  onRequestsUpdate,
}: ShiftRequestDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    request_type: 'day-off',
    start_date: format(new Date(), 'yyyy-MM-dd'),
    end_date: format(new Date(), 'yyyy-MM-dd'),
    reason: '',
    notes: '',
    requested_users: [],
  });

  // If currentUser is not available, don't render the dialog
  if (!currentUser) {
    return null;
  }

  useEffect(() => {
    if (initialData) {
      setFormData(prev => ({
        ...prev,
        ...initialData,
      }));
    }
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      
      if (formData.request_type === 'swap') {
        // Create a new swap request
        const swapRequest: Omit<SwapRequest, 'id' | 'status' | 'created_at' | 'updated_at'> = {
          type: 'swap',
          user_id: currentUser.id,
          requester_id: currentUser.id,
          requested_user_id: formData.requested_users?.[0] || '',
          shift_id: selectedShift?.id || '',
          proposed_shift_id: formData.proposed_shift_id,
          notes: formData.reason || '',
          start_date: selectedShift?.start_time || '',
          end_date: selectedShift?.end_time || '',
        };

        await swapRequestsTable.create(swapRequest);

        // Update the shifts to mark them as pending swap
        if (selectedShift?.id) {
          await shiftsTable.update(selectedShift.id, {
            status: 'pending_swap',
          });
        }

        if (formData.proposed_shift_id) {
          await shiftsTable.update(formData.proposed_shift_id, {
            status: 'pending_swap',
          });
        }
      } else {
        // Handle leave request
        const leaveRequest: Omit<LeaveRequest, 'id' | 'status' | 'created_at' | 'updated_at'> = {
          type: 'leave',
          user_id: currentUser.id,
          leave_type: formData.request_type as LeaveType,
          start_date: formData.start_date,
          end_date: formData.end_date,
          reason: formData.reason,
          notes: formData.notes || '',
        };

        await leaveRequestsTable.create(leaveRequest);
      }

      toast({
        title: 'Request submitted',
        description: 'Your request has been submitted successfully.',
      });
      onOpenChange(false);
      onRequestsUpdate?.();
    } catch (error) {
      console.error('Error submitting request:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit request. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRequestTypeChange = (value: RequestType) => {
    setFormData(prev => ({
      ...prev,
      request_type: value,
    }));
  };

  const selectedRequestType = requestTypes.find(opt => opt.value === formData.request_type);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Request Time Off</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* User Selection for Admins */}
          {currentUser.role === 'admin' && (
            <div className="space-y-2">
              <Label>Select Users</Label>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {users.map(user => (
                  <div
                    key={user.id}
                    className={`flex items-center gap-2 p-2 rounded cursor-pointer ${
                      formData.requested_users?.includes(user.id) ? 'bg-primary/10' : 'hover:bg-accent'
                    }`}
                    onClick={() => setFormData(prev => ({
                      ...prev,
                      requested_users: prev.requested_users?.includes(user.id)
                        ? prev.requested_users.filter(id => id !== user.id)
                        : [...(prev.requested_users || []), user.id]
                    }))}
                  >
                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs">
                      {user.username[0].toUpperCase()}
                    </div>
                    <span>{user.username}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Request Type */}
          <div className="space-y-2">
            <Label>Request Type</Label>
            <Select
              value={formData.request_type}
              onValueChange={handleRequestTypeChange}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {requestTypes
                  .filter(option => !option.adminOnly || currentUser.role === 'admin')
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
          {formData.request_type !== 'swap' && (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label>Start Date</Label>
              <Input
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
                <Label>End Date</Label>
              <Input
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
              />
            </div>
          </div>
          )}

          {/* Reason/Notes */}
          <div className="space-y-2">
            <Label>Reason/Notes (Required)</Label>
            <Input
              value={formData.reason}
              onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
              placeholder="Enter reason for request"
              required
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit Request'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
