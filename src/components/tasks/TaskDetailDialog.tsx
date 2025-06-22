import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Flag, User, MessageCircle, Paperclip, Circle, Clock, Eye, CheckCircle, Save, X, Check, ChevronsUpDown, AtSign } from "lucide-react";
import { Task, TaskStatus } from "@/types/taskTypes";
import { useTask } from "@/context/TaskContext";
import { useAuth } from "@/context/AuthContext";
import { TaskChat } from "./TaskChat";

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
  const { updateTask, deleteTask, currentUser, tasks, users, assignTask } = useTask();
  const { canCompleteTask } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editedTask, setEditedTask] = useState(task);
  const [assigneeIds, setAssigneeIds] = useState<string[]>([]);
  const [assigneeDropdownOpen, setAssigneeDropdownOpen] = useState(false);

  // Filter out producers from assignee list
  const assignableUsers = users.filter(user => user.role !== 'producer');

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
    setAssigneeIds(task.assignees.map(a => a.id));
  }, [task]);

  const handleStatusChange = async (newStatus: TaskStatus) => {
    await updateTask(task.id, { status: newStatus });
  };

  const handleSave = async () => {
    await updateTask(task.id, editedTask);
    
    // Update assignees if they changed
    const currentAssigneeIds = task.assignees.map(a => a.id);
    if (JSON.stringify(assigneeIds.sort()) !== JSON.stringify(currentAssigneeIds.sort())) {
      await assignTask(task.id, assigneeIds);
    }
    
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedTask(task);
    setAssigneeIds(task.assignees.map(a => a.id));
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      // Close dialog immediately before deleting
      onOpenChange(false);
      await deleteTask(task.id);
    }
  };

  const handleAssigneeToggle = (userId: string) => {
    setAssigneeIds(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const removeAssignee = (userId: string) => {
    setAssigneeIds(prev => prev.filter(id => id !== userId));
  };

  const getSelectedAssignees = () => {
    return users.filter(user => assigneeIds.includes(user.id));
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
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
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
        
        <Tabs defaultValue="details" className="w-full h-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="details" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Details
            </TabsTrigger>
            <TabsTrigger value="chat" className="flex items-center gap-2">
              <AtSign className="h-4 w-4" />
              Chat
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="details" className="mt-6 space-y-6 overflow-y-auto max-h-[70vh]">
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
                  {canCompleteTask && (
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
                {isEditing ? (
                  <div>
                    <h3 className="font-semibold mb-2 text-gray-700">Assignees</h3>
                    <Popover open={assigneeDropdownOpen} onOpenChange={setAssigneeDropdownOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={assigneeDropdownOpen}
                          className="w-full justify-between"
                        >
                          <span className="truncate">
                            {assigneeIds.length === 0
                              ? "Select assignees..."
                              : `${assigneeIds.length} assignee${assigneeIds.length > 1 ? 's' : ''} selected`}
                          </span>
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Search users..." />
                          <CommandList>
                            <CommandEmpty>No users found.</CommandEmpty>
                            <CommandGroup>
                              {assignableUsers.map((user) => (
                                <CommandItem
                                  key={user.id}
                                  onSelect={() => handleAssigneeToggle(user.id)}
                                  className="flex items-center space-x-2"
                                >
                                  <Checkbox
                                    checked={assigneeIds.includes(user.id)}
                                    onChange={() => handleAssigneeToggle(user.id)}
                                  />
                                  <div className="flex items-center space-x-2">
                                    <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-medium">
                                      {user.username.charAt(0).toUpperCase()}
                                    </div>
                                    <span className="text-sm">{user.username}</span>
                                    {user.isAdmin && (
                                      <Badge variant="outline" className="text-xs">
                                        Admin
                                      </Badge>
                                    )}
                                  </div>
                                  {assigneeIds.includes(user.id) && (
                                    <Check className="ml-auto h-4 w-4" />
                                  )}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>

                    {/* Selected Assignees Display */}
                    {getSelectedAssignees().length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {getSelectedAssignees().map((user) => (
                          <Badge key={user.id} variant="secondary" className="flex items-center gap-1">
                            <div className="w-4 h-4 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs">
                              {user.username.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-xs">{user.username}</span>
                            <button
                              type="button"
                              onClick={() => removeAssignee(user.id)}
                              className="ml-1 hover:bg-gray-200 rounded-full p-0.5"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <h3 className="font-semibold mb-2 text-gray-700">Assignees</h3>
                    {task.assignees && task.assignees.length > 0 ? (
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
                    ) : (
                      <div className="text-sm text-gray-500 italic">No assignees</div>
                    )}
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
          </TabsContent>
          
          <TabsContent value="chat" className="mt-6 h-[60vh] sm:h-[70vh] flex flex-col">
            {currentUser && (
              <div className="flex-1 min-h-0">
                <TaskChat 
                  taskId={task.id}
                  users={users}
                  currentUser={currentUser}
                />
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
