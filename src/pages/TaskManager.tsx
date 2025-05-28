
import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { TaskProvider } from "@/context/TaskContext";
import { TaskBoard } from "@/components/tasks/TaskBoard";
import { TaskList } from "@/components/tasks/TaskList";
import { CreateTaskDialog } from "@/components/tasks/CreateTaskDialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, List, Kanban, Bell } from "lucide-react";
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
    };

    initNotifications();
  }, []);

  const handleTestNotification = async () => {
    console.log('Test notification button clicked');
    
    try {
      const success = await notificationService.sendTestNotification();
      if (success) {
        toast({
          title: "Success",
          description: "Test notification sent! Check if you received it.",
        });
      } else {
        toast({
          title: "Error",
          description: "Could not send test notification. Please check permissions.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error sending test notification:', error);
      toast({
        title: "Error",
        description: "Failed to send test notification.",
        variant: "destructive",
      });
    }
  };

  const handleRequestPermission = async () => {
    const granted = await notificationService.requestPermission();
    setNotificationPermission(Notification.permission);
    
    if (granted) {
      toast({
        title: "Success",
        description: "Notification permission granted!",
      });
    } else {
      toast({
        title: "Permission Denied",
        description: "Please enable notifications in your browser settings.",
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
                  className="flex items-center gap-2"
                >
                  <Bell className="h-4 w-4" />
                  Test Notification
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
