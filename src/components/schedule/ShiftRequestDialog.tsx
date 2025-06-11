
import { Calendar, Clock, User, Users } from 'lucide-react';
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
  Badge,
} from '@/components/ui';
import { LeaveRequest, LeaveType, ScheduleUser } from '../../types/schedule';
import { useAuth } from '@/context/AuthContext';
import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { useShifts } from '@/context/ShiftsContext';
import { toast } from '@/hooks/use-toast';

interface ShiftRequestDialogProps {
  open: boolean;
  onClose: () => void;
  currentUser: { id: string; role: string };
  users: { id: string; username: string }[];
  onRequestsUpdate?: () => void;
}

const requestTypeOptions = [
  { value: 'day-off', label: 'Day Off Request', icon: Calendar, adminOnly: false },
  { value: 'unpaid', label: 'Unpaid Leave', icon: Clock, adminOnly: false },
  { value: 'extra', label: 'Extra Days', icon: User, adminOnly: true },
  { value: 'public-holiday', label: 'Public Holiday', icon: Users, adminOnly: true },
];

export const ShiftRequestDialog: React.FC<ShiftRequestDialogProps> = ({
  open,
  onClose,
  currentUser,
  users,
  onRequestsUpdate,
}) => {
  const isAdmin = currentUser?.role === 'admin';
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const { createShiftRequest } = useShifts();
  const [formData, setFormData] = useState({
    leave_type: 'day-off' as LeaveType,
    start_date: format(new Date(), 'yyyy-MM-dd'),
    end_date: format(new Date(), 'yyyy-MM-dd'),
    reason: '',
  });

  const handleUserSelect = (userId: string) => {
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
      if (isAdmin && selectedUsers.length > 0) {
        // Admin creating requests for multiple users
        for (const userId of selectedUsers) {
          const requestData = {
            user_id: userId,
            request_type: formData.leave_type,
            start_date: formData.start_date,
            end_date: formData.end_date,
            reason: formData.reason,
            status: 'approved' as const, // Auto-approve admin requests
          };
          
          await createShiftRequest(requestData);
        }
        
        toast({
          title: "Success",
          description: `Leave requests created for ${selectedUsers.length} users`,
        });
      } else {
        // Regular user creating request for themselves
        const requestData = {
          user_id: currentUser.id,
          request_type: formData.leave_type,
          start_date: formData.start_date,
          end_date: formData.end_date,
          reason: formData.reason,
          status: 'pending' as const,
        };
        
        await createShiftRequest(requestData);
      }
      
      onRequestsUpdate?.();
      onClose();
      
      // Reset form
      setSelectedUsers([]);
      setFormData({
        leave_type: 'day-off',
        start_date: format(new Date(), 'yyyy-MM-dd'),
        end_date: format(new Date(), 'yyyy-MM-dd'),
        reason: '',
      });
    } catch (error) {
      console.error('Error submitting request:', error);
      toast({
        title: "Error",
        description: "Failed to submit request",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Submit Leave Request</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isAdmin && (
            <div className="space-y-2">
              <Label>Select Users</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {selectedUsers.map(userId => {
                  const user = users.find(u => u.id === userId);
                  return user ? (
                    <Badge
                      key={userId}
                      variant="secondary"
                      className="cursor-pointer"
                      onClick={() => handleUserSelect(userId)}
                    >
                      {user.username} ×
                    </Badge>
                  ) : null;
                })}
              </div>
              <Select onValueChange={handleUserSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Select users..." />
                </SelectTrigger>
                <SelectContent>
                  {users.map(user => (
                    <SelectItem
                      key={user.id}
                      value={user.id}
                      disabled={selectedUsers.includes(user.id)}
                    >
                      {user.username}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label>Leave Type</Label>
            <Select
              value={formData.leave_type}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, leave_type: value as LeaveType }))
              }
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
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, start_date: e.target.value }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label>End Date</Label>
              <Input
                type="date"
                value={formData.end_date}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, end_date: e.target.value }))
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Reason</Label>
            <Textarea
              value={formData.reason}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, reason: e.target.value }))
              }
              placeholder="Please provide a reason for your leave request..."
              rows={4}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Submit Request</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
