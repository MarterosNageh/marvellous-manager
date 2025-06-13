import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://venxltsumlixfgysffqu.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZlbnhsdHN1bWxpeGZneXNmZnF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUzOTAxMjgsImV4cCI6MjA2MDk2NjEyOH0.nh-jpcFgH1MDIcslbcG4uk82qT81w-IDjI4zMpmLv_Y';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Chat-related database operations
export const chatService = {
  // Get comments for a task
  async getTaskComments(taskId: string) {
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
    
    if (error) {
      console.error('Error fetching comments:', error);
      throw error;
    }
    
    return data || [];
  },

  // Add a new comment
  async addComment(taskId: string, userId: string, message: string, mentions: string[] = []) {
    const { data, error } = await supabase
      .from('task_comments')
      .insert({
        task_id: taskId,
        user_id: userId,
        message,
        mentions
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error adding comment:', error);
      throw error;
    }
    
    return data;
  },

  // Subscribe to real-time comments
  subscribeToComments(taskId: string, callback: (payload: any) => void) {
    return supabase
      .channel(`task_comments_${taskId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'task_comments',
          filter: `task_id=eq.${taskId}`
        },
        callback
      )
      .subscribe();
  },

  // Get mentioned users for notifications
  async getMentionedUsers(commentId: string) {
    const { data, error } = await supabase
      .from('task_comment_mentions')
      .select(`
        mentioned_user_id,
        auth_users!task_comment_mentions_mentioned_user_id_fkey(username, role)
      `)
      .eq('comment_id', commentId);
    
    if (error) {
      console.error('Error fetching mentioned users:', error);
      throw error;
    }
    
    return data || [];
  }
};
