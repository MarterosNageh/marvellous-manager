
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, BellOff, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { usePushNotifications } from '@/hooks/usePushNotifications';

export const FCMSetup = () => {
  const {
    isSupported,
    isSubscribed,
    isLoading,
    subscribeToPush,
    unsubscribeFromPush,
    pushNotificationService,
    checkSubscriptionStatus,
  } = usePushNotifications();
  
  const [debugInfo, setDebugInfo] = useState(null);
  const { toast } = useToast();

  // Get debug information
  const getDebugInfo = async () => {
    try {
      const currentUser = localStorage.getItem('currentUser');
      if (!currentUser) return null;

      const user = JSON.parse(currentUser);
      
      // Check browser subscription
      const registration = await navigator.serviceWorker.ready;
      const browserSub = await registration.pushManager.getSubscription();
      
      // Check database subscription
      const dbStatus = await pushNotificationService.getSubscriptionStatus();
      
      return {
        userId: user.id,
        browserSubscription: !!browserSub,
        databaseSubscription: dbStatus,
        endpoint: browserSub?.endpoint?.substring(0, 50) + '...' || 'None',
        permission: Notification.permission,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error getting debug info:', error);
      return { error: error.message };
    }
  };

  useEffect(() => {
    if (isSupported) {
      getDebugInfo().then(setDebugInfo);
    }
  }, [isSupported, isSubscribed]);

  const handleEnableNotifications = async () => {
    console.log('🔔 User clicked Enable Notifications');
    const success = await subscribeToPush();
    
    if (success) {
      // Refresh debug info
      const newDebugInfo = await getDebugInfo();
      setDebugInfo(newDebugInfo);
      
      // Check comprehensive subscription status
      await pushNotificationService.checkAllSubscriptions();
    }
  };

  const handleDisableNotifications = async () => {
    console.log('🔕 User clicked Disable Notifications');
    await unsubscribeFromPush();
    
    // Refresh debug info
    const newDebugInfo = await getDebugInfo();
    setDebugInfo(newDebugInfo);
  };

  const handleRefreshStatus = async () => {
    console.log('🔄 Refreshing subscription status...');
    await checkSubscriptionStatus();
    const newDebugInfo = await getDebugInfo();
    setDebugInfo(newDebugInfo);
    
    toast({
      title: "Status Refreshed",
      description: "Subscription status has been updated",
    });
  };

  const getStatusBadge = () => {
    if (!isSupported) return <Badge variant="destructive">Not Supported</Badge>;
    if (isSubscribed) return <Badge className="bg-green-100 text-green-800">Enabled</Badge>;
    if (Notification.permission === 'denied') return <Badge variant="destructive">Blocked</Badge>;
    return <Badge variant="secondary">Disabled</Badge>;
  };

  const getStatusIcon = () => {
    if (isSubscribed) return <CheckCircle className="h-4 w-4 text-green-500" />;
    if (Notification.permission === 'denied') return <AlertCircle className="h-4 w-4 text-red-500" />;
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
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefreshStatus}
              disabled={isLoading}
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Refresh
            </Button>
            
            {!isSubscribed ? (
              <Button
                onClick={handleEnableNotifications}
                disabled={isLoading || Notification.permission === 'denied'}
                className="flex items-center gap-2"
              >
                <Bell className="h-4 w-4" />
                {isLoading ? 'Setting up...' : 'Enable Notifications'}
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={handleDisableNotifications}
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                <BellOff className="h-4 w-4" />
                Disable Notifications
              </Button>
            )}
          </div>
        </div>

        {isSubscribed && (
          <div className="p-3 bg-green-50 rounded-lg">
            <div className="flex items-center gap-2 text-green-700 mb-2">
              <CheckCircle className="h-4 w-4" />
              <span className="font-medium">Notifications Active</span>
            </div>
            <p className="text-sm text-green-600">
              Your device is registered for push notifications!
            </p>
            {debugInfo?.endpoint && (
              <p className="text-xs text-green-500 mt-1">
                Endpoint: {debugInfo.endpoint}
              </p>
            )}
          </div>
        )}

        {Notification.permission === 'denied' && (
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

        {!isSubscribed && Notification.permission !== 'denied' && (
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

        {debugInfo && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Debug Information</h4>
            <div className="text-xs text-gray-600 space-y-1">
              <div>User ID: {debugInfo.userId}</div>
              <div>Permission: {debugInfo.permission}</div>
              <div>Browser Subscription: {debugInfo.browserSubscription ? 'Yes' : 'No'}</div>
              <div>Database Subscription: {debugInfo.databaseSubscription ? 'Yes' : 'No'}</div>
              <div>Endpoint: {debugInfo.endpoint}</div>
              <div>Last Checked: {new Date(debugInfo.timestamp).toLocaleTimeString()}</div>
            </div>
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
