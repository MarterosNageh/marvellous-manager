
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
} from '@/components/ui';
import { format } from 'date-fns';
import { Plus, Clock, User } from 'lucide-react';
import { LeaveRequest, ShiftSwapRequest, RequestStatus, ScheduleUser } from '@/types/schedule';
import { leaveRequestsTable, swapRequestsTable } from '@/integrations/supabase/tables/schedule';
import { ShiftRequestDialog } from '@/components/shifts/ShiftRequestDialog';

const statusColors: Record<RequestStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  approved: 'bg-green-100 text-green-800 border-green-200',
  rejected: 'bg-red-100 text-red-800 border-red-200'
};

interface RequestsViewProps {
  users: ScheduleUser[];
}

export default function RequestsView({ users }: RequestsViewProps) {
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [swapRequests, setSwapRequests] = useState<ShiftSwapRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('leave');
  const [selectedStatus, setSelectedStatus] = useState<RequestStatus | 'all'>('all');
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const { toast } = useToast();
  const { currentUser } = useAuth();
  const canManageRequests = currentUser?.role === 'admin' || currentUser?.role === 'senior';

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

  const filteredLeaveRequests = selectedStatus === 'all'
    ? leaveRequests
    : leaveRequests.filter(req => req.status === selectedStatus);

  const filteredSwapRequests = selectedStatus === 'all'
    ? swapRequests
    : swapRequests.filter(req => req.status === selectedStatus);

  const getApprovedHours = (userId: string) => {
    const userLeaveRequests = leaveRequests.filter(req => 
      req.user_id === userId && req.status === 'approved'
    );
    
    return userLeaveRequests.reduce((total, req) => {
      const start = new Date(req.start_date);
      const end = new Date(req.end_date);
      const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      return total + (days * 8); // Assuming 8 hours per day
    }, 0);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  const renderTimeOffSummary = () => (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Approved Time off
        </h3>
        <Button 
          onClick={() => setShowRequestDialog(true)}
          className="bg-blue-500 hover:bg-blue-600"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add time off
        </Button>
      </div>
      
      <div className="grid gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm text-gray-500 border-b pb-2">
                <span>User name</span>
                <span>Approved</span>
                <span>Remaining balance</span>
              </div>
              
              {users.map(user => {
                const approvedHours = getApprovedHours(user.id);
                return (
                  <div key={user.id} className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-medium">
                        {user.username.substring(0, 2).toUpperCase()}
                      </div>
                      <span className="font-medium">{user.username}</span>
                    </div>
                    <span className="text-sm">{approvedHours}.00 hrs</span>
                    <span className="text-sm text-gray-500">Unlimited</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

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
            <Badge className={statusColors[request.status as RequestStatus]}>
              {request.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-4">{request.reason}</p>
          {canManageRequests && request.status === 'pending' && (
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
          {canManageRequests && request.status === 'pending' && (
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
    <div className="space-y-6">
      {renderTimeOffSummary()}
      
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Requests</h2>
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

      {showRequestDialog && (
        <ShiftRequestDialog
          open={showRequestDialog}
          onOpenChange={setShowRequestDialog}
        />
      )}
    </div>
  );
}
