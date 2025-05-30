
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, BellOff, CheckCircle, AlertCircle } from 'lucide-react';
import { useFirebaseMessaging } from '../hooks/useFirebaseMessaging';
import { useToast } from '@/hooks/use-toast';

export const FCMSetup = () => {
  const { 
    token, 
    isSupported, 
    permission, 
    requestPermission, 
    initializeMessaging 
  } = useFirebaseMessaging();
  
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleEnableNotifications = async () => {
    setIsLoading(true);
    try {
      const result = await requestPermission();
      if (result === 'granted') {
        toast({
          title: "✅ Notifications Enabled!",
          description: "You'll now receive push notifications for task updates.",
        });
      } else {
        toast({
          title: "❌ Permission Denied",
          description: "Please enable notifications in your browser settings.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error enabling notifications:', error);
      toast({
        title: "❌ Setup Failed",
        description: "Failed to setup notifications. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = () => {
    if (!isSupported) return <Badge variant="destructive">Not Supported</Badge>;
    if (permission === 'granted') return <Badge className="bg-green-100 text-green-800">Enabled</Badge>;
    if (permission === 'denied') return <Badge variant="destructive">Blocked</Badge>;
    return <Badge variant="secondary">Not Set</Badge>;
  };

  const getStatusIcon = () => {
    if (permission === 'granted') return <CheckCircle className="h-4 w-4 text-green-500" />;
    if (permission === 'denied') return <AlertCircle className="h-4 w-4 text-red-500" />;
    return <Bell className="h-4 w-4 text-gray-400" />;
  };

  if (!isSupported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            Push Notifications Not Supported
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Your browser doesn't support push notifications. Please use a modern browser like Chrome, Firefox, or Safari.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {getStatusIcon()}
          Firebase Cloud Messaging Setup
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Status:</span>
            {getStatusBadge()}
          </div>
          
          {permission !== 'granted' && (
            <Button
              onClick={handleEnableNotifications}
              disabled={isLoading || permission === 'denied'}
              className="flex items-center gap-2"
            >
              <Bell className="h-4 w-4" />
              {isLoading ? 'Setting up...' : 'Enable Notifications'}
            </Button>
          )}
        </div>

        {permission === 'granted' && token && (
          <div className="p-3 bg-green-50 rounded-lg">
            <div className="flex items-center gap-2 text-green-700 mb-2">
              <CheckCircle className="h-4 w-4" />
              <span className="font-medium">Notifications Active</span>
            </div>
            <p className="text-sm text-green-600">
              FCM Token: {token.substring(0, 30)}...
            </p>
            <p className="text-xs text-green-500 mt-1">
              Your device is registered for push notifications!
            </p>
          </div>
        )}

        {permission === 'denied' && (
          <div className="p-3 bg-red-50 rounded-lg">
            <div className="flex items-center gap-2 text-red-700 mb-2">
              <AlertCircle className="h-4 w-4" />
              <span className="font-medium">Notifications Blocked</span>
            </div>
            <p className="text-sm text-red-600">
              Notifications are blocked. Please enable them manually in your browser settings:
            </p>
            <ol className="text-xs text-red-500 mt-1 ml-4 list-decimal">
              <li>Click the lock icon in your address bar</li>
              <li>Change notifications to "Allow"</li>
              <li>Refresh this page</li>
            </ol>
          </div>
        )}

        {permission === 'default' && (
          <div className="p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-2 text-blue-700 mb-2">
              <Bell className="h-4 w-4" />
              <span className="font-medium">Setup Required</span>
            </div>
            <p className="text-sm text-blue-600">
              Enable push notifications to receive real-time updates for task assignments and changes.
            </p>
          </div>
        )}

        <div className="text-xs text-muted-foreground">
          <p>• Notifications work even when the app is closed</p>
          <p>• Uses Firebase Cloud Messaging (FCM)</p>
          <p>• Stored securely in your Supabase database</p>
        </div>
      </CardContent>
    </Card>
  );
};
