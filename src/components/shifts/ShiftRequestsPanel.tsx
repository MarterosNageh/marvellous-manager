
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle, XCircle, Clock, Calendar, User } from 'lucide-react';
import { useShifts } from '@/context/ShiftsContext';
import { useAuth } from '@/context/AuthContext';
import { format } from 'date-fns';

export const ShiftRequestsPanel = () => {
  const { shiftRequests, users, approveShiftRequest, rejectShiftRequest } = useShifts();
  const { currentUser } = useAuth();

  const [activeTab, setActiveTab] = useState('pending');

  const isManager = currentUser?.role === 'manager' || currentUser?.isAdmin;

  // Filter requests based on status
  const pendingRequests = shiftRequests.filter(req => req.status === 'pending');
  const approvedRequests = shiftRequests.filter(req => req.status === 'approved');
  const rejectedRequests = shiftRequests.filter(req => req.status === 'rejected');

  // Filter user's own requests vs all requests (for managers)
  const getUserRequests = (requests: any[]) => {
    if (isManager) {
      return requests;
    }
    return requests.filter(req => req.user_id === currentUser?.id);
  };

  const handleApprove = async (requestId: string) => {
    try {
      await approveShiftRequest(requestId);
    } catch (error) {
      console.error('Failed to approve request:', error);
    }
  };

  const handleReject = async (requestId: string) => {
    try {
      await rejectShiftRequest(requestId);
    } catch (error) {
      console.error('Failed to reject request:', error);
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

  const getRequestTypeBadge = (type: string) => {
    const variants = {
      time_off: 'destructive',
      extra_work: 'default',
      shift_change: 'secondary',
      custom_shift: 'outline'
    } as const;

    return (
      <Badge variant={variants[type as keyof typeof variants] || 'secondary'}>
        {getRequestTypeLabel(type)}
      </Badge>
    );
  };

  const RequestCard = ({ request }: { request: any }) => {
    const user = users.find(u => u.id === request.user_id);
    const approver = request.approved_by ? users.find(u => u.id === request.approved_by) : null;

    return (
      <Card key={request.id} className="mb-4">
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback>
                  {user?.username?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <h4 className="font-medium">{user?.username}</h4>
                  {getRequestTypeBadge(request.request_type)}
                </div>
                
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {format(new Date(request.start_date), 'MMM d, yyyy HH:mm')}
                      {request.end_date && (
                        <> - {format(new Date(request.end_date), 'MMM d, yyyy HH:mm')}</>
                      )}
                    </span>
                  </div>
                  
                  {request.reason && (
                    <div>
                      <span className="font-medium">Reason:</span> {request.reason}
                    </div>
                  )}
                  
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4" />
                    <span>Requested: {format(new Date(request.created_at), 'MMM d, yyyy')}</span>
                  </div>
                  
                  {approver && request.approved_at && (
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4" />
                      <span>
                        {request.status === 'approved' ? 'Approved' : 'Rejected'} by {approver.username} on{' '}
                        {format(new Date(request.approved_at), 'MMM d, yyyy')}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {request.status === 'pending' && isManager && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleApprove(request.id)}
                    className="text-green-600 hover:text-green-700"
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleReject(request.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Reject
                  </Button>
                </>
              )}
              
              <Badge variant={
                request.status === 'approved' ? 'default' :
                request.status === 'rejected' ? 'destructive' : 'secondary'
              }>
                {request.status}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Shift Requests
            {isManager && (
              <Badge variant="outline" className="ml-2">
                Manager View
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="pending" className="flex items-center gap-2">
                Pending
                {pendingRequests.length > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {getUserRequests(pendingRequests).length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="approved">Approved</TabsTrigger>
              <TabsTrigger value="rejected">Rejected</TabsTrigger>
            </TabsList>

            <TabsContent value="pending" className="space-y-4 mt-6">
              {getUserRequests(pendingRequests).length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Clock className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No pending requests</p>
                </div>
              ) : (
                getUserRequests(pendingRequests).map((request) => (
                  <RequestCard key={request.id} request={request} />
                ))
              )}
            </TabsContent>

            <TabsContent value="approved" className="space-y-4 mt-6">
              {getUserRequests(approvedRequests).length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No approved requests</p>
                </div>
              ) : (
                getUserRequests(approvedRequests).map((request) => (
                  <RequestCard key={request.id} request={request} />
                ))
              )}
            </TabsContent>

            <TabsContent value="rejected" className="space-y-4 mt-6">
              {getUserRequests(rejectedRequests).length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <XCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No rejected requests</p>
                </div>
              ) : (
                getUserRequests(rejectedRequests).map((request) => (
                  <RequestCard key={request.id} request={request} />
                ))
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
