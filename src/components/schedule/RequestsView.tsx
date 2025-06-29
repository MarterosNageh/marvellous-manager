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
  DialogDescription,
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
  RequestToDisplay,
  SwapRequestDBToRequest,
  RequestType,
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
  'day-off': 'bg-purple-50',
  'unpaid': 'bg-orange-50',
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

interface DBRequestRow {
  id: string;
  user_id: string;
  request_type: string;
  start_date: string;
  end_date: string;
  reason: string | null;
  status: RequestStatus;
  reviewer_id: string | null;
  review_notes: string | null;
  notes: string | null;
  replacement_user_id: string | null;
  shift_id: string | null;
  proposed_shift_id: string | null;
  approved_shift_id: string | null;
  admin_approval: string | null;
  target_user_approval: string | null;
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

interface ExtendedDisplayRequest extends Omit<AnyRequest, 'start_date' | 'end_date' | 'reason'> {
  displayStartDate: string;
  displayEndDate: string;
  displayReason: string;
  originalRequest: AnyRequest;
  leave_type?: LeaveType;
  request_type: RequestType;
}

const validLeaveTypes = ['day-off', 'unpaid', 'extra', 'public-holiday'] as const;
function toLeaveType(type: any): LeaveType {
  return validLeaveTypes.includes(type) ? type : 'day-off';
}

function toRequestStatus(status: any): RequestStatus {
  if (status === 'pending' || status === 'approved' || status === 'rejected') return status;
  return 'pending';
}

const mapToLeaveRequest = (dbRequest: any): LeaveRequest => {
  return {
    id: dbRequest.id,
    user_id: dbRequest.user_id,
    leave_type: toLeaveType(dbRequest.request_type),
    request_type: toLeaveType(dbRequest.request_type),
    start_date: dbRequest.start_date,
    end_date: dbRequest.end_date,
    reason: dbRequest.reason || '',
    status: toRequestStatus(dbRequest.status),
    notes: dbRequest.notes || '',
    reviewer_id: dbRequest.reviewer_id || undefined,
    created_at: dbRequest.created_at || new Date().toISOString(),
    updated_at: dbRequest.updated_at || new Date().toISOString()
  };
};

const mapToSwapRequest = (dbRequest: any): SwapRequest => {
  return {
    id: dbRequest.id,
    type: 'swap',
    user_id: dbRequest.user_id,
    request_type: 'swap',
    shift_id: dbRequest.shift_id || '',
    proposed_shift_id: dbRequest.proposed_shift_id,
    requester_id: dbRequest.user_id,
    requested_user_id: dbRequest.replacement_user_id || '',
    status: toRequestStatus(dbRequest.status),
    notes: dbRequest.notes || '',
    review_notes: dbRequest.review_notes || '',
    reviewer_id: dbRequest.reviewer_id || undefined,
    start_date: dbRequest.start_date,
    end_date: dbRequest.end_date,
    created_at: dbRequest.created_at || new Date().toISOString(),
    updated_at: dbRequest.updated_at || new Date().toISOString()
  };
};

const mapRequestToDisplay = (request: AnyRequest): ExtendedDisplayRequest => ({
  id: request.id,
  user_id: request.user_id,
  status: request.status,
  request_type: request.request_type as RequestType,
  created_at: request.created_at,
  updated_at: request.updated_at,
  displayStartDate: request.start_date,
  displayEndDate: request.end_date,
  displayReason: request.request_type === 'leave' ? (request as LeaveRequest).reason : (request as SwapRequest).notes || '',
  leave_type: request.request_type === 'leave' && validLeaveTypes.includes((request as LeaveRequest).leave_type as LeaveType) ? (request as LeaveRequest).leave_type as LeaveType : undefined,
  originalRequest: request
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
      console.log('Starting to refresh requests...');
      setLoading(true);

      // First, let's check what's in the database
      const { data: allData, error: checkError } = await supabase
        .from('shift_requests')
        .select('*');

      console.log('All requests in database:', allData);

      if (checkError) {
        console.error('Error checking all requests:', checkError);
      }

      // Get leave requests (all request types except 'swap')
      const { data: leaveData, error: leaveError } = await supabase
        .from('shift_requests')
        .select('*')
        .not('request_type', 'eq', 'swap')
        .order('created_at', { ascending: false });

      if (leaveError) {
        console.error('Error fetching leave requests:', leaveError);
        throw leaveError;
      }

      // Get swap requests
      const { data: swapData, error: swapError } = await supabase
        .from('shift_requests')
        .select('*')
        .eq('request_type', 'swap')
        .order('created_at', { ascending: false });

      if (swapError) {
        console.error('Error fetching swap requests:', swapError);
        throw swapError;
      }

      console.log('Raw leave data:', leaveData);
      console.log('Raw swap data:', swapData);

      const mappedLeaveRequests = (leaveData || []).map(mapToLeaveRequest as (row: any) => LeaveRequest);
      const mappedSwapRequests = (swapData || []).map(mapToSwapRequest as (row: any) => SwapRequest);

      console.log('Mapped leave requests:', mappedLeaveRequests);
      console.log('Mapped swap requests:', mappedSwapRequests);

      setLeaveRequests(mappedLeaveRequests);
      setSwapRequests(mappedSwapRequests);

      console.log('State after setting requests - Leave:', mappedLeaveRequests.length, 'Swap:', mappedSwapRequests.length);

      if (onRequestsUpdate) {
        console.log('Calling onRequestsUpdate with mapped requests');
        onRequestsUpdate(mappedLeaveRequests, mappedSwapRequests);
      }

      // Update pending count
      const pendingCount = [...mappedLeaveRequests, ...mappedSwapRequests].filter(
        req => req.status === 'pending'
      ).length;
      console.log('New pending count:', pendingCount);
      setPendingCount(pendingCount);
    } catch (error) {
      console.error('Error fetching requests:', error);
      toast({
        title: 'Error fetching requests',
        description: 'Please try again later',
        variant: 'destructive',
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
      })
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      void channel.unsubscribe();
    };
  }, []); // Empty dependency array to run only once

  // Separate effect for pending count
  useEffect(() => {
    updatePendingCount();
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
      console.log('Deleting request:', request);
      const { error } = await supabase
        .from('shift_requests')
        .delete()
        .eq('id', request.id);

      if (error) {
        console.error('Error deleting request:', error);
        throw error;
      }

      toast({
        title: "Request deleted",
        description: "The request has been deleted successfully",
      });

      setDeleteConfirmDialog({ open: false, request: null, type: 'leave' });
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
        if (request.request_type === 'leave') {
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
          const swapReq = request as SwapRequest;
          await supabase
            .from('shifts')
            .update({
              user_id: swapReq.requested_user_id,
              color: '#4CAF50',
              notes: `Swapped with ${users.find(u => u.id === request.user_id)?.username}`,
            })
            .eq('id', swapReq.shift_id);

          if (swapReq.proposed_shift_id) {
            await supabase
              .from('shifts')
              .update({
                user_id: request.user_id,
                color: '#4CAF50',
                notes: `Swapped with ${users.find(u => u.id === swapReq.requested_user_id)?.username}`,
              })
              .eq('id', swapReq.proposed_shift_id);
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

  const handleEditRequest = (request: ExtendedDisplayRequest) => {
    console.log('Editing request:', request);
    if (request.request_type === 'leave') {
      setEditingRequest(request.originalRequest as LeaveRequest);
    } else {
      // Convert swap request to leave request format for editing
      const swapRequest = request.originalRequest;
      const leaveRequest: LeaveRequest = {
        id: swapRequest.id,
        user_id: swapRequest.user_id,
        leave_type: 'day-off',
        request_type: 'leave',
        start_date: swapRequest.start_date,
        end_date: swapRequest.end_date,
        reason: swapRequest.notes || '',
        status: swapRequest.status,
        notes: swapRequest.notes || '',
        reviewer_id: swapRequest.reviewer_id,
        created_at: swapRequest.created_at,
        updated_at: swapRequest.updated_at
      };
      setEditingRequest(leaveRequest);
    }
    setShowRequestDialog(true);
  };

  const handleSaveEdit = async (request: LeaveRequest | null) => {
    if (!request) return;

    try {
      const dbRequest = {
        user_id: request.user_id,
        request_type: request.leave_type,
        start_date: request.start_date,
        end_date: request.end_date,
        reason: request.reason || '',
        status: request.status || 'pending',
        notes: request.notes || '',
        reviewer_id: request.reviewer_id || null,
        replacement_user_id: null,
        shift_id: null,
        approved_shift_id: null,
        admin_approval: null,
        target_user_approval: null
      };

      console.log('Saving request:', dbRequest);

      if (request.id) {
        // Update existing request
        const { error } = await supabase
          .from('shift_requests')
          .update(dbRequest)
          .eq('id', request.id);

        if (error) {
          console.error('Update error:', error);
          throw error;
        }
      } else {
        // Create new request
        const { error } = await supabase
          .from('shift_requests')
          .insert([{
            ...dbRequest,
            user_id: currentUser?.id,
            id: crypto.randomUUID(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }]);

        if (error) {
          console.error('Insert error:', error);
          throw error;
        }
      }

      toast({
        title: `Request ${request.id ? 'updated' : 'created'} successfully`,
        variant: 'default',
      });

      setShowRequestDialog(false);
      setEditingRequest(null);
      refreshRequests();
    } catch (error) {
      console.error('Error saving request:', error);
      toast({
        title: 'Error saving request',
        description: error instanceof Error ? error.message : 'Please try again later',
        variant: 'destructive',
      });
    }
  };

  const initializeNewRequest = (): LeaveRequest => ({
    id: '',
    user_id: currentUser?.id || '',
    leave_type: 'day-off',
    request_type: 'day-off',
    start_date: format(new Date(), 'yyyy-MM-dd'),
    end_date: format(new Date(), 'yyyy-MM-dd'),
    reason: '',
    notes: '',
    status: 'pending',
    reviewer_id: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  });

  const filteredLeaveRequests = selectedStatus === 'all' 
    ? leaveRequests 
    : leaveRequests.filter(req => req.status === selectedStatus);
  
  const filteredSwapRequests = selectedStatus === 'all' 
    ? swapRequests 
    : swapRequests.filter(req => req.status === selectedStatus);

  console.log('Filtering state:', {
    selectedStatus,
    totalLeaveRequests: leaveRequests.length,
    totalSwapRequests: swapRequests.length,
    filteredLeaveRequests: filteredLeaveRequests.length,
    filteredSwapRequests: filteredSwapRequests.length
  });

  // Transform requests for display
  // Filter requests based on role
  let visibleLeaveRequests = leaveRequests;
  let visibleSwapRequests = swapRequests;
  if (currentUser?.role === 'operator') {
    visibleLeaveRequests = leaveRequests.filter(req => req.user_id === currentUser.id);
    visibleSwapRequests = swapRequests.filter(req => req.user_id === currentUser.id);
  } else if (currentUser?.role !== 'admin') {
    // For non-admin, non-operator roles, show only own requests (preserve previous logic)
    visibleLeaveRequests = leaveRequests.filter(req => req.user_id === currentUser?.id);
    visibleSwapRequests = swapRequests.filter(req => req.user_id === currentUser?.id);
  }
  const allRequests = [...visibleLeaveRequests, ...visibleSwapRequests]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .map(mapRequestToDisplay);

  console.log('All requests to display:', allRequests);

  const getAvailableLeaveTypes = () => {
    const baseTypes = ['day-off', 'unpaid'];
    if (isAdmin) {
      return [...baseTypes, 'extra', 'public-holiday'] as LeaveType[];
    }
    return baseTypes as LeaveType[];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const renderRequest = (request: ExtendedDisplayRequest) => {
    const requestUser = users.find(u => u.id === request.user_id);
    const isOwnRequest = request.user_id === currentUser?.id;
    const isPending = request.status === 'pending';
    const isAdmin = currentUser?.role === 'admin';
    const canEditDelete = isAdmin;

    return (
      <Card key={request.id} className="mb-4">
        <CardContent className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center space-x-2">
              <User className="h-5 w-5 text-gray-500" />
              <span className="font-medium">{requestUser?.username || 'Unknown User'}</span>
              <Badge variant="outline" className="bg-blue-100 text-blue-800">
                Type: {request.originalRequest.request_type}
              </Badge>
              <div className="flex items-center gap-2">
                <Badge 
                  variant={request.status === 'approved' ? 'default' : request.status === 'rejected' ? 'destructive' : 'outline'} 
                  className={
                    request.status === 'approved' 
                      ? 'bg-green-500 text-white' 
                      : request.status === 'rejected'
                      ? 'bg-red-500 text-white'
                      : ''
                  }
                >
                  {request.status}
                </Badge>
              </div>
            </div>
            {canEditDelete && (
              <div className="flex items-center space-x-2">
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
                  onClick={() => setDeleteConfirmDialog({
                    open: true,
                    request: request.originalRequest,
                    type: request.request_type === 'leave' ? 'leave' : 'swap'
                  })}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
          <div className="space-y-2">
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
            {request.status === 'pending' && isAdmin && (
              <div className="flex items-center gap-2 mt-4">
                <Button
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => handleStatusChange(request.originalRequest, 'approved')}
                >
                  Approve
                </Button>
                <Button
                  size="sm"
                  className="bg-red-600 hover:bg-red-700 text-white"
                  onClick={() => handleStatusChange(request.originalRequest, 'rejected')}
                >
                  Reject
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  const userRequests = currentUser?.role === 'admin' 
    ? { leaveRequests, swapRequests }
    : {
        leaveRequests: leaveRequests.filter(req => req.user_id === currentUser?.id),
        swapRequests: swapRequests.filter(req => req.user_id === currentUser?.id)
      };

  // In the Approved Time Off section, filter users for operator role
  const visibleUsers = currentUser?.role === 'operator'
    ? users.filter(user => user.id === currentUser.id)
    : users;

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
              
              {visibleUsers.map(user => {
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
            <div className="text-center py-8">
              <p className="text-muted-foreground">No requests found</p>
              {selectedStatus !== 'all' && (
                <p className="text-sm text-muted-foreground mt-2">
                  Try changing the status filter to see more requests
                </p>
              )}
            </div>
          ) : (
            allRequests.map(request => renderRequest(request))
          )}
        </div>
      </div>

      {/* Dialogs */}
      <Dialog open={showRequestDialog} onOpenChange={(open) => {
        setShowRequestDialog(open);
        if (!open) {
          setEditingRequest(null);
        }
      }}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingRequest?.id ? 'Edit Request' : 'New Leave Request'}</DialogTitle>
            <DialogDescription>
              {editingRequest?.id ? 'Edit the request details below.' : 'Create a new leave request by filling out the form below.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {isAdmin && editingRequest?.id && (
              <div className="grid gap-2">
                <Label>Status</Label>
                <Select
                  value={editingRequest.status}
                  onValueChange={(value) => {
                    const status = value as RequestStatus;
                    setEditingRequest(prev => 
                      prev ? { 
                        ...prev, 
                        status,
                      } : null
                    );
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid gap-2">
              <Label>Leave Type</Label>
              <Select
                value={editingRequest?.leave_type || 'day-off'}
                onValueChange={(value) => {
                  const leaveType = value as LeaveType;
                  setEditingRequest(prev => 
                    prev ? { 
                      ...prev, 
                      leave_type: leaveType,
                    } : initializeNewRequest()
                  );
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select leave type" />
                </SelectTrigger>
                <SelectContent>
                  {getAvailableLeaveTypes().map((type) => (
                    <SelectItem key={type} value={type}>
                      {type.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Start Date</Label>
              <Input
                type="date"
                value={editingRequest?.start_date || ''}
                onChange={(e) => {
                  const startDate = e.target.value;
                  setEditingRequest(prev => 
                    prev ? { 
                      ...prev, 
                      start_date: startDate,
                    } : null
                  );
                }}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label>End Date</Label>
              <Input
                type="date"
                value={editingRequest?.end_date || ''}
                onChange={(e) => {
                  const endDate = e.target.value;
                  setEditingRequest(prev => 
                    prev ? { 
                      ...prev, 
                      end_date: endDate,
                    } : null
                  );
                }}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label>Reason</Label>
              <Input
                value={editingRequest?.reason || ''}
                onChange={(e) => {
                  const reason = e.target.value;
                  setEditingRequest(prev => 
                    prev ? { 
                      ...prev, 
                      reason,
                    } : null
                  );
                }}
                placeholder="Enter reason for leave"
                required
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => {
              setShowRequestDialog(false);
              setEditingRequest(null);
            }}>
              Cancel
            </Button>
            <Button 
              onClick={() => handleSaveEdit(editingRequest)} 
              disabled={!editingRequest || !editingRequest.start_date || !editingRequest.end_date || !editingRequest.reason}
            >
              {editingRequest?.id ? 'Update' : 'Create'} Request
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* User Balance Dialog */}
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmDialog.open} onOpenChange={(open) => {
        if (!open) setDeleteConfirmDialog({ open: false, request: null, type: 'leave' });
      }}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Request</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this request? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => 
              setDeleteConfirmDialog({ open: false, request: null, type: 'leave' })
            }>
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={() => deleteConfirmDialog.request && handleDeleteRequest(deleteConfirmDialog.request)}
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RequestsView;
