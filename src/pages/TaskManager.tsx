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
      console.log('🚀 Initializing TaskManager notifications...');
      await notificationService.init();
      setNotificationPermission(Notification.permission);
      
      console.log('TaskManager: Notification permission on load:', Notification.permission);
      
      // Check if push notifications are already set up
      if (Notification.permission === 'granted') {
        const pushStatus = await pushNotificationService.getSubscriptionStatus();
        setPushSetupComplete(pushStatus);
        console.log('🔍 Push setup status:', pushStatus);
      }
    };

    initNotifications();
  }, []);

  const handleTestNotification = async () => {
    console.log('🧪 === ENHANCED TEST PUSH NOTIFICATION ===');
    console.log('🔔 Current permission:', Notification.permission);
    
    if (Notification.permission !== 'granted') {
      toast({
        title: "❌ Permission Required",
        description: "Please enable push notifications first using the 'Enable Push Notifications' button.",
        variant: "destructive",
      });
      return;
    }
    
    setIsSettingUpPush(true);
    
    try {
      // First, check the database state
      await pushNotificationService.checkAllSubscriptions();
      
      // Ensure subscription is active
      console.log('🔄 Ensuring push subscription is active...');
      const subscriptionActive = await pushNotificationService.getSubscriptionStatus();
      
      if (!subscriptionActive) {
        console.log('⚠️ No active subscription, setting up push notifications...');
        const setupResult = await pushNotificationService.requestPermissionAndSubscribe();
        if (!setupResult) {
          throw new Error('Failed to set up push notifications');
        }
        setPushSetupComplete(true);
      }

      // Get current user
      const currentUser = localStorage.getItem('currentUser');
      if (!currentUser) {
        throw new Error('No current user found');
      }
      
      const user = JSON.parse(currentUser);
      
      // Send test notification
      console.log('📤 Sending enhanced test notification...');
      await pushNotificationService.sendPushNotification(
        [user.id],
        '🧪 Enhanced Test Notification',
        'This is an enhanced test to verify push notifications are working on all your devices!',
        { 
          test: true, 
          timestamp: Date.now(),
          tag: 'enhanced-test',
          requireInteraction: true,
          url: '/task-manager'
        }
      );

      toast({
        title: "🔔 Enhanced Test Notification Sent!",
        description: "Check all your devices to see if the notification appears. It should work even if you switch tabs!",
      });
      
    } catch (error) {
      console.error('❌ Enhanced test failed:', error);
      toast({
        title: "❌ Test Failed",
        description: `Enhanced test failed: ${(error as Error).message}`,
        variant: "destructive",
      });
    } finally {
      setIsSettingUpPush(false);
    }
  };

  const handleRequestPermission = async () => {
    setIsSettingUpPush(true);
    console.log('🚀 === ENHANCED PUSH NOTIFICATION SETUP ===');
    
    try {
      // Check browser support first
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        throw new Error('Your browser does not support push notifications');
      }
      
      // First check current database state
      await pushNotificationService.checkAllSubscriptions();
      
      console.log('Step 1: Setting up enhanced push notifications...');
      const pushSetup = await pushNotificationService.requestPermissionAndSubscribe();
      
      if (pushSetup) {
        setNotificationPermission(Notification.permission);
        setPushSetupComplete(true);
        
        // Verify the setup worked by checking database again
        await pushNotificationService.checkAllSubscriptions();
        
        toast({
          title: "✅ Enhanced Push Notifications Enabled!",
          description: "Push notifications are now active on this device. Use the test button to verify!",
        });
        
      } else {
        toast({
          title: "⚠️ Setup Failed",
          description: "Enhanced push notification setup failed. Check console logs and try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('❌ Enhanced setup error:', error);
      toast({
        title: "❌ Setup Failed",
        description: `Enhanced setup failed: ${(error as Error).message}`,
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
                  disabled={isSettingUpPush}
                  className="flex items-center gap-2 bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                >
                  <BellRing className="h-4 w-4" />
                  {isSettingUpPush ? 'Testing...' : '🧪 Test Enhanced Push'}
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
                <span className="font-medium">Enhanced Push Notifications Active</span>
              </div>
              <p className="text-sm text-green-600 mt-1">
                ✅ Permission: {notificationPermission} • ✅ Database subscription active
              </p>
              <p className="text-xs text-green-500 mt-1">
                Enhanced notifications will reach all your devices, even when the browser is closed!
              </p>
            </div>
          )}

          {notificationPermission === 'granted' && !pushSetupComplete && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-yellow-700">
                <AlertCircle className="h-4 w-4" />
                <span className="font-medium">Push Notifications Need Setup</span>
              </div>
              <p className="text-sm text-yellow-600 mt-1">
                Permission granted but database subscription not active. Click "Test Enhanced Push" to complete setup.
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
                <span className="font-medium">Enable Enhanced Push Notifications</span>
              </div>
              <p className="text-sm text-blue-600 mt-1">
                Click "Enable Push Notifications" to receive real-time task notifications on all your devices!
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
