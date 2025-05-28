
import { supabase } from "@/integrations/supabase/client";

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
        
        // Request permission immediately after initialization
        if (!this.permissionRequested) {
          await this.requestPermission();
          this.permissionRequested = true;
        }
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
      console.log('Notification permission already granted');
      return true;
    }

    if (Notification.permission === 'denied') {
      console.log('Notification permission denied');
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

  async sendLocalNotification(payload: NotificationPayload) {
    const hasPermission = await this.requestPermission();
    if (!hasPermission) {
      console.log('Notification permission not granted');
      return;
    }

    try {
      const notification = new Notification(payload.title, {
        body: payload.body,
        icon: payload.icon || '/favicon.ico',
        badge: payload.badge || '/favicon.ico',
        tag: payload.tag,
        data: payload.data,
        requireInteraction: false
      });

      // Add vibration for mobile devices
      if ('vibrate' in navigator) {
        navigator.vibrate([200, 100, 200]);
      }

      notification.onclick = () => {
        window.focus();
        notification.close();
        if (payload.data?.url) {
          window.location.href = payload.data.url;
        }
      };

      // Auto close after 5 seconds
      setTimeout(() => {
        notification.close();
      }, 5000);

      console.log('Local notification sent successfully');
      return notification;
    } catch (error) {
      console.error('Failed to show notification:', error);
    }
  }

  async sendMobileNotification(title: string, body: string, data?: any) {
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
        console.log('Mobile notification sent successfully');
      } catch (error) {
        console.error('Failed to show mobile notification:', error);
      }
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
    
    for (const userId of assigneeIds) {
      if (userId !== createdBy) {
        // Check if this user is currently logged in
        if (currentUserId === userId) {
          console.log('Sending notification to current logged-in user:', userId);
          await this.sendLocalNotification({
            title: 'New Task Assigned',
            body: `You have been assigned to task: "${taskTitle}"`,
            tag: `task-${taskId}`,
            data: { taskId, url: `/task-manager` }
          });
        }
        
        // Always send mobile notification for PWA
        await this.sendMobileNotification(
          'New Task Assigned',
          `You have been assigned to task: "${taskTitle}"`,
          { taskId }
        );
      }
    }

    // Send to all admins
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

      // Check if user is currently logged in
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
        }
      }

      // Always send mobile notification for PWA
      await this.sendMobileNotification(title, body, { taskId });

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
}

export const notificationService = new NotificationService();
