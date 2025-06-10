import { useState, useEffect } from 'react';
import { format } from 'date-fns';
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

interface LeaveRequestDialogProps {
  open: boolean;
  request?: LeaveRequest;
  users: ScheduleUser[];
  onClose: () => void;
  onSubmit: (request: Omit<LeaveRequest, 'id' | 'status' | 'created_at' | 'updated_at'>) => Promise<void>;
}

export default function LeaveRequestDialog({
  open,
  request,
  users,
  onClose,
  onSubmit,
}: LeaveRequestDialogProps) {
  const { currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'admin';
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [formData, setFormData] = useState<Partial<LeaveRequest>>({
    leave_type: 'paid',
    start_date: format(new Date(), 'yyyy-MM-dd'),
    end_date: format(new Date(), 'yyyy-MM-dd'),
    reason: '',
  });

  useEffect(() => {
    if (request) {
      setFormData({
        ...request,
        start_date: format(new Date(request.start_date), 'yyyy-MM-dd'),
        end_date: format(new Date(request.end_date), 'yyyy-MM-dd'),
      });
    }
  }, [request]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isAdmin && selectedUsers.length > 0) {
      // Submit request for each selected user
      for (const userId of selectedUsers) {
        await onSubmit({
          ...formData,
          user_id: userId,
        } as Omit<LeaveRequest, 'id' | 'status' | 'created_at' | 'updated_at'>);
      }
    } else {
      await onSubmit(formData as Omit<LeaveRequest, 'id' | 'status' | 'created_at' | 'updated_at'>);
    }
  };

  const handleUserSelect = (userId: string) => {
    setSelectedUsers(prev => {
      if (prev.includes(userId)) {
        return prev.filter(id => id !== userId);
      }
      return [...prev, userId];
    });
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
                <SelectItem value="paid">Paid Leave</SelectItem>
                <SelectItem value="unpaid">Unpaid Leave</SelectItem>
                <SelectItem value="day-off">Day Off</SelectItem>
                {isAdmin && (
                  <>
                    <SelectItem value="extra">Extra Days</SelectItem>
                    <SelectItem value="public-holiday">Public Holiday</SelectItem>
                  </>
                )}
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
} 