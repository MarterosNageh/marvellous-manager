
import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Flag, User, MessageCircle, Paperclip, Circle, Clock, Eye, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import { Task, TaskStatus } from "@/types/taskTypes";
import { useTask } from "@/context/TaskContext";

interface TaskDetailDialogProps {
  task: Task;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const priorityColors = {
  low: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  urgent: 'bg-red-100 text-red-800',
};

const statusColors = {
  pending: 'bg-gray-100 text-gray-800',
  in_progress: 'bg-red-100 text-red-800',
  under_review: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
};

const statusIcons = {
  pending: { icon: Circle, color: 'text-gray-500' },
  in_progress: { icon: Clock, color: 'text-red-500' },
  under_review: { icon: Eye, color: 'text-blue-500' },
  completed: { icon: CheckCircle, color: 'text-green-500' },
};

export const TaskDetailDialog: React.FC<TaskDetailDialogProps> = ({ task, open, onOpenChange }) => {
  const { updateTask } = useTask();

  const handleStatusChange = async (newStatus: TaskStatus) => {
    await updateTask({ ...task, status: newStatus });
  };

  const formatDueDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, 'MMMM d, yyyy');
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Pending';
      case 'in_progress': return 'In Progress';
      case 'under_review': return 'Under Review';
      case 'completed': return 'Completed';
      default: return status;
    }
  };

  const currentStatusConfig = statusIcons[task.status];
  const StatusIcon = currentStatusConfig.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl">{task.title}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Status Section */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <StatusIcon className={`w-5 h-5 ${currentStatusConfig.color}`} />
              <span className="font-medium">Status:</span>
            </div>
            <Select value={task.status} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">
                  <div className="flex items-center gap-2">
                    <Circle className="w-4 h-4 text-gray-500" />
                    Pending
                  </div>
                </SelectItem>
                <SelectItem value="in_progress">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-red-500" />
                    In Progress
                  </div>
                </SelectItem>
                <SelectItem value="under_review">
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-blue-500" />
                    Under Review
                  </div>
                </SelectItem>
                <SelectItem value="completed">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Completed
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          {task.description && (
            <div>
              <h3 className="font-medium mb-2">Description</h3>
              <p className="text-sm text-muted-foreground bg-gray-50 p-3 rounded-lg">
                {task.description}
              </p>
            </div>
          )}

          {/* Task Details */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">Priority</h3>
                <Badge className={`${priorityColors[task.priority]}`}>
                  <Flag className="w-3 h-3 mr-1" />
                  {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                </Badge>
              </div>

              {task.due_date && (
                <div>
                  <h3 className="font-medium mb-2">Due Date</h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDueDate(task.due_date)}</span>
                  </div>
                </div>
              )}

              {task.project && (
                <div>
                  <h3 className="font-medium mb-2">Project</h3>
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: task.project.color }}
                    />
                    <span className="text-sm">{task.project.name}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4">
              {task.assignees && task.assignees.length > 0 && (
                <div>
                  <h3 className="font-medium mb-2">Assignees</h3>
                  <div className="space-y-2">
                    {task.assignees.map((assignee) => (
                      <div key={assignee.id} className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-medium">
                          {assignee.username.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm">{assignee.username}</span>
                        <Badge variant="outline" className="text-xs">
                          {assignee.role}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <h3 className="font-medium">Activity</h3>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <MessageCircle className="w-4 h-4" />
                    <span>0 comments</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Paperclip className="w-4 h-4" />
                    <span>0 attachments</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Subtasks */}
          {task.subtasks && task.subtasks.length > 0 && (
            <div>
              <h3 className="font-medium mb-2">Subtasks</h3>
              <div className="space-y-2">
                {task.subtasks.map((subtask) => (
                  <div key={subtask.id} className="flex items-center gap-2 text-sm">
                    <input 
                      type="checkbox" 
                      checked={subtask.completed}
                      className="w-4 h-4"
                      readOnly
                    />
                    <span className={subtask.completed ? 'line-through text-muted-foreground' : ''}>
                      {subtask.title}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Created Info */}
          <div className="pt-4 border-t text-xs text-muted-foreground">
            Created on {format(new Date(task.created_at), 'MMMM d, yyyy')}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
