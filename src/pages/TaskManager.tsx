
import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { TaskProvider } from "@/context/TaskContext";
import { TaskBoard } from "@/components/tasks/TaskBoard";
import { TaskList } from "@/components/tasks/TaskList";
import { CreateTaskDialog } from "@/components/tasks/CreateTaskDialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, List, Kanban, Bell, BellRing } from "lucide-react";
import { notificationService } from "@/services/notificationService";
import { useToast } from "@/hooks/use-toast";

const TaskManager = () => {
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const { toast } = useToast();

  useEffect(() => {
    // Initialize notification service and check permission
    const initNotifications = async () => {
      await notificationService.init();
      setNotificationPermission(Notification.permission);
      
      console.log('TaskManager: Notification permission on load:', Notification.permission);
      
      // If permission is already granted, try to send an instant test
      if (Notification.permission === 'granted') {
        console.log('Permission already granted, sending welcome notification...');
        setTimeout(async () => {
          await notificationService.sendLocalNotification({
            title: '🎉 Welcome to Task Manager!',
            body: 'Notifications are enabled and working!',
            tag: 'welcome-notification'
          });
        }, 1000);
      }
    };

    initNotifications();
  }, []);

  const handleTestNotification = async () => {
    console.log('=== TEST NOTIFICATION BUTTON CLICKED ===');
    console.log('Current permission:', Notification.permission);
    
    try {
      const success = await notificationService.sendTestNotification();
      if (success) {
        toast({
          title: "🔔 Test Notification Sent!",
          description: "Check if you received the notification. It should appear in a few seconds.",
        });
        
        // Also try to send an immediate browser notification for testing
        if (Notification.permission === 'granted') {
          console.log('Sending immediate browser notification for testing...');
          new Notification('🚀 Direct Browser Notification', {
            body: 'This is sent directly from the browser to test if notifications work!',
            icon: '/favicon.ico'
          });
        }
      } else {
        toast({
          title: "❌ Error",
          description: "Could not send test notification. Please check permissions.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error sending test notification:', error);
      toast({
        title: "❌ Error",
        description: "Failed to send test notification: " + (error as Error).message,
        variant: "destructive",
      });
    }
  };

  const handleRequestPermission = async () => {
    console.log('Requesting notification permission...');
    const granted = await notificationService.requestPermission();
    setNotificationPermission(Notification.permission);
    
    if (granted) {
      toast({
        title: "✅ Success",
        description: "Notification permission granted! Try the test button now.",
      });
      
      // Send an immediate welcome notification
      setTimeout(async () => {
        await notificationService.sendLocalNotification({
          title: '🎉 Notifications Enabled!',
          body: 'You will now receive task notifications!',
          tag: 'permission-granted'
        });
      }, 500);
    } else {
      toast({
        title: "❌ Permission Denied",
        description: "Please enable notifications in your browser settings and refresh the page.",
        variant: "destructive",
      });
    }
  };

  return (
    <TaskProvider>
      <MainLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold tracking-tight">Task Manager</h1>
            <div className="flex gap-2">
              {notificationPermission !== 'granted' && (
                <Button 
                  variant="outline" 
                  onClick={handleRequestPermission}
                  className="flex items-center gap-2"
                >
                  <Bell className="h-4 w-4" />
                  Enable Notifications
                </Button>
              )}
              {notificationPermission === 'granted' && (
                <Button 
                  variant="outline" 
                  onClick={handleTestNotification}
                  className="flex items-center gap-2 bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                >
                  <BellRing className="h-4 w-4" />
                  🔔 Test Notification
                </Button>
              )}
              <CreateTaskDialog>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  New Task
                </Button>
              </CreateTaskDialog>
            </div>
          </div>

          {/* Debug info for notifications */}
          {notificationPermission === 'granted' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-green-700">
                <BellRing className="h-4 w-4" />
                <span className="font-medium">Notifications Active</span>
              </div>
              <p className="text-sm text-green-600 mt-1">
                Permission: {notificationPermission} • Click "Test Notification" to verify it's working
              </p>
            </div>
          )}

          <Tabs defaultValue="board" className="w-full">
            <TabsList>
              <TabsTrigger value="board" className="flex items-center gap-2">
                <Kanban className="h-4 w-4" />
                Board
              </TabsTrigger>
              <TabsTrigger value="list" className="flex items-center gap-2">
                <List className="h-4 w-4" />
                List
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="board" className="mt-6">
              <TaskBoard />
            </TabsContent>
            
            <TabsContent value="list" className="mt-6">
              <TaskList />
            </TabsContent>
          </Tabs>
        </div>
      </MainLayout>
    </TaskProvider>
  );
};

export default TaskManager;
