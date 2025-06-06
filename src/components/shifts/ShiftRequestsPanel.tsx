
import React from 'react';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, User, CheckCircle, XCircle } from 'lucide-react';

export const ShiftRequestsPanel = () => {
  // Mock data for shift requests
  const mockRequests = [
    {
      id: '1',
      user_name: 'John Doe',
      shift_title: 'Morning Shift',
      requested_date: '2024-01-15',
      status: 'pending',
      message: 'Would like to work this shift as I am available',
    },
    {
      id: '2',
      user_name: 'Jane Smith',
      shift_title: 'Evening Shift',
      requested_date: '2024-01-16',
      status: 'approved',
      message: 'Can cover this shift for overtime',
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-4">Shift Requests</h2>
        
        <div className="space-y-4">
          {mockRequests.length === 0 ? (
            <Card>
              <CardContent className="p-6">
                <p className="text-gray-500 text-center">No shift requests at this time</p>
              </CardContent>
            </Card>
          ) : (
            mockRequests.map((request) => (
              <Card key={request.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{request.shift_title}</CardTitle>
                    <Badge className={getStatusColor(request.status)}>
                      {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">{request.user_name}</span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">
                        Requested for: {format(new Date(request.requested_date), 'MMMM d, yyyy')}
                      </span>
                    </div>
                    
                    {request.message && (
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-sm text-gray-700">"{request.message}"</p>
                      </div>
                    )}
                    
                    {request.status === 'pending' && (
                      <div className="flex space-x-2 pt-2">
                        <Button size="sm" className="flex items-center space-x-1">
                          <CheckCircle className="h-4 w-4" />
                          <span>Approve</span>
                        </Button>
                        <Button size="sm" variant="outline" className="flex items-center space-x-1">
                          <XCircle className="h-4 w-4" />
                          <span>Reject</span>
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Request Summary</h2>
        
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-yellow-600">
                  {mockRequests.filter(r => r.status === 'pending').length}
                </p>
                <p className="text-sm text-gray-600">Pending Requests</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">
                  {mockRequests.filter(r => r.status === 'approved').length}
                </p>
                <p className="text-sm text-gray-600">Approved Requests</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">
                  {mockRequests.filter(r => r.status === 'rejected').length}
                </p>
                <p className="text-sm text-gray-600">Rejected Requests</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
