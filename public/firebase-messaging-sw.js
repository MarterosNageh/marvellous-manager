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
  console.log('Received background message:', payload);

  const notificationTitle = payload.notification?.title || 'New Notification';
  const notificationOptions = {
    body: payload.notification?.body || '',
    icon: '/marvellous-logo-black.png',
    tag: payload.data?.tag || 'default',
    data: payload.data || {},
    badge: '/marvellous-logo-black.png',
    vibrate: [200, 100, 200],
    requireInteraction: true
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  event.notification.close();

  // This looks to see if the current is already open and focuses if it is
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        const hadWindowToFocus = clientList.some((windowClient) => {
          if (windowClient.url === event.notification.data?.url) {
            windowClient.focus();
            return true;
          }
          return false;
        });

        // If no window is already open, open a new one
        if (!hadWindowToFocus) {
          clients.openWindow(event.notification.data?.url || '/').then((windowClient) => {
            if (windowClient) {
              windowClient.focus();
            }
          });
        }
      })
  );
}); 