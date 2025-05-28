
console.log('🔧 Enhanced Service Worker loaded');

self.addEventListener('push', function(event) {
  console.log('📱 Enhanced Push event received:', event);
  
  if (event.data) {
    const data = event.data.json();
    console.log('📱 Enhanced Push data:', data);
    
    const options = {
      body: data.body || data.message,
      icon: data.icon || '/favicon.ico',
      badge: data.badge || '/favicon.ico',
      vibrate: [200, 100, 200, 100, 200],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: data.taskId || data.data?.taskId || '1',
        url: data.data?.url || '/task-manager',
        test: data.test || false
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
      tag: data.tag || 'default',
      timestamp: Date.now()
    };
    
    console.log('📱 Showing enhanced notification with options:', options);
    
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
        tag: 'default'
      })
    );
  }
});

self.addEventListener('message', function(event) {
  console.log('💬 Enhanced Service Worker message received:', event.data);
  
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
        url: '/task-manager'
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
      tag: 'manual-message'
    };
    
    event.waitUntil(
      self.registration.showNotification(title, options)
    );
  }
});

self.addEventListener('notificationclick', function(event) {
  console.log('🖱️ Enhanced Notification clicked:', event.action, event.notification.data);
  
  event.notification.close();
  
  if (event.action === 'explore' || !event.action) {
    const urlToOpen = event.notification.data?.url || '/task-manager';
    console.log('🔗 Opening URL:', urlToOpen);
    
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then(function(clientList) {
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
  console.log('❌ Enhanced Notification closed:', event.notification.data);
});

// Handle service worker activation
self.addEventListener('activate', function(event) {
  console.log('🚀 Enhanced Service Worker activated');
  event.waitUntil(self.clients.claim());
});

// Handle service worker installation
self.addEventListener('install', function(event) {
  console.log('📦 Enhanced Service Worker installed');
  event.waitUntil(self.skipWaiting());
});
