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
      console.log('🚀 Initializing Enhanced TaskManager notifications...');
      await notificationService.init();
      setNotificationPermission(Notification.permission);
      setRealtimeActive(true); // Real-time is automatically active after init
      
      console.log('TaskManager: Notification permission on load:', Notification.permission);
      
      // Check if push notifications are already set up
      if (Notification.permission === 'granted') {
        const pushStatus = await pushNotificationService.getSubscriptionStatus();
        setPushSetupComplete(pushStatus);
        console.log('🔍 Push setup status:', pushStatus);
        
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
    console.log('🧪 === ENHANCED TEST ALL NOTIFICATION TYPES ===');
    console.log('🔔 Current permission:', Notification.permission);
    
    if (Notification.permission !== 'granted') {
      toast({
        title: "❌ Permission Required",
        description: "Please enable notifications first using the 'Enable Notifications' button.",
        variant: "destructive",
      });
      return;
    }
    
    setIsSettingUpPush(true);
    
    try {
      // Test all notification types
      console.log('🧪 Testing enhanced notification system...');
      const testResult = await notificationService.sendTestNotification();
      
      if (testResult) {
        // Also test external push notification
        const currentUser = localStorage.getItem('currentUser');
        if (currentUser) {
          const user = JSON.parse(currentUser);
          
          console.log('📤 Testing external push notification...');
          await pushNotificationService.sendPushNotification(
            [user.id],
            '🌐 External Push Test',
            'This is an external push notification test from the server!',
            { 
              test: true, 
              type: 'external-test',
              timestamp: Date.now(),
              tag: 'external-test',
              requireInteraction: true,
              url: '/task-manager'
            }
          );
        }

        toast({
          title: "🎉 All Tests Sent!",
          description: "Check for browser notification, service worker notification, and external push notification!",
        });
      } else {
        throw new Error('Enhanced test notifications failed');
      }
      
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
    console.log('🚀 === ENHANCED NOTIFICATION SETUP ===');
    
    try {
      // Check browser support first
      if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
        throw new Error('Your browser does not support notifications');
      }
      
      // First check current database state
      await pushNotificationService.checkAllSubscriptions();
      
      console.log('Step 1: Setting up enhanced notifications...');
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
          title: "✅ Enhanced Notifications Enabled!",
          description: "All notification types are now active: browser, push, and real-time!",
        });
        
      } else {
        toast({
          title: "⚠️ Setup Failed",
          description: "Enhanced notification setup failed. Check console logs and try again.",
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
                  {isSettingUpPush ? 'Setting up...' : 'Enable All Notifications'}
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
                  {isSettingUpPush ? 'Testing...' : '🧪 Test All Notifications'}
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
          {notificationPermission === 'granted' && pushSetupComplete && realtimeActive && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-green-700">
                <CheckCircle className="h-4 w-4" />
                <span className="font-medium">🎉 All Notifications Active</span>
              </div>
              <div className="text-sm text-green-600 mt-1 space-y-1">
                <p>✅ Browser Notifications: Enabled</p>
                <p>✅ Push Notifications: {subscriptionCount} device(s)</p>
                <p>✅ Real-time Updates: Active</p>
              </div>
              <p className="text-xs text-green-500 mt-2">
                You'll receive instant notifications for task assignments and updates across all your devices!
              </p>
            </div>
          )}

          {notificationPermission === 'granted' && (!pushSetupComplete || !realtimeActive) && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-yellow-700">
                <AlertCircle className="h-4 w-4" />
                <span className="font-medium">Partial Notification Setup</span>
              </div>
              <div className="text-sm text-yellow-600 mt-1">
                <p>Browser: ✅ | Push: {pushSetupComplete ? '✅' : '❌'} | Real-time: {realtimeActive ? '✅' : '❌'}</p>
                <p className="mt-1">Click "Test All Notifications" to complete setup.</p>
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
                All notifications are blocked. Please enable them manually in your browser settings and refresh the page.
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
                <span className="font-medium">Enable Complete Notification System</span>
              </div>
              <p className="text-sm text-blue-600 mt-1">
                Get browser notifications, push notifications, and real-time updates for all task activities!
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
