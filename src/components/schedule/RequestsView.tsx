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
import { format, startOfWeek, endOfWeek } from 'date-fns';
import { Checkbox } from '@/components/ui/checkbox';
import { LeaveRequest, ShiftSwapRequest, RequestStatus, ScheduleUser } from '@/types/schedule';
import { leaveRequestsTable, swapRequestsTable } from '@/integrations/supabase/tables';

const statusColors: Record<RequestStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800'
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
              <CardTitle className="text-base">
                {user?.username || 'Unknown User'}
              </CardTitle>
              <div className="text-sm text-gray-500">
                {format(new Date(request.start_date), 'MMM d, yyyy')} -{' '}
                {format(new Date(request.end_date), 'MMM d, yyyy')}
              </div>
            </div>
            <Badge className={statusColors[request.status]}>
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
                className="text-green-600 hover:text-green-700"
                onClick={() => handleStatusChange(request.id, 'approved', 'leave')}
              >
                Approve
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="text-red-600 hover:text-red-700"
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
    const requester = users.find(u => u.id === request.user_id);
    const targetUser = users.find(u => u.id === request.replacement_user_id);

    return (
      <Card key={request.id} className="mb-4">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">
                {requester?.username || 'Unknown'} → {targetUser?.username || 'Unknown'}
              </CardTitle>
              <div className="text-sm text-gray-500">
                Shift: {format(new Date(request.shift?.start_time || ''), 'MMM d, yyyy HH:mm')}
              </div>
            </div>
            <Badge className={statusColors[request.status]}>
              {request.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {request.comment && (
            <p className="text-sm text-gray-600 mb-4">{request.comment}</p>
          )}
          {canManageRequests && request.status === 'pending' && (
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="text-green-600 hover:text-green-700"
                onClick={() => handleStatusChange(request.id, 'approved', 'swap')}
              >
                Approve
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="text-red-600 hover:text-red-700"
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
    <div className="space-y-4">
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
    </div>
  );
} 