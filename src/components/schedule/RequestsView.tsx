
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, User } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { ShiftRequestDialog } from './ShiftRequestDialog';
import UserInfoDialog from './UserInfoDialog';
import { useToast } from "@/components/ui/use-toast";

interface ShiftRequest {
  id: string;
  user_id: string;
  request_type: string;
  start_date: string;
  end_date: string;
  reason: string;
  notes: string;
  status: string;
  created_at: string;
}

interface LeaveRequest {
  id: string;
  user_id: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  reason: string;
  notes: string;
  status: string;
  created_at: string;
}

interface RequestsViewProps {
  users: Array<{ id: string; username: string; email: string; role: string; }>;
}

export const RequestsView: React.FC<RequestsViewProps> = ({ users }) => {
  const { currentUser } = useAuth();
  const [shiftRequests, setShiftRequests] = useState<ShiftRequest[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<ShiftRequest | null>(null);
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | undefined>(undefined);
  const [showUserDialog, setShowUserDialog] = useState(false);
  const [activeTab, setActiveTab] = useState<'shift' | 'leave'>('shift');
  const { toast } = useToast();

  useEffect(() => {
    // Mock data for now - replace with actual API calls
    setShiftRequests([]);
    setLeaveRequests([]);
    setLoading(false);
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getRequestTypeColor = (type: string) => {
    switch (type) {
      case 'swap': return 'bg-blue-100 text-blue-800';
      case 'coverage': return 'bg-purple-100 text-purple-800';
      case 'time_off': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleStatusUpdate = async (requestId: string, status: 'approved' | 'rejected', notes?: string) => {
    try {
      // Mock implementation - replace with actual API call
      toast({
        title: "Success",
        description: `Request ${status} successfully`,
      });
    } catch (error) {
      console.error('Error updating request status:', error);
      toast({
        title: "Error",
        description: "Failed to update request status",
        variant: "destructive",
      });
    }
  };

  const handleViewUser = (userId: string) => {
    setSelectedUserId(userId);
    setShowUserDialog(true);
  };

  if (loading) {
    return <div className="text-center py-8">Loading requests...</div>;
  }

  if (error) {
    return <div className="text-center py-8 text-red-600">Error: {error}</div>;
  }

  const activeRequests = activeTab === 'shift' ? shiftRequests : leaveRequests;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Requests Management</h1>
        <div className="flex space-x-2">
          <Button
            variant={activeTab === 'shift' ? 'default' : 'outline'}
            onClick={() => setActiveTab('shift')}
          >
            Shift Requests ({shiftRequests.length})
          </Button>
          <Button
            variant={activeTab === 'leave' ? 'default' : 'outline'}
            onClick={() => setActiveTab('leave')}
          >
            Leave Requests ({leaveRequests.length})
          </Button>
        </div>
      </div>

      <div className="grid gap-4">
        {activeRequests.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-gray-500">
              No {activeTab} requests found
            </CardContent>
          </Card>
        ) : (
          activeRequests.map((request) => (
            <Card key={request.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center space-x-2">
                      <Badge className={getRequestTypeColor(request.request_type)}>
                        {request.request_type?.replace('_', ' ').toUpperCase()}
                      </Badge>
                      <Badge className={getStatusColor(request.status)}>
                        {request.status?.toUpperCase()}
                      </Badge>
                      {request.user_id && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewUser(request.user_id!)}
                          className="flex items-center space-x-1"
                        >
                          <User className="h-4 w-4" />
                          <span>View User</span>
                        </Button>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <p className="font-medium">Request Details:</p>
                      {activeTab === 'shift' ? (
                        <div className="text-sm text-gray-600 space-y-1">
                          <p><strong>Type:</strong> {request.request_type}</p>
                          <p><strong>Start:</strong> {formatDate(request.start_date)}</p>
                          <p><strong>End:</strong> {formatDate(request.end_date)}</p>
                          {request.reason && <p><strong>Reason:</strong> {request.reason}</p>}
                          {request.notes && <p><strong>Notes:</strong> {request.notes}</p>}
                        </div>
                      ) : (
                        <div className="text-sm text-gray-600 space-y-1">
                          <p><strong>Leave Type:</strong> {request.leave_type}</p>
                          <p><strong>Start:</strong> {formatDate(request.start_date)}</p>
                          <p><strong>End:</strong> {formatDate(request.end_date)}</p>
                          {request.reason && <p><strong>Reason:</strong> {request.reason}</p>}
                          {request.notes && <p><strong>Notes:</strong> {request.notes}</p>}
                        </div>
                      )}
                    </div>

                    <div className="text-xs text-gray-500">
                      Submitted: {formatDate(request.created_at || '')}
                    </div>
                  </div>
                  
                  {request.status === 'pending' && currentUser?.role === 'admin' && (
                    <div className="flex space-x-2 ml-4">
                      <Button
                        size="sm"
                        onClick={() => handleStatusUpdate(request.id, 'approved')}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleStatusUpdate(request.id, 'rejected')}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {showUserDialog && selectedUserId && (
        <UserInfoDialog
          open={showUserDialog}
          onClose={() => setShowUserDialog(false)}
          userId={selectedUserId}
        />
      )}

      {showRequestDialog && selectedRequest && (
        <ShiftRequestDialog
          open={showRequestDialog}
          onClose={() => setShowRequestDialog(false)}
          request={selectedRequest}
          onStatusUpdate={handleStatusUpdate}
        />
      )}
    </div>
  );
};
