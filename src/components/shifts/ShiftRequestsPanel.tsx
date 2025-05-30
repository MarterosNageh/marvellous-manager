
import React from 'react';
import { useShifts } from '@/context/ShiftsContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Clock, Calendar } from 'lucide-react';
import { format } from 'date-fns';

export const ShiftRequestsPanel = () => {
  const { shiftRequests, approveShiftRequest, rejectShiftRequest } = useShifts();

  const pendingRequests = shiftRequests.filter(request => request.status === 'pending');
  const approvedRequests = shiftRequests.filter(request => request.status === 'approved');
  const rejectedRequests = shiftRequests.filter(request => request.status === 'rejected');

  const handleApprove = async (requestId: string) => {
    await approveShiftRequest(requestId);
  };

  const handleReject = async (requestId: string) => {
    await rejectShiftRequest(requestId);
  };

  const getRequestTypeColor = (type: string) => {
    switch (type) {
      case 'time_off':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
      case 'extra_work':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'shift_change':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
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

  return (
    <div className="space-y-6">
      {/* Pending Requests */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Pending Requests ({pendingRequests.length})
          </CardTitle>
          <CardDescription>Requests awaiting approval</CardDescription>
        </CardHeader>
        <CardContent>
          {pendingRequests.length > 0 ? (
            <div className="space-y-4">
              {pendingRequests.map((request) => (
                <div key={request.id} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium">{request.user?.username}</span>
                        <Badge className={getRequestTypeColor(request.request_type)}>
                          {getRequestTypeLabel(request.request_type)}
                        </Badge>
                      </div>
                      
                      <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {format(new Date(request.start_date), 'MMM d, yyyy')}
                            {request.end_date && ` - ${format(new Date(request.end_date), 'MMM d, yyyy')}`}
                          </span>
                        </div>
                      </div>
                      
                      {request.reason && (
                        <div className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                          <strong>Reason:</strong> {request.reason}
                        </div>
                      )}
                      
                      <div className="text-xs text-gray-500">
                        Requested: {format(new Date(request.created_at), 'MMM d, yyyy HH:mm')}
                      </div>
                    </div>
                    
                    <div className="flex gap-2 ml-4">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-green-600 border-green-600 hover:bg-green-50"
                        onClick={() => handleApprove(request.id)}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 border-red-600 hover:bg-red-50"
                        onClick={() => handleReject(request.id)}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No pending requests</p>
          )}
        </CardContent>
      </Card>

      {/* Approved Requests */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Approved Requests ({approvedRequests.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {approvedRequests.length > 0 ? (
            <div className="space-y-3">
              {approvedRequests.slice(0, 10).map((request) => (
                <div key={request.id} className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{request.user?.username}</span>
                      <Badge className={getRequestTypeColor(request.request_type)}>
                        {getRequestTypeLabel(request.request_type)}
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {format(new Date(request.start_date), 'MMM d, yyyy')}
                      {request.end_date && ` - ${format(new Date(request.end_date), 'MMM d, yyyy')}`}
                    </div>
                  </div>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    Approved
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No approved requests</p>
          )}
        </CardContent>
      </Card>

      {/* Rejected Requests */}
      {rejectedRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-600" />
              Rejected Requests ({rejectedRequests.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {rejectedRequests.slice(0, 5).map((request) => (
                <div key={request.id} className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{request.user?.username}</span>
                      <Badge className={getRequestTypeColor(request.request_type)}>
                        {getRequestTypeLabel(request.request_type)}
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {format(new Date(request.start_date), 'MMM d, yyyy')}
                      {request.end_date && ` - ${format(new Date(request.end_date), 'MMM d, yyyy')}`}
                    </div>
                  </div>
                  <Badge variant="secondary" className="bg-red-100 text-red-800">
                    Rejected
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
