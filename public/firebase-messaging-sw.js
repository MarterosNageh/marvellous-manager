// Give the service worker access to Firebase Messaging.
// Note that you can only use Firebase Messaging here. Other Firebase libraries
// are not available in the service worker.
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker by passing in
// your app's Firebase config object.
firebase.initializeApp({
  apiKey: "AIzaSyBIw7y43dseUoKSeRjxZ3FC0JwqQvDkPdc",
  authDomain: "marvellous-manager.firebaseapp.com",
  projectId: "marvellous-manager",
  storageBucket: "marvellous-manager.firebasestorage.app",
  messagingSenderId: "368753443778",
  appId: "1:368753443778:web:91898578c1af5b04184c5b"
});

// Retrieve an instance of Firebase Messaging so that it can handle background messages.
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message:', payload);

  // Use the tag from the payload to prevent duplicates
  const tag = payload.data?.tag || payload.data?.type || 'default';
  
  const notificationOptions = {
    body: payload.notification?.body || '',
    icon: '/marvellous-logo-white.png',
    badge: '/marvellous-logo-white.png',
    tag: tag, // Use consistent tag to prevent duplicates
    data: {
      ...payload.data,
      url: payload.data?.url || '/tasks',
      timestamp: Date.now()
    },
    vibrate: [100, 50, 100],
    requireInteraction: true,
    renotify: false, // Don't show duplicate notifications
    actions: [
      {
        action: 'open',
        title: 'Open',
        icon: '/marvellous-logo-black.png'
      }
    ],
    silent: false,
    timestamp: Date.now()
  };

  return self.registration.showNotification(
    payload.notification?.title || 'New Notification',
    notificationOptions
  );
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification clicked:', event);
  event.notification.close();

  // Handle notification click with mobile support
  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then((clientList) => {
      // Check if there's already a window/tab open with the target URL
      for (const client of clientList) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // If no window/tab is already open, open a new one
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
}); 