
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
const app = initializeApp(firebaseConfig);

const messaging = async () => {
  try {
    const supported = await isSupported();
    return supported ? getMessaging(app) : null;
  } catch (error) {
    console.error('Error checking messaging support:', error);
    return null;
  }
};

export const fetchToken = async () => {
  try {
    const fcmMessaging = await messaging();
    if (!fcmMessaging) {
      console.log('Firebase messaging is not supported in this browser');
      return null;
    }
    
    console.log('Requesting notification permission...');
    
    // Check if permission is already granted
    if (Notification.permission === 'granted') {
      console.log('Notification permission already granted');
    } else if (Notification.permission === 'denied') {
      console.warn('Notification permission denied by user');
      throw new Error('Notification permission denied');
    } else {
      // Request permission
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
        
        // Display a notification even when app is in foreground
        if (payload.notification) {
          // Check if browser supports notifications
          if ('Notification' in window && Notification.permission === 'granted') {
            const { title, body } = payload.notification;
            
            // Create and show notification
            const notification = new Notification(title || 'New Notification', {
              body: body || '',
              icon: '/marvellous-logo-black.png',
              data: payload.data
            });
            
            // Handle notification click
            notification.onclick = () => {
              notification.close();
              
              // Focus window and navigate if URL provided
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
