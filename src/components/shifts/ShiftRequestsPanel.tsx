
import React, { useState, useMemo } from 'react';
import { useShifts } from '@/context/ShiftsContext';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle, XCircle, Clock, Calendar, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';

export const ShiftRequestsPanel = () => {
  const { shiftRequests, refreshShiftRequests } = useShifts();
  const { currentUser, users } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);

  const isManagerOrAdmin = currentUser?.isAdmin || currentUser?.role === 'manager';

  const pendingRequests = useMemo(() => {
    return shiftRequests.filter(request => request.status === 'pending');
  }, [shiftRequests]);

  const approvedRequests = useMemo(() => {
    return shiftRequests.filter(request => request.status === 'approved');
  }, [shiftRequests]);

  const rejectedRequests = useMemo(() => {
    return shiftRequests.filter(request => request.status === 'rejected');
  }, [shiftRequests]);

  const userRequests = useMemo(() => {
    return shiftRequests.filter(request => request.user_id === currentUser?.id);
  }, [shiftRequests, currentUser?.id]);

  const handleApproveRequest = async (requestId: string) => {
    if (!isManagerOrAdmin) return;
    
    setLoading(requestId);
    try {
      const { error } = await supabase
        .from('shift_requests')
        .update({
          status: 'approved',
          approved_by: currentUser?.id,
          approved_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (error) throw error;

      toast.success('Request approved successfully');
      await refreshShiftRequests();
    } catch (error) {
      console.error('Error approving request:', error);
      toast.error('Failed to approve request');
    } finally {
      setLoading(null);
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    if (!isManagerOrAdmin) return;
    
    setLoading(requestId);
    try {
      const { error } = await supabase
        .from('shift_requests')
        .update({
          status: 'rejected',
          approved_by: currentUser?.id,
          approved_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (error) throw error;

      toast.success('Request rejected');
      await refreshShiftRequests();
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast.error('Failed to reject request');
    } finally {
      setLoading(null);
    }
  };

  const getRequestTypeLabel = (type: string) => {
    switch (type) {
      case 'time_off': return 'Time Off';
      case 'extra_shift': return 'Extra Shift';
      case 'shift_swap': return 'Shift Swap';
      default: return type;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="text-yellow-600"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'approved':
        return <Badge variant="default" className="text-green-600"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const RequestCard = ({ request }: { request: any }) => {
    const requester = users.find(u => u.id === request.user_id);
    const approver = users.find(u => u.id === request.approved_by);

    return (
      <Card key={request.id}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Avatar className="h-8 w-8">
                <AvatarFallback>
                  {requester?.username?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-sm">{requester?.username || 'Unknown User'}</CardTitle>
                <CardDescription className="text-xs">
                  {getRequestTypeLabel(request.request_type)}
                </CardDescription>
              </div>
            </div>
            {getStatusBadge(request.status)}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center text-sm text-gray-600">
            <Calendar className="h-4 w-4 mr-2" />
            <span>
              {format(new Date(request.start_date), 'MMM d, yyyy')}
              {request.end_date && ` - ${format(new Date(request.end_date), 'MMM d, yyyy')}`}
            </span>
          </div>

          {request.reason && (
            <div className="text-sm">
              <strong>Reason:</strong> {request.reason}
            </div>
          )}

          {request.status === 'pending' && isManagerOrAdmin && (
            <div className="flex space-x-2 pt-2">
              <Button
                size="sm"
                onClick={() => handleApproveRequest(request.id)}
                disabled={loading === request.id}
                className="flex-1"
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Approve
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleRejectRequest(request.id)}
                disabled={loading === request.id}
                className="flex-1"
              >
                <XCircle className="h-4 w-4 mr-1" />
                Reject
              </Button>
            </div>
          )}

          {request.approved_by && request.approved_at && (
            <div className="text-xs text-gray-500 pt-2 border-t">
              {request.status === 'approved' ? 'Approved' : 'Rejected'} by{' '}
              {approver?.username || 'Unknown'} on{' '}
              {format(new Date(request.approved_at), 'MMM d, yyyy HH:mm')}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue={isManagerOrAdmin ? "pending" : "my-requests"} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          {isManagerOrAdmin && (
            <>
              <TabsTrigger value="pending" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Pending ({pendingRequests.length})
              </TabsTrigger>
              <TabsTrigger value="approved" className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Approved ({approvedRequests.length})
              </TabsTrigger>
              <TabsTrigger value="rejected" className="flex items-center gap-2">
                <XCircle className="h-4 w-4" />
                Rejected ({rejectedRequests.length})
              </TabsTrigger>
            </>
          )}
          <TabsTrigger value="my-requests" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            My Requests ({userRequests.length})
          </TabsTrigger>
        </TabsList>

        {isManagerOrAdmin && (
          <>
            <TabsContent value="pending" className="space-y-4">
              {pendingRequests.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {pendingRequests.map((request) => (
                    <RequestCard key={request.id} request={request} />
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="text-center py-8">
                    <Clock className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-500">No pending requests</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="approved" className="space-y-4">
              {approvedRequests.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {approvedRequests.map((request) => (
                    <RequestCard key={request.id} request={request} />
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="text-center py-8">
                    <CheckCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-500">No approved requests</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="rejected" className="space-y-4">
              {rejectedRequests.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {rejectedRequests.map((request) => (
                    <RequestCard key={request.id} request={request} />
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="text-center py-8">
                    <XCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-500">No rejected requests</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </>
        )}

        <TabsContent value="my-requests" className="space-y-4">
          {userRequests.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {userRequests.map((request) => (
                <RequestCard key={request.id} request={request} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <User className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-500">You haven't submitted any requests yet</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
