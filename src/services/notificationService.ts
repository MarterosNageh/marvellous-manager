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
  
  // Manual FCM token registration function that can be used for testing
  static async saveTokenManually(userId: string, token: string): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      const deviceInfo = {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
        vendor: navigator.vendor,
        appVersion: navigator.appVersion,
        isMobile: isMobileDevice,
        timestamp: new Date().toISOString(),
        manual: true
      };

      console.log(`📱 ${isMobileDevice ? 'Mobile' : 'Desktop'} device detected, saving FCM token for user: ${userId}`);
      
      // Check if token already exists
      const { data: existingTokens } = await supabase
        .from('fcm_tokens')
        .select('*')
        .eq('fcm_token', token);
        
      if (existingTokens && existingTokens.length > 0) {
        // Update existing token
        const { error: updateError } = await supabase
          .from('fcm_tokens')
          .update({ 
            user_id: userId,
            updated_at: new Date().toISOString(),
            is_active: true,
            device_info: deviceInfo
          })
          .eq('id', existingTokens[0].id);
          
        if (updateError) throw updateError;
        
        return { 
          success: true, 
          message: 'FCM token updated successfully' 
        };
      } else {
        // Create new token
        const { error: insertError } = await supabase
          .from('fcm_tokens')
          .insert([{
            user_id: userId,
            fcm_token: token,
            device_info: deviceInfo,
            is_active: true
          }]);
          
        if (insertError) throw insertError;
        
        return {
          success: true,
          message: 'FCM token saved successfully'
        };
      }
    } catch (error) {
      console.error('❌ Error saving FCM token manually:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

// Make this function accessible from the console for testing
if (typeof window !== 'undefined') {
  (window as any).saveTokenManually = NotificationService.saveTokenManually;
}
