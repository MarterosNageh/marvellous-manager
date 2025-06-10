
import React, { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Input,
  Label,
} from '@/components/ui';
import { format } from 'date-fns';
import { Plus, Clock, User, Edit, Eye, Users } from 'lucide-react';
import { LeaveRequest, ShiftSwapRequest, RequestStatus, ScheduleUser } from '@/types/schedule';
import { leaveRequestsTable, swapRequestsTable } from '@/integrations/supabase/tables/schedule';
import { ShiftRequestDialog } from '@/components/shifts/ShiftRequestDialog';
import { supabase } from '@/integrations/supabase/client';

const statusColors: Record<RequestStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  approved: 'bg-green-100 text-green-800 border-green-200',
  rejected: 'bg-red-100 text-red-800 border-red-200'
};

interface RequestsViewProps {
  users: ScheduleUser[];
}

interface UserBalanceDialog {
  open: boolean;
  user: ScheduleUser | null;
  balance: number;
}

export default function RequestsView({ users }: RequestsViewProps) {
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [swapRequests, setSwapRequests] = useState<ShiftSwapRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('leave');
  const [selectedStatus, setSelectedStatus] = useState<RequestStatus | 'all'>('all');
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const [editingRequest, setEditingRequest] = useState<LeaveRequest | null>(null);
  const [userBalanceDialog, setUserBalanceDialog] = useState<UserBalanceDialog>({
    open: false,
    user: null,
    balance: 0
  });
  const [userBalances, setUserBalances] = useState<Record<string, number>>({});
  const { toast } = useToast();
  const { currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'senior';

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        setLoading(true);
        const [leaveData, swapData] = await Promise.all([
          leaveRequestsTable.getAll(),
          swapRequestsTable.getAll()
        ]);
        setLeaveRequests(leaveData);
        setSwapRequests(swapData);
      } catch (error) {
        console.error('Error fetching requests:', error);
        toast({
          title: "Error loading requests",
          description: "Please try again later",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();

    // Set up realtime subscriptions
    const channel = supabase
      .channel('requests-changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'shift_requests' 
      }, (payload) => {
        console.log('Realtime request change:', payload);
        fetchRequests(); // Refresh data on any change
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [toast]);

  const handleStatusChange = async (requestId: string, newStatus: RequestStatus, type: 'leave' | 'swap') => {
    try {
      if (type === 'leave') {
        await leaveRequestsTable.updateStatus(requestId, newStatus);
        setLeaveRequests(prev => prev.map(req => 
          req.id === requestId ? { ...req, status: newStatus } : req
        ));
      } else {
        await swapRequestsTable.updateStatus(requestId, newStatus);
        setSwapRequests(prev => prev.map(req => 
          req.id === requestId ? { ...req, status: newStatus } : req
        ));
      }

      toast({
        title: "Status updated",
        description: `Request has been ${newStatus}`,
      });
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: "Error updating status",
        description: "Please try again later",
        variant: "destructive",
      });
    }
  };

  const handleUpdateBalance = async (userId: string, newBalance: number) => {
    try {
      // Update user balance in database (assuming a user_balances table exists)
      setUserBalances(prev => ({ ...prev, [userId]: newBalance }));
      
      toast({
        title: "Balance updated",
        description: "User balance has been updated successfully",
      });
      
      setUserBalanceDialog({ open: false, user: null, balance: 0 });
    } catch (error) {
      console.error('Error updating balance:', error);
      toast({
        title: "Error updating balance",
        description: "Please try again later",
        variant: "destructive",
      });
    }
  };

  const filteredLeaveRequests = isAdmin 
    ? (selectedStatus === 'all' ? leaveRequests : leaveRequests.filter(req => req.status === selectedStatus))
    : leaveRequests.filter(req => req.user_id === currentUser?.id && (selectedStatus === 'all' || req.status === selectedStatus));

  const filteredSwapRequests = isAdmin
    ? (selectedStatus === 'all' ? swapRequests : swapRequests.filter(req => req.status === selectedStatus))
    : swapRequests.filter(req => req.requester_id === currentUser?.id && (selectedStatus === 'all' || req.status === selectedStatus));

  const getApprovedHours = (userId: string) => {
    const userLeaveRequests = leaveRequests.filter(req => 
      req.user_id === userId && req.status === 'approved'
    );
    
    return userLeaveRequests.reduce((total, req) => {
      const start = new Date(req.start_date);
      const end = new Date(req.end_date);
      const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      return total + (days * 8); // Assuming 8 hours per day
    }, 0);
  };

  const getRemainingBalance = (userId: string) => {
    const approvedHours = getApprovedHours(userId);
    const userBalance = userBalances[userId] || 80; // Default 80 hours
    return Math.max(0, userBalance - approvedHours);
  };

  const pendingRequestsCount = filteredLeaveRequests.filter(req => req.status === 'pending').length + 
                              filteredSwapRequests.filter(req => req.status === 'pending').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  const renderLeaveRequest = (request: LeaveRequest) => {
    const user = users.find(u => u.id === request.user_id);
    return (
      <Card key={request.id} className="mb-4">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-4 w-4" />
                {user?.username || 'Unknown User'}
              </CardTitle>
              <div className="text-sm text-gray-500">
                {format(new Date(request.start_date), 'MMM d, yyyy')} -{' '}
                {format(new Date(request.end_date), 'MMM d, yyyy')}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={statusColors[request.status as RequestStatus]}>
                {request.status}
              </Badge>
              {isAdmin && request.status === 'approved' && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setEditingRequest(request)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-4">{request.reason}</p>
          {isAdmin && request.status === 'pending' && (
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="text-green-600 hover:text-green-700 border-green-200 hover:border-green-300"
                onClick={() => handleStatusChange(request.id, 'approved', 'leave')}
              >
                Approve
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
                onClick={() => handleStatusChange(request.id, 'rejected', 'leave')}
              >
                Reject
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderSwapRequest = (request: ShiftSwapRequest) => {
    const requester = users.find(u => u.id === request.requester_id);
    const targetUser = users.find(u => u.id === request.requested_user_id);

    return (
      <Card key={request.id} className="mb-4">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">
                {requester?.username || 'Unknown'} → {targetUser?.username || 'Unknown'}
              </CardTitle>
              <div className="text-sm text-gray-500">
                Shift Swap Request
              </div>
            </div>
            <Badge className={statusColors[request.status as RequestStatus]}>
              {request.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {request.notes && (
            <p className="text-sm text-gray-600 mb-4">{request.notes}</p>
          )}
          {isAdmin && request.status === 'pending' && (
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="text-green-600 hover:text-green-700 border-green-200 hover:border-green-300"
                onClick={() => handleStatusChange(request.id, 'approved', 'swap')}
              >
                Approve
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
                onClick={() => handleStatusChange(request.id, 'rejected', 'swap')}
              >
                Reject
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left Column - Approved Time Off */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Approved Time Off
          </h3>
          <Button 
            onClick={() => setShowRequestDialog(true)}
            className="bg-blue-500 hover:bg-blue-600"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Time Off
          </Button>
        </div>
        
        <Card>
          <CardContent className="p-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm text-gray-500 border-b pb-2">
                <span>User name</span>
                <span>Approved</span>
                <span>Remaining</span>
              </div>
              
              {users.map(user => {
                const approvedHours = getApprovedHours(user.id);
                const remainingHours = getRemainingBalance(user.id);
                return (
                  <div 
                    key={user.id} 
                    className="flex items-center justify-between py-2 cursor-pointer hover:bg-gray-50 rounded px-2"
                    onClick={() => isAdmin && setUserBalanceDialog({
                      open: true,
                      user,
                      balance: userBalances[user.id] || 80
                    })}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-medium">
                        {user.username.substring(0, 2).toUpperCase()}
                      </div>
                      <span className="font-medium">{user.username}</span>
                    </div>
                    <span className="text-sm">{approvedHours}.00 hrs</span>
                    <span className="text-sm text-gray-500">{remainingHours}.00 hrs</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right Column - Requests */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            Requests
            {pendingRequestsCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {pendingRequestsCount}
              </Badge>
            )}
          </h2>
          {isAdmin && (
            <Select value={selectedStatus} onValueChange={(value) => setSelectedStatus(value as RequestStatus | 'all')}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>

        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList>
            <TabsTrigger value="leave">Leave Requests</TabsTrigger>
            <TabsTrigger value="swap">Shift Swap Requests</TabsTrigger>
          </TabsList>
          <TabsContent value="leave" className="mt-4">
            {filteredLeaveRequests.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No leave requests found</p>
            ) : (
              filteredLeaveRequests.map(renderLeaveRequest)
            )}
          </TabsContent>
          <TabsContent value="swap" className="mt-4">
            {filteredSwapRequests.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No shift swap requests found</p>
            ) : (
              filteredSwapRequests.map(renderSwapRequest)
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialogs */}
      {showRequestDialog && (
        <ShiftRequestDialog
          open={showRequestDialog}
          onOpenChange={setShowRequestDialog}
          users={isAdmin ? users : undefined}
        />
      )}

      {/* User Balance Dialog */}
      <Dialog 
        open={userBalanceDialog.open} 
        onOpenChange={(open) => setUserBalanceDialog(prev => ({ ...prev, open }))}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Edit Balance - {userBalanceDialog.user?.username}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="balance">Remaining Balance (hours)</Label>
              <Input
                id="balance"
                type="number"
                value={userBalanceDialog.balance}
                onChange={(e) => setUserBalanceDialog(prev => ({
                  ...prev,
                  balance: parseInt(e.target.value) || 0
                }))}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button 
                variant="outline"
                onClick={() => setUserBalanceDialog({ open: false, user: null, balance: 0 })}
              >
                Cancel
              </Button>
              <Button
                onClick={() => userBalanceDialog.user && handleUpdateBalance(
                  userBalanceDialog.user.id, 
                  userBalanceDialog.balance
                )}
              >
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Request Dialog */}
      {editingRequest && (
        <ShiftRequestDialog
          open={!!editingRequest}
          onOpenChange={(open) => !open && setEditingRequest(null)}
          initialData={{
            request_type: 'time_off',
            start_date: editingRequest.start_date,
            end_date: editingRequest.end_date,
            reason: editingRequest.reason,
            user_id: editingRequest.user_id
          }}
          users={isAdmin ? users : undefined}
        />
      )}
    </div>
  );
}
