import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Task, TaskPriority, TaskStatus, User } from "@/types/taskTypes";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { notificationService } from "@/services/notificationService";

interface Project {
  id: string;
  name: string;
  description?: string;
  created_at: string;
}

interface CreateTaskData {
  title: string;
  description?: string;
  priority: TaskPriority;
  status: TaskStatus;
  due_date?: string | null;
  project_id?: string | null;
  assignee_ids?: string[];
}

interface TaskContextType {
  tasks: Task[];
  users: User[];
  projects: Project[];
  loading: boolean;
  createTask: (data: CreateTaskData) => Promise<void>;
  updateTask: (taskId: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  assignTask: (taskId: string, userIds: string[]) => Promise<void>;
  currentUser: User | null;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const TaskProvider = ({ children }: { children: ReactNode }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const { toast } = useToast();

  // Function to fetch all data
  const fetchData = async () => {
    try {
      console.log('🔄 Fetching all data...');

      // Fetch users
      const { data: usersData, error: usersError } = await supabase
        .from('auth_users')
        .select('*');
      
      if (usersError) throw usersError;
      
      const transformedUsers = usersData.map(user => ({
        id: user.id,
        username: user.username,
        password: user.password,
        isAdmin: user.is_admin,
        role: user.is_admin ? 'admin' : 'user',
      }));
      setUsers(transformedUsers);

      // Fetch projects
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('*');
      
      if (projectsError) throw projectsError;
      
      const transformedProjects = projectsData.map(project => ({
        id: project.id,
        name: project.name,
        description: project.description,
        created_at: project.created_at,
      }));
      setProjects(transformedProjects);

      // Fetch tasks with assignments and subtasks
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select(`
          *,
          task_assignments(user_id),
          subtasks(*),
          projects(name)
        `);

      if (tasksError) throw tasksError;

      const transformedTasks = tasksData.map(task => ({
        id: task.id,
        title: task.title,
        description: task.description || "",
        supervisor_comments: task.supervisor_comments || "",
        priority: task.priority as TaskPriority,
        status: task.status as TaskStatus,
        due_date: task.due_date || "",
        project_id: task.project_id || "",
        created_by: task.created_by,
        created_at: task.created_at,
        updated_at: task.updated_at,
        assignees: task.task_assignments?.map((assignment: any) => {
          const user = transformedUsers.find(u => u.id === assignment.user_id);
          return user ? { 
            id: user.id, 
            username: user.username,
            role: user.role || 'user'
          } : null;
        }).filter(Boolean) || [],
        tags: [],
        subtasks: task.subtasks?.map((subtask: any) => ({
          id: subtask.id,
          title: subtask.title,
          completed: subtask.completed,
          order_index: subtask.order_index,
        })) || [],
        project: task.projects ? { id: task.project_id, name: task.projects.name } : null,
      }));

      setTasks(transformedTasks);
      console.log('✅ Data fetched successfully, tasks count:', transformedTasks.length);
    } catch (error) {
      console.error('❌ Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial data fetch
    fetchData();
    
    // Get current user from localStorage
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    }

    // Initialize notification service
    const initNotifications = async () => {
      await notificationService.init();
    };
    initNotifications();

    // Set up real-time subscriptions with better error handling
    console.log('🔌 Setting up real-time subscriptions...');
    
    const setupRealtimeSubscription = () => {
      const channel = supabase
        .channel(`task-updates-${Date.now()}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'tasks'
          },
          (payload) => {
            console.log('📝 Task change detected:', payload.eventType, payload);
            // Immediate UI update for better responsiveness
            fetchData();
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'task_assignments'
          },
          (payload) => {
            console.log('👥 Task assignment change detected:', payload.eventType, payload);
            // Immediate UI update for better responsiveness
            fetchData();
          }
        )
        .subscribe((status) => {
          console.log('🔌 Real-time subscription status:', status);
          if (status === 'SUBSCRIBED') {
            console.log('✅ Successfully subscribed to real-time updates');
          } else if (status === 'CHANNEL_ERROR') {
            console.error('❌ Real-time subscription failed, retrying in 3 seconds...');
            setTimeout(() => {
              channel.unsubscribe();
              setupRealtimeSubscription();
            }, 3000);
          }
        });

      return channel;
    };

    const channel = setupRealtimeSubscription();

    return () => {
      console.log('🧹 Cleaning up real-time subscriptions...');
      if (channel) {
        channel.unsubscribe();
      }
    };
  }, []);

  const createTask = async (data: CreateTaskData) => {
    try {
      console.log('📝 === CREATING TASK WITH CROSS-DEVICE NOTIFICATIONS ===');
      console.log('📝 Task title:', data.title);
      console.log('👥 Assignees:', data.assignee_ids);
      
      const { data: taskData, error: taskError } = await supabase
        .from('tasks')
        .insert([{
          title: data.title,
          description: data.description,
          priority: data.priority,
          status: data.status,
          due_date: data.due_date,
          project_id: data.project_id,
          created_by: currentUser?.id || users[0]?.id || '',
        }])
        .select()
        .single();

      if (taskError) throw taskError;

      console.log('✅ Task created with ID:', taskData.id);

      if (data.assignee_ids && data.assignee_ids.length > 0) {
        console.log('👥 Creating assignments for users:', data.assignee_ids);
        
        const assignments = data.assignee_ids.map(userId => ({
          task_id: taskData.id,
          user_id: userId,
        }));

        const { error: assignmentError } = await supabase
          .from('task_assignments')
          .insert(assignments);

        if (assignmentError) throw assignmentError;

        console.log('✅ Task assignments created successfully');

        // CRITICAL: Send cross-device push notifications to ALL assigned users
        console.log('📱 === SENDING CROSS-DEVICE PUSH NOTIFICATIONS ===');
        console.log('🌐 This will notify ALL devices for ALL assigned users');
        console.log('📱 Target users for notifications:', data.assignee_ids);
        
        // Send notifications to assigned users with enhanced cross-device support
        await notificationService.sendTaskAssignmentNotifications(
          data.assignee_ids,
          data.title,
          taskData.id,
          currentUser?.id
        );
        
        console.log('📱 === CROSS-DEVICE NOTIFICATIONS SENT SUCCESSFULLY ===');
        
        // Also send browser notifications locally for immediate feedback
        for (const userId of data.assignee_ids) {
          const assignedUser = users.find(u => u.id === userId);
          if (assignedUser) {
            console.log(`🔔 Sending local browser notification for user: ${assignedUser.username}`);
            await notificationService.showBrowserNotification({
              title: '🎯 New Task Assigned (Local)',
              body: `Task "${data.title}" has been assigned to ${assignedUser.username}`,
              tag: `local-task-${taskData.id}`,
              data: { taskId: taskData.id, type: 'local_assignment' }
            });
          }
        }
      }
      
      toast({
        title: "✅ Success",
        description: `Task created and notifications sent to ${data.assignee_ids?.length || 0} user(s) across all their devices!`,
      });

      // Force immediate refresh for real-time feel
      await fetchData();
    } catch (error) {
      console.error('❌ Error creating task:', error);
      toast({
        title: "❌ Error",
        description: "Failed to create task or send notifications",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateTask = async (taskId: string, updates: Partial<Task>) => {
    try {
      // Check if trying to update status to completed and user is not admin
      if (updates.status === 'completed' && currentUser && !currentUser.isAdmin) {
        toast({
          title: "Access Denied",
          description: "Only admins can mark tasks as completed",
          variant: "destructive",
        });
        return;
      }

      console.log('📝 Updating task:', taskId, updates);

      // Only send the fields that can be updated in the database
      const updateData: any = {};
      
      if (updates.title !== undefined) updateData.title = updates.title;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.priority !== undefined) updateData.priority = updates.priority;
      if (updates.status !== undefined) updateData.status = updates.status;
      if (updates.due_date !== undefined) updateData.due_date = updates.due_date;
      if (updates.supervisor_comments !== undefined) updateData.supervisor_comments = updates.supervisor_comments;
      if (updates.project_id !== undefined) updateData.project_id = updates.project_id;

      const { error } = await supabase
        .from('tasks')
        .update(updateData)
        .eq('id', taskId);

      if (error) {
        console.error('❌ Supabase error:', error);
        throw error;
      }

      console.log('✅ Task updated successfully');
      
      toast({
        title: "Success",
        description: "Task updated successfully",
      });

      // Force immediate refresh for real-time feel
      await fetchData();
    } catch (error) {
      console.error('❌ Error updating task:', error);
      toast({
        title: "Error",
        description: "Failed to update task",
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteTask = async (taskId: string) => {
    try {
      console.log('🗑️ Deleting task:', taskId);

      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;
      
      console.log('✅ Task deleted successfully');
      
      toast({
        title: "Success",
        description: "Task deleted successfully",
      });

      // Force immediate refresh for real-time feel
      await fetchData();
    } catch (error) {
      console.error('❌ Error deleting task:', error);
      toast({
        title: "Error", 
        description: "Failed to delete task",
        variant: "destructive",
      });
      throw error;
    }
  };

  const assignTask = async (taskId: string, userIds: string[]) => {
    try {
      console.log('👥 Assigning task:', taskId, 'to users:', userIds);

      // Get current task to get its title for notifications
      const currentTask = tasks.find(task => task.id === taskId);
      
      await supabase
        .from('task_assignments')
        .delete()
        .eq('task_id', taskId);

      if (userIds.length > 0) {
        const assignments = userIds.map(userId => ({
          task_id: taskId,
          user_id: userId,
        }));

        const { error } = await supabase
          .from('task_assignments')
          .insert(assignments);

        if (error) throw error;

        // Send notifications to newly assigned users
        if (currentTask) {
          await notificationService.sendTaskAssignmentNotifications(
            userIds,
            currentTask.title,
            taskId,
            currentUser?.id
          );
        }
      }

      console.log('✅ Task assignment completed');

      // Force immediate refresh for real-time feel
      await fetchData();
    } catch (error) {
      console.error('❌ Error assigning task:', error);
      throw error;
    }
  };

  const value = {
    tasks,
    users,
    projects,
    loading,
    createTask,
    updateTask,
    deleteTask,
    assignTask,
    currentUser,
  };

  return <TaskContext.Provider value={value}>{children}</TaskContext.Provider>;
};

export const useTask = () => {
  const context = useContext(TaskContext);
  if (context === undefined) {
    throw new Error("useTask must be used within a TaskProvider");
  }
  return context;
};
