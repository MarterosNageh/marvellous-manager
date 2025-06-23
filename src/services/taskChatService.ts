
import { supabase } from '@/integrations/supabase/client';
import { TaskComment } from '@/types/taskTypes';

export class TaskChatService {
  // Fetch comments for a task
  static async getComments(taskId: string): Promise<TaskComment[]> {
    try {
      const { data, error } = await supabase
        .from('task_comments')
        .select(`
          *,
          auth_users!task_comments_user_id_fkey (
            id,
            username,
            role
          )
        `)
        .eq('task_id', taskId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Transform the data to match our TaskComment interface
      const transformedComments: TaskComment[] = (data || []).map((item: any) => ({
        id: item.id,
        task_id: item.task_id,
        user_id: item.user_id,
        message: item.message,
        mentions: Array.isArray(item.mentions) 
          ? item.mentions.map((mention: any) => String(mention)) // Convert each mention to string
          : [],
        created_at: item.created_at,
        updated_at: item.updated_at,
        user: item.auth_users ? {
          id: item.auth_users.id,
          username: item.auth_users.username,
          role: item.auth_users.role || 'user'
        } : {
          id: item.user_id,
          username: 'Unknown User',
          role: 'user'
        }
      }));

      return transformedComments;
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

      // Transform the response to match TaskComment interface
      return {
        id: data.id,
        task_id: data.task_id,
        user_id: data.user_id,
        message: data.message,
        mentions: Array.isArray(data.mentions) ? data.mentions.map((mention: any) => String(mention)) : [],
        created_at: data.created_at,
        updated_at: data.updated_at
      };
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
