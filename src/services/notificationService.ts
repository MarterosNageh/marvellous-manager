
class NotificationService {
  private registration: ServiceWorkerRegistration | null = null;

  async init() {
    if ('serviceWorker' in navigator) {
      try {
        this.registration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker registered successfully');
      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    }
  }

  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }

    return false;
  }

  async subscribeToPushNotifications(userId: string): Promise<void> {
    if (!this.registration) {
      await this.init();
    }

    if (!this.registration) {
      console.error('Service Worker not registered');
      return;
    }

    try {
      const subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array('YOUR_VAPID_PUBLIC_KEY')
      });

      console.log('Push subscription created:', subscription);
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
    }
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  async sendNotification(title: string, message: string, taskId?: string): Promise<void> {
    const hasPermission = await this.requestPermission();
    
    if (!hasPermission) {
      console.log('Notification permission not granted');
      return;
    }

    // Web notification
    const notification = new Notification(title, {
      body: message,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: `task-${taskId}`,
      requireInteraction: true,
      vibrate: [200, 100, 200]
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
      if (taskId) {
        window.location.href = '/task-manager';
      }
    };

    // Mobile notification via service worker
    if (this.registration && this.registration.active) {
      this.registration.active.postMessage({
        type: 'SHOW_NOTIFICATION',
        title,
        message,
        taskId
      });
    }
  }

  async sendMobileNotification(title: string, message: string, taskId?: string): Promise<void> {
    if (this.registration && this.registration.active) {
      this.registration.active.postMessage({
        type: 'SHOW_NOTIFICATION',
        title,
        message,
        taskId
      });
    }
  }

  async sendTaskAssignmentNotifications(assigneeIds: string[], taskTitle: string, taskId: string, createdBy: string): Promise<void> {
    const title = 'New Task Assignment';
    const message = `You have been assigned to task: "${taskTitle}"`;
    
    console.log(`Sending assignment notifications to ${assigneeIds.length} users`);
    
    // Send notification for each assignee
    for (const assigneeId of assigneeIds) {
      if (assigneeId !== createdBy) {
        await this.sendNotification(title, message, taskId);
        await this.sendMobileNotification(title, message, taskId);
      }
    }
  }

  async sendNotificationToUser(userId: string, title: string, message: string, taskId: string, type: string = 'info'): Promise<void> {
    console.log(`Sending notification to user ${userId}: ${title}`);
    await this.sendNotification(title, message, taskId);
    await this.sendMobileNotification(title, message, taskId);
  }

  async sendNotificationToAssignees(assigneeIds: string[], title: string, message: string, taskId: string, excludeUserId?: string): Promise<void> {
    for (const assigneeId of assigneeIds) {
      if (assigneeId !== excludeUserId) {
        await this.sendNotificationToUser(assigneeId, title, message, taskId);
      }
    }
  }

  async sendNotificationToAdmins(title: string, message: string, taskId: string, excludeUserId?: string): Promise<void> {
    console.log('Sending notification to all admins:', title);
    await this.sendNotification(title, message, taskId);
    await this.sendMobileNotification(title, message, taskId);
  }
}

export const notificationService = new NotificationService();
