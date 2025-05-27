
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskStatus = 'pending' | 'in_progress' | 'under_review' | 'completed';
export type UserRole = 'admin' | 'member';
export type NotificationType = 'mention' | 'assignment' | 'due_date' | 'comment';

export interface TaskProject {
  id: string;
  name: string;
  description?: string;
  color: string;
  created_at: string;
  updated_at: string;
  created_by: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  supervisor_comments?: string;
  priority: TaskPriority;
  status: TaskStatus;
  due_date?: string;
  project_id?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  assignees?: TaskUser[];
  tags?: TaskTag[];
  subtasks?: Subtask[];
  project?: TaskProject;
}

export interface TaskUser {
  id: string;
  username: string;
  role: UserRole;
  assigned_at?: string;
}

export interface TaskTag {
  id: string;
  name: string;
  color: string;
  created_at: string;
}

export interface Subtask {
  id: string;
  parent_task_id: string;
  title: string;
  completed: boolean;
  created_at: string;
  order_index: number;
}

export interface TaskComment {
  id: string;
  task_id: string;
  user_id: string;
  content: string;
  mentions: string[];
  created_at: string;
  updated_at: string;
  user?: TaskUser;
}

export interface TaskAttachment {
  id: string;
  task_id: string;
  filename: string;
  file_url: string;
  file_size?: number;
  mime_type?: string;
  uploaded_by: string;
  uploaded_at: string;
  uploader?: TaskUser;
}

export interface TaskNotification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message?: string;
  task_id: string;
  read: boolean;
  created_at: string;
  task?: Task;
}
