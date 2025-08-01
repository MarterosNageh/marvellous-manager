
import { getApp, getApps, initializeApp } from "firebase/app";
import { getMessaging, getToken, isSupported, onMessage } from "firebase/messaging";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBIw7y43dseUoKSeRjxZ3FC0JwqQvDkPdc",
  authDomain: "marvellous-manager.firebaseapp.com",
  projectId: "marvellous-manager",
  storageBucket: "marvellous-manager.firebasestorage.app",
  messagingSenderId: "368753443778",
  appId: "1:368753443778:web:91898578c1af5b04184c5b",
  measurementId: "G-7PVGNBPXZ7"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

const messaging = async () => {
  try {
    const supported = await isSupported();
    if (!supported) {
      // Check if it's a mobile device
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      if (isMobile) {
        console.log('📱 Mobile device detected, using alternative approach');
        return null;
      }
      console.log('Firebase messaging is not supported in this browser');
      return null;
    }
    return getMessaging(app);
  } catch (error) {
    console.error('Error checking messaging support:', error);
    return null;
  }
};

export const fetchToken = async () => {
  try {
    const fcmMessaging = await messaging();
    
    // Handle mobile devices differently
    if (!fcmMessaging) {
      console.log('Firebase messaging is not supported in this browser');
      return null;
    }
    
    console.log('Requesting notification permission...');
    
    if (Notification.permission === 'granted') {
      console.log('Notification permission already granted');
    } else if (Notification.permission === 'denied') {
      console.warn('Notification permission denied by user');
      throw new Error('Notification permission denied');
    } else {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        console.warn('Failed to get permission for notifications');
        throw new Error('Notification permission not granted');
      }
      console.log('Notification permission granted');
    }
    
    const token = await getToken(fcmMessaging, {
      vapidKey: "BMHNZr9Ik3CyBzIdS_9aeA1LTa85kjQWgIdMhswayeD6FtuUYIXflVJBPzDGWbNUqUx5QDXajEIskPx8Nsk7QNs",
    });
    
    console.log('FCM token obtained:', token ? token.slice(0, 10) + '...' : 'null');
    return token;
  } catch (err) {
    console.error("An error occurred while fetching the token:", err);
    return null;
  }
};

// Set up onMessage handler for foreground notifications
if (typeof window !== 'undefined') {
  messaging().then(messagingInstance => {
    if (messagingInstance) {
      console.log('Setting up foreground message handler');
      onMessage(messagingInstance, (payload) => {
        console.log('Foreground message received:', payload);
        
        // For mobile devices, let the service worker handle notifications
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        if (isMobile) {
          console.log('Mobile device: letting service worker handle notification');
          return;
        }
        
        // For desktop, show notification if app is in foreground
        if (payload.notification) {
          if ('Notification' in window && Notification.permission === 'granted') {
            const { title, body } = payload.notification;
            
            const notification = new Notification(title || 'New Notification', {
              body: body || '',
              icon: '/marvellous-logo-black.png',
              data: payload.data,
              tag: payload.data?.tag || 'default'
            });
            
            notification.onclick = () => {
              notification.close();
              window.focus();
              if (payload.data?.url) {
                window.location.href = payload.data.url;
              }
            };
          }
        }
      });
    }
  });
}

export { app, messaging };
