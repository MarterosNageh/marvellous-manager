import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useShifts } from "@/context/ShiftsContext";
import { useAuth } from "@/context/AuthContext";
import { ShiftRequestDialog } from "./ShiftRequestDialog";
import { format } from "date-fns";

export const ShiftRequestsPanel = () => {
  const { shiftRequests } = useShifts();
  const { currentUser } = useAuth();
  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  
  // Filter requests based on user role
  // Admins can see all requests, regular users only see their own
  const filteredRequests = currentUser?.isAdmin 
    ? shiftRequests
    : shiftRequests.filter(req => req.user_id === currentUser?.id);
  
  const pendingRequests = filteredRequests.filter(req => req.status === "pending");
  const otherRequests = filteredRequests.filter(req => req.status !== "pending");

  const handleApprove = (requestId) => {
    console.log("Approve request:", requestId);
    // Call context function to update request status
  };
  
  const handleReject = (requestId) => {
    console.log("Reject request:", requestId);
    // Call context function to update request status
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Shift Requests</CardTitle>
        <Button size="sm" onClick={() => {
          setSelectedRequest(null);
          setIsRequestDialogOpen(true);
        }}>
          New Request
        </Button>
      </CardHeader>
      <CardContent>
        {pendingRequests.length > 0 && (
          <>
            <h3 className="font-medium mb-2">Pending Requests</h3>
            <div className="space-y-3 mb-4">
              {pendingRequests.map((request) => (
                <RequestCard 
                  key={request.id} 
                  request={request} 
                  isAdmin={currentUser?.isAdmin}
                  onApprove={handleApprove}
                  onReject={handleReject}
                />
              ))}
            </div>
          </>
        )}
        
        {otherRequests.length > 0 && (
          <>
            <h3 className="font-medium mb-2">Past Requests</h3>
            <div className="space-y-3">
              {otherRequests.map((request) => (
                <RequestCard 
                  key={request.id} 
                  request={request} 
                  isAdmin={currentUser?.isAdmin}
                />
              ))}
            </div>
          </>
        )}
        
        {filteredRequests.length === 0 && (
          <div className="text-center py-4 text-muted-foreground">
            No shift requests found.
          </div>
        )}
        
        <ShiftRequestDialog
          open={isRequestDialogOpen}
          onOpenChange={setIsRequestDialogOpen}
        />
      </CardContent>
    </Card>
  );
};

const RequestCard = ({ request, isAdmin, onApprove, onReject }) => {
  let statusBadge;
  switch (request.status) {
    case "pending":
      statusBadge = <Badge variant="outline">Pending</Badge>;
      break;
    case "approved":
      statusBadge = <Badge variant="success">Approved</Badge>;
      break;
    case "rejected":
      statusBadge = <Badge variant="destructive">Rejected</Badge>;
      break;
    default:
      statusBadge = <Badge variant="outline">{request.status}</Badge>;
  }

  return (
    <Card>
      <CardContent className="p-3">
        <div className="flex justify-between items-start">
          <div>
            <div className="text-sm font-medium">
              {request.request_type === "time_off" ? "Time Off Request" : "Schedule Change"}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {format(new Date(request.created_at), "MMM d, yyyy")}
            </div>
            <div className="mt-2 text-sm">
              {request.request_type === "time_off" ? (
                <>
                  <span className="font-medium">Dates: </span> 
                  {format(new Date(request.start_date), "MMM d")} 
                  {request.end_date && ` - ${format(new Date(request.end_date), "MMM d")}`}
                </>
              ) : (
                <span className="font-medium">Shift Change Requested</span>
              )}
            </div>
            {request.reason && (
              <div className="mt-1 text-xs">
                <span className="font-medium">Reason: </span> 
                {request.reason}
              </div>
            )}
          </div>
          
          <div className="flex flex-col items-end">
            {statusBadge}
            
            {isAdmin && request.status === "pending" && (
              <div className="mt-2 flex gap-2">
                <Button 
                  size="sm" 
                  variant="outline"
                  className="h-7 text-xs"
                  onClick={() => onApprove && onApprove(request.id)}
                >
                  Approve
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="h-7 text-xs"
                  onClick={() => onReject && onReject(request.id)}
                >
                  Reject
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
