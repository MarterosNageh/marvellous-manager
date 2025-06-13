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
import { supabase } from '@/integrations/supabase/client';
import { SHIFT_TEMPLATES } from '@/lib/constants';
import { NotificationService } from '@/services/notificationService';

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
  editingRequest?: LeaveRequest | null;
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
  editingRequest,
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

  // Add helper functions at the top of the component
  const getShiftTitleByLeaveType = (leaveType: string) => {
    switch (leaveType) {
      case 'sick-leave':
        return 'Sick Leave';
      case 'annual-leave':
        return 'Annual Leave';
      case 'public-holiday':
        return 'Public Holiday';
      case 'day-off':
        return 'Day Off';
      default:
        return leaveType.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    }
  };

  const getShiftColorByLeaveType = (leaveType: string) => {
    switch (leaveType) {
      case 'sick-leave':
        return '#FF6B6B'; // Red
      case 'annual-leave':
        return '#4ECDC4'; // Teal
      case 'public-holiday':
        return '#FFD93D'; // Yellow
      case 'day-off':
        return '#95A5A6'; // Gray
      default:
        return '#6C5CE7'; // Purple for unknown types
    }
  };

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
          request_type: 'swap',
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
          user_id: currentUser.id,
          leave_type: formData.request_type as LeaveType,
          request_type: 'leave',
          start_date: formData.start_date,
          end_date: formData.end_date,
          reason: formData.reason,
          notes: formData.notes || '',
        };

        await leaveRequestsTable.create(leaveRequest);

        // Send notification to admin users when non-admin submits a request
        if (currentUser.role !== 'admin') {
          try {
            const { data: adminUsers } = await supabase
              .from('auth_users')
              .select('id')
              .eq('role', 'admin')
              .or('is_admin.eq.true');

            if (adminUsers && adminUsers.length > 0) {
              await NotificationService.sendRequestSubmittedNotification(
                adminUsers.map(u => u.id),
                formData.request_type,
                formData.start_date,
                currentUser.id
              );
            }
          } catch (notificationError) {
            console.warn('⚠️ Error sending request submission notification:', notificationError);
          }
        }
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
            {currentUser.role === 'admin' && editingRequest?.id && (
              <>
                {editingRequest.status !== 'approved' && (
                  <Button
                    type="button"
                    variant="default"
                    className="bg-green-600 hover:bg-green-700 text-white"
                    onClick={async () => {
                      setIsSubmitting(true);
                      try {
                        await supabase
                          .from('shift_requests')
                          .update({ 
                            status: 'approved', 
                            reviewer_id: currentUser.id,
                            updated_at: new Date().toISOString()
                          })
                          .eq('id', editingRequest.id);

                        // Create or update shift
                        if (editingRequest.request_type === 'leave') {
                          console.log('Processing leave request:', editingRequest);
                          
                          // Find any existing shifts in this date range
                          const { data: existingShifts, error: searchError } = await supabase
                            .from('shifts')
                            .select('*')
                            .eq('user_id', editingRequest.user_id)
                            .gte('start_time', `${editingRequest.start_date}T00:00:00`)
                            .lte('end_time', `${editingRequest.end_date}T23:59:59`);

                          if (searchError) {
                            console.error('Error searching for existing shifts:', searchError);
                            throw searchError;
                          }

                          console.log('Found existing shifts:', existingShifts);

                          // Get the appropriate template based on leave type
                          const template = editingRequest.leave_type === 'public-holiday' 
                            ? SHIFT_TEMPLATES.PUBLIC_HOLIDAY 
                            : SHIFT_TEMPLATES.DAY_OFF;

                          const shiftData = {
                            ...template,
                            description: editingRequest.reason || '',
                            notes: '',
                            status: 'active',
                            // Set standard times for day off (00:00 to 23:59)
                            start_time: `${editingRequest.start_date}T00:00:00`,
                            end_time: `${editingRequest.end_date}T23:59:59`,
                          };

                          if (existingShifts && existingShifts.length > 0) {
                            console.log('Updating existing shifts');
                            // Update existing shifts instead of deleting
                            for (const shift of existingShifts) {
                              const { error: updateError } = await supabase
                                .from('shifts')
                                .update({
                                  ...shiftData,
                                  notes: `Original shift replaced by ${template.title}`,
                                })
                                .eq('id', shift.id);

                              if (updateError) {
                                console.error('Error updating shift:', updateError);
                                throw updateError;
                              }
                            }
                          } else {
                            console.log('Creating new shift');
                            // Create new shift if none exists
                            const { error: insertError } = await supabase.from('shifts').insert([{
                              ...shiftData,
                              user_id: editingRequest.user_id,
                              created_by: currentUser.id,
                              repeat_days: [],
                            }]);

                            if (insertError) {
                              console.error('Error creating shift:', insertError);
                              throw insertError;
                            }
                          }
                        }

                        // Send push notification to the user who submitted the request
                        try {
                          await NotificationService.sendRequestApprovedNotification(
                            [editingRequest.user_id],
                            editingRequest.leave_type || editingRequest.request_type,
                            editingRequest.start_date
                          );
                        } catch (notificationError) {
                          console.warn('⚠️ Error sending request approval notification:', notificationError);
                        }
                        
                        toast({
                          title: 'Request approved',
                          description: 'The request has been approved successfully.',
                        });
                        onOpenChange(false);
                        onRequestsUpdate?.();
                      } catch (error) {
                        console.error('Error approving request:', error);
                        toast({
                          title: 'Error',
                          description: 'Failed to approve request',
                          variant: 'destructive',
                        });
                      }
                      setIsSubmitting(false);
                    }}
                    disabled={isSubmitting}
                  >
                    Approve
                  </Button>
                )}
                {editingRequest.status !== 'rejected' && (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={async () => {
                      setIsSubmitting(true);
                      try {
                        await supabase
                          .from('shift_requests')
                          .update({ 
                            status: 'rejected', 
                            reviewer_id: currentUser.id,
                            updated_at: new Date().toISOString()
                          })
                          .eq('id', editingRequest.id);

                        // Send push notification to the user who submitted the request
                        try {
                          await NotificationService.sendRequestRejectedNotification(
                            [editingRequest.user_id],
                            editingRequest.leave_type || editingRequest.request_type,
                            editingRequest.start_date
                          );
                        } catch (notificationError) {
                          console.warn('⚠️ Error sending request rejection notification:', notificationError);
                        }
                        
                        toast({
                          title: 'Request rejected',
                          description: 'The request has been rejected.',
                        });
                        onOpenChange(false);
                        onRequestsUpdate?.();
                      } catch (error) {
                        console.error('Error rejecting request:', error);
                        toast({
                          title: 'Error',
                          description: 'Failed to reject request',
                          variant: 'destructive',
                        });
                      }
                      setIsSubmitting(false);
                    }}
                    disabled={isSubmitting}
                  >
                    Reject
                  </Button>
                )}
              </>
            )}
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit Request'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
