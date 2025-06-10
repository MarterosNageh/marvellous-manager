
import React, { useState } from 'react';
import { useShifts } from '@/context/ShiftsContext';
import { useAuth } from '@/context/AuthContext';
import { toast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Clock, AlertCircle } from 'lucide-react';
import { ShiftRequest } from '@/types/shiftTypes';

interface ShiftRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ShiftRequestDialog: React.FC<ShiftRequestDialogProps> = ({ 
  open, 
  onOpenChange 
}) => {
  const { createShiftRequest } = useShifts();
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [requestData, setRequestData] = useState<Omit<ShiftRequest, 'id' | 'created_at' | 'updated_at'>>({
    user_id: currentUser?.id || '',
    request_type: 'time_off',
    start_date: '',
    end_date: '',
    reason: '',
    status: 'pending'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!requestData.start_date || !requestData.reason.trim()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (!currentUser?.id) {
      toast({
        title: "Error",
        description: "You must be logged in to submit requests",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    console.log('Submitting request:', requestData);
    
    const success = await createShiftRequest({
      ...requestData,
      user_id: currentUser.id,
      end_date: requestData.end_date || requestData.start_date
    });
    
    if (success) {
      setRequestData({
        user_id: currentUser.id,
        request_type: 'time_off',
        start_date: '',
        end_date: '',
        reason: '',
        status: 'pending'
      });
      onOpenChange(false);
    }
    setLoading(false);
  };

  const handleInputChange = (field: string, value: any) => {
    setRequestData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Submit Time Off Request
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Request Type */}
          <div className="space-y-2">
            <Label htmlFor="request_type">Request Type *</Label>
            <Select value={requestData.request_type} onValueChange={(value: any) => handleInputChange('request_type', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="time_off">Time Off Request</SelectItem>
                <SelectItem value="extra_work">Extra Work Request</SelectItem>
                <SelectItem value="shift_change">Shift Change Request</SelectItem>
                <SelectItem value="custom_shift">Custom Shift Request</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_date">Start Date *</Label>
              <Input
                id="start_date"
                type="date"
                value={requestData.start_date}
                onChange={(e) => handleInputChange('start_date', e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_date">End Date</Label>
              <Input
                id="end_date"
                type="date"
                value={requestData.end_date}
                onChange={(e) => handleInputChange('end_date', e.target.value)}
                min={requestData.start_date}
              />
            </div>
          </div>

          {/* Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason">Reason *</Label>
            <Textarea
              id="reason"
              value={requestData.reason}
              onChange={(e) => handleInputChange('reason', e.target.value)}
              placeholder="Please provide a reason for your request..."
              rows={3}
              required
            />
          </div>

          {/* Information Note */}
          <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-700">
              <p className="font-medium">Request Information</p>
              <p className="text-xs text-blue-600 mt-1">
                Your request will be reviewed by management. You'll receive a notification once it's been approved or rejected.
              </p>
            </div>
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
              {loading ? 'Submitting...' : 'Submit Request'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
