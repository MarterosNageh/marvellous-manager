import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Task, TaskPriority, TaskStatus, User } from "@/types/taskTypes";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { NotificationService } from "@/services/notificationService";

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
    } catch (error) {
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

    // Set up real-time subscriptions with better error handling
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
          () => {
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
          () => {
            fetchData();
          }
        )
        .subscribe((status) => {
          if (status === 'CHANNEL_ERROR') {
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
      if (channel) {
        channel.unsubscribe();
      }
    };
  }, [toast]);

  const createTask = async (data: CreateTaskData) => {
    try {
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

      console.log('📝 Creating task with fast response...');
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

        // Send notifications to assigned users
        try {
          const { NotificationService } = await import('@/services/notificationService');
          const notificationResult = await NotificationService.sendTaskAssignmentNotification(
            data.assignee_ids,
            data.title
          );
          
          if (notificationResult.success) {
            console.log('✅ Task assignment notifications sent successfully');
          } else {
            console.warn('⚠️ Failed to send notifications:', notificationResult.error);
          }
        } catch (notificationError) {
          console.warn('⚠️ Error sending task assignment notifications:', notificationError);
        }

        toast({
          title: "✅ Task Created Successfully",
          description: `Task created and notifications sent to ${data.assignee_ids?.length || 0} user(s).`,
        });

      } else {
        toast({
          title: "✅ Success",
          description: "Task created successfully",
        });
      }

      // Force immediate refresh for real-time feel
      await fetchData();
    } catch (error) {
      console.error('❌ Error creating task:', error);
      toast({
        title: "❌ Error",
        description: "Failed to create task",
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
      // Delete existing assignments
      const { error: deleteError } = await supabase
        .from('task_assignments')
        .delete()
        .eq('task_id', taskId);

      if (deleteError) throw deleteError;

      // Create new assignments
      const assignments = userIds.map(userId => ({
        task_id: taskId,
        user_id: userId,
      }));

      const { error: createError } = await supabase
        .from('task_assignments')
        .insert(assignments);

      if (createError) throw createError;

      // Fetch updated task data
      const { data: taskData, error: taskError } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', taskId)
        .single();

      if (taskError) throw taskError;

      if (taskData) {
        console.log('✅ Task assignments created successfully');

        toast({
          title: "Success",
          description: "Task assignments updated successfully",
        });

        // Refresh task data
        await fetchData();
      }
    } catch (error) {
      console.error('❌ Error assigning task:', error);
      toast({
        title: "Error",
        description: "Failed to update task assignments",
        variant: "destructive",
      });
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
