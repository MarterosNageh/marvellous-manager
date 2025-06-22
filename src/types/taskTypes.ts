export type TaskPriority = "low" | "medium" | "high" | "urgent";
export type TaskStatus = "pending" | "in_progress" | "under_review" | "completed";

export interface User {
  id: string;
  username: string;
  password: string;
  isAdmin: boolean;
  role?: 'admin' | 'senior' | 'operator' | 'producer';
}

export interface TaskUser {
  id: string;
  username: string;
  role: 'admin' | 'senior' | 'operator' | 'producer';
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

export interface TaskComment {
  id: string;
  task_id: string;
  user_id: string;
  message: string;
  mentions: string[]; // Array of user IDs
  created_at: string;
  updated_at: string;
  user?: TaskUser; // Populated when fetching with user data
}

export interface TaskCommentMention {
  id: string;
  comment_id: string;
  mentioned_user_id: string;
  task_id: string;
  is_read: boolean;
  created_at: string;
  mentioned_user?: TaskUser; // Populated when fetching with user data
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
  comments?: TaskComment[]; // Optional: populated when needed
  unread_mentions_count?: number; // Optional: for notification badges
}
