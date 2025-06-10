import React, { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { useSchedule } from '@/context/ScheduleContext';
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
import { Plus, Clock, User, Edit, Eye, Users, Trash2, AlertCircle } from 'lucide-react';
import { LeaveRequest, SwapRequest, RequestStatus, ScheduleUser, Shift, LeaveType, AnyRequest } from '@/types/schedule';
import { leaveRequestsTable, swapRequestsTable, shiftsTable } from '@/integrations/supabase/tables/schedule';
import { ShiftRequestDialog } from '@/components/shifts/ShiftRequestDialog';
import { supabase } from '@/integrations/supabase/client';

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  pending_user: 'bg-blue-100 text-blue-800 border-blue-200',
  pending_admin: 'bg-purple-100 text-purple-800 border-purple-200',
  approved: 'bg-green-100 text-green-800 border-green-200',
  rejected: 'bg-red-100 text-red-800 border-red-200'
};

const leaveTypeColors = {
  'paid': 'bg-blue-50',
  'unpaid': 'bg-orange-50',
  'day-off': 'bg-purple-50',
  'extra': 'bg-green-50',
  'public-holiday': 'bg-red-50'
};

interface RequestsViewProps {
  users: ScheduleUser[];
  onRequestsUpdate?: (leaveRequests: LeaveRequest[], swapRequests: SwapRequest[]) => void;
}

interface UserBalanceDialog {
  open: boolean;
  user: ScheduleUser | null;
  balance: number;
}

interface UserDetailsDialogState {
  open: boolean;
  user: ScheduleUser | null;
  requests: AnyRequest[];
  balance: number;
}

type LeaveRequestWithType = LeaveRequest & { request_type: 'leave'; type: 'leave' };
type SwapRequestWithType = SwapRequest & { request_type: 'swap'; type: 'swap' };

interface DBRequest {
  id: string;
  user_id: string;
  request_type: 'leave' | 'swap';
  start_date: string;
  end_date: string;
  reason: string;
  status: RequestStatus;
  reviewer_id?: string;
  review_notes?: string;
  replacement_user_id?: string;
  shift_id?: string;
  proposed_shift_id?: string;
  leave_type?: LeaveType;
  created_at: string;
  updated_at: string;
}

const mapToLeaveRequest = (dbRequest: DBRequest): LeaveRequest => ({
  id: dbRequest.id,
  type: 'leave',
  user_id: dbRequest.user_id,
  leave_type: dbRequest.leave_type || 'paid',
  start_date: dbRequest.start_date,
  end_date: dbRequest.end_date,
  reason: dbRequest.reason,
  status: dbRequest.status,
  notes: dbRequest.review_notes,
  reviewer_id: dbRequest.reviewer_id,
  created_at: dbRequest.created_at,
  updated_at: dbRequest.updated_at,
});

const mapToSwapRequest = (dbRequest: DBRequest): SwapRequest => ({
  id: dbRequest.id,
  type: 'swap',
  user_id: dbRequest.user_id,
  shift_id: dbRequest.shift_id || '',
  proposed_shift_id: dbRequest.proposed_shift_id,
  requester_id: dbRequest.user_id,
  requested_user_id: dbRequest.replacement_user_id || '',
  status: dbRequest.status,
  notes: dbRequest.review_notes,
  reviewer_id: dbRequest.reviewer_id,
  created_at: dbRequest.created_at,
  updated_at: dbRequest.updated_at,
});

const RequestsView = ({ users, onRequestsUpdate }: RequestsViewProps) => {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [swapRequests, setSwapRequests] = useState<SwapRequest[]>([]);
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
  const [userDetailsDialog, setUserDetailsDialog] = useState<UserDetailsDialogState>({
    open: false,
    user: null,
    requests: [],
    balance: 0,
  });
  const [deleteConfirmDialog, setDeleteConfirmDialog] = useState<{
    open: boolean;
    request: AnyRequest | null;
    type: 'leave' | 'swap';
  }>({
    open: false,
    request: null,
    type: 'leave',
  });
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        setLoading(true);
        const [leaveData, swapData] = await Promise.all([
          supabase
            .from('shift_requests')
            .select('*')
            .eq('request_type', 'leave')
            .order('created_at', { ascending: false }),
          supabase
            .from('shift_requests')
            .select('*')
            .eq('request_type', 'swap')
            .order('created_at', { ascending: false })
        ]);

        if (leaveData.error) throw leaveData.error;
        if (swapData.error) throw swapData.error;

        const mappedLeaveRequests = (leaveData.data as DBRequest[]).map(mapToLeaveRequest);
        const mappedSwapRequests = (swapData.data as DBRequest[]).map(mapToSwapRequest);

        setLeaveRequests(mappedLeaveRequests);
        setSwapRequests(mappedSwapRequests);

        // Calculate pending count
        const pendingCount = [
          ...mappedLeaveRequests,
          ...mappedSwapRequests
        ].filter(req => req.status === 'pending').length;
        setPendingRequestsCount(pendingCount);
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
        table: 'shift_requests',
        filter: 'request_type=eq.leave'
      }, () => {
        fetchRequests(); // Refresh data on any change
      })
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'shift_requests',
        filter: 'request_type=eq.swap'
      }, () => {
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
          req.id === requestId ? {
            ...req,
            status: newStatus,
            type: 'leave',
          } : req
        ));

        // If approved, update the shifts view
        if (newStatus === 'approved') {
          const request = leaveRequests.find(req => req.id === requestId);
          if (request) {
            // Create a shift for the approved leave request
            const shift: Omit<Shift, 'id'> = {
              user_id: request.user_id,
              shift_type: request.leave_type === 'public-holiday' ? 'public-holiday' : 'day-off',
              start_time: request.start_date,
              end_time: request.end_date,
              title: request.leave_type === 'public-holiday' ? 'Public Holiday' : 'Day Off',
              description: request.reason,
              notes: request.notes || '',
              status: 'active',
              created_by: currentUser?.id || '',
              repeat_days: [],
            };
            await shiftsTable.create(shift);
          }
        }
      } else {
        await swapRequestsTable.updateStatus(requestId, newStatus);
        setSwapRequests(prev => prev.map(req => 
          req.id === requestId ? {
            ...req,
            status: newStatus,
            type: 'swap',
          } : req
        ));
      }

      // Update the pending requests count
      onRequestsUpdate?.(leaveRequests, swapRequests);

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

  const handleDeleteRequest = async (request: AnyRequest, type: 'leave' | 'swap') => {
    try {
      if (type === 'leave') {
        await leaveRequestsTable.delete(request.id);
        setLeaveRequests(prev => prev.filter(r => r.id !== request.id));
      } else {
        await swapRequestsTable.delete(request.id);
        setSwapRequests(prev => prev.filter(r => r.id !== request.id));
      }

      // Update the pending requests count
      onRequestsUpdate?.(leaveRequests, swapRequests);

      toast({
        title: "Request deleted",
        description: "The request has been deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting request:', error);
      toast({
        title: "Error deleting request",
        description: "Please try again later",
        variant: "destructive",
      });
    }
  };

  const HOURS_PER_DAY = 8; // Standard work day hours

  const convertHoursToDays = (hours: number) => {
    return Math.round((hours / HOURS_PER_DAY) * 10) / 10; // Round to 1 decimal place
  };

  const handleUserClick = async (user: ScheduleUser) => {
    try {
      // Get all requests for this user
      const [leaveData, swapData] = await Promise.all([
        leaveRequestsTable.getAllForUser(user.id),
        swapRequestsTable.getAllForUser(user.id)
      ]);

      const balance = await getRemainingBalance(user.id);
      
      setUserDetailsDialog({
        open: true,
        user,
        requests: [...leaveData, ...swapData].sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        ),
        balance
      });
    } catch (error) {
      console.error('Error fetching user details:', error);
      toast({
        title: "Error",
        description: "Failed to load user details",
        variant: "destructive",
      });
    }
  };

  const handleEditRequest = (request: LeaveRequest | SwapRequest) => {
    if ('requester_id' in request) {
      // Handle swap request editing
      setEditingRequest({
        id: request.id,
        user_id: request.requester_id,
        leave_type: 'day-off',
        start_date: new Date().toISOString(),
        end_date: new Date().toISOString(),
        reason: request.notes || '',
        status: request.status as RequestStatus,
        created_at: request.created_at,
        updated_at: request.updated_at,
        type: 'leave'
      });
    } else {
      // Handle leave request editing
      setEditingRequest(request);
    }
  };

  const handleSaveEdit = async (updatedRequest: any) => {
    try {
      if (editingRequest) {
        if ('requester_id' in editingRequest) {
          // Update swap request
          await swapRequestsTable.updateStatus(editingRequest.id, updatedRequest.status);
          setSwapRequests(prev => prev.map(req => 
            req.id === editingRequest.id ? { ...req, ...updatedRequest } : req
          ));
        } else {
          // Update leave request
          await leaveRequestsTable.updateStatus(editingRequest.id, updatedRequest.status);
          setLeaveRequests(prev => prev.map(req => 
            req.id === editingRequest.id ? { ...req, ...updatedRequest } : req
          ));
        }
        setEditingRequest(null);
        toast({
          title: "Success",
          description: "Request updated successfully",
        });
      }
    } catch (error) {
      console.error('Error updating request:', error);
      toast({
        title: "Error",
        description: "Failed to update request",
        variant: "destructive",
      });
    }
  };

  const filteredLeaveRequests = selectedStatus === 'all' ? leaveRequests : leaveRequests.filter(req => req.status === selectedStatus);
  const filteredSwapRequests = selectedStatus === 'all' ? swapRequests : swapRequests.filter(req => req.status === selectedStatus);

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

  // Render all requests in one view
  const allRequests = [...leaveRequests, ...swapRequests].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const renderRequest = (request: AnyRequest) => {
    const user = users.find(u => u.id === request.user_id);
    const isLeaveRequest = request.type === 'leave';

    return (
      <div key={request.id} className="border rounded-lg p-4 hover:bg-accent">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {isLeaveRequest ? (
              <Clock className="h-4 w-4" />
            ) : (
              <Users className="h-4 w-4" />
            )}
            <span className="font-medium">
              {user?.username || 'Unknown User'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {currentUser?.role === 'admin' && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleEditRequest(request)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() =>
                    setDeleteConfirmDialog({
                      open: true,
                      request,
                      type: isLeaveRequest ? 'leave' : 'swap',
                    })
                  }
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </>
            )}
            <Badge className={statusColors[request.status]}>
              {request.status}
            </Badge>
          </div>
        </div>
        <div className="text-sm space-y-1">
          {isLeaveRequest ? (
            <>
              <p>
                <span className="font-medium">Period:</span>{' '}
                {format(new Date(request.start_date), 'PPP')} -{' '}
                {format(new Date(request.end_date), 'PPP')}
              </p>
              <p>
                <span className="font-medium">Type:</span>{' '}
                {request.leave_type}
              </p>
              <p>
                <span className="font-medium">Reason:</span>{' '}
                {request.reason}
              </p>
            </>
          ) : (
            <>
              <p>
                <span className="font-medium">Shift ID:</span>{' '}
                {request.shift_id}
              </p>
              {request.proposed_shift_id && (
                <p>
                  <span className="font-medium">Proposed Shift:</span>{' '}
                  {request.proposed_shift_id}
                </p>
              )}
            </>
          )}
          {request.notes && (
            <p>
              <span className="font-medium">Notes:</span> {request.notes}
            </p>
          )}
        </div>
      </div>
    );
  };

  const userRequests = currentUser?.role === 'admin' 
    ? { leaveRequests, swapRequests }
    : {
        leaveRequests: leaveRequests.filter(req => req.user_id === currentUser?.id),
        swapRequests: swapRequests.filter(req => req.user_id === currentUser?.id)
      };

  return (
    <Card>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold">Requests</h2>
          {currentUser?.role === 'admin' && (
            <Button onClick={() => {}}>
              <Plus className="h-4 w-4 mr-1" />
              New Request
            </Button>
          )}
        </div>

        <Tabs defaultValue="leave">
          <TabsList>
            <TabsTrigger value="leave">Leave Requests</TabsTrigger>
            <TabsTrigger value="swap">Swap Requests</TabsTrigger>
          </TabsList>

          <TabsContent value="leave" className="mt-4">
            {userRequests.leaveRequests.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">No leave requests found</p>
            ) : (
              <div className="space-y-4">
                {userRequests.leaveRequests.map(request => (
                  <Card key={request.id} className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{request.leave_type} Leave</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(request.start_date).toLocaleDateString()} - {new Date(request.end_date).toLocaleDateString()}
                        </p>
                        {request.notes && (
                          <p className="text-sm mt-2">{request.notes}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <span className={`inline-block px-2 py-1 rounded text-xs ${
                          request.status === 'approved' ? 'bg-green-100 text-green-800' :
                          request.status === 'rejected' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {request.status}
                        </span>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="swap" className="mt-4">
            {userRequests.swapRequests.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">No swap requests found</p>
            ) : (
              <div className="space-y-4">
                {userRequests.swapRequests.map(request => (
                  <Card key={request.id} className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">Shift Swap Request</p>
                        <p className="text-sm text-muted-foreground">
                          With: {request.requested_user_id}
                        </p>
                        {request.notes && (
                          <p className="text-sm mt-2">{request.notes}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <span className={`inline-block px-2 py-1 rounded text-xs ${
                          request.status === 'approved' ? 'bg-green-100 text-green-800' :
                          request.status === 'rejected' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {request.status}
                        </span>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Card>
  );
};

export default RequestsView;
