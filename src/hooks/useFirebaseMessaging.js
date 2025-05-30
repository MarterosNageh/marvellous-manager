
import { useEffect, useState } from 'react';
import { messaging, getToken, onMessage } from '../config/firebase';
import supabase from '../config/supabase';

// VAPID key from Firebase Console
const VAPID_KEY = 'BFlGrK9GG-1qvkGEBhu_HLHLJLrBGvucnrixb4vDX3BLhVP6xoBmaGQTnNh3Kc_Vp_R_1OIyHf-b0aNLXNgqTqc';

export const useFirebaseMessaging = () => {
  const [token, setToken] = useState(null);
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState(Notification.permission);

  useEffect(() => {
    // Check if messaging is supported
    const checkSupport = () => {
      const supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
      setIsSupported(supported);
      return supported;
    };

    if (checkSupport()) {
      initializeMessaging();
    }
  }, []);

  const initializeMessaging = async () => {
    try {
      // Request permission
      const permission = await Notification.requestPermission();
      setPermission(permission);
      
      if (permission === 'granted') {
        // Get FCM token
        const currentToken = await getToken(messaging, { 
          vapidKey: VAPID_KEY 
        });
        
        if (currentToken) {
          console.log('FCM Token:', currentToken);
          setToken(currentToken);
          await saveTokenToSupabase(currentToken);
        } else {
          console.log('No registration token available.');
        }
      }
    } catch (error) {
      console.error('An error occurred while retrieving token. ', error);
    }
  };

  const saveTokenToSupabase = async (token) => {
    try {
      const currentUser = localStorage.getItem('currentUser');
      if (!currentUser) {
        console.log('No current user found');
        return;
      }

      const user = JSON.parse(currentUser);
      
      // Check if token already exists
      const { data: existingToken, error: checkError } = await supabase
        .from('push_tokens')
        .select('*')
        .eq('user_id', user.id)
        .eq('token', token)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Error checking existing token:', checkError);
        return;
      }

      if (!existingToken) {
        // Insert new token
        const { data, error } = await supabase
          .from('push_tokens')
          .insert([
            { 
              user_id: user.id, 
              token: token,
              created_at: new Date().toISOString()
            }
          ]);

        if (error) {
          console.error('Error saving token to Supabase:', error);
        } else {
          console.log('Token saved to Supabase successfully');
        }
      } else {
        console.log('Token already exists in Supabase');
      }
    } catch (error) {
      console.error('Error in saveTokenToSupabase:', error);
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
      return 'denied';
    }
  };

  // Listen for foreground messages
  useEffect(() => {
    if (messaging && permission === 'granted') {
      const unsubscribe = onMessage(messaging, (payload) => {
        console.log('Message received in foreground: ', payload);
        
        // Display notification manually for foreground messages
        if (Notification.permission === 'granted') {
          new Notification(payload.notification.title, {
            body: payload.notification.body,
            icon: payload.notification.icon || '/favicon.ico',
            data: payload.data
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
    requestPermission,
    initializeMessaging
  };
};
