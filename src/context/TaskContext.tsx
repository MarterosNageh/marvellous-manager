
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Task, TaskPriority, TaskStatus, User } from "@/types/taskTypes";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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

  useEffect(() => {
    fetchData();
    // Get current user from localStorage
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    }
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

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
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createTask = async (data: CreateTaskData) => {
    try {
      const { data: taskData, error: taskError } = await supabase
        .from('tasks')
        .insert([{
          title: data.title,
          description: data.description,
          priority: data.priority,
          status: data.status,
          due_date: data.due_date,
          project_id: data.project_id,
          created_by: users[0]?.id || '',
        }])
        .select()
        .single();

      if (taskError) throw taskError;

      if (data.assignee_ids && data.assignee_ids.length > 0) {
        const assignments = data.assignee_ids.map(userId => ({
          task_id: taskData.id,
          user_id: userId,
        }));

        const { error: assignmentError } = await supabase
          .from('task_assignments')
          .insert(assignments);

        if (assignmentError) throw assignmentError;
      }

      await fetchData();
    } catch (error) {
      console.error('Error creating task:', error);
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

      const { error } = await supabase
        .from('tasks')
        .update({
          title: updates.title,
          description: updates.description,
          priority: updates.priority,
          status: updates.status,
          due_date: updates.due_date,
          supervisor_comments: updates.supervisor_comments,
        })
        .eq('id', taskId);

      if (error) throw error;

      await fetchData();
      
      toast({
        title: "Success",
        description: "Task updated successfully",
      });
    } catch (error) {
      console.error('Error updating task:', error);
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
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;

      await fetchData();
    } catch (error) {
      console.error('Error deleting task:', error);
      throw error;
    }
  };

  const assignTask = async (taskId: string, userIds: string[]) => {
    try {
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
      }

      await fetchData();
    } catch (error) {
      console.error('Error assigning task:', error);
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
