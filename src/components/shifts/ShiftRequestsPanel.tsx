
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  UserCheck, 
  Clock, 
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { useShifts } from '@/context/ShiftsContext';
import { useAuth } from '@/context/AuthContext';
import { format } from 'date-fns';

export const ShiftRequestsPanel = () => {
  const { shiftRequests, approveShiftRequest, rejectShiftRequest } = useShifts();
  const { users } = useAuth();
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Filter pending requests
  const pendingRequests = shiftRequests.filter(request => request.status === 'pending');
  const recentDecisions = shiftRequests.filter(request => request.status !== 'pending').slice(0, 5);

  const handleApprove = async (requestId: string) => {
    setProcessingId(requestId);
    await approveShiftRequest(requestId);
    setProcessingId(null);
  };

  const handleReject = async (requestId: string) => {
    setProcessingId(requestId);
    await rejectShiftRequest(requestId);
    setProcessingId(null);
  };

  const getRequestTypeIcon = (type: string) => {
    switch (type) {
      case 'time_off':
        return <Calendar className="h-4 w-4" />;
      case 'extra_work':
        return <Clock className="h-4 w-4" />;
      case 'shift_change':
        return <UserCheck className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
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
      case 'custom_shift':
        return 'Custom Shift';
      default:
        return type;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold">Shift Request Approvals</h3>
        <p className="text-sm text-gray-600">
          Review and approve shift requests from employees
        </p>
      </div>

      {/* Pending Requests */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-orange-500" />
            Pending Requests ({pendingRequests.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pendingRequests.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No pending requests</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingRequests.map((request) => {
                const user = users.find(u => u.id === request.user_id);
                return (
                  <div
                    key={request.id}
                    className="p-4 border border-orange-200 bg-orange-50 rounded-lg"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-orange-100 text-orange-600">
                            {user?.username?.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            {getRequestTypeIcon(request.request_type)}
                            <span className="font-medium">{user?.username}</span>
                            <Badge variant="outline" className="text-xs">
                              {getRequestTypeLabel(request.request_type)}
                            </Badge>
                          </div>
                          
                          <div className="space-y-1 text-sm">
                            <p><strong>Dates:</strong> {format(new Date(request.start_date), 'MMM d, yyyy')}
                              {request.end_date && ` - ${format(new Date(request.end_date), 'MMM d, yyyy')}`}
                            </p>
                            {request.reason && (
                              <p><strong>Reason:</strong> {request.reason}</p>
                            )}
                            {request.requested_shift_details && (
                              <div>
                                <p><strong>Shift Details:</strong></p>
                                <ul className="list-disc list-inside ml-4 text-xs">
                                  <li>Title: {request.requested_shift_details.title}</li>
                                  <li>Type: {request.requested_shift_details.shift_type}</li>
                                  {request.requested_shift_details.role && (
                                    <li>Role: {request.requested_shift_details.role}</li>
                                  )}
                                </ul>
                              </div>
                            )}
                            <p className="text-gray-600">
                              <strong>Requested:</strong> {format(new Date(request.created_at), 'MMM d, yyyy HH:mm')}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleReject(request.id)}
                          disabled={processingId === request.id}
                          className="text-red-600 border-red-300 hover:bg-red-50"
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleApprove(request.id)}
                          disabled={processingId === request.id}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Decisions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5" />
            Recent Decisions
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentDecisions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <UserCheck className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No recent decisions</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentDecisions.map((request) => {
                const user = users.find(u => u.id === request.user_id);
                return (
                  <div
                    key={request.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-xs">
                          {user?.username?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{user?.username}</p>
                        <p className="text-xs text-gray-600">
                          {getRequestTypeLabel(request.request_type)} • {format(new Date(request.approved_at || request.created_at), 'MMM d')}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant={request.status === 'approved' ? 'default' : 'destructive'}
                      className="text-xs"
                    >
                      {request.status}
                    </Badge>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
