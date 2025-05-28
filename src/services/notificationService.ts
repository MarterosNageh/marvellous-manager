
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
    console.log('📋 === SENDING ENHANCED TASK ASSIGNMENT NOTIFICATIONS ===');
    console.log('👥 Assignee IDs:', assigneeIds);
    console.log('📝 Task Title:', taskTitle);
    console.log('🆔 Task ID:', taskId);
    console.log('👤 Created By:', createdBy);
    
    // Send external push notifications to ALL assigned users
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
      console.log(`📤 === SENDING ENHANCED NOTIFICATION TO USER ${userId} ===`);
      console.log('📢 Title:', title);
      console.log('💬 Body:', body);

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
    const result = await this.sendPushNotification({
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
