
import React from 'react';
import { useShifts } from '@/context/ShiftsContext';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, X, Clock, Calendar, User } from 'lucide-react';
import { format } from 'date-fns';

export const ShiftRequestsPanel: React.FC = () => {
  const { shiftRequests, loading, approveShiftRequest, rejectShiftRequest } = useShifts();
  const { currentUser } = useAuth();

  const isAdmin = currentUser?.isAdmin;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading shift requests...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Shift Requests</h2>
        <Badge variant="secondary">
          {shiftRequests.filter(req => req.status === 'pending').length} Pending
        </Badge>
      </div>

      {shiftRequests.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No requests found
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              There are no shift requests to display.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {shiftRequests.map((request) => (
            <Card key={request.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-3 flex-1">
                    <div className="flex items-center gap-3">
                      <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-full">
                        <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {request.user?.username}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {getRequestTypeLabel(request.request_type)}
                        </div>
                      </div>
                      <Badge className={getStatusColor(request.status)}>
                        {request.status}
                      </Badge>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {format(new Date(request.start_date), 'MMM d, yyyy')}
                          {request.end_date && (
                            <span> - {format(new Date(request.end_date), 'MMM d, yyyy')}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {format(new Date(request.created_at), 'MMM d, HH:mm')}
                        </div>
                      </div>

                      {request.reason && (
                        <div className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 p-3 rounded">
                          <strong>Reason:</strong> {request.reason}
                        </div>
                      )}

                      {request.approved_at && (
                        <div className="text-xs text-gray-500">
                          {request.status === 'approved' ? 'Approved' : 'Rejected'} on{' '}
                          {format(new Date(request.approved_at), 'MMM d, yyyy HH:mm')}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  {isAdmin && request.status === 'pending' && (
                    <div className="flex gap-2 ml-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => approveShiftRequest(request.id)}
                        className="text-green-600 border-green-600 hover:bg-green-50"
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => rejectShiftRequest(request.id)}
                        className="text-red-600 border-red-600 hover:bg-red-50"
                      >
                        <X className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
