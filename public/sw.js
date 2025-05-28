
console.log('🔧 Firebase FCM Enhanced Service Worker loaded');

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

self.addEventListener('push', function(event) {
  console.log('📱 Firebase FCM Enhanced Push event received:', event);
  console.log('🔥 Firebase Project:', firebaseConfig.projectId);
  
  if (event.data) {
    const data = event.data.json();
    console.log('📱 Firebase FCM Enhanced Push data:', data);
    
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
        type: data.type || 'firebase-fcm',
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
      tag: data.tag || 'firebase-fcm',
      timestamp: Date.now()
    };
    
    console.log('📱 Showing Firebase FCM enhanced notification with options:', options);
    
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  } else {
    console.log('📱 Firebase FCM Push event received but no data');
    
    // Show a default notification
    event.waitUntil(
      self.registration.showNotification('New Notification', {
        body: 'You have a new notification from Firebase FCM',
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        vibrate: [200, 100, 200],
        requireInteraction: true,
        tag: 'firebase-fcm-default',
        data: {
          url: '/task-manager',
          type: 'firebase-fcm-default',
          firebaseProject: firebaseConfig.projectId
        }
      })
    );
  }
});

self.addEventListener('message', function(event) {
  console.log('💬 Firebase FCM Enhanced Service Worker message received:', event.data);
  
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, message, taskId } = event.data;
    
    const options = {
      body: message,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      vibrate: [200, 100, 200, 100, 200],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: taskId || '1',
        url: '/task-manager',
        type: 'firebase-fcm-manual-message',
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
      tag: 'firebase-fcm-manual-message'
    };
    
    event.waitUntil(
      self.registration.showNotification(title, options)
    );
  }
});

self.addEventListener('notificationclick', function(event) {
  console.log('🖱️ Firebase FCM Enhanced Notification clicked:', event.action, event.notification.data);
  console.log('🔥 Firebase Project:', event.notification.data?.firebaseProject);
  
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
            console.log('🔄 Focusing existing tab and navigating to task manager');
            client.postMessage({ 
              type: 'NAVIGATE_TO_TASK_MANAGER', 
              taskId: event.notification.data?.primaryKey,
              firebaseProject: firebaseConfig.projectId
            });
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
  console.log('❌ Firebase FCM Enhanced Notification closed:', event.notification.data);
});

// Handle service worker activation
self.addEventListener('activate', function(event) {
  console.log('🚀 Firebase FCM Enhanced Service Worker activated');
  console.log('🔥 Firebase Project:', firebaseConfig.projectId);
  event.waitUntil(self.clients.claim());
});

// Handle service worker installation
self.addEventListener('install', function(event) {
  console.log('📦 Firebase FCM Enhanced Service Worker installed');
  console.log('🔥 Firebase Project:', firebaseConfig.projectId);
  event.waitUntil(self.skipWaiting());
});
