
import React, { useState } from 'react';
import { useShifts } from '@/context/ShiftsContext';
import { useAuth } from '@/context/AuthContext';
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
    status: 'pending',
    requested_shift_details: {
      title: '',
      shift_type: 'morning',
      role: '',
      custom_hours: {
        start_hour: 9,
        start_minute: 0,
        end_hour: 17,
        end_minute: 0
      }
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestData.start_date || !requestData.reason) {
      return;
    }

    setLoading(true);
    const success = await createShiftRequest(requestData);
    if (success) {
      setRequestData({
        user_id: currentUser?.id || '',
        request_type: 'time_off',
        start_date: '',
        end_date: '',
        reason: '',
        status: 'pending',
        requested_shift_details: {
          title: '',
          shift_type: 'morning',
          role: '',
          custom_hours: {
            start_hour: 9,
            start_minute: 0,
            end_hour: 17,
            end_minute: 0
          }
        }
      });
      onOpenChange(false);
    }
    setLoading(false);
  };

  const handleInputChange = (field: string, value: any) => {
    setRequestData(prev => ({ ...prev, [field]: value }));
  };

  const handleShiftDetailsChange = (field: string, value: any) => {
    setRequestData(prev => ({
      ...prev,
      requested_shift_details: {
        ...prev.requested_shift_details!,
        [field]: value
      }
    }));
  };

  const handleCustomHoursChange = (field: string, value: number) => {
    setRequestData(prev => ({
      ...prev,
      requested_shift_details: {
        ...prev.requested_shift_details!,
        custom_hours: {
          ...prev.requested_shift_details!.custom_hours!,
          [field]: value
        }
      }
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Submit Shift Request
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
              />
            </div>
          </div>

          {/* Custom Shift Details */}
          {requestData.request_type === 'custom_shift' && (
            <Card className="border-orange-200 bg-orange-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Custom Shift Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Shift Title</Label>
                  <Input
                    value={requestData.requested_shift_details?.title}
                    onChange={(e) => handleShiftDetailsChange('title', e.target.value)}
                    placeholder="e.g., Special Event Coverage"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Shift Type</Label>
                  <Select 
                    value={requestData.requested_shift_details?.shift_type} 
                    onValueChange={(value) => handleShiftDetailsChange('shift_type', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="morning">Morning</SelectItem>
                      <SelectItem value="evening">Evening</SelectItem>
                      <SelectItem value="night">Night</SelectItem>
                      <SelectItem value="custom">Custom Hours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {requestData.requested_shift_details?.shift_type === 'custom' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Start Hour</Label>
                      <Select 
                        value={requestData.requested_shift_details?.custom_hours?.start_hour.toString()} 
                        onValueChange={(value) => handleCustomHoursChange('start_hour', parseInt(value))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 24 }, (_, i) => (
                            <SelectItem key={i} value={i.toString()}>
                              {i.toString().padStart(2, '0')}:00
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>End Hour</Label>
                      <Select 
                        value={requestData.requested_shift_details?.custom_hours?.end_hour.toString()} 
                        onValueChange={(value) => handleCustomHoursChange('end_hour', parseInt(value))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 24 }, (_, i) => (
                            <SelectItem key={i} value={i.toString()}>
                              {i.toString().padStart(2, '0')}:00
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Role/Position</Label>
                  <Input
                    value={requestData.requested_shift_details?.role}
                    onChange={(e) => handleShiftDetailsChange('role', e.target.value)}
                    placeholder="e.g., Event Coordinator"
                  />
                </div>
              </CardContent>
            </Card>
          )}

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
