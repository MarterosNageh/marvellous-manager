
import { useEffect, useState } from 'react';
import { pushNotificationService } from '@/services/pushNotificationService';
import { useToast } from '@/hooks/use-toast';

export const usePushNotifications = () => {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Check if push notifications are supported
    const supported = 'serviceWorker' in navigator && 'PushManager' in window;
    setIsSupported(supported);
    console.log('🔍 Push notifications supported:', supported);

    if (supported) {
      checkSubscriptionStatus();
    }
  }, []);

  const checkSubscriptionStatus = async () => {
    try {
      console.log('🔍 Checking subscription status...');
      
      // Check both browser subscription and database subscription
      const registration = await navigator.serviceWorker.ready;
      const browserSubscription = await registration.pushManager.getSubscription();
      console.log('🔍 Browser subscription:', browserSubscription ? 'Found' : 'None');
      
      const databaseSubscription = await pushNotificationService.getSubscriptionStatus();
      console.log('🔍 Database subscription:', databaseSubscription ? 'Found' : 'None');
      
      // Only consider subscribed if both browser and database have subscription
      const actuallySubscribed = !!(browserSubscription && databaseSubscription);
      console.log('🔍 Actually subscribed:', actuallySubscribed);
      
      setIsSubscribed(actuallySubscribed);
    } catch (error) {
      console.error('Error checking subscription status:', error);
      setIsSubscribed(false);
    }
  };

  const subscribeToPush = async () => {
    setIsLoading(true);
    console.log('🔔 Starting push subscription process...');
    
    try {
      const success = await pushNotificationService.requestPermissionAndSubscribe();
      if (success) {
        setIsSubscribed(true);
        toast({
          title: "Success",
          description: "Push notifications enabled successfully",
        });
        
        // Verify the subscription is working
        await checkSubscriptionStatus();
      } else {
        toast({
          title: "Error",
          description: "Failed to enable push notifications. Check console for details.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error subscribing to push:', error);
      toast({
        title: "Error",
        description: "Failed to enable push notifications",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const unsubscribeFromPush = async () => {
    setIsLoading(true);
    try {
      const success = await pushNotificationService.unsubscribe();
      if (success) {
        setIsSubscribed(false);
        toast({
          title: "Success",
          description: "Push notifications disabled",
        });
      }
    } catch (error) {
      console.error('Error unsubscribing from push:', error);
      toast({
        title: "Error",
        description: "Failed to disable push notifications",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isSupported,
    isSubscribed,
    isLoading,
    subscribeToPush,
    unsubscribeFromPush,
    pushNotificationService,
    checkSubscriptionStatus,
  };
};
