
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { NotificationService } from '@/services/notificationService';
import { useTask } from '@/context/TaskContext';
import { Bell, Loader2 } from 'lucide-react';

export const NotificationTestButton = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { users, currentUser } = useTask();

  const handleSendTestNotification = async () => {
    if (!currentUser) {
      toast({
        title: "Error",
        description: "You must be logged in to send notifications",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      console.log('🔔 Sending test notification to current user:', currentUser.id);
      
      const result = await NotificationService.sendTestNotification([currentUser.id]);
      
      if (result.success) {
        toast({
          title: "✅ Success",
          description: result.message || "Test notification sent successfully!",
        });
      } else {
        toast({
          title: "❌ Error",
          description: result.error || "Failed to send test notification",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('❌ Error sending test notification:', error);
      toast({
        title: "❌ Error",
        description: "Failed to send test notification",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendToAllUsers = async () => {
    if (!currentUser?.isAdmin) {
      toast({
        title: "Access Denied",
        description: "Only admins can send notifications to all users",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const allUserIds = users.map(user => user.id);
      console.log('🔔 Sending test notification to all users:', allUserIds);
      
      const result = await NotificationService.sendTestNotification(allUserIds);
      
      if (result.success) {
        toast({
          title: "✅ Success",
          description: `Test notification sent to ${allUserIds.length} users!`,
        });
      } else {
        toast({
          title: "❌ Error",
          description: result.error || "Failed to send test notification",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('❌ Error sending test notification:', error);
      toast({
        title: "❌ Error",
        description: "Failed to send test notification",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex gap-2">
      <Button 
        onClick={handleSendTestNotification} 
        disabled={isLoading || !currentUser}
        variant="outline"
        size="sm"
      >
        {isLoading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Bell className="mr-2 h-4 w-4" />
        )}
        Test Notification (Me)
      </Button>
      
      {currentUser?.isAdmin && (
        <Button 
          onClick={handleSendToAllUsers} 
          disabled={isLoading}
          variant="outline"
          size="sm"
        >
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Bell className="mr-2 h-4 w-4" />
          )}
          Test Notification (All Users)
        </Button>
      )}
    </div>
  );
};
