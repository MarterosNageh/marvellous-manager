import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { TaskProvider } from "@/context/TaskContext";
import { TaskBoard } from "@/components/tasks/TaskBoard";
import { TaskList } from "@/components/tasks/TaskList";
import { CreateTaskDialog } from "@/components/tasks/CreateTaskDialog";
import { FCMDebugger } from "@/components/FCMDebugger";
import { FCMSetup } from "@/components/FCMSetup";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, List, Kanban, Bell, BellRing, AlertCircle, CheckCircle, Bug, Settings } from "lucide-react";
import { notificationService } from "@/services/notificationService";
import { pushNotificationService } from "@/services/pushNotificationService";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const TaskManager = () => {
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const [pushSetupComplete, setPushSetupComplete] = useState(false);
  const [isSettingUpPush, setIsSettingUpPush] = useState(false);
  const [subscriptionCount, setSubscriptionCount] = useState(0);
  const [realtimeActive, setRealtimeActive] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Initialize notification service and check permission
    const initNotifications = async () => {
      console.log('🚀 Initializing Enhanced TaskManager with FCM...');
      await notificationService.init();
      setNotificationPermission(Notification.permission);
      setRealtimeActive(true); // Real-time is automatically active after init
      
      console.log('TaskManager: Notification permission on load:', Notification.permission);
      
      // Check if FCM notifications are already set up
      if (Notification.permission === 'granted') {
        const pushStatus = await pushNotificationService.getSubscriptionStatus();
        setPushSetupComplete(pushStatus);
        console.log('🔍 FCM setup status:', pushStatus);
        
        // Check database subscription count
        await checkDatabaseSubscriptions();
      }
    };

    initNotifications();

    // Cleanup on unmount
    return () => {
      notificationService.cleanup();
    };
  }, []);

  const checkDatabaseSubscriptions = async () => {
    try {
      await pushNotificationService.checkAllSubscriptions();
      const currentUser = localStorage.getItem('currentUser');
      if (currentUser) {
        const user = JSON.parse(currentUser);
        const { data: subscriptions } = await supabase
          .from('push_subscriptions')
          .select('*')
          .eq('user_id', user.id);
        setSubscriptionCount(subscriptions?.length || 0);
      }
    } catch (error) {
      console.error('Error checking database subscriptions:', error);
    }
  };

  const handleTestNotification = async () => {
    console.log('🧪 === TESTING FCM NOTIFICATION SYSTEM ===');
    console.log('🔔 Current permission:', Notification.permission);
    
    if (Notification.permission !== 'granted') {
      toast({
        title: "❌ Permission Required",
        description: "Please enable notifications first using the 'Enable FCM Notifications' button.",
        variant: "destructive",
      });
      return;
    }
    
    setIsSettingUpPush(true);
    
    try {
      // Test FCM notification system
      console.log('🧪 Testing FCM notification system...');
      const testResult = await notificationService.sendTestNotification();
      
      if (testResult) {
        toast({
          title: "🎉 FCM Test Sent!",
          description: "Check for Firebase Cloud Messaging notification!",
        });
      } else {
        throw new Error('FCM test notifications failed');
      }
      
    } catch (error) {
      console.error('❌ FCM test failed:', error);
      toast({
        title: "❌ Test Failed",
        description: `FCM test failed: ${(error as Error).message}`,
        variant: "destructive",
      });
    } finally {
      setIsSettingUpPush(false);
    }
  };

  const handleRequestPermission = async () => {
    setIsSettingUpPush(true);
    console.log('🚀 === FCM NOTIFICATION SETUP ===');
    
    try {
      // Check browser support first
      if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
        throw new Error('Your browser does not support notifications');
      }
      
      // First check current database state
      await pushNotificationService.checkAllSubscriptions();
      
      console.log('Step 1: Setting up FCM notifications...');
      const pushSetup = await pushNotificationService.requestPermissionAndSubscribe();
      
      if (pushSetup) {
        setNotificationPermission(Notification.permission);
        setPushSetupComplete(true);
        
        // Verify the setup worked by checking database again
        await pushNotificationService.checkAllSubscriptions();
        await checkDatabaseSubscriptions();
        
        // Setup real-time notifications
        await notificationService.setupRealtimeNotifications();
        setRealtimeActive(true);
        
        toast({
          title: "✅ FCM Notifications Enabled!",
          description: "Firebase Cloud Messaging notifications are now active for task updates!",
        });
        
      } else {
        toast({
          title: "⚠️ Setup Failed",
          description: "FCM notification setup failed. Check console logs and try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('❌ FCM setup error:', error);
      toast({
        title: "❌ Setup Failed",
        description: `FCM setup failed: ${(error as Error).message}`,
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
                  {isSettingUpPush ? 'Setting up...' : 'Enable FCM Notifications'}
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
                  {isSettingUpPush ? 'Testing...' : '🧪 Test FCM Notifications'}
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

          {/* FCM notification status info */}
          {notificationPermission === 'granted' && pushSetupComplete && realtimeActive && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-green-700">
                <CheckCircle className="h-4 w-4" />
                <span className="font-medium">🎉 FCM Notifications Active</span>
              </div>
              <div className="text-sm text-green-600 mt-1 space-y-1">
                <p>✅ Firebase Cloud Messaging: Enabled</p>
                <p>✅ Push Notifications: {subscriptionCount} device(s)</p>
                <p>✅ Real-time Updates: Active</p>
              </div>
              <p className="text-xs text-green-500 mt-2">
                You'll receive instant FCM notifications for task assignments and updates across all your devices!
              </p>
            </div>
          )}

          {notificationPermission === 'granted' && (!pushSetupComplete || !realtimeActive) && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-yellow-700">
                <AlertCircle className="h-4 w-4" />
                <span className="font-medium">Partial FCM Setup</span>
              </div>
              <div className="text-sm text-yellow-600 mt-1">
                <p>Browser: ✅ | FCM: {pushSetupComplete ? '✅' : '❌'} | Real-time: {realtimeActive ? '✅' : '❌'}</p>
                <p className="mt-1">Click "Test FCM Notifications" to complete setup.</p>
              </div>
            </div>
          )}

          {notificationPermission === 'denied' && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-red-700">
                <AlertCircle className="h-4 w-4" />
                <span className="font-medium">Notifications Blocked</span>
              </div>
              <p className="text-sm text-red-600 mt-1">
                FCM notifications are blocked. Please enable them manually in your browser settings and refresh the page.
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
                <span className="font-medium">Enable Firebase Cloud Messaging</span>
              </div>
              <p className="text-sm text-blue-600 mt-1">
                Get Firebase Cloud Messaging notifications for all task activities across all your devices!
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
              <TabsTrigger value="fcm-setup" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                FCM Setup
              </TabsTrigger>
              <TabsTrigger value="debug" className="flex items-center gap-2">
                <Bug className="h-4 w-4" />
                Debug
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="board" className="mt-6">
              <TaskBoard />
            </TabsContent>
            
            <TabsContent value="list" className="mt-6">
              <TaskList />
            </TabsContent>

            <TabsContent value="fcm-setup" className="mt-6">
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight">Firebase Cloud Messaging Setup</h2>
                  <p className="text-muted-foreground">
                    Configure push notifications using Firebase Cloud Messaging
                  </p>
                </div>
                
                <FCMSetup />
              </div>
            </TabsContent>

            <TabsContent value="debug" className="mt-6">
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight">FCM Debug Center</h2>
                  <p className="text-muted-foreground">
                    Comprehensive testing and debugging tools for Firebase Cloud Messaging
                  </p>
                </div>
                
                <FCMDebugger />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </MainLayout>
    </TaskProvider>
  );
};

export default TaskManager;
