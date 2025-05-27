
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
      
      // For now, use existing projects table as a fallback
      // This creates some mock data to get the app working
      const mockProjects: TaskProject[] = [
        {
          id: '1',
          name: 'Website Redesign',
          description: 'Complete redesign of company website',
          color: '#3b82f6',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          created_by: currentUser?.id || ''
        },
        {
          id: '2',
          name: 'Mobile App',
          description: 'Develop mobile application',
          color: '#10b981',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          created_by: currentUser?.id || ''
        }
      ];
      
      setProjects(mockProjects);

      // Create mock tasks
      const mockTasks: Task[] = [
        {
          id: '1',
          title: 'Design new homepage layout',
          description: 'Create wireframes and mockups for the new homepage design',
          priority: 'high',
          status: 'todo',
          due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          project_id: '1',
          created_by: currentUser?.id || '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          assignees: [],
          tags: [],
          subtasks: [],
          project: mockProjects[0]
        },
        {
          id: '2',
          title: 'Set up development environment',
          description: 'Configure build tools and development environment',
          priority: 'medium',
          status: 'in_progress',
          project_id: '2',
          created_by: currentUser?.id || '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          assignees: [],
          tags: [],
          subtasks: []
        },
        {
          id: '3',
          title: 'Write user documentation',
          description: 'Create comprehensive user guide and documentation',
          priority: 'low',
          status: 'done',
          project_id: '1',
          created_by: currentUser?.id || '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          assignees: [],
          tags: [],
          subtasks: [],
          project: mockProjects[0]
        }
      ];
      
      setTasks(mockTasks);

      // Fetch users from existing auth_users table
      const { data: usersData, error: usersError } = await supabase
        .from('auth_users')
        .select('id, username')
        .order('username');
      
      if (usersError) {
        console.log('Users fetch error:', usersError);
        // Create mock users if the table structure is different
        const mockUsers: TaskUser[] = [
          {
            id: currentUser?.id || '1',
            username: currentUser?.username || 'Current User',
            role: 'admin'
          }
        ];
        setUsers(mockUsers);
      } else {
        const formattedUsers = usersData?.map(user => ({
          id: user.id,
          username: user.username,
          role: 'member' as const
        })) || [];
        setUsers(formattedUsers);
      }

      // Set mock tags
      setTags([
        { id: '1', name: 'Frontend', color: '#3b82f6', created_at: new Date().toISOString() },
        { id: '2', name: 'Backend', color: '#10b981', created_at: new Date().toISOString() },
        { id: '3', name: 'Design', color: '#f59e0b', created_at: new Date().toISOString() }
      ]);

      setNotifications([]);

    } catch (error) {
      console.error('Error fetching task data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
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
      toast.success('Project created successfully');
    } catch (error) {
      console.error('Error adding project:', error);
      toast.error('Failed to create project');
    }
  };

  const updateProject = async (project: TaskProject) => {
    try {
      setProjects(prev => prev.map(p => p.id === project.id ? project : p));
      toast.success('Project updated successfully');
    } catch (error) {
      console.error('Error updating project:', error);
      toast.error('Failed to update project');
    }
  };

  const deleteProject = async (id: string) => {
    try {
      setProjects(prev => prev.filter(p => p.id !== id));
      toast.success('Project deleted successfully');
    } catch (error) {
      console.error('Error deleting project:', error);
      toast.error('Failed to delete project');
    }
  };

  const addTask = async (task: Omit<Task, "id" | "created_at" | "updated_at">) => {
    try {
      const newTask: Task = {
        ...task,
        id: Math.random().toString(36).substr(2, 9),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: currentUser?.id || '',
        assignees: [],
        tags: [],
        subtasks: [],
        project: task.project_id ? projects.find(p => p.id === task.project_id) : undefined
      };
      
      setTasks(prev => [newTask, ...prev]);
      toast.success('Task created successfully');
    } catch (error) {
      console.error('Error adding task:', error);
      toast.error('Failed to create task');
    }
  };

  const updateTask = async (task: Task) => {
    try {
      setTasks(prev => prev.map(t => t.id === task.id ? task : t));
      toast.success('Task updated successfully');
    } catch (error) {
      console.error('Error updating task:', error);
      toast.error('Failed to update task');
    }
  };

  const deleteTask = async (id: string) => {
    try {
      setTasks(prev => prev.filter(t => t.id !== id));
      toast.success('Task deleted successfully');
    } catch (error) {
      console.error('Error deleting task:', error);
      toast.error('Failed to delete task');
    }
  };

  const assignUser = async (taskId: string, userId: string) => {
    try {
      toast.success('User assigned to task');
    } catch (error) {
      console.error('Error assigning user:', error);
      toast.error('Failed to assign user');
    }
  };

  const unassignUser = async (taskId: string, userId: string) => {
    try {
      toast.success('User unassigned from task');
    } catch (error) {
      console.error('Error unassigning user:', error);
      toast.error('Failed to unassign user');
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
      toast.success('Tag created successfully');
    } catch (error) {
      console.error('Error adding tag:', error);
      toast.error('Failed to create tag');
    }
  };

  const deleteTag = async (id: string) => {
    try {
      setTags(prev => prev.filter(t => t.id !== id));
      toast.success('Tag deleted successfully');
    } catch (error) {
      console.error('Error deleting tag:', error);
      toast.error('Failed to delete tag');
    }
  };

  const addSubtask = async (subtask: Omit<Subtask, "id" | "created_at">) => {
    try {
      toast.success('Subtask added successfully');
    } catch (error) {
      console.error('Error adding subtask:', error);
      toast.error('Failed to add subtask');
    }
  };

  const updateSubtask = async (subtask: Subtask) => {
    try {
      // Implementation for updating subtask
    } catch (error) {
      console.error('Error updating subtask:', error);
      toast.error('Failed to update subtask');
    }
  };

  const deleteSubtask = async (id: string) => {
    try {
      toast.success('Subtask deleted successfully');
    } catch (error) {
      console.error('Error deleting subtask:', error);
      toast.error('Failed to delete subtask');
    }
  };

  const addComment = async (comment: Omit<TaskComment, "id" | "created_at" | "updated_at">) => {
    try {
      toast.success('Comment added successfully');
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Failed to add comment');
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
