import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Button,
  Input,
  Label,
  Badge,
} from '@/components/ui';
import { ScrollArea } from '@/components/ui/scroll-area';
import { User, Calendar, Clock, Award, History } from 'lucide-react';
import { ScheduleUser, LeaveRequest } from '@/types/schedule';
import { toast } from '@/hooks/use-toast';
import { userBalancesTable, leaveRequestsTable } from '@/integrations/supabase/tables/schedule';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';

interface UserInfoDialogProps {
  open: boolean;
  onClose: () => void;
  user: ScheduleUser | null;
  currentUser: { id: string; role: string };
}

export const UserInfoDialog: React.FC<UserInfoDialogProps> = ({
  open,
  onClose,
  user,
  currentUser,
}) => {
  const [balance, setBalance] = useState(0);
  const [originalBalance, setOriginalBalance] = useState(0);
  const [requestHistory, setRequestHistory] = useState<LeaveRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const isAdmin = currentUser?.role === 'admin';

  useEffect(() => {
    if (open && user) {
      loadUserData();
    }
  }, [open, user]);

  const loadUserData = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // Load user balance
      const { data: userData, error: userError } = await supabase
        .from('auth_users')
        .select('balance')
        .eq('id', user.id)
        .single();

      if (userError) throw userError;
      
      const userBalance = userData?.balance || 80;
      setBalance(userBalance);
      setOriginalBalance(userBalance);

      // Load request history
      const { data: requests, error: requestsError } = await supabase
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

      if (requestsError) throw requestsError;
      
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
      console.error('Error loading user data:', error);
      toast({
        title: "Error",
        description: "Failed to load user information",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveBalance = async () => {
    if (!user || !isAdmin) return;
    
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('auth_users')
        .update({ balance })
        .eq('id', user.id);

      if (error) throw error;

      setOriginalBalance(balance);
      toast({
        title: "Success",
        description: "User balance updated successfully",
      });
    } catch (error) {
      console.error('Error updating balance:', error);
      toast({
        title: "Error",
        description: "Failed to update balance",
        variant: "destructive",
      });
      setBalance(originalBalance); // Reset to original value on error
    } finally {
      setIsSaving(false);
    }
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
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            User Information
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center h-[400px]">
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
                <Label className="font-medium">Leave Balance</Label>
              </div>
              
              {isAdmin ? (
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={balance}
                    onChange={(e) => setBalance(Number(e.target.value))}
                    className="w-24"
                    min="0"
                  />
                  <span className="text-sm text-gray-500">days</span>
                  {balance !== originalBalance && (
                    <Button 
                      size="sm" 
                      onClick={handleSaveBalance}
                      disabled={isSaving}
                    >
                      {isSaving ? 'Saving...' : 'Save'}
                    </Button>
                  )}
                </div>
              ) : (
                <p className="text-lg font-semibold">{balance} days</p>
              )}
            </div>

            {/* Request History */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <History className="h-4 w-4" />
                <Label className="font-medium">Request History</Label>
              </div>
              
              <ScrollArea className="h-[200px] rounded-md border">
                <div className="space-y-2 p-4">
                  {requestHistory.length === 0 ? (
                    <p className="text-sm text-gray-500">No request history available</p>
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
        )}
      </DialogContent>
    </Dialog>
  );
};
