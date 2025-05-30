
import React from 'react';
import { useShifts } from '@/context/ShiftsContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';

export const ShiftRequestsPanel = () => {
  const { shiftRequests, approveShiftRequest, rejectShiftRequest } = useShifts();

  const pendingRequests = shiftRequests.filter(request => request.status === 'pending');
  const recentRequests = shiftRequests.slice(0, 10);

  const handleApprove = async (requestId: string) => {
    await approveShiftRequest(requestId);
  };

  const handleReject = async (requestId: string) => {
    await rejectShiftRequest(requestId);
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

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'approved':
        return 'default';
      case 'rejected':
        return 'destructive';
      case 'pending':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Shift Requests</h2>
        <Badge variant="secondary">
          {pendingRequests.length} pending
        </Badge>
      </div>

      {pendingRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="mr-2 h-5 w-5" />
              Pending Requests
            </CardTitle>
            <CardDescription>
              Requests awaiting approval
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {pendingRequests.map((request) => (
              <div key={request.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="font-medium">{request.user?.username}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {getRequestTypeLabel(request.request_type)} • {format(new Date(request.start_date), 'MMM d, yyyy')}
                    {request.end_date && ` - ${format(new Date(request.end_date), 'MMM d, yyyy')}`}
                  </div>
                  {request.reason && (
                    <div className="text-sm text-gray-500 mt-1">{request.reason}</div>
                  )}
                  <div className="text-xs text-gray-400 mt-1">
                    Requested {format(new Date(request.created_at), 'MMM d, yyyy HH:mm')}
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleApprove(request.id)}
                    className="text-green-600 hover:text-green-700"
                  >
                    <CheckCircle className="mr-1 h-4 w-4" />
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleReject(request.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <XCircle className="mr-1 h-4 w-4" />
                    Reject
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Recent Requests</CardTitle>
          <CardDescription>
            All shift requests history
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentRequests.map((request) => (
              <div key={request.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div>
                  <div className="font-medium">{request.user?.username}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {getRequestTypeLabel(request.request_type)} • {format(new Date(request.start_date), 'MMM d, yyyy')}
                    {request.end_date && ` - ${format(new Date(request.end_date), 'MMM d, yyyy')}`}
                  </div>
                  {request.reason && (
                    <div className="text-sm text-gray-500 mt-1">{request.reason}</div>
                  )}
                </div>
                <Badge variant={getStatusBadgeVariant(request.status)}>
                  {request.status}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
