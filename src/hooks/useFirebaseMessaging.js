
import { useEffect, useState } from 'react';
import { messaging, getToken, onMessage } from '../config/firebase';
import { supabase } from '@/integrations/supabase/client';

// Your VAPID key
const VAPID_KEY = 'BFlGrK9GG-1qvkGEBhu_HLHLJLrBGvucnrixb4vDX3BLhVP6xoBmaGQTnNh3Kc_Vp_R_1OIyHf-b0aNLXNgqTqc';

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
          
          // Save token to Supabase
          await saveTokenToDatabase(currentToken);
        } else {
          const error = 'No registration token available. Firebase SDK could not get a token.';
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

  const saveTokenToDatabase = async (fcmToken) => {
    try {
      const currentUser = localStorage.getItem('currentUser');
      if (!currentUser) {
        console.error('No user logged in');
        return;
      }

      const user = JSON.parse(currentUser);
      
      // Save or update the FCM token in Supabase
      const { error } = await supabase
        .from('push_subscriptions')
        .upsert({
          user_id: user.id,
          endpoint: fcmToken,
          p256dh_key: '', // FCM handles this internally
          auth_key: ''    // FCM handles this internally
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        console.error('Error saving FCM token:', error);
      } else {
        console.log('FCM token saved successfully');
      }
    } catch (error) {
      console.error('Error saving token to database:', error);
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
