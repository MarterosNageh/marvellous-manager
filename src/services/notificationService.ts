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
  private realtimeChannel: any = null;

  async init() {
    if ('serviceWorker' in navigator) {
      try {
        // Get the ready service worker registration (should be /firebase-messaging-sw.js from main.tsx)
        this.registration = await navigator.serviceWorker.ready;
        if (this.registration) {
          console.log('🔧 Service Worker already registered and ready:', this.registration.scope);
        } else {
          console.error('❌ Service Worker not found or not ready. FCM might not work.');
          // Attempt to re-register /firebase-messaging-sw.js if not found, though main.tsx should handle it.
          // This is a fallback, ideally main.tsx handles the primary registration.
          try {
            this.registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
            console.log('🔧 Fallback: Registered /firebase-messaging-sw.js');
            await navigator.serviceWorker.ready; // wait for it to be ready
            console.log('✅ Fallback: Service Worker is ready');
          } catch (fbSwRegError) {
            console.error('❌ Fallback: Failed to register /firebase-messaging-sw.js:', fbSwRegError);
            return; // Exit if SW registration fails
          }
        }
        
        // Auto-setup push notifications if permission is already granted
        if (Notification.permission === 'granted') {
          console.log('🔄 Auto-setting up push notifications...');
          await this.setupPushNotifications();
        }

        // Setup real-time notifications
        await this.setupRealtimeNotifications();
      } catch (error) {
        console.error('❌ Service Worker registration failed:', error);
      }
    }
  }

  async setupRealtimeNotifications() {
    console.log('🔔 Setting up real-time notifications...');
    
    try {
      // Get current user
      const currentUser = localStorage.getItem('currentUser');
      if (!currentUser) {
        console.log('⚠️ No current user, skipping real-time setup');
        return;
      }

      const user = JSON.parse(currentUser);
      
      // Clean up existing channel
      if (this.realtimeChannel) {
        this.realtimeChannel.unsubscribe();
      }

      // Create new real-time channel for task notifications
      this.realtimeChannel = supabase
        .channel(`task-notifications-${user.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'task_assignments',
            filter: `user_id=eq.${user.id}`
          },
          async (payload) => {
            console.log('🔔 Real-time task assignment:', payload);
            
            // Fetch task details
            const { data: task } = await supabase
              .from('tasks')
              .select('title, description')
              .eq('id', payload.new.task_id)
              .single();

            if (task) {
              // Show browser notification
              await this.showBrowserNotification({
                title: '🎯 New Task Assigned (Real-time)',
                body: `You have been assigned to: "${task.title}"`,
                icon: '/favicon.ico',
                tag: `realtime-task-${payload.new.task_id}`,
                data: { taskId: payload.new.task_id, type: 'realtime_assignment' }
              });
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'tasks'
          },
          async (payload) => {
            console.log('🔄 Real-time task update:', payload);
            
            // Check if this user is assigned to this task
            const { data: assignment } = await supabase
              .from('task_assignments')
              .select('id')
              .eq('task_id', payload.new.id)
              .eq('user_id', user.id)
              .single();

            if (assignment && payload.new.title) {
              // Show browser notification for task updates
              await this.showBrowserNotification({
                title: '📝 Task Updated (Real-time)',
                body: `Task "${payload.new.title}" has been updated`,
                icon: '/favicon.ico',
                tag: `realtime-update-${payload.new.id}`,
                data: { taskId: payload.new.id, type: 'realtime_update' }
              });
            }
          }
        )
        .subscribe((status) => {
          console.log('🔔 Real-time subscription status:', status);
          if (status === 'SUBSCRIBED') {
            console.log('✅ Real-time notifications active');
          }
        });

    } catch (error) {
      console.error('❌ Error setting up real-time notifications:', error);
    }
  }

  async showBrowserNotification(payload: NotificationPayload) {
    console.log('🖥️ Showing browser notification:', payload.title);
    
    // Check permission
    if (Notification.permission !== 'granted') {
      console.log('❌ Browser notification permission not granted');
      return false;
    }

    try {
      // Show native browser notification
      const notification = new Notification(payload.title, {
        body: payload.body,
        icon: payload.icon || '/favicon.ico',
        badge: payload.badge || '/favicon.ico',
        tag: payload.tag,
        data: payload.data,
        requireInteraction: payload.requireInteraction || true,
        silent: false
      });

      // Add click handler
      notification.onclick = () => {
        window.focus();
        notification.close();
        
        // Navigate to task manager if data contains taskId
        if (payload.data?.taskId) {
          window.location.href = '/task-manager';
        }
      };

      // Auto close after 5 seconds unless requireInteraction is true
      if (!payload.requireInteraction) {
        setTimeout(() => {
          notification.close();
        }, 5000);
      }

      console.log('✅ Browser notification shown successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to show browser notification:', error);
      return false;
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

  async showLocalNotificationViaServiceWorker(payload: NotificationPayload) {
    console.log('📱 Sending local notification via Service Worker:', payload.title);
    
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
      // This displays a notification locally using the SW, it does not send a message to FCM server.
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

      console.log('✅ Local notification sent successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to show local notification:', error);
      return null;
    }
  }

  async sendLocalNotification(payload: NotificationPayload) {
    return this.showLocalNotificationViaServiceWorker(payload);
  }

  async sendMobileNotification(title: string, body: string, data?: any) {
    // This should use the actual push mechanism to send a notification via FCM server.
    console.log('📱 sendMobileNotification: Triggering server-side push.');
    try {
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      if (!currentUser || !currentUser.id) {
        console.error('❌ sendMobileNotification: Current user not found. Cannot determine target for mobile push.');
        return false;
      }
      // Assuming the mobile notification is for the current user.
      // Adjust userIds if it's for other users.
      return await pushNotificationService.sendPushNotification(
        [currentUser.id], 
        title, 
        body, 
        {
         ...data,
         type: data?.type || 'mobile_notification', // Add a type for clarity
         requireInteraction: data?.requireInteraction !== undefined ? data.requireInteraction : true,
         icon: data?.icon || '/marvellous-logo-black.png',
         badge: data?.badge || '/marvellous-logo-black.png',
         url: data?.url || '/',
         tag: data?.tag || `mobile-notif-${Date.now()}`
        }
      );
    } catch (error) {
      console.error('❌ Error in sendMobileNotification:', error);
      return false;
    }
  }

  async sendTaskAssignmentNotifications(
    assigneeIds: string[],
    taskTitle: string,
    taskId: string,
    createdBy?: string
  ) {
    console.log('📋 === ENHANCED CROSS-DEVICE TASK ASSIGNMENT NOTIFICATIONS ===');
    console.log('👥 Target assignee IDs:', assigneeIds);
    console.log('📝 Task Title:', taskTitle);
    console.log('🆔 Task ID:', taskId);
    console.log('👤 Created By:', createdBy);
    
    // Step 1: Send external push notifications to ALL devices for ALL assigned users
    console.log('📱 === SENDING EXTERNAL PUSH TO ALL DEVICES ===');
    console.log('🌐 This will reach ALL registered devices for each assigned user');
    
    try {
      // Send push notifications with detailed tracking
      const pushResult = await pushNotificationService.sendPushNotification(
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
          url: '/task-manager',
          timestamp: Date.now(),
          assigneeCount: assigneeIds.length
        }
      );
      
      console.log('📱 External push notification result:', pushResult);
    } catch (error) {
      console.error('❌ Error sending external push notifications:', error);
    }

    // Step 2: Send admin notifications (excluding the creator)
    console.log('👑 === SENDING ADMIN NOTIFICATIONS ===');
    await this.sendNotificationToAdmins(
      '📋 New Task Created',
      `Task "${taskTitle}" has been created and assigned to ${assigneeIds.length} user(s)`,
      taskId,
      createdBy
    );

    // Step 3: Verify notification delivery
    console.log('🔍 === VERIFYING NOTIFICATION DELIVERY ===');
    await this.verifyNotificationDelivery(assigneeIds, taskTitle);
    
    console.log('✅ === CROSS-DEVICE NOTIFICATIONS PROCESS COMPLETE ===');
  }

  async verifyNotificationDelivery(userIds: string[], taskTitle: string) {
    try {
      console.log('🔍 Verifying notification delivery for users:', userIds);
      
      // Check how many devices each user has registered
      for (const userId of userIds) {
        const { data: subscriptions, error } = await supabase
          .from('push_subscriptions')
          .select('*')
          .eq('user_id', userId);

        if (error) {
          console.error(`❌ Error checking subscriptions for user ${userId}:`, error);
        } else {
          console.log(`📊 User ${userId} has ${subscriptions?.length || 0} registered device(s)`);
          if (subscriptions && subscriptions.length > 0) {
            subscriptions.forEach((sub, index) => {
              console.log(`  Device ${index + 1}: ${sub.endpoint.substring(0, 50)}...`);
            });
          } else {
            console.log(`⚠️ User ${userId} has no registered devices for push notifications`);
          }
        }
      }
    } catch (error) {
      console.error('❌ Error verifying notification delivery:', error);
    }
  }

  async sendNotificationToUser(
    userId: string,
    title: string,
    body: string,
    taskId?: string,
    type: string = 'general'
  ) {
    try {
      console.log(`📤 === SENDING ENHANCED NOTIFICATION TO USER ${userId} ===`);
      console.log('📢 Title:', title);
      console.log('💬 Body:', body);
      console.log('🆔 Task ID:', taskId);
      console.log('📱 Type:', type);

      // Send external push notification to ALL devices for this user
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
          url: '/task-manager',
          timestamp: Date.now()
        }
      );
      
      console.log('📱 Cross-device push notification sent to user:', userId);
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
    console.log('🧪 === SENDING ENHANCED TEST NOTIFICATION ===');
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

    console.log('🧪 Sending enhanced test notifications...');

    // Send browser notification
    await this.showBrowserNotification({
      title: '🖥️ Browser Test Notification',
      body: 'This is a browser-based test notification! Click to focus the window.',
      tag: 'browser-test',
      data: { test: true, type: 'browser', timestamp: Date.now() },
      requireInteraction: true
    });

    // Send push notification via service worker
    const result = await this.showLocalNotificationViaServiceWorker({
      title: '📱 Service Worker Test Notification',
      body: 'This is a service worker push notification test!',
      tag: 'sw-test-notification',
      data: { test: true, type: 'service-worker', timestamp: Date.now() },
      requireInteraction: true
    });

    console.log('🧪 Enhanced test notifications result:', result);
    return !!result;
  }

  cleanup() {
    if (this.realtimeChannel) {
      console.log('🧹 Cleaning up real-time notifications...');
      this.realtimeChannel.unsubscribe();
      this.realtimeChannel = null;
    }
  }
}

export const notificationService = new NotificationService();
