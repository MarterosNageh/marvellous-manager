
console.log('🔧 Service Worker loaded for FCM');

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBIw7y43dseUoKSeRjxZ3FC0JwqQvDkPdc",
  authDomain: "marvellous-manager.firebaseapp.com",
  projectId: "marvellous-manager",
  storageBucket: "marvellous-manager.firebasestorage.app",
  messagingSenderId: "368753443778",
  appId: "1:368753443778:web:2f5c47c984bee1f3184c5b",
  measurementId: "G-YBBC3CXLEF"
};

// Correct VAPID key
const VAPID_KEY = 'BL7ELSlram2dAgx2Hm1BTEKD9EjvCcxkIqJaUNZjD1HNg_O2zzMiA5d9I5A5mPKZJVk7T2tLWS-4kzRv6fTuwS4';

console.log('🔑 Using VAPID key:', VAPID_KEY.substring(0, 30) + '...');
console.log('🔥 Firebase Project:', firebaseConfig.projectId);

self.addEventListener('push', function(event) {
  console.log('📱 Push event received:', event);
  
  if (event.data) {
    const data = event.data.json();
    console.log('📱 Push data:', data);
    
    const options = {
      body: data.body || data.message,
      icon: data.icon || '/favicon.ico',
      badge: data.badge || '/favicon.ico',
      vibrate: [200, 100, 200, 100, 200],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: data.taskId || data.data?.taskId || '1',
        url: data.data?.url || '/task-manager',
        test: data.test || false,
        type: data.type || 'fcm',
        firebaseProject: firebaseConfig.projectId
      },
      actions: [
        {
          action: 'explore', 
          title: 'View Task',
          icon: '/favicon.ico'
        },
        {
          action: 'close', 
          title: 'Close',
          icon: '/favicon.ico'
        }
      ],
      requireInteraction: true,
      silent: false,
      tag: data.tag || 'fcm-notification',
      timestamp: Date.now()
    };
    
    console.log('📱 Showing notification:', options);
    
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  } else {
    console.log('📱 Push event received but no data');
    
    // Show a default notification
    event.waitUntil(
      self.registration.showNotification('New Notification', {
        body: 'You have a new notification',
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        vibrate: [200, 100, 200],
        requireInteraction: true,
        tag: 'fcm-default',
        data: {
          url: '/task-manager',
          type: 'fcm-default',
          firebaseProject: firebaseConfig.projectId
        }
      })
    );
  }
});

self.addEventListener('notificationclick', function(event) {
  console.log('🖱️ Notification clicked:', event.action, event.notification.data);
  
  event.notification.close();
  
  if (event.action === 'explore' || !event.action) {
    const urlToOpen = event.notification.data?.url || '/task-manager';
    console.log('🔗 Opening URL:', urlToOpen);
    
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
        // Check if there's already a tab open with our app
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            console.log('🔄 Focusing existing tab');
            return client.focus();
          }
        }
        
        // No existing tab found, open a new one
        console.log('🆕 Opening new tab');
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
    );
  }
});

// Handle notification close
self.addEventListener('notificationclose', function(event) {
  console.log('❌ Notification closed:', event.notification.data);
});

// Handle service worker activation
self.addEventListener('activate', function(event) {
  console.log('🚀 Service Worker activated');
  event.waitUntil(self.clients.claim());
});

// Handle service worker installation
self.addEventListener('install', function(event) {
  console.log('📦 Service Worker installed');
  event.waitUntil(self.skipWaiting());
});
