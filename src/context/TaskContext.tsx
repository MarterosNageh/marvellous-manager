
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
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
  // Projects
  projects: TaskProject[];
  addProject: (project: Omit<TaskProject, "id" | "created_at" | "updated_at">) => Promise<void>;
  updateProject: (project: TaskProject) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  
  // Tasks
  tasks: Task[];
  addTask: (task: Omit<Task, "id" | "created_at" | "updated_at">) => Promise<void>;
  updateTask: (task: Task) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  
  // Task assignment
  assignUser: (taskId: string, userId: string) => Promise<void>;
  unassignUser: (taskId: string, userId: string) => Promise<void>;
  
  // Tags
  tags: TaskTag[];
  addTag: (tag: Omit<TaskTag, "id" | "created_at">) => Promise<void>;
  deleteTag: (id: string) => Promise<void>;
  
  // Subtasks
  addSubtask: (subtask: Omit<Subtask, "id" | "created_at">) => Promise<void>;
  updateSubtask: (subtask: Subtask) => Promise<void>;
  deleteSubtask: (id: string) => Promise<void>;
  
  // Comments
  addComment: (comment: Omit<TaskComment, "id" | "created_at" | "updated_at">) => Promise<void>;
  
  // Notifications
  notifications: TaskNotification[];
  markNotificationRead: (id: string) => Promise<void>;
  
  // Users
  users: TaskUser[];
  
  // Loading states
  loading: boolean;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const TaskProvider = ({ children }: { children: ReactNode }) => {
  const { currentUser } = useAuth();
  const [projects, setProjects] = useState<TaskProject[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tags, setTags] = useState<TaskTag[]>([]);
  const [notifications, setNotifications] = useState<TaskNotification[]>([]);
  const [users, setUsers] = useState<TaskUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentUser) {
      fetchData();
    }
  }, [currentUser]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch projects
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (projectsError) throw projectsError;
      setProjects(projectsData || []);

      // Fetch tasks with assignees and project info
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select(`
          *,
          project:projects(*),
          assignees:task_assignees(
            user_id,
            assigned_at,
            user:auth_users(id, username, role)
          ),
          tags:task_tag_relations(
            tag:task_tags(*)
          ),
          subtasks(*)
        `)
        .order('created_at', { ascending: false });
      
      if (tasksError) throw tasksError;
      
      const formattedTasks = tasksData?.map(task => ({
        ...task,
        assignees: task.assignees?.map(a => ({
          id: a.user.id,
          username: a.user.username,
          role: a.user.role,
          assigned_at: a.assigned_at
        })),
        tags: task.tags?.map(t => t.tag),
      })) || [];
      
      setTasks(formattedTasks);

      // Fetch tags
      const { data: tagsData, error: tagsError } = await supabase
        .from('task_tags')
        .select('*')
        .order('name');
      
      if (tagsError) throw tagsError;
      setTags(tagsData || []);

      // Fetch users
      const { data: usersData, error: usersError } = await supabase
        .from('auth_users')
        .select('id, username, role')
        .order('username');
      
      if (usersError) throw usersError;
      setUsers(usersData || []);

      // Fetch notifications for current user
      if (currentUser) {
        const { data: notificationsData, error: notificationsError } = await supabase
          .from('notifications')
          .select('*, task:tasks(title)')
          .eq('user_id', currentUser.id)
          .order('created_at', { ascending: false });
        
        if (notificationsError) throw notificationsError;
        setNotifications(notificationsData || []);
      }

    } catch (error) {
      console.error('Error fetching task data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const addProject = async (project: Omit<TaskProject, "id" | "created_at" | "updated_at">) => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .insert([{ ...project, created_by: currentUser?.id }])
        .select()
        .single();
      
      if (error) throw error;
      setProjects(prev => [data, ...prev]);
      toast.success('Project created successfully');
    } catch (error) {
      console.error('Error adding project:', error);
      toast.error('Failed to create project');
    }
  };

  const updateProject = async (project: TaskProject) => {
    try {
      const { error } = await supabase
        .from('projects')
        .update(project)
        .eq('id', project.id);
      
      if (error) throw error;
      setProjects(prev => prev.map(p => p.id === project.id ? project : p));
      toast.success('Project updated successfully');
    } catch (error) {
      console.error('Error updating project:', error);
      toast.error('Failed to update project');
    }
  };

  const deleteProject = async (id: string) => {
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      setProjects(prev => prev.filter(p => p.id !== id));
      toast.success('Project deleted successfully');
    } catch (error) {
      console.error('Error deleting project:', error);
      toast.error('Failed to delete project');
    }
  };

  const addTask = async (task: Omit<Task, "id" | "created_at" | "updated_at">) => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert([{ ...task, created_by: currentUser?.id }])
        .select()
        .single();
      
      if (error) throw error;
      
      const newTask = { ...data, assignees: [], tags: [], subtasks: [] };
      setTasks(prev => [newTask, ...prev]);
      toast.success('Task created successfully');
    } catch (error) {
      console.error('Error adding task:', error);
      toast.error('Failed to create task');
    }
  };

  const updateTask = async (task: Task) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({
          title: task.title,
          description: task.description,
          priority: task.priority,
          status: task.status,
          due_date: task.due_date,
          project_id: task.project_id
        })
        .eq('id', task.id);
      
      if (error) throw error;
      setTasks(prev => prev.map(t => t.id === task.id ? task : t));
      toast.success('Task updated successfully');
    } catch (error) {
      console.error('Error updating task:', error);
      toast.error('Failed to update task');
    }
  };

  const deleteTask = async (id: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      setTasks(prev => prev.filter(t => t.id !== id));
      toast.success('Task deleted successfully');
    } catch (error) {
      console.error('Error deleting task:', error);
      toast.error('Failed to delete task');
    }
  };

  const assignUser = async (taskId: string, userId: string) => {
    try {
      const { error } = await supabase
        .from('task_assignees')
        .insert([{ task_id: taskId, user_id: userId }]);
      
      if (error) throw error;
      fetchData(); // Refresh data
      toast.success('User assigned to task');
    } catch (error) {
      console.error('Error assigning user:', error);
      toast.error('Failed to assign user');
    }
  };

  const unassignUser = async (taskId: string, userId: string) => {
    try {
      const { error } = await supabase
        .from('task_assignees')
        .delete()
        .eq('task_id', taskId)
        .eq('user_id', userId);
      
      if (error) throw error;
      fetchData(); // Refresh data
      toast.success('User unassigned from task');
    } catch (error) {
      console.error('Error unassigning user:', error);
      toast.error('Failed to unassign user');
    }
  };

  const addTag = async (tag: Omit<TaskTag, "id" | "created_at">) => {
    try {
      const { data, error } = await supabase
        .from('task_tags')
        .insert([tag])
        .select()
        .single();
      
      if (error) throw error;
      setTags(prev => [...prev, data]);
      toast.success('Tag created successfully');
    } catch (error) {
      console.error('Error adding tag:', error);
      toast.error('Failed to create tag');
    }
  };

  const deleteTag = async (id: string) => {
    try {
      const { error } = await supabase
        .from('task_tags')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      setTags(prev => prev.filter(t => t.id !== id));
      toast.success('Tag deleted successfully');
    } catch (error) {
      console.error('Error deleting tag:', error);
      toast.error('Failed to delete tag');
    }
  };

  const addSubtask = async (subtask: Omit<Subtask, "id" | "created_at">) => {
    try {
      const { error } = await supabase
        .from('subtasks')
        .insert([subtask]);
      
      if (error) throw error;
      fetchData(); // Refresh data
      toast.success('Subtask added successfully');
    } catch (error) {
      console.error('Error adding subtask:', error);
      toast.error('Failed to add subtask');
    }
  };

  const updateSubtask = async (subtask: Subtask) => {
    try {
      const { error } = await supabase
        .from('subtasks')
        .update(subtask)
        .eq('id', subtask.id);
      
      if (error) throw error;
      fetchData(); // Refresh data
    } catch (error) {
      console.error('Error updating subtask:', error);
      toast.error('Failed to update subtask');
    }
  };

  const deleteSubtask = async (id: string) => {
    try {
      const { error } = await supabase
        .from('subtasks')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      fetchData(); // Refresh data
      toast.success('Subtask deleted successfully');
    } catch (error) {
      console.error('Error deleting subtask:', error);
      toast.error('Failed to delete subtask');
    }
  };

  const addComment = async (comment: Omit<TaskComment, "id" | "created_at" | "updated_at">) => {
    try {
      const { error } = await supabase
        .from('task_comments')
        .insert([comment]);
      
      if (error) throw error;
      toast.success('Comment added successfully');
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Failed to add comment');
    }
  };

  const markNotificationRead = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', id);
      
      if (error) throw error;
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
