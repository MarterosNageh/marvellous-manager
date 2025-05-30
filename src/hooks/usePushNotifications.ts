
import { useEffect, useState, useRef } from 'react';
import { pushNotificationService } from '@/services/pushNotificationService';
import { useToast } from '@/hooks/use-toast';

export const usePushNotifications = () => {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
  // Use refs to prevent multiple concurrent setups
  const isSetupInProgress = useRef(false);
  const lastCheckTime = useRef(0);
  const CHECK_COOLDOWN = 5000; // 5 seconds cooldown between checks

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
    // Prevent excessive checking
    const now = Date.now();
    if (now - lastCheckTime.current < CHECK_COOLDOWN) {
      console.log('🔍 Skipping subscription check (cooldown active)');
      return;
    }
    lastCheckTime.current = now;

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
    // Prevent multiple concurrent setups
    if (isSetupInProgress.current) {
      console.log('🔍 Setup already in progress, skipping...');
      return false;
    }

    setIsLoading(true);
    isSetupInProgress.current = true;
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
        setTimeout(() => checkSubscriptionStatus(), 1000);
      } else {
        toast({
          title: "Error",
          description: "Failed to enable push notifications. Check console for details.",
          variant: "destructive",
        });
      }
      return success;
    } catch (error) {
      console.error('Error subscribing to push:', error);
      toast({
        title: "Error",
        description: "Failed to enable push notifications",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
      isSetupInProgress.current = false;
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
