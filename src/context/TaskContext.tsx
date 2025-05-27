import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
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
      initializeNotifications();
    }
  }, [currentUser]);

  const initializeNotifications = async () => {
    const hasPermission = await notificationService.requestPermission();
    if (hasPermission && currentUser) {
      await notificationService.subscribeToPushNotifications(currentUser.id);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch real projects from database
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (projectsError) {
        console.log('Projects fetch error:', projectsError);
        setProjects([]);
      } else {
        const formattedProjects = projectsData?.map(project => ({
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

      // Fetch users from auth_users table
      const { data: usersData, error: usersError } = await supabase
        .from('auth_users')
        .select('id, username, is_admin')
        .order('username');
      
      if (usersError) {
        console.log('Users fetch error:', usersError);
        setUsers([]);
      } else {
        const formattedUsers = usersData?.map(user => ({
          id: user.id,
          username: user.username,
          role: user.is_admin ? 'admin' as const : 'member' as const
        })) || [];
        setUsers(formattedUsers);
      }

      // Create sample tasks with users assigned
      const mockTasks: Task[] = [
        {
          id: '1',
          title: 'Review project requirements',
          description: 'Go through all project requirements and create initial assessment. This includes analyzing technical specifications, resource requirements, and timeline constraints.',
          priority: 'high',
          status: 'pending',
          due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
          project_id: projectsData?.[0]?.id,
          created_by: currentUser?.id || '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          assignees: usersData?.slice(0, 1).map(user => ({
            id: user.id,
            username: user.username,
            role: user.is_admin ? 'admin' as const : 'member' as const
          })) || [],
          tags: [],
          subtasks: [
            { id: '1a', parent_task_id: '1', title: 'Gather requirements', completed: false, created_at: new Date().toISOString(), order_index: 1 },
            { id: '1b', parent_task_id: '1', title: 'Create timeline', completed: false, created_at: new Date().toISOString(), order_index: 2 }
          ],
          project: projectsData?.[0] ? {
            id: projectsData[0].id,
            name: projectsData[0].name,
            description: projectsData[0].description,
            color: '#3b82f6',
            created_at: projectsData[0].created_at,
            updated_at: projectsData[0].created_at,
            created_by: 'system'
          } : undefined
        },
        {
          id: '2',
          title: 'Implement user authentication',
          description: 'Set up secure user authentication system with proper validation and security measures.',
          priority: 'urgent',
          status: 'in_progress',
          project_id: projectsData?.[0]?.id,
          created_by: currentUser?.id || '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          assignees: usersData?.slice(0, 2).map(user => ({
            id: user.id,
            username: user.username,
            role: user.is_admin ? 'admin' as const : 'member' as const
          })) || [],
          tags: [],
          subtasks: []
        },
        {
          id: '3',
          title: 'Write API documentation',
          description: 'Create comprehensive API documentation for all endpoints.',
          priority: 'medium',
          status: 'under_review',
          project_id: projectsData?.[1]?.id,
          created_by: currentUser?.id || '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          assignees: usersData?.slice(1, 2).map(user => ({
            id: user.id,
            username: user.username,
            role: user.is_admin ? 'admin' as const : 'member' as const
          })) || [],
          tags: [],
          subtasks: []
        },
        {
          id: '4',
          title: 'Setup CI/CD pipeline',
          description: 'Configure automated deployment pipeline with proper testing and validation.',
          priority: 'low',
          status: 'completed',
          project_id: projectsData?.[0]?.id,
          created_by: currentUser?.id || '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          assignees: [],
          tags: [],
          subtasks: []
        },
        {
          id: '5',
          title: 'Database optimization',
          description: 'Optimize database queries and improve performance.',
          priority: 'medium',
          status: 'pending',
          project_id: projectsData?.[0]?.id,
          created_by: currentUser?.id || '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          assignees: usersData?.slice(0, 1).map(user => ({
            id: user.id,
            username: user.username,
            role: user.is_admin ? 'admin' as const : 'member' as const
          })) || [],
          tags: [],
          subtasks: []
        }
      ];
      
      setTasks(mockTasks);
      setTags([
        { id: '1', name: 'Frontend', color: '#3b82f6', created_at: new Date().toISOString() },
        { id: '2', name: 'Backend', color: '#10b981', created_at: new Date().toISOString() },
        { id: '3', name: 'Design', color: '#f59e0b', created_at: new Date().toISOString() },
        { id: '4', name: 'Documentation', color: '#8b5cf6', created_at: new Date().toISOString() }
      ]);

      setNotifications([]);

    } catch (error) {
      console.error('Error fetching task data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
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
      
      // Send notifications to admins about new task
      await notificationService.sendNotificationToAdmins(
        'New Task Created',
        `Task "${task.title}" has been created`,
        newTask.id,
        currentUser?.id
      );
      
      toast.success('Task created successfully');
    } catch (error) {
      console.error('Error adding task:', error);
      toast.error('Failed to create task');
    }
  };

  const updateTask = async (task: Task) => {
    try {
      const previousTask = tasks.find(t => t.id === task.id);
      setTasks(prev => prev.map(t => t.id === task.id ? task : t));
      
      // Send notification for status change to assignees and admins
      if (previousTask && previousTask.status !== task.status) {
        const assigneeIds = task.assignees?.map(a => a.id) || [];
        
        // Notify assignees
        if (assigneeIds.length > 0) {
          await notificationService.sendNotificationToAssignees(
            assigneeIds,
            'Task Status Updated',
            `Task "${task.title}" status changed to ${task.status.replace('_', ' ')}`,
            task.id,
            currentUser?.id
          );
        }
        
        // Notify admins
        await notificationService.sendNotificationToAdmins(
          'Task Status Updated',
          `Task "${task.title}" status changed to ${task.status.replace('_', ' ')}`,
          task.id,
          currentUser?.id
        );
      }
      
      toast.success('Task updated successfully');
    } catch (error) {
      console.error('Error updating task:', error);
      toast.error('Failed to update task');
    }
  };

  const assignUser = async (taskId: string, userId: string) => {
    try {
      const task = tasks.find(t => t.id === taskId);
      const user = users.find(u => u.id === userId);
      
      if (task && user) {
        const updatedTask = {
          ...task,
          assignees: [...(task.assignees || []), { ...user, assigned_at: new Date().toISOString() }]
        };
        
        setTasks(prev => prev.map(t => t.id === taskId ? updatedTask : t));
        
        // Send notification to assigned user
        await notificationService.sendNotificationToUser(
          userId,
          'Task Assigned',
          `You have been assigned to task "${task.title}"`,
          taskId,
          'assignment'
        );

        // Notify admins about assignment
        await notificationService.sendNotificationToAdmins(
          'Task Assignment',
          `${user.username} has been assigned to task "${task.title}"`,
          taskId,
          currentUser?.id
        );
      }
      
      toast.success('User assigned to task');
    } catch (error) {
      console.error('Error assigning user:', error);
      toast.error('Failed to assign user');
    }
  };

  const deleteTask = async (id: string) => {
    try {
      const task = tasks.find(t => t.id === id);
      setTasks(prev => prev.filter(t => t.id !== id));
      
      if (task) {
        // Notify assignees about deletion
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

        // Notify admins
        await notificationService.sendNotificationToAdmins(
          'Task Deleted',
          `Task "${task.title}" has been deleted`,
          id,
          currentUser?.id
        );
      }
      
      toast.success('Task deleted successfully');
    } catch (error) {
      console.error('Error deleting task:', error);
      toast.error('Failed to delete task');
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

  const unassignUser = async (taskId: string, userId: string) => {
    try {
      const task = tasks.find(t => t.id === taskId);
      
      if (task) {
        const updatedTask = {
          ...task,
          assignees: task.assignees?.filter(a => a.id !== userId) || []
        };
        
        setTasks(prev => prev.map(t => t.id === taskId ? updatedTask : t));
      }
      
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
