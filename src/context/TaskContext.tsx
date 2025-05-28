import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Task, TaskUser, Project } from '@/types/taskTypes';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { notificationService } from '@/services/notificationService';
import { useToast } from '@/hooks/use-toast';

interface TaskContextType {
  tasks: Task[];
  users: TaskUser[];
  projects: Project[];
  currentUser: TaskUser | null;
  loading: boolean;
  addTask: (task: Omit<Task, 'id' | 'created_at' | 'updated_at'>, assigneeIds: string[]) => Promise<void>;
  updateTask: (taskId: string, updates: Partial<Task>, assigneeIds?: string[]) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  addProject: (project: Omit<Project, 'id'>) => Promise<void>;
  fetchTasks: () => Promise<void>;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const useTask = () => {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error('useTask must be used within a TaskProvider');
  }
  return context;
};

interface TaskProviderProps {
  children: ReactNode;
}

export const TaskProvider: React.FC<TaskProviderProps> = ({ children }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<TaskUser[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentUser, setCurrentUser] = useState<TaskUser | null>(null);
  const [loading, setLoading] = useState(true);
  const { currentUser: authUser } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (authUser) {
      const taskUser: TaskUser = {
        id: authUser.id,
        username: authUser.username,
        role: authUser.is_admin ? 'admin' : 'member'
      };
      setCurrentUser(taskUser);
      
      fetchTasks();
      fetchUsers();
      fetchProjects();
    }
  }, [authUser]);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('auth_users')
        .select('id, username, is_admin');

      if (error) throw error;

      const taskUsers: TaskUser[] = data.map(user => ({
        id: user.id,
        username: user.username,
        role: user.is_admin ? 'admin' : 'member'
      }));

      setUsers(taskUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('id, name, description')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const taskProjects: Project[] = data.map(project => ({
        id: project.id,
        name: project.name,
        description: project.description || undefined
      }));

      setProjects(taskProjects);
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const fetchTasks = async () => {
    try {
      console.log('Fetching tasks from database...');
      
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          task_assignments (
            user_id,
            auth_users (id, username, is_admin),
            assigned_at
          ),
          subtasks (*),
          projects (id, name, description)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      console.log('Raw tasks data from database:', data);

      const formattedTasks: Task[] = data.map(task => ({
        id: task.id,
        title: task.title,
        description: task.description,
        supervisor_comments: task.supervisor_comments,
        priority: task.priority,
        status: task.status,
        due_date: task.due_date,
        project_id: task.project_id,
        created_by: task.created_by,
        created_at: task.created_at,
        updated_at: task.updated_at,
        assignees: task.task_assignments?.map((assignment: any) => ({
          id: assignment.auth_users.id,
          username: assignment.auth_users.username,
          role: assignment.auth_users.is_admin ? 'admin' : 'member',
          assigned_at: assignment.assigned_at
        })) || [],
        tags: [],
        subtasks: task.subtasks?.map((subtask: any) => ({
          id: subtask.id,
          title: subtask.title,
          completed: subtask.completed,
          parent_task_id: subtask.parent_task_id,
          order_index: subtask.order_index,
          created_at: subtask.created_at
        })) || [],
        project: task.projects ? {
          id: task.projects.id,
          name: task.projects.name,
          description: task.projects.description
        } : undefined
      }));

      console.log('Formatted tasks:', formattedTasks);
      setTasks(formattedTasks);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      toast({
        title: "Error",
        description: "Failed to fetch tasks",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const addTask = async (taskData: Omit<Task, 'id' | 'created_at' | 'updated_at'>, assigneeIds: string[] = []) => {
    try {
      console.log('Adding task with data:', taskData, 'assignees:', assigneeIds);

      const { data: newTask, error: taskError } = await supabase
        .from('tasks')
        .insert([{
          title: taskData.title,
          description: taskData.description,
          priority: taskData.priority,
          status: taskData.status,
          due_date: taskData.due_date,
          project_id: taskData.project_id,
          supervisor_comments: taskData.supervisor_comments,
          created_by: taskData.created_by
        }])
        .select()
        .single();

      if (taskError) throw taskError;

      if (assigneeIds.length > 0) {
        const assignments = assigneeIds.map(userId => ({
          task_id: newTask.id,
          user_id: userId
        }));

        const { error: assignmentError } = await supabase
          .from('task_assignments')
          .insert(assignments);

        if (assignmentError) throw assignmentError;

        await notificationService.sendTaskAssignmentNotifications(
          assigneeIds,
          taskData.title,
          newTask.id,
          taskData.created_by
        );
      }

      if (taskData.subtasks && taskData.subtasks.length > 0) {
        const subtasks = taskData.subtasks.map(subtask => ({
          parent_task_id: newTask.id,
          title: subtask.title,
          completed: subtask.completed,
          order_index: subtask.order_index
        }));

        const { error: subtaskError } = await supabase
          .from('subtasks')
          .insert(subtasks);

        if (subtaskError) throw subtaskError;
      }

      await fetchTasks();
      
      toast({
        title: "Success",
        description: "Task created successfully"
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

  const updateTask = async (taskId: string, updates: Partial<Task>, assigneeIds?: string[]) => {
    try {
      const { error: taskError } = await supabase
        .from('tasks')
        .update({
          title: updates.title,
          description: updates.description,
          priority: updates.priority,
          status: updates.status,
          due_date: updates.due_date,
          project_id: updates.project_id,
          supervisor_comments: updates.supervisor_comments
        })
        .eq('id', taskId);

      if (taskError) throw taskError;

      if (assigneeIds !== undefined) {
        await supabase
          .from('task_assignments')
          .delete()
          .eq('task_id', taskId);

        if (assigneeIds.length > 0) {
          const assignments = assigneeIds.map(userId => ({
            task_id: taskId,
            user_id: userId
          }));

          const { error: assignmentError } = await supabase
            .from('task_assignments')
            .insert(assignments);

          if (assignmentError) throw assignmentError;
        }
      }

      await fetchTasks();
      
      toast({
        title: "Success",
        description: "Task updated successfully"
      });
    } catch (error) {
      console.error('Error updating task:', error);
      toast({
        title: "Error",
        description: "Failed to update task",
        variant: "destructive"
      });
      throw error;
    }
  };

  const deleteTask = async (taskId: string) => {
    try {
      await supabase
        .from('task_assignments')
        .delete()
        .eq('task_id', taskId);

      await supabase
        .from('subtasks')
        .delete()
        .eq('parent_task_id', taskId);

      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;

      await fetchTasks();
      
      toast({
        title: "Success",
        description: "Task deleted successfully"
      });
    } catch (error) {
      console.error('Error deleting task:', error);
      toast({
        title: "Error",
        description: "Failed to delete task",
        variant: "destructive"
      });
      throw error;
    }
  };

  const addProject = async (projectData: Omit<Project, 'id'>) => {
    try {
      const { error } = await supabase
        .from('projects')
        .insert([{
          name: projectData.name,
          description: projectData.description
        }]);

      if (error) throw error;

      await fetchProjects();
      
      toast({
        title: "Success",
        description: "Project created successfully"
      });
    } catch (error) {
      console.error('Error adding project:', error);
      toast({
        title: "Error",
        description: "Failed to create project",
        variant: "destructive"
      });
      throw error;
    }
  };

  useEffect(() => {
    const setupRealtimeSubscriptions = () => {
      const tasksSubscription = supabase
        .channel('tasks-changes')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'tasks' },
          (payload) => {
            console.log('Task realtime change detected:', payload);
            handleTaskRealtimeChange(payload);
          }
        )
        .subscribe();

      const assignmentsSubscription = supabase
        .channel('task-assignments-changes')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'task_assignments' },
          (payload) => {
            console.log('Task assignment realtime change detected:', payload);
            handleTaskAssignmentRealtimeChange(payload);
          }
        )
        .subscribe();

      return () => {
        tasksSubscription.unsubscribe();
        assignmentsSubscription.unsubscribe();
      };
    };

    const handleTaskRealtimeChange = (payload: any) => {
      console.log('Handling task realtime change:', payload);
      fetchTasks();
    };

    const handleTaskAssignmentRealtimeChange = (payload: any) => {
      fetchTasks();
    };

    if (authUser) {
      const cleanup = setupRealtimeSubscriptions();
      return cleanup;
    }
  }, [authUser]);

  useEffect(() => {
    notificationService.init();
    notificationService.requestPermission();
  }, []);

  const value: TaskContextType = {
    tasks,
    users,
    projects,
    currentUser,
    loading,
    addTask,
    updateTask,
    deleteTask,
    addProject,
    fetchTasks
  };

  return (
    <TaskContext.Provider value={value}>
      {children}
    </TaskContext.Provider>
  );
};
