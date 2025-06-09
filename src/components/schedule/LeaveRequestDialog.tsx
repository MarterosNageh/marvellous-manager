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
} from '@/components/ui';
import { LeaveRequest, LeaveType } from '../../types/schedule';

interface LeaveRequestDialogProps {
  open: boolean;
  request?: LeaveRequest;
  onClose: () => void;
  onSubmit: (request: Omit<LeaveRequest, 'id' | 'status' | 'created_at' | 'updated_at'>) => Promise<void>;
}

export default function LeaveRequestDialog({
  open,
  request,
  onClose,
  onSubmit,
}: LeaveRequestDialogProps) {
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
    await onSubmit(formData as Omit<LeaveRequest, 'id' | 'status' | 'created_at' | 'updated_at'>);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Submit Leave Request</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
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
                <SelectItem value="extra">Extra Days</SelectItem>
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