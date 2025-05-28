
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Calendar, Flag, User, MessageCircle, Paperclip, Circle, Clock, Eye, CheckCircle, Save, X } from "lucide-react";
import { Task, TaskStatus } from "@/types/taskTypes";
import { useTask } from "@/context/TaskContext";

interface TaskDetailDialogProps {
  task: Task;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const priorityColors = {
  low: 'bg-green-100 text-green-800 border-green-200',
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  high: 'bg-orange-100 text-orange-800 border-orange-200',
  urgent: 'bg-red-100 text-red-800 border-red-200',
};

const statusColors = {
  pending: 'bg-gray-100 text-gray-800 border-gray-200',
  in_progress: 'bg-red-100 text-red-800 border-red-200',
  under_review: 'bg-blue-100 text-blue-800 border-blue-200',
  completed: 'bg-green-100 text-green-800 border-green-200',
};

const statusIcons = {
  pending: { icon: Circle, color: 'text-gray-600' },
  in_progress: { icon: Clock, color: 'text-red-600' },
  under_review: { icon: Eye, color: 'text-blue-600' },
  completed: { icon: CheckCircle, color: 'text-green-600' },
};

export const TaskDetailDialog: React.FC<TaskDetailDialogProps> = ({ task, open, onOpenChange }) => {
  const { updateTask, deleteTask, currentUser, tasks } = useTask();
  const [isEditing, setIsEditing] = useState(false);
  const [editedTask, setEditedTask] = useState(task);

  // Check if task still exists in the tasks array
  const taskExists = tasks.find(t => t.id === task.id);

  // Close dialog immediately if task doesn't exist (was deleted)
  useEffect(() => {
    if (open && !taskExists) {
      onOpenChange(false);
    }
  }, [taskExists, open, onOpenChange]);

  // Update editedTask when task prop changes
  useEffect(() => {
    setEditedTask(task);
  }, [task]);

  const handleStatusChange = async (newStatus: TaskStatus) => {
    await updateTask(task.id, { status: newStatus });
  };

  const handleSave = async () => {
    await updateTask(task.id, editedTask);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedTask(task);
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      // Close dialog immediately before deleting
      onOpenChange(false);
      await deleteTask(task.id);
    }
  };

  const formatDueDate = (dateString: string) => {
    const date = new Date(dateString);
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
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

  const formatCreatedDate = (dateString: string) => {
    const date = new Date(dateString);
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
  };

  const currentStatusConfig = statusIcons[task.status];
  const StatusIcon = currentStatusConfig.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between">
          {isEditing ? (
            <Input
              value={editedTask.title}
              onChange={(e) => setEditedTask({ ...editedTask, title: e.target.value })}
              className="text-xl font-bold border-none p-0 focus:ring-0 focus:border-0"
            />
          ) : (
            <DialogTitle className="text-xl font-bold text-gray-900">{task.title}</DialogTitle>
          )}
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <Button onClick={handleSave} size="sm" className="bg-green-600 hover:bg-green-700">
                  <Save className="w-4 h-4 mr-1" />
                  Save
                </Button>
                <Button onClick={handleCancel} size="sm" variant="outline">
                  <X className="w-4 h-4 mr-1" />
                  Cancel
                </Button>
              </>
            ) : (
              <>
                <Button onClick={() => setIsEditing(true)} size="sm" variant="outline">
                  Edit Task
                </Button>
                <Button onClick={handleDelete} size="sm" variant="outline" className="text-red-600 hover:text-red-700">
                  Delete
                </Button>
              </>
            )}
          </div>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Status Section */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <StatusIcon className={`w-5 h-5 ${currentStatusConfig.color}`} />
              <span className="font-semibold text-gray-700">Status:</span>
            </div>
            <Select value={task.status} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-48 border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">
                  <div className="flex items-center gap-2">
                    <Circle className="w-4 h-4 text-gray-600" />
                    Pending
                  </div>
                </SelectItem>
                <SelectItem value="in_progress">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-red-600" />
                    In Progress
                  </div>
                </SelectItem>
                <SelectItem value="under_review">
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-blue-600" />
                    Under Review
                  </div>
                </SelectItem>
                {currentUser?.isAdmin && (
                  <SelectItem value="completed">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      Completed
                    </div>
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div>
            <Label className="font-semibold mb-2 text-gray-700">Description</Label>
            {isEditing ? (
              <Textarea
                value={editedTask.description || ''}
                onChange={(e) => setEditedTask({ ...editedTask, description: e.target.value })}
                className="mt-2"
                rows={4}
                placeholder="Add task description..."
              />
            ) : (
              <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border mt-2">
                {task.description || 'No description provided'}
              </div>
            )}
          </div>

          {/* Supervisor Comments */}
          <div>
            <Label className="font-semibold mb-2 text-gray-700">Supervisor Comments</Label>
            {isEditing ? (
              <Textarea
                value={editedTask.supervisor_comments || ''}
                onChange={(e) => setEditedTask({ ...editedTask, supervisor_comments: e.target.value })}
                className="mt-2"
                rows={3}
                placeholder="Add supervisor comments..."
              />
            ) : (
              <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg border mt-2">
                {task.supervisor_comments || 'No supervisor comments'}
              </div>
            )}
          </div>

          {/* Task Details */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2 text-gray-700">Priority</h3>
                <Badge className={`border ${priorityColors[task.priority]}`}>
                  <Flag className="w-3 h-3 mr-1" />
                  {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                </Badge>
              </div>

              {task.due_date && (
                <div>
                  <h3 className="font-semibold mb-2 text-gray-700">Due Date</h3>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDueDate(task.due_date)}</span>
                  </div>
                </div>
              )}

              {task.project && (
                <div>
                  <h3 className="font-semibold mb-2 text-gray-700">Project</h3>
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: task.project.color }}
                    />
                    <span className="text-sm font-medium text-gray-600">{task.project.name}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4">
              {task.assignees && task.assignees.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2 text-gray-700">Assignees</h3>
                  <div className="space-y-2">
                    {task.assignees.map((assignee) => (
                      <div key={assignee.id} className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-medium">
                          {assignee.username.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm font-medium text-gray-600">{assignee.username}</span>
                        <Badge variant="outline" className="text-xs border-gray-300">
                          {assignee.role}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <h3 className="font-semibold text-gray-700">Activity</h3>
                <div className="flex items-center gap-4 text-sm text-gray-600">
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
              <h3 className="font-semibold mb-2 text-gray-700">Subtasks</h3>
              <div className="space-y-2">
                {task.subtasks.map((subtask) => (
                  <div key={subtask.id} className="flex items-center gap-2 text-sm">
                    <input 
                      type="checkbox" 
                      checked={subtask.completed}
                      className="w-4 h-4"
                      readOnly
                    />
                    <span className={subtask.completed ? 'line-through text-gray-500' : 'text-gray-600'}>
                      {subtask.title}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Created Info */}
          <div className="pt-4 border-t text-xs text-gray-500">
            Created on {formatCreatedDate(task.created_at)}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
