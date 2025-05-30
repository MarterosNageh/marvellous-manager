
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Calendar, Clock, User, CheckCircle, XCircle, Filter } from 'lucide-react';
import { useShifts } from '@/context/ShiftsContext';
import { useAuth } from '@/context/AuthContext';
import { format } from 'date-fns';

type RequestFilterType = 'all' | 'pending' | 'approved' | 'rejected';

export const ShiftRequestsPanel = () => {
  const { shiftRequests, users, approveShiftRequest, rejectShiftRequest } = useShifts();
  const { currentUser } = useAuth();
  const [filter, setFilter] = useState<RequestFilterType>('all');

  // Filter requests based on selected filter
  const getFilteredRequests = () => {
    switch (filter) {
      case 'pending':
        return shiftRequests.filter(req => req.status === 'pending');
      case 'approved':
        return shiftRequests.filter(req => req.status === 'approved');
      case 'rejected':
        return shiftRequests.filter(req => req.status === 'rejected');
      default:
        return shiftRequests;
    }
  };

  const filteredRequests = getFilteredRequests();

  const handleApprove = async (requestId: string) => {
    await approveShiftRequest(requestId);
  };

  const handleReject = async (requestId: string) => {
    await rejectShiftRequest(requestId);
  };

  const filterButtons = [
    { key: 'all' as RequestFilterType, label: 'All Requests', count: shiftRequests.length },
    { key: 'pending' as RequestFilterType, label: 'Pending', count: shiftRequests.filter(r => r.status === 'pending').length },
    { key: 'approved' as RequestFilterType, label: 'Approved', count: shiftRequests.filter(r => r.status === 'approved').length },
    { key: 'rejected' as RequestFilterType, label: 'Rejected', count: shiftRequests.filter(r => r.status === 'rejected').length },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRequestTypeLabel = (type: string) => {
    switch (type) {
      case 'time_off': return 'Time Off';
      case 'extra_work': return 'Extra Work';
      case 'shift_change': return 'Shift Change';
      default: return type;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
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
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {filter === 'all' ? 'All Requests' : 
             filter === 'pending' ? 'Pending Requests' :
             filter === 'approved' ? 'Approved Requests' : 'Rejected Requests'}
            <Badge variant="secondary">{filteredRequests.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredRequests.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No shift requests found for the selected filter</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredRequests.map((request) => {
                const user = users.find(u => u.id === request.user_id);
                
                return (
                  <div key={request.id} className="p-4 rounded-lg border bg-white border-gray-200">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4">
                        <Avatar className="h-12 w-12">
                          <AvatarFallback className="bg-blue-100 text-blue-600 text-sm font-medium">
                            {user?.username?.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 className="font-semibold text-gray-900">{user?.username}</h4>
                          <p className="text-sm text-gray-600">{getRequestTypeLabel(request.request_type)}</p>
                          <div className="flex items-center space-x-4 mt-2">
                            <div className="flex items-center space-x-1 text-xs text-gray-500">
                              <Calendar className="h-3 w-3" />
                              <span>
                                {format(new Date(request.start_date), 'MMM d, yyyy')}
                                {request.end_date && ` - ${format(new Date(request.end_date), 'MMM d, yyyy')}`}
                              </span>
                            </div>
                          </div>
                          {request.reason && (
                            <p className="text-xs text-gray-500 mt-2 max-w-md">{request.reason}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end space-y-2">
                        <Badge className={getStatusColor(request.status)}>
                          {request.status}
                        </Badge>
                        {request.status === 'pending' && currentUser?.isAdmin && (
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-green-600 border-green-300 hover:bg-green-50"
                              onClick={() => handleApprove(request.id)}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 border-red-300 hover:bg-red-50"
                              onClick={() => handleReject(request.id)}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </div>
                        )}
                        <div className="text-xs text-gray-500">
                          Requested {format(new Date(request.created_at), 'MMM d, yyyy')}
                        </div>
                      </div>
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
