
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Clock, CheckCircle, X, Filter } from 'lucide-react';
import { useShifts } from '@/context/ShiftsContext';
import { useAuth } from '@/context/AuthContext';
import { format } from 'date-fns';

type RequestFilter = 'all' | 'pending' | 'approved' | 'rejected';

export const ShiftRequestsPanel = () => {
  const { shiftRequests, approveShiftRequest, rejectShiftRequest, users } = useShifts();
  const { currentUser } = useAuth();
  const [filter, setFilter] = useState<RequestFilter>('all');

  const isManager = currentUser?.role === 'manager' || currentUser?.isAdmin;

  // Filter requests based on selected filter
  const filteredRequests = shiftRequests.filter(request => {
    if (filter === 'all') return true;
    return request.status === filter;
  });

  // Sort by creation date (newest first)
  const sortedRequests = filteredRequests.sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  const handleApprove = async (requestId: string) => {
    await approveShiftRequest(requestId);
  };

  const handleReject = async (requestId: string) => {
    await rejectShiftRequest(requestId);
  };

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

  const filterButtons = [
    { key: 'all' as RequestFilter, label: 'All Requests', count: shiftRequests.length },
    { key: 'pending' as RequestFilter, label: 'Pending', count: shiftRequests.filter(r => r.status === 'pending').length },
    { key: 'approved' as RequestFilter, label: 'Approved', count: shiftRequests.filter(r => r.status === 'approved').length },
    { key: 'rejected' as RequestFilter, label: 'Rejected', count: shiftRequests.filter(r => r.status === 'rejected').length },
  ];

  return (
    <div className="space-y-6">
      {/* Header with Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Shift Requests
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {filterButtons.map((button) => (
              <Button
                key={button.key}
                variant={filter === button.key ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter(button.key)}
                className="flex items-center gap-2"
              >
                <Filter className="h-4 w-4" />
                {button.label}
                <Badge variant="secondary" className="ml-1">
                  {button.count}
                </Badge>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Requests List */}
      <Card>
        <CardHeader>
          <CardTitle>
            {filter === 'all' ? 'All Shift Requests' : 
             filter === 'pending' ? 'Pending Requests' :
             filter === 'approved' ? 'Approved Requests' : 'Rejected Requests'}
            <Badge variant="secondary" className="ml-2">{sortedRequests.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {sortedRequests.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Clock className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No shift requests found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {sortedRequests.map((request) => {
                const user = users.find(u => u.id === request.user_id);
                
                return (
                  <div key={request.id} className="p-4 rounded-lg border bg-white">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <Avatar className="h-12 w-12">
                          <AvatarFallback className="bg-blue-100 text-blue-600">
                            {user?.username?.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 className="font-semibold text-gray-900">{user?.username}</h4>
                          <p className="text-sm text-gray-600 capitalize">{request.request_type.replace('_', ' ')}</p>
                          <div className="flex items-center space-x-4 mt-1">
                            <div className="text-xs text-gray-500">
                              {format(new Date(request.start_date), 'MMM d, yyyy')}
                              {request.end_date && ` - ${format(new Date(request.end_date), 'MMM d, yyyy')}`}
                            </div>
                            <Badge className={getStatusColor(request.status)}>
                              {request.status}
                            </Badge>
                          </div>
                          {request.reason && (
                            <p className="text-xs text-gray-500 mt-2">Reason: {request.reason}</p>
                          )}
                        </div>
                      </div>
                      
                      {/* Action Buttons - Only show for pending requests and managers */}
                      {request.status === 'pending' && isManager && (
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
                            <X className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      )}
                      
                      {/* Show approval info for processed requests */}
                      {request.status !== 'pending' && request.approved_at && (
                        <div className="text-right text-xs text-gray-500">
                          <p>Processed: {format(new Date(request.approved_at), 'MMM d, yyyy')}</p>
                        </div>
                      )}
                    </div>
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
