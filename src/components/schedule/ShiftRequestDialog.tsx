import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { Clock, User, Users, X } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import { z } from 'zod';
import { SwapRequest, LeaveRequest, LeaveType, Shift, ScheduleUser } from '@/types/schedule';
import { shiftsTable, swapRequestsTable, leaveRequestsTable } from '@/integrations/supabase/tables/schedule';
import { supabase } from '@/integrations/supabase/client';
import { SHIFT_TEMPLATES } from '@/lib/constants';
import { useAuth } from '@/context/AuthContext';

// Form schema
const formSchema = z.object({
  request_type: z.enum(['day-off', 'unpaid-leave', 'extra-days', 'public-holiday', 'swap']),
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
  users: ScheduleUser[];
  initialData?: Partial<Shift>;
  selectedShift?: Shift;
  onRequestsUpdate?: () => void;
  editingRequest?: LeaveRequest | null;
}

const requestTypes = [
  { value: 'day-off' as const, label: 'Day Off', icon: Clock, adminOnly: false },
  { value: 'unpaid-leave' as const, label: 'Unpaid Leave', icon: Clock, adminOnly: false },
  { value: 'extra-days' as const, label: 'Extra Days', icon: User, adminOnly: true },
  { value: 'public-holiday' as const, label: 'Public Holiday', icon: Users, adminOnly: true },
  { value: 'swap' as const, label: 'Swap', icon: User, adminOnly: false },
] as const;

type RequestType = typeof requestTypes[number]['value'];

export function ShiftRequestDialog({
  open,
  onOpenChange,
  users,
  initialData,
  selectedShift,
  onRequestsUpdate,
  editingRequest,
}: ShiftRequestDialogProps) {
  const { currentUser } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [formData, setFormData] = useState<FormData>({
    request_type: 'day-off',
    start_date: format(new Date(), 'yyyy-MM-dd'),
    end_date: format(new Date(), 'yyyy-MM-dd'),
    reason: '',
    notes: '',
    requested_users: [],
  });

  const isAdmin = currentUser?.role === 'admin';

  useEffect(() => {
    if (initialData && open) {
      setFormData(prev => ({
        ...prev,
        ...initialData,
      }));
    }
  }, [initialData, open]);

  useEffect(() => {
    if (!open) {
      // Reset form when dialog closes
      setSelectedUsers([]);
      setFormData({
        request_type: 'day-off',
        start_date: format(new Date(), 'yyyy-MM-dd'),
        end_date: format(new Date(), 'yyyy-MM-dd'),
        reason: '',
        notes: '',
        requested_users: [],
      });
    }
  }, [open]);

  const resetForm = () => {
    setSelectedUsers([]);
    setFormData({
      request_type: 'day-off',
      start_date: format(new Date(), 'yyyy-MM-dd'),
      end_date: format(new Date(), 'yyyy-MM-dd'),
      reason: '',
      notes: '',
      requested_users: [],
    });
  };

  const handleUserToggle = (userId: string) => {
    setSelectedUsers(prev => {
      if (prev.includes(userId)) {
        return prev.filter(id => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      
      if (formData.request_type === 'swap') {
        // Create a new swap request
        const swapRequest: Omit<SwapRequest, 'id' | 'status' | 'created_at' | 'updated_at'> = {
          type: 'swap',
          request_type: 'swap',
          user_id: currentUser?.id || '',
          requester_id: currentUser?.id || '',
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
        // Handle leave request - for admins with multiple users or single user
        const usersToProcess = isAdmin && selectedUsers.length > 0 ? selectedUsers : [currentUser?.id || ''];
        
        for (const userId of usersToProcess) {
          const leaveRequest: Omit<LeaveRequest, 'id' | 'status' | 'created_at' | 'updated_at'> = {
            type: 'leave',
            request_type: 'leave',
            user_id: userId,
            leave_type: formData.request_type as LeaveType,
            start_date: formData.start_date,
            end_date: formData.end_date,
            reason: formData.reason,
            notes: formData.notes || '',
          };

          const createdRequest = await leaveRequestsTable.create(leaveRequest);

          // For admins, auto-approve and create/replace shifts immediately
          if (isAdmin) {
            await supabase
              .from('shift_requests')
              .update({ 
                status: 'approved', 
                reviewer_id: currentUser?.id,
                updated_at: new Date().toISOString()
              })
              .eq('id', createdRequest.id);

            // Replace existing shifts with day-off shifts
            await replaceShiftsWithDayOff(userId, formData.start_date, formData.end_date, formData.request_type);
          }
        }
      }

      toast({
        title: 'Request submitted',
        description: isAdmin ? 'Request has been auto-approved and shifts updated.' : 'Your request has been submitted successfully.',
      });
      
      onOpenChange(false);
      onRequestsUpdate?.();
    } catch (error) {
      console.error('Error submitting request:', error);
      toast({
        title: "Error",
        description: "Failed to submit request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const replaceShiftsWithDayOff = async (userId: string, startDate: string, endDate: string, leaveType: string) => {
    try {
      // Find existing shifts in the date range
      const { data: existingShifts, error: searchError } = await supabase
        .from('shifts')
        .select('*')
        .eq('user_id', userId)
        .gte('start_time', `${startDate}T00:00:00`)
        .lte('end_time', `${endDate}T23:59:59`);

      if (searchError) {
        console.error('Error searching for existing shifts:', searchError);
        return;
      }

      // Get the appropriate template based on leave type
      const template = leaveType === 'public-holiday' 
        ? SHIFT_TEMPLATES.PUBLIC_HOLIDAY 
        : SHIFT_TEMPLATES.DAY_OFF;

      const shiftData = {
        user_id: userId,
        shift_type: template.shift_type,
        title: template.title,
        color: template.color,
        is_all_day: template.is_all_day,
        notes: `Leave request: ${leaveType}`,
        start_time: `${startDate}T00:00:00`,
        end_time: `${endDate}T23:59:59`,
        created_by: currentUser.id,
      };

      if (existingShifts && existingShifts.length > 0) {
        // Update existing shifts
        for (const shift of existingShifts) {
          await supabase
            .from('shifts')
            .update({
              shift_type: template.shift_type,
              color: template.color,
              notes: `Leave request: ${leaveType} (replaced original shift)`,
            })
            .eq('id', shift.id);
        }
      } else {
        // Create new day-off shift
        await supabase.from('shifts').insert([shiftData]);
      }
    } catch (error) {
      console.error('Error replacing shifts with day-off:', error);
    }
  };

  const handleRequestTypeChange = (value: RequestType) => {
    setFormData(prev => ({
      ...prev,
      request_type: value,
    }));
  };

  if (!currentUser) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Request Time Off</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* User Selection for Admins */}
          {isAdmin && (
            <div className="space-y-2">
              <Label>Select Users (Multiple Selection)</Label>
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
                    <label 
                      htmlFor={`user-${user.id}`}
                      className="flex items-center gap-2 flex-1 cursor-pointer"
                    >
                      <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs">
                        {user.username[0].toUpperCase()}
                      </div>
                      <span>{user.username}</span>
                      <span className="text-xs text-muted-foreground">({user.role})</span>
                    </label>
                  </div>
                ))}
              </div>
              {selectedUsers.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {selectedUsers.map(userId => {
                    const user = users.find(u => u.id === userId);
                    return user ? (
                      <div key={userId} className="flex items-center gap-1 bg-primary/10 text-primary px-2 py-1 rounded text-xs">
                        {user.username}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-4 w-4 p-0"
                          onClick={() => handleUserToggle(userId)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : null;
                  })}
                </div>
              )}
            </div>
          )}

          {/* Request Type */}
          <div className="space-y-2">
            <Label>Leave Type</Label>
            <Select
              value={formData.request_type}
              onValueChange={handleRequestTypeChange}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {requestTypes
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
              {isSubmitting ? 'Submitting...' : isAdmin ? 'Submit & Auto-Approve' : 'Submit Request'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
