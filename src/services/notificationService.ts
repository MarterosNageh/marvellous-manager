
import { supabase } from "@/integrations/supabase/client";

export interface PushNotification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  task_id?: string;
  type: 'assignment' | 'status_change' | 'mention' | 'due_date';
  read: boolean;
  created_at: string;
}

class NotificationService {
  private static instance: NotificationService;
  private registration: ServiceWorkerRegistration | null = null;
  private subscription: PushSubscription | null = null;

  private constructor() {
    this.initializeServiceWorker();
  }

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  private async initializeServiceWorker() {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
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
      console.warn('This browser does not support notifications');
      return false;
    }

    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  async subscribeToPushNotifications(userId: string): Promise<void> {
    if (!this.registration) {
      console.error('Service Worker not registered');
      return;
    }

    try {
      this.subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlB64ToUint8Array(
          'BEl62iUYgUivxIkv69yViEuiBIa40HI80Y0sTcr8tojnkdSKZrTp_dTmmuJOkZIJaXpBNGWKQ-Wf8n7Nm4W6RQQ'
        ),
      });

      console.log('Push subscription created:', this.subscription);
      
      // Store subscription in database for mobile notifications
      await this.storeSubscription(userId, this.subscription);
      
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
    }
  }

  private async storeSubscription(userId: string, subscription: PushSubscription): Promise<void> {
    try {
      const subscriptionData = {
        user_id: userId,
        endpoint: subscription.endpoint,
        p256dh_key: subscription.toJSON().keys?.p256dh,
        auth_key: subscription.toJSON().keys?.auth,
        created_at: new Date().toISOString()
      };

      console.log('Storing push subscription:', subscriptionData);
      
      // Note: This would require a push_subscriptions table in the database
      // For now, we'll just log it
    } catch (error) {
      console.error('Error storing subscription:', error);
    }
  }

  async sendBrowserNotification(title: string, message: string, taskId?: string): Promise<void> {
    if (Notification.permission === 'granted') {
      try {
        const notification = new Notification(title, {
          body: message,
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          tag: taskId || 'general',
          requireInteraction: true,
          actions: [
            {
              action: 'view',
              title: 'View'
            },
            {
              action: 'dismiss',
              title: 'Dismiss'
            }
          ]
        });

        // Add vibration for mobile devices
        if ('vibrate' in navigator) {
          navigator.vibrate([200, 100, 200]);
        }

        notification.onclick = () => {
          window.focus();
          if (taskId) {
            // Navigate to task if needed
            window.location.href = `/task-manager`;
          }
          notification.close();
        };

        console.log('Browser notification sent:', title);
      } catch (error) {
        console.error('Error sending browser notification:', error);
      }
    }
  }

  async sendServiceWorkerNotification(title: string, message: string, taskId?: string): Promise<void> {
    if (this.registration && this.subscription) {
      try {
        // Send through service worker for better mobile support
        if (this.registration.active) {
          this.registration.active.postMessage({
            type: 'SHOW_NOTIFICATION',
            title,
            message,
            taskId
          });
        }
        console.log('Service worker notification sent:', title);
      } catch (error) {
        console.error('Error sending service worker notification:', error);
      }
    }
  }

  async sendMobileNotification(title: string, message: string, taskId?: string): Promise<void> {
    try {
      // Send both browser and service worker notifications for maximum compatibility
      await Promise.all([
        this.sendBrowserNotification(title, message, taskId),
        this.sendServiceWorkerNotification(title, message, taskId)
      ]);

      console.log(`Mobile notification sent: ${title}`);
    } catch (error) {
      console.error('Error sending mobile notification:', error);
    }
  }

  private urlB64ToUint8Array(base64String: string): Uint8Array {
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

  async sendNotificationToUser(
    userId: string,
    title: string,
    message: string,
    taskId?: string,
    type: 'assignment' | 'status_change' | 'mention' | 'due_date' = 'assignment'
  ): Promise<void> {
    try {
      // Send both browser and mobile notifications
      await this.sendMobileNotification(title, message, taskId);

      console.log(`Notification sent to user ${userId}: ${title}`);
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  }

  async sendNotificationToAssignees(
    assigneeIds: string[],
    title: string,
    message: string,
    taskId?: string,
    excludeUserId?: string
  ): Promise<void> {
    console.log('Sending notifications to assignees:', { assigneeIds, title, excludeUserId });
    
    const filteredAssigneeIds = assigneeIds.filter(id => id !== excludeUserId);
    
    if (filteredAssigneeIds.length === 0) {
      console.log('No assignees to notify after filtering');
      return;
    }

    const promises = filteredAssigneeIds.map(userId => {
      console.log(`Sending notification to assignee: ${userId}`);
      return this.sendNotificationToUser(userId, title, message, taskId, 'assignment');
    });

    await Promise.all(promises);
    console.log('All assignee notifications sent');
  }

  async sendNotificationToAdmins(
    title: string,
    message: string,
    taskId?: string,
    excludeUserId?: string
  ): Promise<void> {
    try {
      // Get all admin users
      const { data: adminUsers, error } = await supabase
        .from('auth_users')
        .select('id')
        .eq('is_admin', true);

      if (error) {
        console.error('Error fetching admin users:', error);
        return;
      }

      if (adminUsers) {
        const adminIds = adminUsers
          .map(user => user.id)
          .filter(id => id !== excludeUserId);

        console.log('Sending notifications to admins:', { adminIds, title });

        const promises = adminIds.map(userId => 
          this.sendNotificationToUser(userId, title, message, taskId, 'assignment')
        );

        await Promise.all(promises);
        console.log('All admin notifications sent');
      }
    } catch (error) {
      console.error('Error sending admin notifications:', error);
    }
  }

  async sendTaskAssignmentNotifications(
    assigneeIds: string[],
    taskTitle: string,
    taskId: string,
    createdById?: string
  ): Promise<void> {
    console.log('sendTaskAssignmentNotifications called with:', {
      assigneeIds,
      taskTitle,
      taskId,
      createdById
    });

    try {
      // Send notifications to all assigned users (excluding the creator)
      if (assigneeIds.length > 0) {
        await this.sendNotificationToAssignees(
          assigneeIds,
          'New Task Assignment',
          `You have been assigned to task: "${taskTitle}"`,
          taskId,
          createdById
        );
      }

      // Send notifications to all admins (excluding the creator if they're admin)
      await this.sendNotificationToAdmins(
        'New Task Created',
        `A new task "${taskTitle}" has been created`,
        taskId,
        createdById
      );

      console.log('Task assignment notifications completed');
    } catch (error) {
      console.error('Error in sendTaskAssignmentNotifications:', error);
    }
  }
}

export const notificationService = NotificationService.getInstance();
