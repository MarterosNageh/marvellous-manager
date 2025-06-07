
import { supabase } from '@/integrations/supabase/client';

interface NotificationPayload {
  userIds: string[];
  title: string;
  body: string;
  data?: any;
}

export class NotificationService {
  static async sendNotification(payload: NotificationPayload): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      console.log('🔔 Sending notification:', payload);

      // Call the Supabase edge function
      const { data, error } = await supabase.functions.invoke('send-push-notification', {
        body: payload
      });

      if (error) {
        console.error('❌ Supabase function error:', error);
        throw error;
      }

      console.log('✅ Notification sent successfully:', data);
      return { 
        success: true, 
        message: data?.message || 'Notification sent successfully' 
      };
    } catch (error) {
      console.error('❌ Error sending notification:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  static async sendTestNotification(userIds: string[]): Promise<{ success: boolean; message?: string; error?: string }> {
    return this.sendNotification({
      userIds,
      title: '🔔 Test Notification',
      body: 'This is a test notification from the Task Manager!',
      data: {
        type: 'test',
        timestamp: new Date().toISOString(),
        url: '/tasks'
      }
    });
  }

  static async sendTaskAssignmentNotification(userIds: string[], taskTitle: string): Promise<{ success: boolean; message?: string; error?: string }> {
    return this.sendNotification({
      userIds,
      title: '📝 New Task Assigned',
      body: `You have been assigned a new task: ${taskTitle}`,
      data: {
        type: 'task_assignment',
        taskTitle,
        url: '/tasks'
      }
    });
  }

  static async sendTaskStatusNotification(userIds: string[], taskTitle: string, status: string): Promise<{ success: boolean; message?: string; error?: string }> {
    return this.sendNotification({
      userIds,
      title: '📋 Task Status Updated',
      body: `Task "${taskTitle}" status changed to ${status}`,
      data: {
        type: 'task_status',
        taskTitle,
        status,
        url: '/tasks'
      }
    });
  }
}
