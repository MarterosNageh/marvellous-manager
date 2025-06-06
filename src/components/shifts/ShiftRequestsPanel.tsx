
import React from 'react';
import { useShifts } from '@/context/ShiftsContext';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, User, Calendar, CheckCircle, XCircle } from 'lucide-react';

export const ShiftRequestsPanel = () => {
  const { shiftRequests, users } = useShifts();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'rejected':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4" />;
      case 'rejected':
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  if (!shiftRequests || shiftRequests.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Shift Requests
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No shift requests at this time</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Shift Requests ({shiftRequests.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {shiftRequests.map((request) => {
            const user = users?.find(u => u.id === request.user_id);
            return (
              <div
                key={request.id}
                className="border rounded-lg p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-medium">{user?.username || 'Unknown User'}</h4>
                      <p className="text-sm text-gray-600">{request.request_type}</p>
                    </div>
                  </div>
                  <div className={`flex items-center space-x-2 px-3 py-1 rounded-full border ${getStatusColor(request.status)}`}>
                    {getStatusIcon(request.status)}
                    <span className="text-sm font-medium capitalize">{request.status}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Requested Date:</span>
                    <p>{request.created_at && format(new Date(request.created_at), 'PPP')}</p>
                  </div>
                  {request.reason && (
                    <div>
                      <span className="font-medium text-gray-700">Reason:</span>
                      <p className="text-gray-600">{request.reason}</p>
                    </div>
                  )}
                </div>

                {request.status === 'pending' && (
                  <div className="flex space-x-2 pt-2">
                    <Button size="sm" variant="outline" className="text-green-600 border-green-300 hover:bg-green-50">
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Approve
                    </Button>
                    <Button size="sm" variant="outline" className="text-red-600 border-red-300 hover:bg-red-50">
                      <XCircle className="h-4 w-4 mr-1" />
                      Reject
                    </Button>
                  </div>
                )}

                <div className="text-xs text-gray-500 pt-2">
                  Submitted: {request.created_at && format(new Date(request.created_at), 'PPP')}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
