
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
      const subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlB64ToUint8Array(
          'BEl62iUYgUivxIkv69yViEuiBIa40HI80Y0sTcr8tojnkdSKZrTp_dTmmuJOkZIJaXpBNGWKQ-Wf8n7Nm4W6RQQ'
        ),
      });

      console.log('Push subscription:', subscription);
      
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
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
      // For now, show browser notification if permission granted
      if (Notification.permission === 'granted') {
        new Notification(title, {
          body: message,
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          tag: taskId || 'general',
          requireInteraction: true
        });
      }

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
    const promises = assigneeIds
      .filter(id => id !== excludeUserId)
      .map(userId => 
        this.sendNotificationToUser(userId, title, message, taskId, 'assignment')
      );

    await Promise.all(promises);
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

        const promises = adminIds.map(userId => 
          this.sendNotificationToUser(userId, title, message, taskId, 'assignment')
        );

        await Promise.all(promises);
      }
    } catch (error) {
      console.error('Error sending admin notifications:', error);
    }
  }
}

export const notificationService = NotificationService.getInstance();
