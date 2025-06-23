
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Send, AtSign, User, Clock, Search, Bell, ChevronDown } from 'lucide-react';
import { TaskComment, TaskUser, User as UserType } from '@/types/taskTypes';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { NotificationService } from '@/services/notificationService';
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area";

interface TaskChatProps {
  taskId: string;
  users: UserType[];
  currentUser: UserType;
}

export const TaskChat: React.FC<TaskChatProps> = ({ taskId, users, currentUser }) => {
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [showMentionDialog, setShowMentionDialog] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [sendingNotifications, setSendingNotifications] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const scrollViewportRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mentionSearchRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Convert User to TaskUser for internal use
  const convertToTaskUser = (user: UserType): TaskUser => ({
    id: user.id,
    username: user.username,
    role: (user.role && ['admin', 'senior', 'operator', 'producer'].includes(user.role)) 
      ? user.role as 'admin' | 'senior' | 'operator' | 'producer'
      : 'operator'
  });

  const taskUsers = users.map(convertToTaskUser);
  const currentTaskUser = convertToTaskUser(currentUser);

  // Scroll to bottom function
  const scrollToBottom = useCallback((smooth = true) => {
    if (scrollViewportRef.current) {
      const viewport = scrollViewportRef.current;
      const scrollHeight = viewport.scrollHeight;
      const clientHeight = viewport.clientHeight;
      
      viewport.scrollTo({
        top: scrollHeight - clientHeight,
        behavior: smooth ? 'smooth' : 'auto'
      });
    }
  }, []);

  // Check if user is at bottom
  const checkIfAtBottom = useCallback(() => {
    if (scrollViewportRef.current) {
      const viewport = scrollViewportRef.current;
      const { scrollTop, scrollHeight, clientHeight } = viewport;
      const isBottom = scrollTop + clientHeight >= scrollHeight - 10; // 10px threshold
      setIsAtBottom(isBottom);
      setShowScrollToBottom(!isBottom && comments.length > 0);
    }
  }, [comments.length]);

  // Handle scroll events
  const handleScroll = useCallback(() => {
    checkIfAtBottom();
  }, [checkIfAtBottom]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (isAtBottom && comments.length > 0) {
      // Use setTimeout to ensure DOM is updated
      setTimeout(() => {
        scrollToBottom(false);
      }, 100);
    }
  }, [comments, isAtBottom, scrollToBottom]);

  // Extract mentions from message
  const extractMentions = (message: string): string[] => {
    const mentionRegex = /@(\w+)/g;
    const mentions: string[] = [];
    let match;
    
    while ((match = mentionRegex.exec(message)) !== null) {
      const username = match[1];
      const user = taskUsers.find(u => u.username === username);
      if (user) {
        mentions.push(user.id);
      }
    }
    
    return mentions;
  };

  // Fetch comments from database
  const fetchComments = async () => {
    try {
      setLoading(true);
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
        mentions: Array.isArray(item.mentions) ? item.mentions : [],
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
      
      setComments(transformedComments);
    } catch (error) {
      console.error('Error fetching comments:', error);
      toast({
        title: "Error",
        description: "Failed to load comments",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Send push notification for mentions
  const sendMentionNotifications = async (mentionedUserIds: string[], message: string) => {
    try {
      if (mentionedUserIds.length > 0) {
        // Get task details for notification
        const { data: taskData } = await supabase
          .from('tasks')
          .select('title')
          .eq('id', taskId)
          .single();

        const taskTitle = taskData?.title || 'Task';

        // Send notification using the NotificationService
        await NotificationService.sendTaskMentionNotification(
          mentionedUserIds,
          taskTitle,
          currentUser.username,
          message
        );

        console.log('✅ Mention notifications sent to', mentionedUserIds.length, 'users');
      }
    } catch (error) {
      console.error('Error sending mention notifications:', error);
    }
  };

  // Send push notification to all task participants
  const sendChatNotifications = async (message: string) => {
    try {
      // Get task details for notification
      const { data: taskData } = await supabase
        .from('tasks')
        .select(`
          title,
          task_assignments (
            user_id
          )
        `)
        .eq('id', taskId)
        .single();

      if (!taskData) {
        console.warn('Task not found for notifications');
        return;
      }

      const taskTitle = taskData.title || 'Task';
      
      // Get all assignee user IDs (excluding the current user who sent the message)
      const assigneeIds = taskData.task_assignments
        ?.map((assignment: any) => assignment.user_id)
        .filter((userId: string) => userId !== currentUser.id) || [];

      if (assigneeIds.length > 0) {
        // Send notification using the NotificationService
        await NotificationService.sendTaskChatNotification(
          assigneeIds,
          taskTitle,
          currentUser.username,
          message
        );

        console.log('✅ Chat notifications sent to', assigneeIds.length, 'task participants');
      }
    } catch (error) {
      console.error('Error sending chat notifications:', error);
    }
  };

  // Send message to database
  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      setSending(true);
      setSendingNotifications(true);
      
      const mentions = extractMentions(newMessage);
      
      // Insert comment to database WITHOUT mentions first (to avoid trigger error)
      const { data, error } = await supabase
        .from('task_comments')
        .insert({
          task_id: taskId,
          user_id: currentUser.id,
          message: newMessage.trim(),
          mentions: [] // Start with empty mentions to avoid trigger
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // Manually insert mentions if any exist
      if (mentions.length > 0) {
        // Insert mentions manually to avoid the problematic trigger
        const mentionInserts = mentions.map(userId => ({
          comment_id: data.id,
          mentioned_user_id: userId,
          task_id: taskId
        }));
        
        const { error: mentionError } = await supabase
          .from('task_comment_mentions')
          .insert(mentionInserts);
        
        if (mentionError) {
          console.error('Error inserting mentions:', mentionError);
        }
        
        // Update the comment with mentions
        const { error: updateError } = await supabase
          .from('task_comments')
          .update({ mentions: mentions })
          .eq('id', data.id);
        
        if (updateError) {
          console.error('Error updating comment with mentions:', updateError);
        }
      }
      
      setNewMessage('');

      // Send push notifications for mentions
      if (mentions.length > 0) {
        await sendMentionNotifications(mentions, newMessage.trim());
      }

      // Send push notifications to all task participants
      await sendChatNotifications(newMessage.trim());

      toast({
        title: "Success",
        description: mentions.length > 0 
          ? `Message sent and notifications sent to task participants`
          : "Message sent and notifications sent to task participants",
      });
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setSending(false);
      setSendingNotifications(false);
    }
  };

  // Handle mention input
  const handleMentionInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setNewMessage(value);
    
    const cursorPos = e.target.selectionStart;
    setCursorPosition(cursorPos);
    
    // Check for @ symbol
    const beforeCursor = value.substring(0, cursorPos);
    const mentionMatch = beforeCursor.match(/@(\w*)$/);
    
    if (mentionMatch) {
      setMentionQuery(mentionMatch[1]);
      setShowMentionDialog(true);
    } else {
      setShowMentionDialog(false);
    }
  };

  // Insert mention
  const insertMention = (username: string) => {
    const beforeMention = newMessage.substring(0, cursorPosition).replace(/@\w*$/, '');
    const afterMention = newMessage.substring(cursorPosition);
    const newValue = beforeMention + `@${username} ` + afterMention;
    
    setNewMessage(newValue);
    setShowMentionDialog(false);
    
    // Focus back to textarea
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        const newCursorPos = beforeMention.length + username.length + 2; // +2 for @ and space
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  };

  // Filter users for mention suggestions
  const filteredUsers = taskUsers.filter(user => 
    user.username.toLowerCase().includes(mentionQuery.toLowerCase()) &&
    user.id !== currentUser.id
  );

  // Format message with mentions
  const formatMessage = (message: string) => {
    return message.replace(/@(\w+)/g, (match, username) => {
      const user = taskUsers.find(u => u.username === username);
      if (user) {
        return `<span class="text-blue-600 font-medium bg-blue-100 px-1 rounded">@${username}</span>`;
      }
      return match;
    });
  };

  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  // Load comments and set up real-time subscription
  useEffect(() => {
    fetchComments();

    // Set up real-time subscription for comments
    const channel = supabase
      .channel(`task_comments_${taskId}_${Date.now()}`) // Add timestamp to make unique
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'task_comments',
          filter: `task_id=eq.${taskId}`
        },
        (payload) => {
          console.log('Real-time comment update:', payload);
          // Refresh comments when there's a change
          fetchComments();
        }
      )
      .subscribe((status) => {
        console.log('Real-time subscription status:', status);
      });

    // Cleanup subscription on unmount
    return () => {
      console.log('Cleaning up real-time subscription');
      supabase.removeChannel(channel);
    };
  }, [taskId]);

  // Focus search input when dialog opens
  useEffect(() => {
    if (showMentionDialog && mentionSearchRef.current) {
      setTimeout(() => {
        mentionSearchRef.current?.focus();
      }, 100);
    }
  }, [showMentionDialog]);

  // Add keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + End to scroll to bottom
      if ((e.ctrlKey || e.metaKey) && e.key === 'End') {
        e.preventDefault();
        scrollToBottom(true);
      }
      // Ctrl/Cmd + Home to scroll to top
      if ((e.ctrlKey || e.metaKey) && e.key === 'Home') {
        e.preventDefault();
        if (scrollViewportRef.current) {
          scrollViewportRef.current.scrollTo({
            top: 0,
            behavior: 'smooth'
          });
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [scrollToBottom]);

  return (
    <>
      <Card className="h-full flex flex-col max-h-full overflow-hidden">
        <CardHeader className="pb-3 flex-shrink-0">
          <CardTitle className="flex items-center gap-2 text-lg">
            <AtSign className="h-5 w-5" />
            Task Chat
            <Badge variant="secondary" className="text-xs">
              {comments.length} messages
            </Badge>
            {comments.some(c => c.mentions && c.mentions.length > 0) && (
              <Badge variant="outline" className="text-xs">
                <Bell className="h-3 w-3 mr-1" />
                Mentions
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="flex-1 flex flex-col p-0 relative min-h-0">
          {/* Messages */}
          <div className="flex-1 min-h-0 relative">
            <ScrollArea 
              className="h-full px-4" 
              ref={scrollAreaRef}
            >
              <ScrollAreaPrimitive.Viewport 
                ref={scrollViewportRef}
                className="h-full w-full"
                onScroll={handleScroll}
              >
                {loading ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="text-muted-foreground">Loading messages...</div>
                  </div>
                ) : comments.length === 0 ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="text-muted-foreground text-center">
                      <AtSign className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No messages yet</p>
                      <p className="text-sm">Start the conversation!</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 pb-4">
                    {comments.map((comment) => (
                      <div
                        key={comment.id}
                        className={`flex gap-2 sm:gap-3 ${
                          comment.user_id === currentUser.id ? 'flex-row-reverse' : ''
                        }`}
                      >
                        <Avatar className="h-6 w-6 sm:h-8 sm:w-8 flex-shrink-0">
                          <AvatarFallback className="text-xs">
                            {comment.user?.username.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className={`flex-1 min-w-0 ${
                          comment.user_id === currentUser.id ? 'text-right' : ''
                        }`}>
                          <div className={`inline-block p-2 sm:p-3 rounded-lg max-w-[85%] sm:max-w-[80%] ${
                            comment.user_id === currentUser.id
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-900'
                          }`}>
                            <div
                              className="text-xs sm:text-sm whitespace-pre-wrap break-words"
                              dangerouslySetInnerHTML={{
                                __html: formatMessage(comment.message)
                              }}
                            />
                          </div>
                          
                          <div className={`flex items-center gap-1 sm:gap-2 mt-1 text-xs text-muted-foreground ${
                            comment.user_id === currentUser.id ? 'justify-end' : ''
                          }`}>
                            <span className="font-medium truncate max-w-[100px] sm:max-w-none">
                              {comment.user?.username}
                            </span>
                            <Clock className="h-3 w-3 flex-shrink-0" />
                            <span className="text-xs">{formatTimestamp(comment.created_at)}</span>
                            {comment.mentions && comment.mentions.length > 0 && (
                              <Badge variant="outline" className="text-xs hidden sm:inline-flex">
                                <Bell className="h-3 w-3 mr-1" />
                                {comment.mentions.length} mention{comment.mentions.length !== 1 ? 's' : ''}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollAreaPrimitive.Viewport>
            </ScrollArea>

            {/* Scroll to bottom button */}
            {showScrollToBottom && (
              <Button
                size="sm"
                variant="secondary"
                className="absolute bottom-4 right-4 h-8 w-8 p-0 rounded-full shadow-lg z-10 sm:bottom-6 sm:right-6"
                onClick={() => scrollToBottom(true)}
                title="Scroll to bottom (Ctrl+End)"
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Input area */}
          <div className="border-t p-3 sm:p-4 flex-shrink-0">
            <div className="relative">
              <Textarea
                ref={textareaRef}
                value={newMessage}
                onChange={handleMentionInput}
                placeholder="Type a message... Use @ to mention someone"
                className="min-h-[50px] sm:min-h-[60px] resize-none pr-12 text-sm"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
              />
              
              <Button
                size="sm"
                className="absolute right-2 bottom-2 h-7 w-7 sm:h-8 sm:w-8 p-0"
                onClick={sendMessage}
                disabled={sending || !newMessage.trim()}
                title={sendingNotifications ? "Sending notifications..." : "Send message"}
              >
                {sendingNotifications ? (
                  <div className="h-3 w-3 sm:h-4 sm:w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : (
                  <Send className="h-3 w-3 sm:h-4 sm:w-4" />
                )}
              </Button>
            </div>

            {/* Help text */}
            <div className="mt-2 text-xs text-muted-foreground">
              <div className="hidden sm:block">
                Press Enter to send, Shift+Enter for new line. Use @ to mention team members.
                <br />
                <span className="text-xs">Keyboard shortcuts: Ctrl+End (scroll to bottom), Ctrl+Home (scroll to top)</span>
                {sendingNotifications && (
                  <div className="mt-1 text-blue-600 flex items-center gap-1">
                    <div className="h-2 w-2 animate-spin rounded-full border border-current border-t-transparent" />
                    Sending notifications...
                  </div>
                )}
              </div>
              <div className="sm:hidden">
                Press Enter to send, Shift+Enter for new line. Use @ to mention team members.
                {sendingNotifications && (
                  <div className="mt-1 text-blue-600 flex items-center gap-1">
                    <div className="h-2 w-2 animate-spin rounded-full border border-current border-t-transparent" />
                    Sending notifications...
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mention Dialog */}
      <Dialog open={showMentionDialog} onOpenChange={setShowMentionDialog}>
        <DialogContent className="max-w-md w-[95vw] sm:w-full max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AtSign className="h-5 w-5" />
              Mention Users
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                ref={mentionSearchRef}
                placeholder="Search users..."
                value={mentionQuery}
                onChange={(e) => setMentionQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Users List */}
            <div className="max-h-48 sm:max-h-64 overflow-y-auto">
              {filteredUsers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <User className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No users found</p>
                  <p className="text-sm">Try a different search term</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredUsers.map((user) => (
                    <button
                      key={user.id}
                      className="w-full p-2 sm:p-3 text-left hover:bg-gray-50 rounded-lg border border-transparent hover:border-gray-200 transition-colors flex items-center gap-2 sm:gap-3"
                      onClick={() => insertMention(user.username)}
                    >
                      <Avatar className="h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0">
                        <AvatarFallback className="text-sm font-medium">
                          {user.username.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">{user.username}</div>
                        <div className="text-xs text-muted-foreground capitalize">{user.role}</div>
                      </div>
                      <Badge variant="outline" className="text-xs hidden sm:inline-flex">
                        @{user.username}
                      </Badge>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-2 border-t">
              <div className="text-xs text-muted-foreground">
                {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''} found
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowMentionDialog(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
