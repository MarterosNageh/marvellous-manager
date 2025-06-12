import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, User, Users, Calendar, Edit, Trash2, Eye, Plus } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { useAuth } from '@/context/AuthContext';
import { useShifts } from '@/context/ShiftsContext';
import { ShiftRequestDialog } from './ShiftRequestDialog';
import { UserInfoDialog } from './UserInfoDialog';
import { UserBalanceDialog } from './UserBalanceDialog';
import type { ScheduleUser, RequestStatus } from '@/types/schedule';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { SHIFT_TEMPLATES } from '@/lib/constants';

interface RequestsViewProps {
  users: ScheduleUser[];
  onRequestsUpdate?: () => void;
}

interface ShiftRequestDisplay {
  id: string;
  user_id: string;
  username?: string;
  request_type: string;
  leave_type?: string;
  start_date: string;
  end_date: string;
  reason: string;
  status: RequestStatus;
  created_at: string;
  notes?: string;
  reviewer_id?: string;
}

const RequestsView: React.FC<RequestsViewProps> = ({ users, onRequestsUpdate }) => {
  const { currentUser } = useAuth();
  const { shiftRequests, refreshRequests } = useShifts();
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const [showUserInfoDialog, setShowUserInfoDialog] = useState(false);
  const [userBalanceDialog, setUserBalanceDialog] = useState<{ open: boolean; user: ScheduleUser | null; balance: number; }>({ open: false, user: null, balance: 0 });
  const [selectedUser, setSelectedUser] = useState<ScheduleUser | null>(null);
  const [editingRequest, setEditingRequest] = useState<any>(null);
  const [requests, setRequests] = useState<ShiftRequestDisplay[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [userBalances, setUserBalances] = useState<{[key: string]: number}>({});

  const isAdmin = currentUser?.role === 'admin';

  useEffect(() => {
    loadRequests();
    loadUserBalances();
  }, [currentUser, users]);

  const loadRequests = async () => {
    if (!currentUser) return;
    
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('shift_requests')
        .select(`
          *,
          auth_users!shift_requests_user_id_fkey(username, role, title)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const transformedRequests: ShiftRequestDisplay[] = (data || []).map(req => ({
        id: req.id,
        user_id: req.user_id,
        username: req.auth_users?.username || 'Unknown User',
        request_type: req.request_type,
        leave_type: req.leave_type,
        start_date: req.start_date,
        end_date: req.end_date,
        reason: req.reason || '',
        status: req.status as RequestStatus,
        created_at: req.created_at,
        notes: req.notes,
        reviewer_id: req.reviewer_id,
      }));

      setRequests(transformedRequests);
    } catch (error) {
      console.error('Error loading requests:', error);
      toast({
        title: "Error",
        description: "Failed to load requests",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadUserBalances = async () => {
    try {
      const { data, error } = await supabase
        .from('auth_users')
        .select('id, balance')
        .in('id', users.map(user => user.id));

      if (error) throw error;

      const balances: {[key: string]: number} = {};
      (data || []).forEach(user => {
        // Convert hours to days (8 hours per day)
        balances[user.id] = (user.balance || 80) / 8;
      });
      
      setUserBalances(balances);
    } catch (error) {
      console.error('Error loading user balances:', error);
      // Fallback to default balances
      const initialBalances: {[key: string]: number} = {};
      users.forEach(user => {
        initialBalances[user.id] = 10; // Default 10 days
      });
      setUserBalances(initialBalances);
    }
  };

  const getApprovedDays = (userId: string) => {
    return requests
      .filter(req => req.user_id === userId && req.status === 'approved')
      .reduce((acc, req) => {
        const startDate = new Date(req.start_date);
        const endDate = new Date(req.end_date);
        const days = differenceInDays(endDate, startDate) + 1;
        return acc + days;
      }, 0);
  };

  const getRemainingDays = (userId: string) => {
    const totalBalanceDays = userBalances[userId] || 10; // Default to 10 days
    const approvedDays = getApprovedDays(userId);
    const remainingDays = totalBalanceDays - approvedDays;
    return Math.max(0, remainingDays); // Ensure we don't return negative days
  };

  const handleApproveRequest = async (request: ShiftRequestDisplay) => {
    try {
      await supabase
        .from('shift_requests')
        .update({ 
          status: 'approved', 
          reviewer_id: currentUser?.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', request.id);

      await createDayOffShift(request);

      toast({
        title: "Request approved",
        description: "The request has been approved and shifts updated.",
      });

      await loadRequests();
      onRequestsUpdate?.();
    } catch (error) {
      console.error('Error approving request:', error);
      toast({
        title: "Error",
        description: "Failed to approve request",
        variant: "destructive",
      });
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      await supabase
        .from('shift_requests')
        .update({ 
          status: 'rejected', 
          reviewer_id: currentUser?.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId);

      toast({
        title: "Request rejected",
        description: "The request has been rejected.",
      });

      await loadRequests();
      onRequestsUpdate?.();
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast({
        title: "Error",
        description: "Failed to reject request",
        variant: "destructive",
      });
    }
  };

  const handleDeleteRequest = async (requestId: string) => {
    try {
      await supabase
        .from('shift_requests')
        .delete()
        .eq('id', requestId);

      toast({
        title: "Request deleted",
        description: "The request has been deleted.",
      });

      await loadRequests();
      onRequestsUpdate?.();
    } catch (error) {
      console.error('Error deleting request:', error);
      toast({
        title: "Error",
        description: "Failed to delete request",
        variant: "destructive",
      });
    }
  };

  const createDayOffShift = async (request: ShiftRequestDisplay) => {
    try {
      const { data: existingShifts } = await supabase
        .from('shifts')
        .select('*')
        .eq('user_id', request.user_id)
        .gte('start_time', `${request.start_date}T00:00:00`)
        .lte('end_time', `${request.end_date}T23:59:59`);

      const template = request.leave_type === 'public-holiday' 
        ? SHIFT_TEMPLATES.PUBLIC_HOLIDAY 
        : SHIFT_TEMPLATES.DAY_OFF;

      const shiftData = {
        user_id: request.user_id,
        shift_type: template.shift_type,
        title: template.title,
        description: request.reason,
        color: template.color,
        notes: `${template.title} - ${request.reason}`,
        start_time: `${request.start_date}T00:00:00`,
        end_time: `${request.end_date}T23:59:59`,
        created_by: currentUser?.id,
        status: 'active' as const,
        is_all_day: true,
        repeat_days: [],
      };

      if (existingShifts && existingShifts.length > 0) {
        for (const shift of existingShifts) {
          await supabase
            .from('shifts')
            .update({
              shift_type: template.shift_type,
              title: template.title,
              description: request.reason,
              color: template.color,
              notes: `${template.title} - ${request.reason} (replaced original shift)`,
              is_all_day: true,
              status: 'active',
            })
            .eq('id', shift.id);
        }
      } else {
        await supabase.from('shifts').insert([shiftData]);
      }
    } catch (error) {
      console.error('Error creating day-off shift:', error);
      throw error;
    }
  };

  const getStatusColor = (status: RequestStatus) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getRequestTypeIcon = (type: string) => {
    switch (type) {
      case 'extra-days':
        return User;
      case 'public-holiday':
        return Users;
      default:
        return Clock;
    }
  };

  const canEditOrDelete = (request: ShiftRequestDisplay) => {
    if (isAdmin) return true;
    if (request.user_id !== currentUser?.id) return false;
    return request.status === 'pending';
  };

  const handleUserClick = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (user) {
      setSelectedUser(user);
      setShowUserInfoDialog(true);
    }
  };

  const handleBalanceUpdate = (userId: string, newBalance: number) => {
    setUserBalances(prev => ({ ...prev, [userId]: newBalance }));
    setUserBalanceDialog({ open: false, user: null, balance: 0 });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-1 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Time Off Balances
          </h3>
          {isAdmin && (
            <Button size="sm" onClick={() => setUserBalanceDialog({ open: true, user: null, balance: 0 })}>
              <Plus className="h-4 w-4 mr-1" />
              Add/Edit Balance
            </Button>
          )}
        </div>

        <Card>
          <CardContent className="p-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm text-muted-foreground border-b pb-2">
                <span>User</span>
                <span>Approved</span>
                <span>Remaining</span>
              </div>
              
              {users.map(user => {
                const approvedDays = getApprovedDays(user.id);
                const remainingDays = getRemainingDays(user.id);
                return (
                  <div 
                    key={user.id} 
                    className={`flex items-center justify-between py-2 px-2 rounded ${isAdmin ? 'cursor-pointer hover:bg-gray-50' : ''}`}
                    onClick={() => isAdmin && setUserBalanceDialog({
                      open: true,
                      user,
                      balance: userBalances[user.id] || 80
                    })}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
                        {user.username?.substring(0, 2).toUpperCase()}
                      </div>
                      <span className="font-medium">{user.username}</span>
                    </div>
                    <span className="text-sm">{approvedDays} days</span>
                    <span className="text-sm text-muted-foreground">{remainingDays} days</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="lg:col-span-2 space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Leave Requests</h2>
          <Button onClick={() => setShowRequestDialog(true)}>
            <Calendar className="h-4 w-4 mr-2" />
            New Leave Request
          </Button>
        </div>

        <div className="grid gap-4">
          {console.log("-------------------------------------------------------------------")}
          {console.log("users",users)}
          {console.log("requests",requests)}
          {requests.length === 0 ? (
            
            <Card>
              <CardContent className="flex items-center justify-center h-[200px]">
                <p className="text-muted-foreground">No pending or recent requests</p>
              </CardContent>
            </Card>
          ) : (
            (() => {
              const filteredRequests = isAdmin 
                ? requests 
                : requests.filter(request => request.username === users[0].username);
              
              if (filteredRequests.length === 0) {
                return (
                  <Card>
                    <CardContent className="flex items-center justify-center h-[200px]">
                      <p className="text-muted-foreground">No pending or recent requests</p>
                    </CardContent>
                  </Card>
                );
              }
              
              return filteredRequests.map((request) => {
                const RequestIcon = getRequestTypeIcon(request.leave_type || request.request_type);
                return (
                  <Card key={request.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <RequestIcon className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <CardTitle className="text-base">
                              {request.leave_type || request.request_type} Request
                            </CardTitle>
                            <p className="text-sm text-muted-foreground">
                              by{' '}
                              <button
                                onClick={() => handleUserClick(request.user_id)}
                                className="text-primary hover:underline cursor-pointer"
                              >
                                {request.username}
                              </button>
                            </p>
                          </div>
                        </div>
                        <Badge className={getStatusColor(request.status)}>
                          {request.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-medium">Start Date</p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(request.start_date), 'MMM dd, yyyy')}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">End Date</p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(request.end_date), 'MMM dd, yyyy')}
                          </p>
                        </div>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium">Reason</p>
                        <p className="text-sm text-muted-foreground">{request.reason}</p>
                      </div>

                      <div className="flex justify-between items-center pt-2">
                        <p className="text-xs text-muted-foreground">
                          Submitted on {format(new Date(request.created_at), 'MMM dd, yyyy')}
                        </p>
                        
                        <div className="flex gap-2">
                          {canEditOrDelete(request) && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setEditingRequest(request);
                                  setShowRequestDialog(true);
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteRequest(request.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          
                          {isAdmin && request.status === 'pending' && (
                            <>
                              <Button
                                variant="default"
                                size="sm"
                                className="bg-green-600 hover:bg-green-700"
                                onClick={() => handleApproveRequest(request)}
                              >
                                Approve
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleRejectRequest(request.id)}
                              >
                                Reject
                              </Button>
                            </>
                          )}
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUserClick(request.user_id)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              });
            })()
          )}
        </div>
      </div>

      {showRequestDialog && (
        <ShiftRequestDialog
          open={showRequestDialog}
          onOpenChange={(open) => {
            setShowRequestDialog(open);
            if (!open) {
              setEditingRequest(null);
            }
          }}
          users={users}
          editingRequest={editingRequest}
          onRequestsUpdate={() => {
            loadRequests();
            onRequestsUpdate?.();
          }}
        />
      )}

      {showUserInfoDialog && selectedUser && (
        <UserInfoDialog
          user={selectedUser}
          open={showUserInfoDialog}
          onClose={() => setShowUserInfoDialog(false)}
          currentUser={currentUser}
        />
      )}
      
      {userBalanceDialog.open && (
        <UserBalanceDialog
          open={userBalanceDialog.open}
          user={userBalanceDialog.user}
          initialBalance={userBalanceDialog.balance}
          onClose={() => setUserBalanceDialog({ open: false, user: null, balance: 0 })}
          onSave={(userId, newBalance) => {
            handleBalanceUpdate(userId, newBalance);
          }}
        />
      )}
    </div>
  );
};

export default RequestsView;