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

      // Add a unique tag for the notification type
      const notificationData = {
        ...payload.data,
        tag: `${payload.data?.type || 'default'}_${Date.now()}`,
      };

      // Call the Supabase edge function
      const { data, error } = await supabase.functions.invoke('send-push-notification', {
        body: {
          ...payload,
          data: notificationData
        }
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
        url: '/task-manager'
      }
    });
  }

  static async sendTaskCreatedNotification(
    userIds: string[], 
    taskTitle: string
  ): Promise<{ success: boolean; message?: string; error?: string }> {
    return this.sendNotification({
      userIds,
      title: `${taskTitle} (Created)`,
      body: `A new task has been created and assigned to you`,
      data: {
        type: 'task_created',
        taskTitle,
        url: '/task-manager',
        timestamp: new Date().toISOString()
      }
    });
  }

  static async sendTaskAssignmentNotification(
    userIds: string[], 
    taskTitle: string
  ): Promise<{ success: boolean; message?: string; error?: string }> {
    return this.sendNotification({
      userIds,
      title: `${taskTitle} (Assigned)`,
      body: `You have been assigned to this task`,
      data: {
        type: 'task_assignment',
        taskTitle,
        url: '/task-manager',
        timestamp: new Date().toISOString()
      }
    });
  }

  static async sendTaskStatusNotification(
    userIds: string[], 
    taskTitle: string, 
    oldStatus: string, 
    newStatus: string
  ): Promise<{ success: boolean; message?: string; error?: string }> {
    // Format status labels
    const formatStatus = (status: string) => {
      return status.split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    };

    return this.sendNotification({
      userIds,
      title: `${taskTitle} (Status Updated)`,
      body: `Status changed from ${formatStatus(oldStatus)} to ${formatStatus(newStatus)}`,
      data: {
        type: 'task_status',
        taskTitle,
        oldStatus,
        newStatus,
        url: '/task-manager',
        timestamp: new Date().toISOString()
      }
    });
  }

  static async sendTaskModifiedNotification(
    userIds: string[], 
    taskTitle: string,
    changes: string[]
  ): Promise<{ success: boolean; message?: string; error?: string }> {
    // Format the changes for display
    const formatChanges = (changes: string[]) => {
      return changes.map(change => change.charAt(0).toUpperCase() + change.slice(1));
    };

    return this.sendNotification({
      userIds,
      title: `${taskTitle} (Updated)`,
      body: `Changes made to: ${formatChanges(changes).join(', ')}`,
      data: {
        type: 'task_modified',
        taskTitle,
        changes,
        url: '/task-manager',
        timestamp: new Date().toISOString()
      }
    });
  }

  static async sendTaskDeletedNotification(
    userIds: string[], 
    taskTitle: string
  ): Promise<{ success: boolean; message?: string; error?: string }> {
    return this.sendNotification({
      userIds,
      title: `${taskTitle} (Deleted)`,
      body: `This task has been deleted`,
      data: {
        type: 'task_deleted',
        taskTitle,
        url: '/task-manager',
        timestamp: new Date().toISOString()
      }
    });
  }

  static async sendNoteSharedNotification(
    userIds: string[],
    noteTitle: string,
    sharedByUsername: string
  ): Promise<{ success: boolean; message?: string; error?: string }> {
    return this.sendNotification({
      userIds,
      title: `${noteTitle} (Shared)`,
      body: `${sharedByUsername} has shared a note with you`,
      data: {
        type: 'note_shared',
        noteTitle,
        url: '/notes',
        timestamp: new Date().toISOString()
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
        manual: true,
        // Add more detailed mobile information
        screen: {
          width: window.screen.width,
          height: window.screen.height,
          orientation: window.screen.orientation?.type || 'unknown'
        },
        deviceMemory: (navigator as any).deviceMemory,
        hardwareConcurrency: navigator.hardwareConcurrency,
        mobileOS: isMobileDevice ? 
          (/iPhone|iPad|iPod/.test(navigator.userAgent) ? 'iOS' : 
           /Android/.test(navigator.userAgent) ? 'Android' : 'Other') : 'Desktop'
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
          
        if (updateError) {
          console.error('Error updating token:', updateError);
          throw updateError;
        }
        
        console.log('✅ FCM token updated successfully for mobile device');
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
          
        if (insertError) {
          console.error('Error inserting token:', insertError);
          throw insertError;
        }
        
        console.log('✅ FCM token saved successfully for mobile device');
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

  static async sendShiftCreatedNotification(
    userIds: string[],
    shiftDate: string,
    shiftTime: string
  ): Promise<{ success: boolean; message?: string; error?: string }> {
    return this.sendNotification({
      userIds,
      title: `New Shift Assigned (${shiftDate})`,
      body: `You have been assigned a new shift at ${shiftTime}`,
      data: {
        type: 'shift_created',
        shiftDate,
        shiftTime,
        url: '/schedule',
        timestamp: new Date().toISOString()
      }
    });
  }

  static async sendShiftModifiedNotification(
    userIds: string[],
    shiftDate: string,
    shiftTime: string,
    changes: string[]
  ): Promise<{ success: boolean; message?: string; error?: string }> {
    const formatChanges = (changes: string[]) => {
      return changes.map(change => change.charAt(0).toUpperCase() + change.slice(1));
    };

    return this.sendNotification({
      userIds,
      title: `Shift Updated (${shiftDate})`,
      body: `Changes made to your shift at ${shiftTime}: ${formatChanges(changes).join(', ')}`,
      data: {
        type: 'shift_modified',
        shiftDate,
        shiftTime,
        changes,
        url: '/schedule',
        timestamp: new Date().toISOString()
      }
    });
  }

  static async sendShiftDeletedNotification(
    userIds: string[],
    shiftDate: string,
    shiftTime: string
  ): Promise<{ success: boolean; message?: string; error?: string }> {
    return this.sendNotification({
      userIds,
      title: `Shift Deleted (${shiftDate})`,
      body: `Your shift at ${shiftTime} has been deleted`,
      data: {
        type: 'shift_deleted',
        shiftDate,
        shiftTime,
        url: '/schedule',
        timestamp: new Date().toISOString()
      }
    });
  }

  static async sendRequestApprovedNotification(
    userIds: string[],
    requestType: string,
    requestDate: string
  ): Promise<{ success: boolean; message?: string; error?: string }> {
    const formatRequestType = (type: string) => {
      return type.split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    };

    return this.sendNotification({
      userIds,
      title: `Request Approved (${formatRequestType(requestType)})`,
      body: `Your request for ${formatRequestType(requestType)} on ${requestDate} has been approved`,
      data: {
        type: 'request_approved',
        requestType,
        requestDate,
        url: '/requests',
        timestamp: new Date().toISOString()
      }
    });
  }

  static async sendRequestSubmittedNotification(
    userIds: string[],
    requestType: string,
    requestDate: string,
    submittedBy: string
  ): Promise<{ success: boolean; message?: string; error?: string }> {
    const formatRequestType = (type: string) => {
      return type.split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    };

    return this.sendNotification({
      userIds,
      title: `New Request Submitted`,
      body: `${submittedBy} has submitted a request for ${formatRequestType(requestType)} on ${requestDate}`,
      data: {
        type: 'request_submitted',
        requestType,
        requestDate,
        submittedBy,
        url: '/requests',
        timestamp: new Date().toISOString()
      }
    });
  }
}

// Make this function accessible from the console for testing
if (typeof window !== 'undefined') {
  (window as any).saveTokenManually = NotificationService.saveTokenManually;
}
