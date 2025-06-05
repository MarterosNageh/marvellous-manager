
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
        // Register Firebase messaging service worker
        this.registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
        console.log('🔧 Firebase messaging service worker registered:', this.registration.scope);
        
        // Auto-setup push notifications if permission is already granted
        if (Notification.permission === 'granted') {
          console.log('🔄 Auto-setting up FCM notifications...');
          await this.setupPushNotifications();
        }

        // Setup real-time notifications for task changes
        await this.setupRealtimeNotifications();
      } catch (error) {
        console.error('❌ Service Worker registration failed:', error);
      }
    }
  }

  async setupRealtimeNotifications() {
    console.log('🔔 Setting up real-time task notifications...');
    
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
              // Send FCM notification
              await this.sendTaskAssignmentNotifications(
                [user.id],
                task.title,
                payload.new.task_id
              );
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
              // Send FCM notification for task updates
              await this.sendTaskUpdateNotifications(
                [user.id],
                payload.new.title,
                payload.new.id
              );
            }
          }
        )
        .subscribe((status) => {
          console.log('🔔 Real-time subscription status:', status);
          if (status === 'SUBSCRIBED') {
            console.log('✅ Real-time task notifications active');
          }
        });

    } catch (error) {
      console.error('❌ Error setting up real-time notifications:', error);
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
    console.log('🚀 Setting up FCM push notifications...');
    
    if (Notification.permission !== 'granted') {
      console.log('❌ Cannot setup push notifications: permission not granted');
      return false;
    }

    try {
      console.log('📱 Requesting FCM subscription...');
      const subscribed = await pushNotificationService.requestPermissionAndSubscribe();
      console.log('📱 FCM subscription result:', subscribed);
      
      if (subscribed) {
        console.log('✅ FCM push notifications setup completed successfully');
        
        // Verify subscription status
        const hasSubscription = await pushNotificationService.getSubscriptionStatus();
        console.log('🔍 FCM subscription verification:', hasSubscription);
        
        return hasSubscription;
      } else {
        console.log('❌ FCM push notifications setup failed');
        return false;
      }
    } catch (error) {
      console.error('❌ Error setting up FCM push notifications:', error);
      return false;
    }
  }

  async sendTaskAssignmentNotifications(
    assigneeIds: string[],
    taskTitle: string,
    taskId: string,
    createdBy?: string
  ) {
    console.log('📋 === SENDING TASK ASSIGNMENT NOTIFICATIONS ===');
    console.log('👥 Target assignee IDs:', assigneeIds);
    console.log('📝 Task Title:', taskTitle);
    console.log('🆔 Task ID:', taskId);
    console.log('👤 Created By:', createdBy);
    
    // Send FCM notifications to ALL devices for ALL assigned users
    console.log('📱 === SENDING FCM NOTIFICATIONS ===');
    
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
      
      console.log('📱 FCM notification result:', pushResult);
    } catch (error) {
      console.error('❌ Error sending FCM notifications:', error);
    }

    // Send admin notifications (excluding the creator)
    console.log('👑 === SENDING ADMIN NOTIFICATIONS ===');
    await this.sendNotificationToAdmins(
      '📋 New Task Created',
      `Task "${taskTitle}" has been created and assigned to ${assigneeIds.length} user(s)`,
      taskId,
      createdBy
    );
    
    console.log('✅ === TASK ASSIGNMENT NOTIFICATIONS COMPLETE ===');
  }

  async sendTaskUpdateNotifications(
    assigneeIds: string[],
    taskTitle: string,
    taskId: string
  ) {
    console.log('📝 === SENDING TASK UPDATE NOTIFICATIONS ===');
    
    try {
      await pushNotificationService.sendPushNotification(
        assigneeIds,
        '📝 Task Updated',
        `Task "${taskTitle}" has been modified`,
        { 
          taskId, 
          type: 'task_update', 
          requireInteraction: true,
          tag: `task-update-${taskId}`,
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          url: '/task-manager',
          timestamp: Date.now()
        }
      );
      
      console.log('✅ Task update notifications sent');
    } catch (error) {
      console.error('❌ Error sending task update notifications:', error);
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
        const adminIds = admins
          .filter(admin => admin.id !== excludeUserId)
          .map(admin => admin.id);

        if (adminIds.length > 0) {
          await pushNotificationService.sendPushNotification(
            adminIds,
            title,
            body,
            { 
              taskId, 
              type: 'admin_notification',
              requireInteraction: true,
              tag: `admin-${taskId}`,
              icon: '/favicon.ico',
              badge: '/favicon.ico',
              url: '/task-manager',
              timestamp: Date.now()
            }
          );
        }
      }
    } catch (error) {
      console.error('❌ Error sending notifications to admins:', error);
    }
  }

  async sendTestNotification() {
    console.log('🧪 === SENDING FCM TEST NOTIFICATION ===');
    console.log('🔔 Current permission status:', Notification.permission);
    
    if (Notification.permission !== 'granted') {
      console.log('🔔 Permission not granted, requesting...');
      const hasPermission = await this.requestPermission();
      if (!hasPermission) {
        console.log('❌ Cannot send test notification: permission not granted');
        return false;
      }
    }

    // Setup FCM notifications if not already done
    const fcmSetup = await this.setupPushNotifications();
    console.log('📱 FCM notification setup result:', fcmSetup);

    if (!fcmSetup) {
      console.log('❌ FCM notifications not properly set up');
      return false;
    }

    console.log('🧪 Sending FCM test notification...');

    // Send test FCM notification
    const currentUser = localStorage.getItem('currentUser');
    if (currentUser) {
      const user = JSON.parse(currentUser);
      
      await pushNotificationService.sendPushNotification(
        [user.id],
        '🧪 FCM Test Notification',
        'This is a test notification from Firebase Cloud Messaging!',
        { 
          test: true, 
          type: 'fcm_test', 
          timestamp: Date.now(),
          tag: 'fcm-test',
          requireInteraction: true,
          url: '/task-manager'
        }
      );
    }

    console.log('🧪 FCM test notification sent');
    return true;
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
