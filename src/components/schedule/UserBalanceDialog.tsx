
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { User, Calendar, Clock, Award } from 'lucide-react';
import { ScheduleUser } from '@/types/schedule';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

interface UserBalanceDialogProps {
  open: boolean;
  user: ScheduleUser | null;
  initialBalance: number;
  onClose: () => void;
  onSave: (userId: string, newBalance: number) => void;
}

interface RequestHistory {
  id: string;
  request_type: string;
  leave_type?: string;
  start_date: string;
  end_date: string;
  reason: string;
  status: string;
  created_at: string;
}

export const UserBalanceDialog: React.FC<UserBalanceDialogProps> = ({
  open,
  user,
  initialBalance,
  onClose,
  onSave,
}) => {
  const [balance, setBalance] = useState(initialBalance);
  const [requestHistory, setRequestHistory] = useState<RequestHistory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (open && user) {
      setBalance(initialBalance);
      loadRequestHistory();
    }
  }, [open, user, initialBalance]);

  const loadRequestHistory = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('shift_requests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setRequestHistory(data || []);
    } catch (error) {
      console.error('Error loading request history:', error);
      toast({
        title: "Error",
        description: "Failed to load request history",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    
    setIsSaving(true);
    try {
      onSave(user.id, balance);
      toast({
        title: "Success",
        description: "User balance updated successfully",
      });
      onClose();
    } catch (error) {
      console.error('Error updating balance:', error);
      toast({
        title: "Error",
        description: "Failed to update balance",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'approved': return 'default';
      case 'pending': return 'secondary';
      case 'rejected': return 'destructive';
      default: return 'secondary';
    }
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            User Information
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* User Details */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-500">Name</Label>
                <p className="text-sm font-medium">{user.username}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">Role</Label>
                <Badge variant="outline" className="capitalize">
                  {user.role}
                </Badge>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">Title</Label>
                <p className="text-sm">{user.title || 'N/A'}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">Department</Label>
                <p className="text-sm">{user.department || 'N/A'}</p>
              </div>
            </div>

            {/* Balance Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Award className="h-4 w-4" />
                <Label className="font-medium">Remaining Balance</Label>
              </div>
              
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={balance}
                  onChange={(e) => setBalance(Number(e.target.value))}
                  className="w-24"
                  min="0"
                />
                <span className="text-sm text-gray-500">days</span>
                {balance !== initialBalance && (
                  <Button 
                    size="sm" 
                    onClick={handleSave}
                    disabled={isSaving}
                  >
                    {isSaving ? 'Saving...' : 'Save'}
                  </Button>
                )}
              </div>
            </div>

            {/* Request History */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <Label className="font-medium">Request History</Label>
              </div>
              
              <div className="max-h-48 overflow-y-auto space-y-2">
                {requestHistory.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">
                    No requests found
                  </p>
                ) : (
                  requestHistory.map((request) => (
                    <div 
                      key={request.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium capitalize">
                            {request.leave_type?.replace('-', ' ') || request.request_type}
                          </span>
                          <Badge variant={getStatusBadgeVariant(request.status)}>
                            {request.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-500">
                          {format(new Date(request.start_date), 'MMM d, yyyy')} - {format(new Date(request.end_date), 'MMM d, yyyy')}
                        </p>
                        {request.reason && (
                          <p className="text-xs text-gray-600 mt-1">{request.reason}</p>
                        )}
                      </div>
                      <Clock className="h-4 w-4 text-gray-400" />
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
