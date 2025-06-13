
import { supabase } from '@/integrations/supabase/client';
import { TaskComment } from '@/types/taskTypes';

export class TaskChatService {
  // Fetch comments for a task
  static async getComments(taskId: string): Promise<TaskComment[]> {
    try {
      const { data, error } = await supabase
        .rpc('get_task_comments_with_users', { task_uuid: taskId });

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error fetching comments:', error);
      throw error;
    }
  }

  // Create a new comment
  static async createComment(taskId: string, userId: string, message: string): Promise<TaskComment> {
    try {
      const { data, error } = await supabase
        .from('task_comments')
        .insert({
          task_id: taskId,
          user_id: userId,
          message
        })
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error creating comment:', error);
      throw error;
    }
  }

  // Get comment count for a task
  static async getCommentCount(taskId: string): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('task_comments')
        .select('id', { count: 'exact' })
        .eq('task_id', taskId);

      if (error) throw error;

      return data ? data.length : 0;
    } catch (error) {
      console.error('Error fetching comment count:', error);
      return 0;
    }
  }

  // Send mention notifications
  static async sendMentionNotifications(mentionedUserIds: string[], message: string, taskId: string, senderUsername: string): Promise<void> {
    try {
      // Get FCM tokens for mentioned users
      const { data: fcmData, error: fcmError } = await supabase
        .from('fcm_tokens')
        .select('fcm_token, user_id')
        .in('user_id', mentionedUserIds)
        .eq('is_active', true);

      if (fcmError) throw fcmError;

      if (fcmData && fcmData.length > 0) {
        const tokens = fcmData.map((item: any) => item.fcm_token);
        
        // Send notifications to each token
        for (const token of tokens) {
          await fetch('/api/send-notification', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              token,
              title: `@${senderUsername} mentioned you in a task`,
              message: message.length > 100 ? message.substring(0, 100) + '...' : message,
              link: `/tasks/${taskId}`
            }),
          });
        }
      }
    } catch (error) {
      console.error('Error sending mention notifications:', error);
    }
  }
}
