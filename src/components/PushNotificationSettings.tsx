
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, BellOff, Smartphone } from 'lucide-react';
import { usePushNotifications } from '@/hooks/usePushNotifications';

export const PushNotificationSettings = () => {
  const {
    isSupported,
    isSubscribed,
    isLoading,
    subscribeToPush,
    unsubscribeFromPush,
  } = usePushNotifications();

  if (!isSupported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Push Notifications
          </CardTitle>
          <CardDescription>
            Push notifications are not supported in this browser
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Badge variant="destructive">Not Supported</Badge>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Push Notifications
        </CardTitle>
        <CardDescription>
          Receive real-time notifications for task updates and assignments
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>Status:</span>
            <Badge variant={isSubscribed ? "default" : "secondary"}>
              {isSubscribed ? "Enabled" : "Disabled"}
            </Badge>
          </div>
          
          {isSubscribed ? (
            <Button
              variant="outline"
              size="sm"
              onClick={unsubscribeFromPush}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <BellOff className="h-4 w-4" />
              Disable
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={subscribeToPush}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <Bell className="h-4 w-4" />
              Enable
            </Button>
          )}
        </div>
        
        <div className="text-sm text-muted-foreground">
          {isSubscribed 
            ? "You'll receive push notifications for task assignments and updates."
            : "Enable push notifications to stay updated on task changes even when the app is closed."
          }
        </div>
      </CardContent>
    </Card>
  );
};
