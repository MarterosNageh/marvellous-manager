
import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { TaskProvider } from "@/context/TaskContext";
import { TaskBoard } from "@/components/tasks/TaskBoard";
import { TaskList } from "@/components/tasks/TaskList";
import { CreateTaskDialog } from "@/components/tasks/CreateTaskDialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, List, Kanban, Bell, BellRing, AlertCircle } from "lucide-react";
import { notificationService } from "@/services/notificationService";
import { useToast } from "@/hooks/use-toast";

const TaskManager = () => {
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const [pushSetupComplete, setPushSetupComplete] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Initialize notification service and check permission
    const initNotifications = async () => {
      await notificationService.init();
      setNotificationPermission(Notification.permission);
      
      console.log('TaskManager: Notification permission on load:', Notification.permission);
    };

    initNotifications();
  }, []);

  const handleTestNotification = async () => {
    console.log('=== TEST PUSH NOTIFICATION BUTTON CLICKED ===');
    console.log('Current permission:', Notification.permission);
    
    try {
      const success = await notificationService.sendTestNotification();
      if (success) {
        toast({
          title: "🔔 Test Push Notification Sent!",
          description: "Check if you received the push notification. It should appear even if you switch tabs!",
        });
      } else {
        toast({
          title: "❌ Error",
          description: "Could not send test push notification. Please check permissions and try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error sending test push notification:', error);
      toast({
        title: "❌ Error",
        description: "Failed to send test push notification: " + (error as Error).message,
        variant: "destructive",
      });
    }
  };

  const handleRequestPermission = async () => {
    console.log('Requesting notification permission...');
    const granted = await notificationService.requestPermission();
    setNotificationPermission(Notification.permission);
    
    if (granted) {
      // Setup push notifications
      const pushSetup = await notificationService.setupPushNotifications();
      setPushSetupComplete(pushSetup);
      
      toast({
        title: "✅ Success",
        description: pushSetup 
          ? "Push notifications enabled! Try the test button now." 
          : "Notification permission granted, but push setup failed. Local notifications will work.",
      });
      
      // Send an immediate test notification
      setTimeout(async () => {
        await notificationService.sendPushNotification({
          title: '🎉 Push Notifications Enabled!',
          body: 'You will now receive push notifications for tasks!',
          tag: 'permission-granted'
        });
      }, 500);
    } else {
      toast({
        title: "❌ Permission Denied",
        description: "Please enable notifications in your browser settings manually and refresh the page.",
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
                  Enable Push Notifications
                </Button>
              )}
              {notificationPermission === 'granted' && (
                <Button 
                  variant="outline" 
                  onClick={handleTestNotification}
                  className="flex items-center gap-2 bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                >
                  <BellRing className="h-4 w-4" />
                  🔔 Test Push Notification
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

          {/* Enhanced notification status info */}
          {notificationPermission === 'granted' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-green-700">
                <BellRing className="h-4 w-4" />
                <span className="font-medium">Push Notifications Active</span>
              </div>
              <p className="text-sm text-green-600 mt-1">
                Permission: {notificationPermission} • Click "Test Push Notification" to verify it's working
              </p>
              <p className="text-xs text-green-500 mt-1">
                Push notifications will work even when you switch tabs or minimize the browser!
              </p>
            </div>
          )}

          {notificationPermission === 'denied' && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-red-700">
                <AlertCircle className="h-4 w-4" />
                <span className="font-medium">Push Notifications Blocked</span>
              </div>
              <p className="text-sm text-red-600 mt-1">
                Notifications are blocked. Please enable them manually in your browser settings and refresh the page.
              </p>
              <p className="text-xs text-red-500 mt-1">
                Look for a bell/notification icon in your browser's address bar or check Site Settings.
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
