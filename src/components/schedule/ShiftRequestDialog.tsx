import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { Calendar, Clock, User, Users, X } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import { LeaveRequest, LeaveType, ScheduleUser } from '@/types/schedule';
import { leaveRequestsTable } from '@/integrations/supabase/tables/schedule';
import { supabase } from '@/integrations/supabase/client';

interface ShiftRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  users: ScheduleUser[];
  onRequestsUpdate?: () => void;
}

const requestTypeOptions = [
  { value: 'day-off', label: 'Day Off Request', icon: Calendar },
  { value: 'unpaid', label: 'Unpaid Leave', icon: Clock },
  { value: 'extra', label: 'Extra Days', icon: User, adminOnly: true },
  { value: 'public-holiday', label: 'Public Holiday', icon: Users, adminOnly: true },
];

type RequestType = 'day-off' | 'unpaid' | 'extra' | 'public-holiday';

export const ShiftRequestDialog: React.FC<ShiftRequestDialogProps> = ({
  open,
  onOpenChange,
  users,
  onRequestsUpdate,
}) => {
  // Simulate currentUser from context (replace with useAuth in your app)
  const currentUser = { id: 'admin-id', role: 'admin', username: 'admin' }; // <-- Replace with real auth
  const isAdmin = currentUser.role === 'admin';

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    request_type: 'day-off' as RequestType,
    start_date: format(new Date(), 'yyyy-MM-dd'),
    end_date: format(new Date(), 'yyyy-MM-dd'),
    reason: '',
    notes: '',
  });

  const handleUserToggle = (userId: string) => {
    setSelectedUsers(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      if (isAdmin) {
        if (selectedUsers.length === 0) {
          toast({
            title: 'No user selected',
            description: 'Please select at least one user to submit a request for.',
            variant: 'destructive',
          });
          setIsSubmitting(false);
          return;
        }
        for (const userId of selectedUsers) {
          const leaveRequest = {
            user_id: userId,
            leave_type: formData.request_type as LeaveType,
            request_type: 'leave',
            start_date: formData.start_date,
            end_date: formData.end_date,
            reason: formData.reason,
            notes: formData.notes || '',
          };
          // Create the request
          const createdRequest = await leaveRequestsTable.create(leaveRequest);
          // Auto-approve
          await supabase
            .from('shift_requests')
            .update({
              status: 'approved',
              reviewer_id: currentUser.id,
              updated_at: new Date().toISOString(),
            })
            .eq('id', createdRequest.id);
        }
        toast({
          title: 'Request submitted',
          description: 'Request has been auto-approved for selected users.',
        });
      } else {
        // Not admin: create for self, pending
        const leaveRequest = {
          user_id: currentUser.id,
          leave_type: formData.request_type as LeaveType,
          request_type: 'leave',
          start_date: formData.start_date,
          end_date: formData.end_date,
          reason: formData.reason,
          notes: formData.notes || '',
        };
        await leaveRequestsTable.create(leaveRequest);
        toast({
          title: 'Request submitted',
          description: 'Your request has been submitted successfully.',
        });
      }
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Request Time Off</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {isAdmin && (
            <div className="space-y-2">
              <Label>Select Users</Label>
              <div className="space-y-2 max-h-40 overflow-y-auto border rounded p-2">
                {users.map(user => (
                  <div
                    key={user.id}
                    className={`flex items-center gap-2 p-2 rounded ${
                      selectedUsers.includes(user.id) ? 'bg-primary/10 border border-primary/20' : ''
                    }`}
                  >
                    <Checkbox
                      id={`user-${user.id}`}
                      checked={selectedUsers.includes(user.id)}
                      onCheckedChange={() => handleUserToggle(user.id)}
                    />
                    <label htmlFor={`user-${user.id}`} className="flex items-center gap-2 flex-1 cursor-pointer">
                      <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs">
                        {user.username[0].toUpperCase()}
                      </div>
                      <span>{user.username}</span>
                      <span className="text-xs text-muted-foreground">({user.role})</span>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="space-y-2">
            <Label>Leave Type</Label>
            <Select
              value={formData.request_type}
              onValueChange={value => setFormData(prev => ({ ...prev, request_type: value as RequestType }))}
            >
              <SelectTrigger>
                <SelectValue />
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
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input
                type="date"
                value={formData.start_date}
                onChange={e => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>End Date</Label>
              <Input
                type="date"
                value={formData.end_date}
                onChange={e => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Reason/Notes (Required)</Label>
            <Input
              value={formData.reason}
              onChange={e => setFormData(prev => ({ ...prev, reason: e.target.value }))}
              placeholder="Enter reason for request"
              required
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : isAdmin ? 'Submit & Auto-Approve' : 'Submit Request'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}; 