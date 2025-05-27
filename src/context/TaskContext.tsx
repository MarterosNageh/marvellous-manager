import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { notificationService } from "@/services/notificationService";
import { 
  Task, 
  TaskProject, 
  TaskUser, 
  TaskTag, 
  Subtask, 
  TaskComment, 
  TaskAttachment, 
  TaskNotification,
  TaskPriority,
  TaskStatus
} from "@/types/taskTypes";

interface TaskContextType {
  projects: TaskProject[];
  addProject: (project: Omit<TaskProject, "id" | "created_at" | "updated_at">) => Promise<void>;
  updateProject: (project: TaskProject) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  tasks: Task[];
  addTask: (task: Omit<Task, "id" | "created_at" | "updated_at">) => Promise<void>;
  updateTask: (task: Task) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  assignUser: (taskId: string, userId: string) => Promise<void>;
  unassignUser: (taskId: string, userId: string) => Promise<void>;
  tags: TaskTag[];
  addTag: (tag: Omit<TaskTag, "id" | "created_at">) => Promise<void>;
  deleteTag: (id: string) => Promise<void>;
  addSubtask: (subtask: Omit<Subtask, "id" | "created_at">) => Promise<void>;
  updateSubtask: (subtask: Subtask) => Promise<void>;
  deleteSubtask: (id: string) => Promise<void>;
  addComment: (comment: Omit<TaskComment, "id" | "created_at" | "updated_at">) => Promise<void>;
  notifications: TaskNotification[];
  markNotificationRead: (id: string) => Promise<void>;
  users: TaskUser[];
  loading: boolean;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const TaskProvider = ({ children }: { children: ReactNode }) => {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [projects, setProjects] = useState<TaskProject[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tags, setTags] = useState<TaskTag[]>([]);
  const [notifications, setNotifications] = useState<TaskNotification[]>([]);
  const [users, setUsers] = useState<TaskUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentUser) {
      console.log('TaskProvider: Current user available, fetching data');
      fetchData();
      initializeNotifications();
      setupRealtimeSubscriptions();
    }
  }, [currentUser]);

  const setupRealtimeSubscriptions = () => {
    console.log('Setting up realtime subscriptions for tasks');
    
    const tasksChannel = supabase
      .channel('tasks-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks'
        },
        (payload) => {
          console.log('Task realtime change detected:', payload);
          handleTaskRealtimeChange(payload);
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
          console.log('Task assignment realtime change detected:', payload);
          fetchTasks();
        }
      )
      .subscribe((status) => {
        console.log('Realtime subscription status:', status);
      });

    return () => {
      console.log('Cleaning up realtime subscriptions');
      supabase.removeChannel(tasksChannel);
    };
  };

  const handleTaskRealtimeChange = async (payload: any) => {
    console.log('Handling task realtime change:', payload);
    
    if (payload.eventType === 'INSERT') {
      // Fetch the complete task data with relations
      const { data: newTaskData } = await supabase
        .from('tasks')
        .select(`
          *,
          task_assignments(
            user_id,
            assigned_at,
            auth_users(id, username, is_admin)
          ),
          subtasks(*),
          projects(id, name, description)
        `)
        .eq('id', payload.new.id)
        .single();

      if (newTaskData) {
        const formattedTask = formatTaskData(newTaskData);
        setTasks(prev => {
          const exists = prev.find(t => t.id === formattedTask.id);
          if (exists) return prev;
          return [formattedTask, ...prev];
        });
        
        // Show notification for new tasks
        if (payload.new.created_by !== currentUser?.id) {
          toast({
            title: "New Task Created",
            description: `"${payload.new.title}" has been created`,
          });
        }
      }
    } else if (payload.eventType === 'UPDATE') {
      fetchTasks(); // Refetch to get updated data with relations
    } else if (payload.eventType === 'DELETE') {
      setTasks(prev => prev.filter(t => t.id !== payload.old.id));
      toast({
        title: "Task Deleted",
        description: "A task has been deleted",
      });
    }
  };

  const formatTaskData = (taskData: any): Task => {
    return {
      id: taskData.id,
      title: taskData.title,
      description: taskData.description,
      supervisor_comments: taskData.supervisor_comments,
      priority: taskData.priority as TaskPriority,
      status: taskData.status as TaskStatus,
      due_date: taskData.due_date,
      project_id: taskData.project_id,
      created_by: taskData.created_by,
      created_at: taskData.created_at,
      updated_at: taskData.updated_at,
      assignees: taskData.task_assignments?.map((assignment: any) => ({
        id: assignment.auth_users.id,
        username: assignment.auth_users.username,
        role: assignment.auth_users.is_admin ? 'admin' as const : 'member' as const,
        assigned_at: assignment.assigned_at
      })) || [],
      tags: [],
      subtasks: taskData.subtasks?.map((subtask: any) => ({
        id: subtask.id,
        parent_task_id: subtask.parent_task_id,
        title: subtask.title,
        completed: subtask.completed,
        created_at: subtask.created_at,
        order_index: subtask.order_index
      })) || [],
      project: taskData.projects ? {
        id: taskData.projects.id,
        name: taskData.projects.name,
        description: taskData.projects.description,
        color: '#3b82f6',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: 'system'
      } : undefined
    };
  };

  const initializeNotifications = async () => {
    const hasPermission = await notificationService.requestPermission();
    if (hasPermission && currentUser) {
      await notificationService.subscribeToPushNotifications(currentUser.id);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      console.log('Fetching task data...');
      
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (projectsError) {
        console.log('Projects fetch error:', projectsError);
        setProjects([]);
      } else {
        const formattedProjects: TaskProject[] = projectsData?.map(project => ({
          id: project.id,
          name: project.name,
          description: project.description || undefined,
          color: '#3b82f6',
          created_at: project.created_at,
          updated_at: project.created_at,
          created_by: 'system'
        })) || [];
        setProjects(formattedProjects);
      }

      const { data: usersData, error: usersError } = await supabase
        .from('auth_users')
        .select('id, username, is_admin')
        .order('username');
      
      if (usersError) {
        console.log('Users fetch error:', usersError);
        setUsers([]);
      } else {
        const formattedUsers: TaskUser[] = usersData?.map(user => ({
          id: user.id,
          username: user.username,
          role: user.is_admin ? 'admin' as const : 'member' as const
        })) || [];
        setUsers(formattedUsers);
      }

      await fetchTasks();
      
      setTags([
        { id: '1', name: 'Frontend', color: '#3b82f6', created_at: new Date().toISOString() },
        { id: '2', name: 'Backend', color: '#10b981', created_at: new Date().toISOString() },
        { id: '3', name: 'Design', color: '#f59e0b', created_at: new Date().toISOString() },
        { id: '4', name: 'Documentation', color: '#8b5cf6', created_at: new Date().toISOString() }
      ]);

      setNotifications([]);

    } catch (error) {
      console.error('Error fetching task data:', error);
      toast({
        title: "Error",
        description: "Failed to load data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchTasks = async () => {
    try {
      console.log('Fetching tasks from database...');
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select(`
          *,
          task_assignments(
            user_id,
            assigned_at,
            auth_users(id, username, is_admin)
          ),
          subtasks(*),
          projects(id, name, description)
        `)
        .order('created_at', { ascending: false });

      if (tasksError) {
        console.error('Tasks fetch error:', tasksError);
        return;
      }

      console.log('Raw tasks data from database:', tasksData);

      const formattedTasks = tasksData?.map(formatTaskData) || [];
      
      console.log('Formatted tasks:', formattedTasks);
      setTasks(formattedTasks);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  const addTask = async (task: Omit<Task, "id" | "created_at" | "updated_at">) => {
    if (!currentUser) {
      console.error('No current user');
      toast({
        title: "Error",
        description: "You must be logged in to create tasks",
        variant: "destructive"
      });
      return;
    }

    try {
      console.log('Adding task to database with user:', currentUser.id);
      
      const taskData = {
        title: task.title,
        description: task.description || null,
        supervisor_comments: task.supervisor_comments || null,
        priority: task.priority,
        status: task.status,
        due_date: task.due_date,
        project_id: task.project_id || null,
        created_by: currentUser.id
      };

      console.log('Inserting task data:', taskData);

      const { data, error } = await supabase
        .from('tasks')
        .insert(taskData)
        .select()
        .single();

      if (error) {
        console.error('Database error:', error);
        toast({
          title: "Error",
          description: `Failed to create task: ${error.message}`,
          variant: "destructive"
        });
        throw error;
      }

      console.log('Task created successfully:', data);
      toast({
        title: "Success",
        description: "Task created successfully",
      });
      
    } catch (error) {
      console.error('Error adding task:', error);
      toast({
        title: "Error",
        description: "Failed to create task",
        variant: "destructive"
      });
      throw error;
    }
  };

  const updateTask = async (task: Task) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({
          title: task.title,
          description: task.description,
          supervisor_comments: task.supervisor_comments,
          priority: task.priority,
          status: task.status,
          due_date: task.due_date,
          project_id: task.project_id
        })
        .eq('id', task.id);

      if (error) throw error;

      const previousTask = tasks.find(t => t.id === task.id);
      
      if (previousTask && previousTask.status !== task.status) {
        const assigneeIds = task.assignees?.map(a => a.id) || [];
        
        if (assigneeIds.length > 0) {
          await notificationService.sendNotificationToAssignees(
            assigneeIds,
            'Task Status Updated',
            `Task "${task.title}" status changed to ${task.status.replace('_', ' ')}`,
            task.id,
            currentUser?.id
          );
        }
        
        await notificationService.sendNotificationToAdmins(
          'Task Status Updated',
          `Task "${task.title}" status changed to ${task.status.replace('_', ' ')}`,
          task.id,
          currentUser?.id
        );
      }
      
      toast({
        title: "Success",
        description: "Task updated successfully",
      });
    } catch (error) {
      console.error('Error updating task:', error);
      toast({
        title: "Error",
        description: "Failed to update task",
        variant: "destructive"
      });
    }
  };

  const deleteTask = async (id: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id);

      if (error) throw error;

      const task = tasks.find(t => t.id === id);
      
      if (task) {
        const assigneeIds = task.assignees?.map(a => a.id) || [];
        if (assigneeIds.length > 0) {
          await notificationService.sendNotificationToAssignees(
            assigneeIds,
            'Task Deleted',
            `Task "${task.title}" has been deleted`,
            id,
            currentUser?.id
          );
        }

        await notificationService.sendNotificationToAdmins(
          'Task Deleted',
          `Task "${task.title}" has been deleted`,
          id,
          currentUser?.id
        );
      }
      
      toast({
        title: "Success",
        description: "Task deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting task:', error);
      toast({
        title: "Error",
        description: "Failed to delete task",
        variant: "destructive"
      });
    }
  };

  const assignUser = async (taskId: string, userId: string) => {
    try {
      const { error } = await supabase
        .from('task_assignments')
        .insert({
          task_id: taskId,
          user_id: userId
        });

      if (error) throw error;

      const task = tasks.find(t => t.id === taskId);
      const user = users.find(u => u.id === userId);
      
      if (task && user) {
        await notificationService.sendNotificationToUser(
          userId,
          'Task Assigned',
          `You have been assigned to task "${task.title}"`,
          taskId,
          'assignment'
        );

        await notificationService.sendNotificationToAdmins(
          'Task Assignment',
          `${user.username} has been assigned to task "${task.title}"`,
          taskId,
          currentUser?.id
        );
      }
      
      toast({
        title: "Success",
        description: "User assigned to task",
      });
    } catch (error) {
      console.error('Error assigning user:', error);
      toast({
        title: "Error",
        description: "Failed to assign user",
        variant: "destructive"
      });
    }
  };

  const unassignUser = async (taskId: string, userId: string) => {
    try {
      const { error } = await supabase
        .from('task_assignments')
        .delete()
        .eq('task_id', taskId)
        .eq('user_id', userId);

      if (error) throw error;
      
      toast({
        title: "Success",
        description: "User unassigned from task",
      });
    } catch (error) {
      console.error('Error unassigning user:', error);
      toast({
        title: "Error",
        description: "Failed to unassign user",
        variant: "destructive"
      });
    }
  };

  const addProject = async (project: Omit<TaskProject, "id" | "created_at" | "updated_at">) => {
    try {
      const newProject: TaskProject = {
        ...project,
        id: Math.random().toString(36).substr(2, 9),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: currentUser?.id || ''
      };
      
      setProjects(prev => [newProject, ...prev]);
      toast({
        title: "Success",
        description: "Project created successfully",
      });
    } catch (error) {
      console.error('Error adding project:', error);
      toast({
        title: "Error",
        description: "Failed to create project",
        variant: "destructive"
      });
    }
  };

  const updateProject = async (project: TaskProject) => {
    try {
      setProjects(prev => prev.map(p => p.id === project.id ? project : p));
      toast({
        title: "Success",
        description: "Project updated successfully",
      });
    } catch (error) {
      console.error('Error updating project:', error);
      toast({
        title: "Error",
        description: "Failed to update project",
        variant: "destructive"
      });
    }
  };

  const deleteProject = async (id: string) => {
    try {
      setProjects(prev => prev.filter(p => p.id !== id));
      toast({
        title: "Success",
        description: "Project deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting project:', error);
      toast({
        title: "Error",
        description: "Failed to delete project",
        variant: "destructive"
      });
    }
  };

  const addTag = async (tag: Omit<TaskTag, "id" | "created_at">) => {
    try {
      const newTag: TaskTag = {
        ...tag,
        id: Math.random().toString(36).substr(2, 9),
        created_at: new Date().toISOString()
      };
      setTags(prev => [...prev, newTag]);
      toast({
        title: "Success",
        description: "Tag created successfully",
      });
    } catch (error) {
      console.error('Error adding tag:', error);
      toast({
        title: "Error",
        description: "Failed to create tag",
        variant: "destructive"
      });
    }
  };

  const deleteTag = async (id: string) => {
    try {
      setTags(prev => prev.filter(t => t.id !== id));
      toast({
        title: "Success",
        description: "Tag deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting tag:', error);
      toast({
        title: "Error",
        description: "Failed to delete tag",
        variant: "destructive"
      });
    }
  };

  const addSubtask = async (subtask: Omit<Subtask, "id" | "created_at">) => {
    try {
      const { data, error } = await supabase
        .from('subtasks')
        .insert({
          parent_task_id: subtask.parent_task_id,
          title: subtask.title,
          completed: subtask.completed,
          order_index: subtask.order_index
        })
        .select()
        .single();

      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Subtask added successfully",
      });
    } catch (error) {
      console.error('Error adding subtask:', error);
      toast({
        title: "Error",
        description: "Failed to add subtask",
        variant: "destructive"
      });
    }
  };

  const updateSubtask = async (subtask: Subtask) => {
    try {
      const { error } = await supabase
        .from('subtasks')
        .update({
          title: subtask.title,
          completed: subtask.completed,
          order_index: subtask.order_index
        })
        .eq('id', subtask.id);

      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Subtask updated successfully",
      });
    } catch (error) {
      console.error('Error updating subtask:', error);
      toast({
        title: "Error",
        description: "Failed to update subtask",
        variant: "destructive"
      });
    }
  };

  const deleteSubtask = async (id: string) => {
    try {
      const { error } = await supabase
        .from('subtasks')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Subtask deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting subtask:', error);
      toast({
        title: "Error",
        description: "Failed to delete subtask",
        variant: "destructive"
      });
    }
  };

  const addComment = async (comment: Omit<TaskComment, "id" | "created_at" | "updated_at">) => {
    try {
      toast({
        title: "Success",
        description: "Comment added successfully",
      });
    } catch (error) {
      console.error('Error adding comment:', error);
      toast({
        title: "Error",
        description: "Failed to add comment",
        variant: "destructive"
      });
    }
  };

  const markNotificationRead = async (id: string) => {
    try {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const value = {
    projects,
    addProject,
    updateProject,
    deleteProject,
    tasks,
    addTask,
    updateTask,
    deleteTask,
    assignUser,
    unassignUser,
    tags,
    addTag,
    deleteTag,
    addSubtask,
    updateSubtask,
    deleteSubtask,
    addComment,
    notifications,
    markNotificationRead,
    users,
    loading,
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
