
import React from 'react';
import { useShifts } from '@/context/ShiftsContext';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Clock, User } from 'lucide-react';

export const ShiftRequestsPanel = () => {
  const { shiftRequests, users, updateShiftRequestStatus } = useShifts();

  if (!shiftRequests || shiftRequests.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Shift Requests
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <Clock className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No shift requests pending</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const pendingRequests = shiftRequests.filter(req => req.status === 'pending');
  const approvedRequests = shiftRequests.filter(req => req.status === 'approved');
  const rejectedRequests = shiftRequests.filter(req => req.status === 'rejected');

  const handleApprove = async (requestId: string) => {
    try {
      await updateShiftRequestStatus(requestId, 'approved');
    } catch (error) {
      console.error('Error approving request:', error);
    }
  };

  const handleReject = async (requestId: string) => {
    try {
      await updateShiftRequestStatus(requestId, 'rejected');
    } catch (error) {
      console.error('Error rejecting request:', error);
    }
  };

  const getUserName = (userId: string) => {
    const user = users.find(u => u.id === userId);
    return user?.username || 'Unknown User';
  };

  return (
    <div className="space-y-6">
      {/* Pending Requests */}
      {pendingRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              Pending Requests ({pendingRequests.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingRequests.map((request) => (
              <div
                key={request.id}
                className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg border border-yellow-200"
              >
                <div className="flex items-center space-x-4">
                  <User className="h-5 w-5 text-yellow-600" />
                  <div>
                    <p className="font-medium">{getUserName(request.user_id)}</p>
                    <p className="text-sm text-gray-600">
                      {request.shift_id ? 'Shift Change' : 'Time Off'} - {format(new Date(request.created_at), 'MMM d, yyyy')}
                    </p>
                    <p className="text-xs text-gray-500">{request.reason}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleApprove(request.id)}
                    className="text-green-600 border-green-600 hover:bg-green-50"
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleReject(request.id)}
                    className="text-red-600 border-red-600 hover:bg-red-50"
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Reject
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Approved Requests */}
      {approvedRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Approved Requests ({approvedRequests.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {approvedRequests.map((request) => (
              <div
                key={request.id}
                className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200"
              >
                <div className="flex items-center space-x-4">
                  <User className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium">{getUserName(request.user_id)}</p>
                    <p className="text-sm text-gray-600">
                      {request.shift_id ? 'Shift Change' : 'Time Off'} - {format(new Date(request.created_at), 'MMM d, yyyy')}
                    </p>
                    <p className="text-xs text-gray-500">{request.reason}</p>
                  </div>
                </div>
                <Badge variant="default" className="bg-green-100 text-green-800">
                  Approved
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Rejected Requests */}
      {rejectedRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-600" />
              Rejected Requests ({rejectedRequests.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {rejectedRequests.map((request) => (
              <div
                key={request.id}
                className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200"
              >
                <div className="flex items-center space-x-4">
                  <User className="h-5 w-5 text-red-600" />
                  <div>
                    <p className="font-medium">{getUserName(request.user_id)}</p>
                    <p className="text-sm text-gray-600">
                      {request.shift_id ? 'Shift Change' : 'Time Off'} - {format(new Date(request.created_at), 'MMM d, yyyy')}
                    </p>
                    <p className="text-xs text-gray-500">{request.reason}</p>
                  </div>
                </div>
                <Badge variant="destructive" className="bg-red-100 text-red-800">
                  Rejected
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
