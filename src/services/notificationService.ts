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
      // Automatically subscribe to push notifications when permission is granted
      const subscribed = await pushNotificationService.requestPermissionAndSubscribe();
      console.log('Push subscription result:', subscribed);
      return true;
    }

    if (Notification.permission === 'denied') {
      console.log('Notification permission denied - cannot request again');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      console.log('Notification permission result:', permission);
      
      if (permission === 'granted') {
        // Automatically subscribe to push notifications when permission is granted
        const subscribed = await pushNotificationService.requestPermissionAndSubscribe();
        console.log('Push subscription result:', subscribed);
      }
      
      return permission === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  async sendLocalNotification(payload: NotificationPayload) {
    console.log('Attempting to send local notification:', payload);
    
    if (Notification.permission !== 'granted') {
      console.log('Cannot send notification: permission not granted');
      return null;
    }

    try {
      const notification = new Notification(payload.title, {
        body: payload.body,
        icon: payload.icon || '/favicon.ico',
        badge: payload.badge || '/favicon.ico',
        tag: payload.tag,
        data: payload.data,
        requireInteraction: false,
        silent: false
      });

      console.log('Local notification created successfully:', notification);

      // Add vibration for mobile devices
      if ('vibrate' in navigator) {
        navigator.vibrate([200, 100, 200]);
      }

      notification.onclick = () => {
        console.log('Notification clicked');
        window.focus();
        notification.close();
        if (payload.data?.url) {
          window.location.href = payload.data.url;
        }
      };

      // Auto close after 10 seconds
      setTimeout(() => {
        notification.close();
      }, 10000);

      return notification;
    } catch (error) {
      console.error('Failed to show notification:', error);
      return null;
    }
  }

  async sendMobileNotification(title: string, body: string, data?: any) {
    console.log('Attempting to send mobile notification:', { title, body, data });
    
    // Check permission first
    if (Notification.permission !== 'granted') {
      console.log('Cannot send mobile notification: permission not granted');
      return;
    }

    // For PWA mobile notifications
    if (this.registration && 'showNotification' in this.registration) {
      try {
        await this.registration.showNotification(title, {
          body,
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          data,
          requireInteraction: false,
          silent: false,
          vibrate: [200, 100, 200]
        });
        
        console.log('Mobile notification sent successfully via service worker');
      } catch (error) {
        console.error('Failed to show mobile notification:', error);
      }
    } else {
      console.log('Service worker not available for mobile notifications');
    }
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
    console.log('=== SENDING TEST NOTIFICATION ===');
    console.log('Current permission status:', Notification.permission);
    
    if (Notification.permission !== 'granted') {
      console.log('Permission not granted, requesting...');
      const hasPermission = await this.requestPermission();
      if (!hasPermission) {
        console.log('Cannot send test notification: permission not granted');
        return false;
      }
    }

    console.log('Sending both local and mobile notifications...');

    // Send local notification
    const localNotification = await this.sendLocalNotification({
      title: '🔔 Test Notification',
      body: 'This is a test notification! If you can see this, notifications are working correctly.',
      tag: 'test-notification',
      data: { test: true, timestamp: Date.now() }
    });

    // Send mobile notification via service worker
    await this.sendMobileNotification(
      '🔔 Test Notification (Mobile)',
      'This is a mobile test notification via service worker!',
      { test: true, timestamp: Date.now() }
    );

    console.log('Test notifications sent:', {
      local: !!localNotification,
      mobile: true
    });

    return true;
  }
}

export const notificationService = new NotificationService();
