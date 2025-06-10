import React, { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { useSchedule } from '@/context/ScheduleContext';
import { useShifts } from '@/context/ShiftsContext';
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
import {
  LeaveRequest,
  SwapRequest,
  SwapRequestDB,
  RequestStatus,
  ScheduleUser,
  Shift,
  LeaveType,
  AnyRequest,
  DisplayRequest,
  RequestToDisplay,
  SwapRequestDBToRequest,
} from '@/types/schedule';
import { leaveRequestsTable, swapRequestsTable, shiftsTable } from '@/integrations/supabase/tables/schedule';
import { ShiftRequestDialog } from '@/components/shifts/ShiftRequestDialog';
import { supabase } from '@/integrations/supabase/client';
import { getShiftColorByLeaveType, getShiftTitleByLeaveType } from '@/lib/utils';

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

interface AuthUser {
  id: string;
  username: string;
  is_admin: boolean;
  balance: number;
  role?: string;
  title?: string;
  team_name?: string;
  department?: string;
}

interface BaseRequest {
  id: string;
  user_id: string;
  status: RequestStatus;
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
  const { createShiftRequest } = useShifts();
  const [loading, setLoading] = useState(true);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [swapRequests, setSwapRequests] = useState<SwapRequest[]>([]);
  const [selectedTab, setSelectedTab] = useState('leave');
  const [selectedStatus, setSelectedStatus] = useState<RequestStatus | 'all'>('all');
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const [editingRequest, setEditingRequest] = useState<LeaveRequest | null>(null);
  const [userBalances, setUserBalances] = useState<{ [key: string]: number }>({});
  const [userBalanceDialog, setUserBalanceDialog] = useState<UserBalanceDialog>({
    open: false,
    user: null,
    balance: 0
  });
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
  const [pendingCount, setPendingCount] = useState(0);
  const isAdmin = currentUser?.role === 'admin';

  // Constants for time calculations
  const HOURS_PER_DAY = 8;

  const convertHoursToDays = (hours: number) => {
    return Math.round((hours / HOURS_PER_DAY) * 10) / 10; // Round to 1 decimal place
  };

  const convertDaysToHours = (days: number) => {
    return days * HOURS_PER_DAY;
  };

  const getApprovedDays = (userId: string) => {
    const userLeaveRequests = leaveRequests.filter(req => 
      req.user_id === userId && req.status === 'approved'
    );
    
    return userLeaveRequests.reduce((total, req) => {
      const start = new Date(req.start_date);
      const end = new Date(req.end_date);
      const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      return total + days;
    }, 0);
  };

  const getRemainingDays = (userId: string) => {
    const approvedDays = getApprovedDays(userId);
    const userBalanceDays = convertHoursToDays(userBalances[userId] || 80); // Convert default 80 hours to days
    return Math.max(0, userBalanceDays - approvedDays);
  };

  // Fetch initial balances and set up real-time subscription
  useEffect(() => {
    // Initial fetch of balances
    const fetchBalances = async () => {
      const { data, error } = await supabase
        .from('auth_users')
        .select('id, balance')
        .returns<Pick<AuthUser, 'id' | 'balance'>[]>();
      
      if (error) {
        console.error('Error fetching balances:', error);
        return;
      }

      const balances = data.reduce((acc, user) => ({
        ...acc,
        [user.id]: user.balance ?? 80
      }), {} as { [key: string]: number });

      setUserBalances(balances);
    };

    fetchBalances();

    // Set up real-time subscription for balance updates
    const balanceSubscription = supabase
      .channel('balance_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'auth_users',
          filter: 'balance=neq.null'
        },
        (payload: { new: Partial<AuthUser> }) => {
          if (payload.new?.id && typeof payload.new.balance === 'number') {
            setUserBalances(prev => ({
              ...prev,
              [payload.new.id!]: payload.new.balance!
            }));
          }
        }
      )
      .subscribe();

    return () => {
      balanceSubscription.unsubscribe();
    };
  }, []);

  const handleUpdateBalance = async (userId: string, newBalance: number) => {
    const { error } = await supabase
      .from('auth_users')
      .update({ balance: newBalance } as Partial<AuthUser>)
      .eq('id', userId);

    if (error) {
      console.error('Error updating balance:', error);
      return;
    }

    setUserBalanceDialog({ open: false, user: null, balance: 0 });
  };

  const refreshRequests = async () => {
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
      onRequestsUpdate?.(mappedLeaveRequests, mappedSwapRequests);

        // Calculate pending count
        const pendingCount = [
          ...mappedLeaveRequests,
          ...mappedSwapRequests
        ].filter(req => req.status === 'pending').length;
      setPendingCount(pendingCount);
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

  useEffect(() => {
    refreshRequests();

    // Set up real-time subscription for requests
    const channel = supabase.channel('requests-changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'shift_requests',
      }, () => {
        refreshRequests();
        updatePendingCount();
      })
      .subscribe();

    // Initial pending count
    updatePendingCount();

    return () => {
      channel.unsubscribe();
    };
  }, []);

  const updatePendingCount = async () => {
    const [leaveCount, swapCount] = await Promise.all([
      leaveRequestsTable.count({ status: 'pending' }),
      swapRequestsTable.count({ status: 'pending' }),
    ]);
    setPendingCount(leaveCount + swapCount);
  };

  const handleDeleteRequest = async (request: AnyRequest) => {
    try {
      await supabase
        .from('shift_requests')
        .delete()
        .eq('id', request.id);

      toast({
        title: "Request deleted",
        description: "The request has been deleted successfully",
      });

      refreshRequests();
    } catch (error) {
      console.error('Error deleting request:', error);
      toast({
        title: "Error deleting request",
        description: "Please try again later",
        variant: "destructive",
      });
    }
  };

  const handleStatusChange = async (request: LeaveRequest | SwapRequest, newStatus: RequestStatus) => {
    try {
      const updateData = {
        status: newStatus,
        reviewer_id: currentUser?.id,
      };

      await supabase
        .from('shift_requests')
        .update(updateData)
        .eq('id', request.id);

      if (newStatus === 'approved') {
        if (request.type === 'leave') {
          const shiftData = {
            user_id: request.user_id,
            shift_type: request.leave_type === 'public-holiday' ? 'public-holiday' : 'day-off',
            start_time: `${request.start_date}T00:00:00`,
            end_time: `${request.end_date}T23:59:59`,
            title: getShiftTitleByLeaveType(request.leave_type),
            description: request.reason || '',
            notes: '',
            status: 'active',
            created_by: currentUser?.id || '',
            color: getShiftColorByLeaveType(request.leave_type),
            repeat_days: [],
            is_all_day: true,
          };

          await supabase.from('shifts').insert([shiftData]);
        } else {
          await supabase
            .from('shifts')
            .update({
              user_id: request.requested_user_id,
              color: '#4CAF50',
              notes: `Swapped with ${users.find(u => u.id === request.user_id)?.username}`,
            })
            .eq('id', request.shift_id);

          if (request.proposed_shift_id) {
            await supabase
              .from('shifts')
              .update({
                user_id: request.user_id,
                color: '#4CAF50',
                notes: `Swapped with ${users.find(u => u.id === request.requested_user_id)?.username}`,
              })
              .eq('id', request.proposed_shift_id);
          }
        }
      }

      toast({
        title: `Request ${newStatus}`,
        description: `The request has been ${newStatus}`,
      });

      refreshRequests();
    } catch (error) {
      console.error('Error updating request status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update request status',
        variant: 'destructive',
      });
    }
  };

  const handleUserClick = async (user: ScheduleUser) => {
    try {
      // Get all requests for this user
      const [leaveData, swapData] = await Promise.all([
        leaveRequestsTable.getAllForUser(user.id),
        swapRequestsTable.getAllForUser(user.id)
      ]);

      const balance = await getRemainingDays(user.id);
      
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

  const handleEditRequest = (request: DisplayRequest) => {
    if (request.originalRequest.type === 'leave') {
      setEditingRequest(request.originalRequest);
    } else {
      // Convert swap request to leave request format for editing
      const swapRequest = request.originalRequest;
      const leaveRequest: LeaveRequest = {
        id: swapRequest.id,
        user_id: swapRequest.user_id,
        type: 'leave',
        leave_type: 'day-off',
        start_date: swapRequest.start_date,
        end_date: swapRequest.end_date,
        reason: swapRequest.notes,
        status: swapRequest.status,
        created_at: swapRequest.created_at,
        updated_at: swapRequest.updated_at,
      };
      setEditingRequest(leaveRequest);
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

  // Transform requests for display
  const allRequests = [
    ...leaveRequests.map((req: LeaveRequest) => ({
      id: req.id,
      user_id: req.user_id,
      type: 'leave' as const,
      status: req.status,
      created_at: req.created_at,
      updated_at: req.updated_at,
      displayStartDate: req.start_date,
      displayEndDate: req.end_date,
      displayReason: req.reason,
      leave_type: req.leave_type,
      originalRequest: req,
    })),
    ...swapRequests.map((req: SwapRequestDB) => {
      const start_date = req.shift?.start_time || req.start_date || '';
      const end_date = req.shift?.end_time || req.end_date || '';
      const swapRequest: SwapRequest = {
        id: req.id,
        user_id: req.user_id,
        type: 'swap',
        status: req.status,
        start_date,
        end_date,
        notes: req.notes || '',
        requester_id: req.requester_id,
        requested_user_id: req.requested_user_id,
        shift_id: req.shift_id,
        proposed_shift_id: req.proposed_shift_id,
        created_at: req.created_at,
        updated_at: req.updated_at,
        reviewer_id: req.reviewer_id,
      };

      return {
        id: req.id,
        user_id: req.user_id,
        type: 'swap' as const,
        status: req.status,
        created_at: req.created_at,
        updated_at: req.updated_at,
        displayStartDate: start_date,
        displayEndDate: end_date,
        displayReason: req.notes || '',
        originalRequest: swapRequest,
      };
    })
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const renderRequest = (request: DisplayRequest) => {
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
                <Button
                  variant="ghost"
                  size="icon"
                onClick={() => handleDeleteRequest(request.originalRequest)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
            )}
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge
              variant={
                request.status === 'approved'
                  ? 'success'
                  : request.status === 'rejected'
                  ? 'destructive'
                  : 'default'
              }
            >
              {request.status}
            </Badge>
            {request.type === 'leave' && (
              <Badge variant="outline">{request.leave_type}</Badge>
            )}
          </div>
          <div className="text-sm text-muted-foreground">
              <p>
                <span className="font-medium">Period:</span>{' '}
              {format(new Date(request.displayStartDate), 'PPP')} -{' '}
              {format(new Date(request.displayEndDate), 'PPP')}
              </p>
              <p>
                <span className="font-medium">Reason:</span>{' '}
              {request.displayReason}
              </p>
          </div>
          {request.status === 'pending' && currentUser?.role === 'admin' && (
            <div className="flex items-center gap-2 mt-4">
              <Button
                size="sm"
                variant="default"
                onClick={() => handleStatusChange(request.originalRequest, 'approved')}
              >
                Approve
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleStatusChange(request.originalRequest, 'rejected')}
              >
                Reject
              </Button>
            </div>
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
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left Column - Approved Time Off */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Approved Time Off
          </h3>
          {currentUser?.role === 'admin' && (
            <Button onClick={() => setUserBalanceDialog({ open: true, user: null, balance: 0 })}>
              <Plus className="h-4 w-4 mr-1" />
              Add Balance
            </Button>
          )}
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
                const approvedDays = getApprovedDays(user.id);
                const remainingDays = getRemainingDays(user.id);
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
                    <span className="text-sm">{approvedDays} days</span>
                    <span className="text-sm text-gray-500">{remainingDays} days</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
                  </Card>
      </div>

      {/* Right Column - All Requests */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">Requests</h2>
            {pendingCount > 0 && (
              <Badge variant="secondary" className="bg-primary/10">
                {pendingCount} pending
              </Badge>
            )}
              </div>
          <div className="flex gap-2">
            {currentUser?.role === 'admin' && (
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
            <Button onClick={() => setShowRequestDialog(true)}>
              <Plus className="h-4 w-4 mr-1" />
              New Request
            </Button>
          </div>
        </div>

        {/* Combined Requests View */}
        <div className="space-y-4">
          {allRequests.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">No requests found</p>
            ) : (
            allRequests.map(request => (
                  <Card key={request.id} className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                    <div className="flex items-center gap-2 mb-2">
                      {request.type === 'leave' ? (
                        <Clock className="h-4 w-4" />
                      ) : (
                        <Users className="h-4 w-4" />
                      )}
                      <p className="font-medium">
                        {users.find(u => u.id === request.user_id)?.username}
                      </p>
                    </div>
                        <p className="text-sm text-muted-foreground">
                      {format(new Date(request.displayStartDate), 'PPP')} - {format(new Date(request.displayEndDate), 'PPP')}
                    </p>
                    {request.type === 'leave' && request.leave_type && (
                      <p className="text-sm mt-1">
                        <span className="font-medium">Type:</span> {request.leave_type}
                        </p>
                    )}
                    {request.displayReason && (
                      <p className="text-sm mt-1">
                        <span className="font-medium">Reason:</span> {request.displayReason}
                      </p>
                        )}
                      </div>
                  <div className="flex items-center gap-2">
                    {currentUser?.role === 'admin' && request.status === 'pending' && (
                      <div className="flex items-center gap-2 mr-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-green-600 hover:text-green-700 hover:bg-green-50"
                          onClick={() => handleStatusChange(request.originalRequest, 'approved')}
                        >
                          Approve
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleStatusChange(request.originalRequest, 'rejected')}
                        >
                          Reject
                        </Button>
                      </div>
                    )}
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
                              request: request.originalRequest,
                              type: request.type,
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
                  </Card>
            ))
          )}
        </div>
      </div>

      {/* Dialogs */}
      <Dialog open={userBalanceDialog.open} onOpenChange={(open) => !open && setUserBalanceDialog({ open: false, user: null, balance: 0 })}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Manage Time Off Balance</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Select User</Label>
              <Select
                value={userBalanceDialog.user?.id || ''}
                onValueChange={(userId) => {
                  const user = users.find(u => u.id === userId);
                  if (user) {
                    const balance = userBalances[userId] || 80;
                    setUserBalanceDialog(prev => ({
                      ...prev,
                      user,
                      balance
                    }));
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a user" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.username}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {userBalanceDialog.user && (
              <div className="grid gap-2">
                <Label>Days Balance</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={convertHoursToDays(userBalanceDialog.balance)}
                    onChange={(e) => setUserBalanceDialog(prev => ({
                      ...prev,
                      balance: convertDaysToHours(parseFloat(e.target.value) || 0)
                    }))}
                    min="0"
                    step="0.5"
                  />
                  <span className="text-sm text-muted-foreground">days</span>
                </div>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setUserBalanceDialog({ open: false, user: null, balance: 0 })}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (userBalanceDialog.user) {
                  handleUpdateBalance(userBalanceDialog.user.id, userBalanceDialog.balance);
                }
              }}
              disabled={!userBalanceDialog.user}
            >
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {showRequestDialog && currentUser && (
        <ShiftRequestDialog
          open={showRequestDialog}
          onOpenChange={setShowRequestDialog}
          currentUser={currentUser}
          users={users}
          onRequestsUpdate={refreshRequests}
        />
      )}
      </div>
  );
};

export default RequestsView;
