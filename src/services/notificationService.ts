import { supabase } from "@/integrations/supabase/client";
import { pushNotificationService } from "./pushNotificationService";

interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: any;
  requireInteraction?: boolean;
}

class NotificationService {
  private registration: ServiceWorkerRegistration | null = null;
  private permissionRequested = false;

  async init() {
    if ('serviceWorker' in navigator) {
      try {
        this.registration = await navigator.serviceWorker.register('/sw.js');
        console.log('🔧 Service Worker registered successfully');
        
        // Wait for service worker to be ready
        await navigator.serviceWorker.ready;
        console.log('✅ Service Worker is ready');
        
        // Auto-setup push notifications if permission is already granted
        if (Notification.permission === 'granted') {
          console.log('🔄 Auto-setting up push notifications...');
          await this.setupPushNotifications();
        }
      } catch (error) {
        console.error('❌ Service Worker registration failed:', error);
      }
    }
  }

  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.log('❌ This browser does not support notifications');
      return false;
    }

    console.log('🔔 Current notification permission:', Notification.permission);

    if (Notification.permission === 'granted') {
      console.log('✅ Notification permission already granted');
      return true;
    }

    if (Notification.permission === 'denied') {
      console.log('❌ Notification permission denied - user must manually enable in browser settings');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      console.log('🔔 Notification permission result:', permission);
      return permission === 'granted';
    } catch (error) {
      console.error('❌ Error requesting notification permission:', error);
      return false;
    }
  }

  async setupPushNotifications(): Promise<boolean> {
    console.log('🚀 Setting up push notifications...');
    
    if (Notification.permission !== 'granted') {
      console.log('❌ Cannot setup push notifications: permission not granted');
      return false;
    }

    try {
      console.log('📱 Requesting push subscription...');
      const subscribed = await pushNotificationService.requestPermissionAndSubscribe();
      console.log('📱 Push subscription result:', subscribed);
      
      if (subscribed) {
        console.log('✅ Push notifications setup completed successfully');
        
        // Verify subscription status
        const hasSubscription = await pushNotificationService.getSubscriptionStatus();
        console.log('🔍 Subscription verification:', hasSubscription);
        
        return hasSubscription;
      } else {
        console.log('❌ Push notifications setup failed');
        return false;
      }
    } catch (error) {
      console.error('❌ Error setting up push notifications:', error);
      return false;
    }
  }

  async sendPushNotification(payload: NotificationPayload) {
    console.log('📱 Sending local push notification:', payload.title);
    
    if (Notification.permission !== 'granted') {
      console.log('❌ Cannot send notification: permission not granted');
      return null;
    }

    if (!this.registration) {
      console.log('❌ Service worker not available');
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
        requireInteraction: payload.requireInteraction || true,
        silent: false
      });

      // Add vibration for mobile devices
      if ('vibrate' in navigator) {
        navigator.vibrate([200, 100, 200]);
      }

      console.log('✅ Local push notification sent successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to show local push notification:', error);
      return null;
    }
  }

  async sendLocalNotification(payload: NotificationPayload) {
    return this.sendPushNotification(payload);
  }

  async sendMobileNotification(title: string, body: string, data?: any) {
    return this.sendPushNotification({
      title,
      body,
      data,
      requireInteraction: true
    });
  }

  async sendTaskAssignmentNotifications(
    assigneeIds: string[],
    taskTitle: string,
    taskId: string,
    createdBy?: string
  ) {
    console.log('📋 === SENDING TASK ASSIGNMENT NOTIFICATIONS TO ALL DEVICES ===');
    console.log('👥 Assignee IDs:', assigneeIds);
    console.log('📝 Task Title:', taskTitle);
    console.log('🆔 Task ID:', taskId);
    console.log('👤 Created By:', createdBy);
    
    // ALWAYS send external push notifications to ALL assigned users - NO CONDITIONS
    console.log('📱 === SENDING EXTERNAL PUSH TO ALL ASSIGNED USERS ===');
    await pushNotificationService.sendPushNotification(
      assigneeIds,
      '🎯 New Task Assigned',
      `You have been assigned to task: "${taskTitle}"`,
      { 
        taskId, 
        type: 'task_assignment', 
        requireInteraction: true,
        tag: `task-${taskId}`,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        url: '/task-manager'
      }
    );

    // Send to all admins (excluding the creator)
    console.log('👑 Sending notifications to admins...');
    await this.sendNotificationToAdmins(
      '📋 New Task Created',
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
      console.log(`📤 === SENDING EXTERNAL PUSH TO USER ${userId} ===`);
      console.log('📢 Title:', title);
      console.log('💬 Body:', body);

      // ALWAYS send external push notification to ALL devices for this user
      console.log('📱 === SENDING TO ALL DEVICES FOR USER ===');
      await pushNotificationService.sendPushNotification(
        [userId],
        title,
        body,
        { 
          taskId, 
          type, 
          requireInteraction: true,
          tag: `task-${taskId}`,
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          url: '/task-manager'
        }
      );
      
      console.log('📱 External push notification sent to ALL devices for user:', userId);
      console.log(`✅ Notification processing completed for user ${userId}`);
    } catch (error) {
      console.error('❌ Error sending notification to user:', error);
    }
  }

  async sendNotificationToAdmins(
    title: string,
    body: string,
    taskId?: string,
    excludeUserId?: string
  ) {
    try {
      console.log('👑 === SENDING NOTIFICATIONS TO ADMINS ===');
      console.log('🚫 Exclude user ID:', excludeUserId);
      
      const { data: admins, error } = await supabase
        .from('auth_users')
        .select('id')
        .eq('is_admin', true);

      if (error) {
        console.error('❌ Error fetching admins:', error);
        return;
      }

      console.log('👑 Found admins:', admins);

      if (admins) {
        for (const admin of admins) {
          if (admin.id !== excludeUserId) {
            console.log(`📤 Sending admin notification to: ${admin.id}`);
            await this.sendNotificationToUser(admin.id, title, body, taskId, 'admin');
          } else {
            console.log(`⏭️ Skipping admin notification for creator: ${admin.id}`);
          }
        }
      }
    } catch (error) {
      console.error('❌ Error sending notifications to admins:', error);
    }
  }

  async sendTestNotification() {
    console.log('🧪 === SENDING TEST PUSH NOTIFICATION ===');
    console.log('🔔 Current permission status:', Notification.permission);
    
    if (Notification.permission !== 'granted') {
      console.log('🔔 Permission not granted, requesting...');
      const hasPermission = await this.requestPermission();
      if (!hasPermission) {
        console.log('❌ Cannot send test notification: permission not granted');
        return false;
      }
    }

    // Setup push notifications if not already done
    const pushSetup = await this.setupPushNotifications();
    console.log('📱 Push notification setup result:', pushSetup);

    if (!pushSetup) {
      console.log('❌ Push notifications not properly set up');
      return false;
    }

    console.log('🧪 Sending test push notification...');

    // Send push notification via service worker
    const result = await this.sendPushNotification({
      title: '🔔 Test Push Notification',
      body: 'This is a test push notification! If you can see this on your phone, push notifications are working correctly.',
      tag: 'test-notification',
      data: { test: true, timestamp: Date.now() },
      requireInteraction: true
    });

    console.log('🧪 Test push notification result:', result);
    return !!result;
  }
}

export const notificationService = new NotificationService();
