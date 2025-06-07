
import React, { useState, useEffect } from 'react';
import { useShifts } from '@/context/ShiftsContext';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Clock, Calendar, User, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { ShiftRequestDialog } from './ShiftRequestDialog';
import { useToast } from '@/hooks/use-toast';

export const ShiftRequestsPanel = () => {
  const { shiftRequests, users, updateShiftRequest } = useShifts();
  const [currentUser, setCurrentUser] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    const user = localStorage.getItem('currentUser');
    if (user) {
      setCurrentUser(JSON.parse(user));
    }
  }, []);

  const isAdmin = currentUser?.isAdmin || currentUser?.role === 'manager';

  const pendingRequests = shiftRequests?.filter(req => req.status === 'pending') || [];
  const approvedRequests = shiftRequests?.filter(req => req.status === 'approved') || [];
  const rejectedRequests = shiftRequests?.filter(req => req.status === 'rejected') || [];

  const handleApproveRequest = async (requestId: string) => {
    try {
      await updateShiftRequest(requestId, {
        status: 'approved',
        approved_by: currentUser?.id,
        approved_at: new Date().toISOString()
      });
      toast({
        title: "Request Approved",
        description: "The shift request has been approved successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to approve the request. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      await updateShiftRequest(requestId, {
        status: 'rejected',
        approved_by: currentUser?.id,
        approved_at: new Date().toISOString()
      });
      toast({
        title: "Request Rejected",
        description: "The shift request has been rejected.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reject the request. Please try again.",
        variant: "destructive",
      });
    }
  };

  const renderRequestCard = (request: any) => {
    const user = users?.find(u => u.id === request.user_id);
    const approver = users?.find(u => u.id === request.approved_by);
    
    return (
      <Card key={request.id} className="mb-4">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg capitalize">{request.request_type}</CardTitle>
            <Badge 
              variant={request.status === 'approved' ? 'default' : 
                      request.status === 'rejected' ? 'destructive' : 'secondary'}
            >
              {request.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-gray-500" />
              <span className="text-sm">{user?.username || 'Unknown User'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <span className="text-sm">
                {format(new Date(request.start_date), 'MMM d, yyyy')}
                {request.end_date && ` - ${format(new Date(request.end_date), 'MMM d, yyyy')}`}
              </span>
            </div>
          </div>
          
          {request.reason && (
            <div>
              <p className="text-sm font-medium text-gray-700">Reason:</p>
              <p className="text-sm text-gray-600">{request.reason}</p>
            </div>
          )}
          
          {request.approved_by && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <CheckCircle className="h-4 w-4" />
              <span>
                {request.status === 'approved' ? 'Approved' : 'Rejected'} by {approver?.username}
              </span>
            </div>
          )}

          {isAdmin && request.status === 'pending' && (
            <div className="flex gap-2 pt-2">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="sm" variant="default">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Approve
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Approve Request</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to approve this {request.request_type} request from {user?.username}?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleApproveRequest(request.id)}>
                      Approve
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="sm" variant="destructive">
                    <XCircle className="h-4 w-4 mr-1" />
                    Reject
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Reject Request</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to reject this {request.request_type} request from {user?.username}?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleRejectRequest(request.id)}>
                      Reject
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Shift Requests</h2>
          <p className="text-muted-foreground">
            {isAdmin ? 'Manage and review shift requests' : 'Your shift requests'}
          </p>
        </div>
        <ShiftRequestDialog>
          <Button>
            <Clock className="mr-2 h-4 w-4" />
            New Request
          </Button>
        </ShiftRequestDialog>
      </div>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pending">
            Pending ({pendingRequests.length})
          </TabsTrigger>
          <TabsTrigger value="approved">
            Approved ({approvedRequests.length})
          </TabsTrigger>
          <TabsTrigger value="rejected">
            Rejected ({rejectedRequests.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-6">
          {pendingRequests.length === 0 ? (
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-medium">No pending requests</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {isAdmin ? 'All requests have been processed.' : 'You have no pending requests.'}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div>
              {pendingRequests.map(renderRequestCard)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="approved" className="mt-6">
          {approvedRequests.length === 0 ? (
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <CheckCircle className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-medium">No approved requests</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    No requests have been approved yet.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div>
              {approvedRequests.map(renderRequestCard)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="rejected" className="mt-6">
          {rejectedRequests.length === 0 ? (
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <XCircle className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-medium">No rejected requests</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    No requests have been rejected.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div>
              {rejectedRequests.map(renderRequestCard)}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
