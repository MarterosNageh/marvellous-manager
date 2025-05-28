
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
        console.log('🔧 Service Worker registered successfully');
        
        // Wait for service worker to be ready
        await navigator.serviceWorker.ready;
        console.log('✅ Service Worker is ready');
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
        
        // Verify subscription was saved by checking the database
        const currentUser = localStorage.getItem('currentUser');
        if (currentUser) {
          const user = JSON.parse(currentUser);
          console.log('🔍 Checking push subscription in database for user:', user.id);
          
          const { data: subscription, error } = await supabase
            .from('push_subscriptions')
            .select('*')
            .eq('user_id', user.id)
            .single();
            
          if (error) {
            console.error('❌ Error checking push subscription:', error);
          } else {
            console.log('✅ Push subscription found in database:', subscription);
          }
        }
      } else {
        console.log('❌ Push notifications setup failed');
      }
      
      return subscribed;
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
        requireInteraction: true, // Keep notification visible until user interacts
        silent: false,
        vibrate: [200, 100, 200] // Mobile vibration pattern
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
    console.log('📋 === SENDING TASK ASSIGNMENT NOTIFICATIONS ===');
    console.log('👥 Assignee IDs:', assigneeIds);
    console.log('📝 Task Title:', taskTitle);
    console.log('🆔 Task ID:', taskId);
    console.log('👤 Created By:', createdBy);
    
    // Get current logged-in user
    const currentUser = localStorage.getItem('currentUser');
    let currentUserId = null;
    
    if (currentUser) {
      try {
        const user = JSON.parse(currentUser);
        currentUserId = user.id;
        console.log('👤 Current user ID:', currentUserId);
      } catch (error) {
        console.error('❌ Error parsing current user:', error);
      }
    }
    
    // Send notifications to all assigned users
    for (const userId of assigneeIds) {
      console.log(`📤 Processing notification for user: ${userId}`);
      
      // Don't send notification to the task creator
      if (userId !== createdBy) {
        console.log(`✅ Sending notification to user: ${userId} (not the creator)`);
        await this.sendNotificationToUser(
          userId,
          '🎯 New Task Assigned',
          `You have been assigned to task: "${taskTitle}"`,
          taskId,
          'task_assignment'
        );
      } else {
        console.log(`⏭️ Skipping notification for creator: ${userId}`);
      }
    }

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
      console.log(`📤 === SENDING NOTIFICATION TO USER ${userId} ===`);
      console.log('📢 Title:', title);
      console.log('💬 Body:', body);

      // Get current user to check if they're the target user
      const currentUser = localStorage.getItem('currentUser');
      if (currentUser) {
        const user = JSON.parse(currentUser);
        console.log('👤 Current user ID:', user.id, 'Target user ID:', userId);
        
        if (user.id === userId) {
          console.log('✅ User is currently logged in, sending local notification');
          // User is currently logged in, send local notification
          await this.sendLocalNotification({
            title,
            body,
            tag: `task-${taskId}`,
            data: { taskId, url: `/task-manager` },
            requireInteraction: true
          });

          // Also send mobile notification for PWA
          await this.sendMobileNotification(title, body, { taskId });
        } else {
          console.log('ℹ️ User is not currently logged in, will send external push only');
        }
      }

      // Always try to send external push notification for mobile devices
      console.log('🔍 Checking if user has push subscription...');
      const { data: subscriptions, error } = await supabase
        .from('push_subscriptions')
        .select('*')
        .eq('user_id', userId);

      if (error) {
        console.error('❌ Error checking push subscriptions:', error);
      } else {
        console.log(`📊 Found ${subscriptions?.length || 0} push subscriptions for user ${userId}`);
        
        if (subscriptions && subscriptions.length > 0) {
          console.log('✅ User has push subscription, sending external push notification...');
          await pushNotificationService.sendPushNotification(
            [userId],
            title,
            body,
            { taskId, type, requireInteraction: true }
          );
        } else {
          console.log('⚠️ User has no push subscription registered, skipping external push');
        }
      }

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
