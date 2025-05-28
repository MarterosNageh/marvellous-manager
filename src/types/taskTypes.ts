
export type TaskPriority = "low" | "medium" | "high" | "urgent";
export type TaskStatus = "pending" | "in_progress" | "under_review" | "completed";

export interface User {
  id: string;
  username: string;
  password: string;
  isAdmin: boolean;
  role?: string;
}

export interface TaskUser {
  id: string;
  username: string;
  role: string;
}

export interface Project {
  id: string;
  name: string;
  color?: string;
}

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
  order_index: number;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  supervisor_comments: string;
  priority: TaskPriority;
  status: TaskStatus;
  due_date: string;
  project_id: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  assignees: TaskUser[];
  tags: string[];
  subtasks: Subtask[];
  project: Project | null;
}
