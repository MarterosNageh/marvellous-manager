
self.addEventListener('push', function(event) {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.message,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: data.taskId || '1'
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
      ]
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

self.addEventListener('message', function(event) {
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, message, taskId } = event.data;
    
    const options = {
      body: message,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      vibrate: [200, 100, 200],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: taskId || '1'
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
      ]
    };
    
    event.waitUntil(
      self.registration.showNotification(title, options)
    );
  }
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/task-manager')
    );
  }
});
