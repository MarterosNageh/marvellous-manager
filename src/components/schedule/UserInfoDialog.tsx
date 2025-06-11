
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
import { User, Calendar, Clock, Award } from 'lucide-react';
import { ScheduleUser, LeaveRequest } from '@/types/schedule';
import { toast } from '@/hooks/use-toast';
import { userBalancesTable, leaveRequestsTable } from '@/integrations/supabase/tables/schedule';
import { format } from 'date-fns';

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
      const balanceData = await userBalancesTable.getByUserId(user.id);
      const userBalance = balanceData?.balance || user.balance || 80;
      setBalance(userBalance);
      setOriginalBalance(userBalance);

      // Load request history
      const requests = await leaveRequestsTable.getAllForUser(user.id);
      setRequestHistory(requests);
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
      await userBalancesTable.upsert(user.id, balance);
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
      <DialogContent className="sm:max-w-[500px]">
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
                            {request.leave_type.replace('-', ' ')}
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

            <div className="flex justify-end">
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
