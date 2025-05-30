
import React, { useMemo } from 'react';
import { useShifts } from '@/context/ShiftsContext';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle, XCircle, Clock, Calendar, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

export const ShiftRequestsPanel = () => {
  const { shiftRequests, approveShiftRequest, rejectShiftRequest } = useShifts();
  const { currentUser } = useAuth();

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

  const getRequestTypeIcon = (type: string) => {
    switch (type) {
      case 'time_off':
        return <Calendar className="h-4 w-4" />;
      case 'extra_work':
        return <Clock className="h-4 w-4" />;
      case 'shift_change':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getRequestTypeLabel = (type: string) => {
    switch (type) {
      case 'time_off':
        return 'Time Off';
      case 'extra_work':
        return 'Extra Work';
      case 'shift_change':
        return 'Shift Change';
      default:
        return type;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline">Pending</Badge>;
      case 'approved':
        return <Badge variant="default">Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const RequestCard = ({ request, showActions = false }: { request: any; showActions?: boolean }) => (
    <Card key={request.id}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {getRequestTypeIcon(request.request_type)}
            <CardTitle className="text-lg">
              {getRequestTypeLabel(request.request_type)}
            </CardTitle>
          </div>
          {getStatusBadge(request.status)}
        </div>
        <CardDescription>
          From {request.user?.username} • {format(new Date(request.start_date), 'MMM d, yyyy')}
          {request.end_date && ` - ${format(new Date(request.end_date), 'MMM d, yyyy')}`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {request.reason && (
          <div className="mb-4">
            <h4 className="font-medium mb-1">Reason:</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">{request.reason}</p>
          </div>
        )}
        
        <div className="text-xs text-gray-500 mb-4">
          Requested on {format(new Date(request.created_at), 'MMM d, yyyy HH:mm')}
        </div>

        {showActions && isManagerOrAdmin && request.status === 'pending' && (
          <div className="flex space-x-2">
            <Button 
              size="sm" 
              onClick={() => approveShiftRequest(request.id)}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Approve
            </Button>
            <Button 
              size="sm" 
              variant="destructive"
              onClick={() => rejectShiftRequest(request.id)}
            >
              <XCircle className="h-4 w-4 mr-1" />
              Reject
            </Button>
          </div>
        )}

        {request.status !== 'pending' && request.approved_at && (
          <div className="text-xs text-gray-500">
            {request.status === 'approved' ? 'Approved' : 'Rejected'} on {format(new Date(request.approved_at), 'MMM d, yyyy HH:mm')}
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Shift Requests</h2>
        <div className="flex space-x-2">
          <Badge variant="outline">
            {pendingRequests.length} Pending
          </Badge>
          <Badge variant="default">
            {approvedRequests.length} Approved
          </Badge>
          <Badge variant="destructive">
            {rejectedRequests.length} Rejected
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
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
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {pendingRequests.length > 0 ? (
            pendingRequests.map((request) => (
              <RequestCard key={request.id} request={request} showActions={true} />
            ))
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
            approvedRequests.map((request) => (
              <RequestCard key={request.id} request={request} />
            ))
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
            rejectedRequests.map((request) => (
              <RequestCard key={request.id} request={request} />
            ))
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <XCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-500">No rejected requests</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
