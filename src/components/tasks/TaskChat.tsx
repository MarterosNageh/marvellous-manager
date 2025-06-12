import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Send, AtSign, User, Clock, Search, Bell } from 'lucide-react';
import { TaskComment, TaskUser, User as UserType } from '@/types/taskTypes';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { chatService } from '@/services/supabaseClient';

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
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mentionSearchRef = useRef<HTMLInputElement>(null);
  const subscriptionRef = useRef<any>(null);
  const { toast } = useToast();

  // Convert User to TaskUser for internal use
  const convertToTaskUser = (user: UserType): TaskUser => ({
    id: user.id,
    username: user.username,
    role: user.role || 'user'
  });

  const taskUsers = users.map(convertToTaskUser);
  const currentTaskUser = convertToTaskUser(currentUser);

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
      const data = await chatService.getTaskComments(taskId);
      
      // Transform the data to match our TaskComment interface
      const transformedComments: TaskComment[] = data.map((item: any) => ({
        id: item.id,
        task_id: item.task_id,
        user_id: item.user_id,
        message: item.message,
        mentions: item.mentions || [],
        created_at: item.created_at,
        updated_at: item.updated_at,
        user: {
          id: item.user_id,
          username: item.user_username,
          role: item.user_role
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
  const sendMentionNotifications = async (mentionedUserIds: string[], message: string, taskId: string) => {
    try {
      // Get mentioned users' details
      const mentionedUsers = taskUsers.filter(user => mentionedUserIds.includes(user.id));
      
      // In a real implementation, you would:
      // 1. Get FCM tokens for mentioned users
      // 2. Send push notifications via your notification service
      // 3. Store notification in database
      
      console.log('Sending notifications to:', mentionedUsers.map(u => u.username));
      console.log('Message:', message);
      console.log('Task ID:', taskId);
      
      // For now, show a toast for each mentioned user
      mentionedUsers.forEach(user => {
        toast({
          title: "Mention Notification",
          description: `You were mentioned by ${currentUser.username} in a task comment`,
          action: (
            <Button variant="outline" size="sm" onClick={() => {
              // Navigate to task or show task details
              console.log('Navigate to task:', taskId);
            }}>
              View Task
            </Button>
          ),
        });
      });
      
    } catch (error) {
      console.error('Error sending mention notifications:', error);
    }
  };

  // Send message to database
  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      setSending(true);
      
      const mentions = extractMentions(newMessage);
      
      // Send to database
      await chatService.addComment(taskId, currentUser.id, newMessage.trim(), mentions);
      
      setNewMessage('');

      // Send push notifications for mentions
      if (mentions.length > 0) {
        await sendMentionNotifications(mentions, newMessage.trim(), taskId);
      }

      toast({
        title: "Success",
        description: "Message sent successfully",
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

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [comments]);

  // Load comments and set up real-time subscription
  useEffect(() => {
    fetchComments();

    // Set up real-time subscription
    subscriptionRef.current = chatService.subscribeToComments(taskId, (payload) => {
      console.log('Real-time update:', payload);
      
      if (payload.eventType === 'INSERT') {
        // Fetch updated comments
        fetchComments();
      }
    });

    // Cleanup subscription on unmount
    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }
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

  return (
    <>
      <Card className="h-full flex flex-col">
        <CardHeader className="pb-3">
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
        
        <CardContent className="flex-1 flex flex-col p-0">
          {/* Messages */}
          <ScrollArea className="flex-1 px-4" ref={scrollAreaRef}>
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
              <div className="space-y-4 pb-4">
                {comments.map((comment) => (
                  <div
                    key={comment.id}
                    className={`flex gap-3 ${
                      comment.user_id === currentUser.id ? 'flex-row-reverse' : ''
                    }`}
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs">
                        {comment.user?.username.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className={`flex-1 max-w-[80%] ${
                      comment.user_id === currentUser.id ? 'text-right' : ''
                    }`}>
                      <div className={`inline-block p-3 rounded-lg ${
                        comment.user_id === currentUser.id
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}>
                        <div
                          className="text-sm whitespace-pre-wrap"
                          dangerouslySetInnerHTML={{
                            __html: formatMessage(comment.message)
                          }}
                        />
                      </div>
                      
                      <div className={`flex items-center gap-2 mt-1 text-xs text-muted-foreground ${
                        comment.user_id === currentUser.id ? 'justify-end' : ''
                      }`}>
                        <span className="font-medium">{comment.user?.username}</span>
                        <Clock className="h-3 w-3" />
                        <span>{formatTimestamp(comment.created_at)}</span>
                        {comment.mentions && comment.mentions.length > 0 && (
                          <Badge variant="outline" className="text-xs">
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
          </ScrollArea>

          {/* Input area */}
          <div className="border-t p-4">
            <div className="relative">
              <Textarea
                ref={textareaRef}
                value={newMessage}
                onChange={handleMentionInput}
                placeholder="Type a message... Use @ to mention someone"
                className="min-h-[60px] resize-none pr-12"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
              />
              
              <Button
                size="sm"
                className="absolute right-2 bottom-2 h-8 w-8 p-0"
                onClick={sendMessage}
                disabled={sending || !newMessage.trim()}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>

            {/* Help text */}
            <div className="mt-2 text-xs text-muted-foreground">
              Press Enter to send, Shift+Enter for new line. Use @ to mention team members.
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mention Dialog */}
      <Dialog open={showMentionDialog} onOpenChange={setShowMentionDialog}>
        <DialogContent className="max-w-md">
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
            <div className="max-h-64 overflow-y-auto">
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
                      className="w-full p-3 text-left hover:bg-gray-50 rounded-lg border border-transparent hover:border-gray-200 transition-colors flex items-center gap-3"
                      onClick={() => insertMention(user.username)}
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="text-sm font-medium">
                          {user.username.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">{user.username}</div>
                        <div className="text-xs text-muted-foreground capitalize">{user.role}</div>
                      </div>
                      <Badge variant="outline" className="text-xs">
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