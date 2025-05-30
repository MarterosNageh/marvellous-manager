import { useEffect, useState } from 'react';
import { messaging, getToken, onMessage } from '../config/firebase';
import { supabase } from '@/integrations/supabase/client';

// Correct VAPID key for marvellous-manager project
const VAPID_KEY = 'BL7ELSlram2dAgx2Hm1BTEKD9EjvCcxkIqJaUNZjD1HNg_O2zzMiA5d9I5A5mPKZJVk7T2tLWS-4kzRv6fTuwS4';

export const useFirebaseMessaging = () => {
  const [token, setToken] = useState(null);
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState(Notification.permission);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check if messaging is supported
    const checkSupport = () => {
      const supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
      setIsSupported(supported);
      
      if (!supported) {
        setError('Push notifications are not supported in this browser');
        console.error('Push notifications not supported');
      }
      
      return supported;
    };

    if (checkSupport()) {
      initializeMessaging();
    }
  }, []);

  const saveTokenToSupabase = async (fcmToken) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.error('No authenticated user found');
        return;
      }

      const { data, error } = await supabase
        .from('push_subscriptions')
        .upsert({
          user_id: user.id,
          endpoint: `https://fcm.googleapis.com/fcm/${fcmToken}`,
          p256dh: 'FCM',
          auth: 'FCM',
          created_at: new Date().toISOString()
        }, {
          onConflict: 'endpoint'
        });

      if (error) {
        console.error('Error saving FCM token:', error);
        throw error;
      }

      console.log('FCM token saved successfully');
      return data;
    } catch (error) {
      console.error('Error in saveTokenToSupabase:', error);
      throw error;
    }
  };

  const initializeMessaging = async () => {
    try {
      // Check if service worker is registered
      const registration = await navigator.serviceWorker.ready;
      console.log('Service Worker ready:', registration);

      // Request permission
      const permission = await Notification.requestPermission();
      setPermission(permission);
      console.log('Notification permission:', permission);
      
      if (permission === 'granted') {
        // Get FCM token
        const currentToken = await getToken(messaging, { 
          vapidKey: VAPID_KEY,
          serviceWorkerRegistration: registration
        });
        
        if (currentToken) {
          console.log('FCM Token obtained:', currentToken);
          setToken(currentToken);
          await saveTokenToSupabase(currentToken);
        } else {
          const error = 'No registration token available.';
          console.error(error);
          setError(error);
        }
      } else {
        const error = `Notification permission ${permission}`;
        console.error(error);
        setError(error);
      }
    } catch (error) {
      console.error('Error initializing messaging:', error);
      setError(error.message);
    }
  };

  const requestPermission = async () => {
    try {
      const permission = await Notification.requestPermission();
      setPermission(permission);
      
      if (permission === 'granted') {
        await initializeMessaging();
      }
      
      return permission;
    } catch (error) {
      console.error('Error requesting permission:', error);
      setError(error.message);
      return 'denied';
    }
  };

  // Listen for foreground messages
  useEffect(() => {
    if (messaging && permission === 'granted') {
      const unsubscribe = onMessage(messaging, (payload) => {
        console.log('Message received in foreground:', payload);
        
        // Display notification manually for foreground messages
        if (Notification.permission === 'granted') {
          new Notification(payload.notification.title, {
            body: payload.notification.body,
            icon: payload.notification.icon || '/favicon.ico',
            badge: '/favicon.ico',
            data: payload.data || {},
            requireInteraction: true,
            tag: payload.data?.tag || 'fcm-notification'
          });
        }
      });

      return () => unsubscribe();
    }
  }, [permission]);

  return {
    token,
    isSupported,
    permission,
    error,
    requestPermission,
    initializeMessaging
  };
};
