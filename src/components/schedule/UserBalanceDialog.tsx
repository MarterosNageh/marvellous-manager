import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Button,
  Input,
  Label,
  Badge,
} from '@/components/ui';
import { ScrollArea } from '@/components/ui/scroll-area';
import { User, Calendar, Clock, Award, History } from 'lucide-react';
import { ScheduleUser, LeaveRequest } from '@/types/schedule';
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

export const UserBalanceDialog: React.FC<UserBalanceDialogProps> = ({
  open,
  user,
  initialBalance,
  onClose,
  onSave,
}) => {
  const [balance, setBalance] = useState(initialBalance);
  const [isSaving, setIsSaving] = useState(false);
  const [requestHistory, setRequestHistory] = useState<LeaveRequest[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  useEffect(() => {
    if (open && user) {
      setBalance(initialBalance);
      loadRequestHistory();
    }
  }, [open, user, initialBalance]);

  const loadRequestHistory = async () => {
    if (!user) return;
    
    setIsLoadingHistory(true);
    try {
      const { data: requests, error } = await supabase
        .from('shift_requests')
        .select(`
          id,
          user_id,
          leave_type,
          request_type,
          start_date,
          end_date,
          reason,
          status,
          notes,
          created_at,
          updated_at,
          reviewer_id,
          reviewer:auth_users!shift_requests_reviewer_id_fkey(username)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const mappedRequests: LeaveRequest[] = (requests || []).map(req => ({
        id: req.id,
        user_id: req.user_id,
        leave_type: req.leave_type || '',
        request_type: req.request_type || 'leave',
        start_date: req.start_date,
        end_date: req.end_date,
        reason: req.reason || '',
        status: req.status || 'pending',
        notes: req.notes,
        created_at: req.created_at,
        updated_at: req.updated_at,
        reviewer_id: req.reviewer_id,
        reviewer: req.reviewer ? { username: req.reviewer.username } : undefined
      }));
      
      setRequestHistory(mappedRequests);
    } catch (error) {
      console.error('Error loading request history:', error);
      toast({
        title: "Error",
        description: "Failed to load request history",
        variant: "destructive",
      });
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    
    setIsSaving(true);
    try {
      // Update the balance in the database
      const { error } = await supabase
        .from('auth_users')
        .update({ balance: balance * 8 }) // Convert days to hours (8 hours per day)
        .eq('id', user.id);

      if (error) throw error;

      // Call the onSave callback to update the local state
      onSave(user.id, balance);
      
      toast({
        title: "Success",
        description: `Leave balance updated for ${user.username}`,
      });
      
      onClose();
    } catch (error) {
      console.error('Error updating balance:', error);
      toast({
        title: "Error",
        description: "Failed to update leave balance",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setBalance(initialBalance); // Reset to original value
    onClose();
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Edit Leave Balance
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4 overflow-y-auto max-h-[60vh]">
          {/* User Information Section */}
          <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-medium">
              {user.username?.substring(0, 2).toUpperCase()}
            </div>


            <div>
              <p className="font-medium">{user.username}</p>
              <p className="text-sm text-muted-foreground">{user.title || 'Employee'}</p>
              <p className="text-sm text-muted-foreground">{user.role || 'N/A'}</p>
            </div>
          </div>

          <div className="space-y-3">
            <Label htmlFor="balance" className="text-base font-medium flex items-center gap-2">
              <Award className="h-4 w-4" />
              Leave Balance (Days)
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id="balance"
                type="number"
                value={balance}
                onChange={(e) => setBalance(Number(e.target.value))}
                className="w-32"
                min="0"
                step="0.5"
                placeholder="Enter days"
              />
              <span className="text-sm text-muted-foreground">days</span>
            </div>
            <p className="text-sm text-muted-foreground">
              This represents the total number of leave days available to the user.
            </p>
          </div>

          {balance !== initialBalance && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Change:</strong> {balance > initialBalance ? '+' : ''}{balance - initialBalance} days
              </p>
            </div>
          )}

          {/* Request History Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <History className="h-4 w-4" />
              <Label className="font-medium">Request History</Label>
            </div>
            
            <ScrollArea className="h-[200px] rounded-md border">
              <div className="space-y-2 p-4">
                {isLoadingHistory ? (
                  <div className="flex items-center justify-center h-20">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
                  </div>
                ) : requestHistory.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No request history available</p>
                ) : (
                  requestHistory.map((request) => (
                    <div
                      key={request.id}
                      className="flex flex-col gap-2 p-3 rounded-lg border bg-gray-50"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-500" />
                          <span className="text-sm font-medium">
                            {format(new Date(request.start_date), 'MMM dd, yyyy')} - {format(new Date(request.end_date), 'MMM dd, yyyy')}
                          </span>
                        </div>
                        <Badge className={getStatusBadgeColor(request.status)}>
                          {request.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">{request.reason}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Clock className="h-3 w-3" />
                        {format(new Date(request.created_at), 'MMM dd, yyyy HH:mm')}
                        {request.reviewer && (
                          <span>• Reviewed by {request.reviewer.username}</span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={isSaving || balance === initialBalance}
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}; 