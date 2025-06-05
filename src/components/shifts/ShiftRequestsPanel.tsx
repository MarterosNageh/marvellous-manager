import React, { useState } from 'react';
import { useShifts } from '@/context/ShiftsContext';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle, XCircle, Clock, Calendar, User } from 'lucide-react';

const ShiftRequestsPanel = () => {
  const { shiftRequests, approveShiftRequest, rejectShiftRequest, loading } = useShifts();
  const [selectedTab, setSelectedTab] = useState("pending");

  const filteredRequests = shiftRequests.filter(request => {
    if (selectedTab === "pending") {
      return request.status === "pending";
    } else if (selectedTab === "approved") {
      return request.status === "approved";
    } else {
      return request.status === "rejected";
    }
  });

  if (loading) {
    return <p>Loading shift requests...</p>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Shift Requests</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="pending" className="w-full" onValueChange={setSelectedTab}>
          <TabsList>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="approved">Approved</TabsTrigger>
            <TabsTrigger value="rejected">Rejected</TabsTrigger>
          </TabsList>
          <TabsContent value="pending">
            {filteredRequests.length === 0 && <p>No pending shift requests.</p>}
            {filteredRequests.map(request => (
              <Card key={request.id} className="mb-4">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{request.employeeName}</span>
                    <Badge variant="secondary">{request.type}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    <User className="mr-2 inline-block h-4 w-4" />
                    {request.employeeName}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    <Calendar className="mr-2 inline-block h-4 w-4" />
                    {format(new Date(request.date), 'PPP')}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    <Clock className="mr-2 inline-block h-4 w-4" />
                    {request.startTime} - {request.endTime}
                  </p>
                  <div className="flex justify-end mt-4">
                    <Button variant="outline" size="sm" onClick={() => approveShiftRequest(request.id)}>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Approve
                    </Button>
                    <Button variant="destructive" size="sm" className="ml-2" onClick={() => rejectShiftRequest(request.id)}>
                      <XCircle className="mr-2 h-4 w-4" />
                      Reject
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
          <TabsContent value="approved">
            {filteredRequests.length === 0 && <p>No approved shift requests.</p>}
            {filteredRequests.map(request => (
              <Card key={request.id} className="mb-4">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{request.employeeName}</span>
                    <Badge variant="secondary">{request.type}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                <p className="text-sm text-muted-foreground">
                    <User className="mr-2 inline-block h-4 w-4" />
                    {request.employeeName}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    <Calendar className="mr-2 inline-block h-4 w-4" />
                    {format(new Date(request.date), 'PPP')}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    <Clock className="mr-2 inline-block h-4 w-4" />
                    {request.startTime} - {request.endTime}
                  </p>
                  <Badge variant="outline" className="mt-4">Approved</Badge>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
          <TabsContent value="rejected">
            {filteredRequests.length === 0 && <p>No rejected shift requests.</p>}
            {filteredRequests.map(request => (
              <Card key={request.id} className="mb-4">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{request.employeeName}</span>
                    <Badge variant="secondary">{request.type}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    <User className="mr-2 inline-block h-4 w-4" />
                    {request.employeeName}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    <Calendar className="mr-2 inline-block h-4 w-4" />
                    {format(new Date(request.date), 'PPP')}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    <Clock className="mr-2 inline-block h-4 w-4" />
                    {request.startTime} - {request.endTime}
                  </p>
                  <Badge variant="destructive" className="mt-4">Rejected</Badge>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default ShiftRequestsPanel;
