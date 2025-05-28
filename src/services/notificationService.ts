import { supabase } from "@/integrations/supabase/client";
import { pushNotificationService } from "./pushNotificationService";

interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: any;
}

class NotificationService {
  private registration: ServiceWorkerRegistration | null = null;
  private permissionRequested = false;

  async init() {
    if ('serviceWorker' in navigator) {
      try {
        this.registration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker registered:', this.registration);
        
        // Wait for service worker to be ready
        await navigator.serviceWorker.ready;
        console.log('Service Worker is ready');
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

    console.log('Current notification permission:', Notification.permission);

    if (Notification.permission === 'granted') {
      console.log('Notification permission already granted');
      return true;
    }

    if (Notification.permission === 'denied') {
      console.log('Notification permission denied - user must manually enable in browser settings');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      console.log('Notification permission result:', permission);
      return permission === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  async setupPushNotifications(): Promise<boolean> {
    if (Notification.permission !== 'granted') {
      console.log('Cannot setup push notifications: permission not granted');
      return false;
    }

    try {
      const subscribed = await pushNotificationService.requestPermissionAndSubscribe();
      console.log('Push subscription result:', subscribed);
      return subscribed;
    } catch (error) {
      console.error('Error setting up push notifications:', error);
      return false;
    }
  }

  async sendPushNotification(payload: NotificationPayload) {
    console.log('Attempting to send push notification via service worker:', payload);
    
    if (Notification.permission !== 'granted') {
      console.log('Cannot send notification: permission not granted');
      return null;
    }

    if (!this.registration) {
      console.log('Service worker not available');
      return null;
    }

    try {
      // Send notification via service worker for proper push notification behavior
      await this.registration.showNotification(payload.title, {
        body: payload.body,
        icon: payload.icon || '/favicon.ico',
        badge: payload.badge || '/favicon.ico',
        tag: payload.tag,
        data: payload.data,
        requireInteraction: false,
        silent: false,
        actions: [
          {
            action: 'view',
            title: 'View'
          },
          {
            action: 'close',
            title: 'Close'
          }
        ]
      });

      // Add vibration for mobile devices
      if ('vibrate' in navigator) {
        navigator.vibrate([200, 100, 200]);
      }

      console.log('Push notification sent successfully via service worker');
      return true;
    } catch (error) {
      console.error('Failed to show push notification:', error);
      return null;
    }
  }

  async sendLocalNotification(payload: NotificationPayload) {
    // Redirect to push notification for better browser support
    return this.sendPushNotification(payload);
  }

  async sendMobileNotification(title: string, body: string, data?: any) {
    return this.sendPushNotification({
      title,
      body,
      data
    });
  }

  async sendTaskAssignmentNotifications(
    assigneeIds: string[],
    taskTitle: string,
    taskId: string,
    createdBy?: string
  ) {
    console.log('Sending task assignment notifications to:', assigneeIds);
    
    // Get current logged-in user
    const currentUser = localStorage.getItem('currentUser');
    let currentUserId = null;
    
    if (currentUser) {
      try {
        const user = JSON.parse(currentUser);
        currentUserId = user.id;
      } catch (error) {
        console.error('Error parsing current user:', error);
      }
    }
    
    // Send notifications to all assigned users (not just current user)
    for (const userId of assigneeIds) {
      if (userId !== createdBy) {
        console.log('Sending notification to user:', userId);
        await this.sendNotificationToUser(
          userId,
          'New Task Assigned',
          `You have been assigned to task: "${taskTitle}"`,
          taskId,
          'task_assignment'
        );
      }
    }

    // Send to all admins (excluding the creator)
    await this.sendNotificationToAdmins(
      'New Task Created',
      `Task "${taskTitle}" has been created and assigned`,
      taskId,
      createdBy
    );
  }

  async sendNotificationToUser(
    userId: string,
    title: string,
    body: string,
    taskId?: string,
    type: string = 'general'
  ) {
    try {
      console.log(`Sending notification to user ${userId}:`, title);

      // Get current user to check if they're the target user
      const currentUser = localStorage.getItem('currentUser');
      if (currentUser) {
        const user = JSON.parse(currentUser);
        if (user.id === userId) {
          // User is currently logged in, send local notification
          await this.sendLocalNotification({
            title,
            body,
            tag: `task-${taskId}`,
            data: { taskId, url: `/task-manager` }
          });

          // Also send mobile notification for PWA
          await this.sendMobileNotification(title, body, { taskId });
        }
      }

      // Send external push notification
      await pushNotificationService.sendPushNotification(
        [userId],
        title,
        body,
        { taskId, type }
      );

      console.log(`Notification sent to user ${userId}:`, title);
    } catch (error) {
      console.error('Error sending notification to user:', error);
    }
  }

  async sendNotificationToAdmins(
    title: string,
    body: string,
    taskId?: string,
    excludeUserId?: string
  ) {
    try {
      const { data: admins } = await supabase
        .from('auth_users')
        .select('id')
        .eq('is_admin', true);

      if (admins) {
        for (const admin of admins) {
          if (admin.id !== excludeUserId) {
            await this.sendNotificationToUser(admin.id, title, body, taskId, 'admin');
          }
        }
      }
    } catch (error) {
      console.error('Error sending notifications to admins:', error);
    }
  }

  async sendTestNotification() {
    console.log('=== SENDING TEST PUSH NOTIFICATION ===');
    console.log('Current permission status:', Notification.permission);
    
    if (Notification.permission !== 'granted') {
      console.log('Permission not granted, requesting...');
      const hasPermission = await this.requestPermission();
      if (!hasPermission) {
        console.log('Cannot send test notification: permission not granted');
        return false;
      }
    }

    // Setup push notifications if not already done
    const pushSetup = await this.setupPushNotifications();
    console.log('Push notification setup result:', pushSetup);

    console.log('Sending test push notification...');

    // Send push notification via service worker
    const result = await this.sendPushNotification({
      title: '🔔 Test Push Notification',
      body: 'This is a test push notification! If you can see this, push notifications are working correctly.',
      tag: 'test-notification',
      data: { test: true, timestamp: Date.now() }
    });

    console.log('Test push notification result:', result);
    return !!result;
  }
}

export const notificationService = new NotificationService();
