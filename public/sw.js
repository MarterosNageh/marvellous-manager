
console.log('🔧 Service Worker loaded');

self.addEventListener('push', function(event) {
  console.log('📱 Push event received:', event);
  
  if (event.data) {
    const data = event.data.json();
    console.log('📱 Push data:', data);
    
    const options = {
      body: data.body || data.message,
      icon: data.icon || '/favicon.ico',
      badge: data.badge || '/favicon.ico',
      vibrate: [200, 100, 200],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: data.taskId || data.data?.taskId || '1',
        url: data.data?.url || '/task-manager'
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
      requireInteraction: true, // Keep notification visible until user interacts
      silent: false,
      tag: data.tag || 'default'
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

self.addEventListener('message', function(event) {
  console.log('💬 Service Worker message received:', event.data);
  
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, message, taskId } = event.data;
    
    const options = {
      body: message,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      vibrate: [200, 100, 200],
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
      silent: false
    };
    
    event.waitUntil(
      self.registration.showNotification(title, options)
    );
  }
});

self.addEventListener('notificationclick', function(event) {
  console.log('🖱️ Notification clicked:', event.action, event.notification.data);
  
  event.notification.close();
  
  if (event.action === 'explore' || !event.action) {
    event.waitUntil(
      clients.openWindow('/task-manager')
    );
  }
});

// Handle notification close
self.addEventListener('notificationclose', function(event) {
  console.log('❌ Notification closed:', event.notification.data);
});
