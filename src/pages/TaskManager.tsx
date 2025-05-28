
import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { TaskProvider } from "@/context/TaskContext";
import { TaskBoard } from "@/components/tasks/TaskBoard";
import { TaskList } from "@/components/tasks/TaskList";
import { CreateTaskDialog } from "@/components/tasks/CreateTaskDialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, List, Kanban, Bell, BellRing, AlertCircle, CheckCircle } from "lucide-react";
import { notificationService } from "@/services/notificationService";
import { pushNotificationService } from "@/services/pushNotificationService";
import { useToast } from "@/hooks/use-toast";

const TaskManager = () => {
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const [pushSetupComplete, setPushSetupComplete] = useState(false);
  const [isSettingUpPush, setIsSettingUpPush] = useState(false);
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
    
    // First, check the database state
    await pushNotificationService.checkAllSubscriptions();
    
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
    setIsSettingUpPush(true);
    console.log('=== SETTING UP PUSH NOTIFICATIONS ===');
    
    // First check current database state
    await pushNotificationService.checkAllSubscriptions();
    
    try {
      console.log('Step 1: Requesting notification permission...');
      const granted = await notificationService.requestPermission();
      setNotificationPermission(Notification.permission);
      
      if (granted) {
        console.log('Step 2: Setting up push notifications...');
        // Setup push notifications with better error handling
        const pushSetup = await pushNotificationService.requestPermissionAndSubscribe();
        setPushSetupComplete(pushSetup);
        
        if (pushSetup) {
          // Verify the setup worked by checking database again
          await pushNotificationService.checkAllSubscriptions();
          
          toast({
            title: "✅ Push Notifications Enabled!",
            description: "You will now receive push notifications for tasks. Try the test button to verify!",
          });
          
          // Send an immediate test notification
          setTimeout(async () => {
            console.log('Sending welcome notification...');
            await notificationService.sendPushNotification({
              title: '🎉 Push Notifications Enabled!',
              body: 'You will now receive push notifications for tasks!',
              tag: 'permission-granted'
            });
          }, 1000);
        } else {
          toast({
            title: "⚠️ Setup Failed",
            description: "Push notification setup failed. Please check console logs and try again.",
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "❌ Permission Denied",
          description: "Please enable notifications in your browser settings manually and refresh the page.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error setting up push notifications:', error);
      toast({
        title: "❌ Setup Failed",
        description: "Failed to set up push notifications: " + (error as Error).message,
        variant: "destructive",
      });
    } finally {
      setIsSettingUpPush(false);
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
                  disabled={isSettingUpPush}
                  className="flex items-center gap-2"
                >
                  <Bell className="h-4 w-4" />
                  {isSettingUpPush ? 'Setting up...' : 'Enable Push Notifications'}
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
          {notificationPermission === 'granted' && pushSetupComplete && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-green-700">
                <CheckCircle className="h-4 w-4" />
                <span className="font-medium">Push Notifications Fully Active</span>
              </div>
              <p className="text-sm text-green-600 mt-1">
                ✅ Permission: {notificationPermission} • ✅ Push subscription registered
              </p>
              <p className="text-xs text-green-500 mt-1">
                You will receive notifications for task assignments even when the browser is closed!
              </p>
            </div>
          )}

          {notificationPermission === 'granted' && !pushSetupComplete && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-yellow-700">
                <AlertCircle className="h-4 w-4" />
                <span className="font-medium">Push Notifications Partially Active</span>
              </div>
              <p className="text-sm text-yellow-600 mt-1">
                Permission granted but push subscription not registered. Click "Test Push Notification" to complete setup.
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

          {notificationPermission === 'default' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-blue-700">
                <Bell className="h-4 w-4" />
                <span className="font-medium">Enable Push Notifications for Task Updates</span>
              </div>
              <p className="text-sm text-blue-600 mt-1">
                Click "Enable Push Notifications" to receive real-time task assignment notifications on your phone!
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
