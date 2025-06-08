import React, { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Calendar, Flag, MoreHorizontal, User, MessageCircle, Circle, Clock, Eye, CheckCircle } from "lucide-react";
import { Task } from "@/types/taskTypes";
import { useTask } from "@/context/TaskContext";
import { useAuth } from "@/context/AuthContext";
import { TaskDetailDialog } from "./TaskDetailDialog";

interface TaskCardProps {
  task: Task;
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
  pending: Circle,
  in_progress: Clock,
  under_review: Eye,
  completed: CheckCircle,
};

export const TaskCard: React.FC<TaskCardProps> = ({ task }) => {
  const { updateTask, deleteTask, currentUser } = useTask();
  const { canCompleteTask } = useAuth();
  const [detailOpen, setDetailOpen] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [newTitle, setNewTitle] = useState(task.title);

  const handleStatusChange = async (newStatus: 'pending' | 'in_progress' | 'under_review' | 'completed', event: React.MouseEvent) => {
    event.stopPropagation();
    await updateTask(task.id, { status: newStatus });
  };

  const handleDelete = async (event: React.MouseEvent) => {
    event.stopPropagation();
    if (window.confirm('Are you sure you want to delete this task?')) {
      setDetailOpen(false);
      await deleteTask(task.id);
    }
  };

  const handleRename = async (event: React.MouseEvent) => {
    event.stopPropagation();
    setIsRenaming(true);
  };

  const handleRenameSubmit = async (event: React.FormEvent) => {
    event.stopPropagation();
    event.preventDefault();
    if (newTitle.trim() && newTitle !== task.title) {
      await updateTask(task.id, { title: newTitle.trim() });
    }
    setIsRenaming(false);
  };

  const handleOpenTask = (event: React.MouseEvent) => {
    event.stopPropagation();
    setDetailOpen(true);
  };

  const formatDueDate = (dateString: string) => {
    const date = new Date(dateString);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[date.getMonth()]} ${date.getDate()}`;
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

  const StatusIcon = statusIcons[task.status];

  return (
    <>
      <Card className="w-full hover:shadow-md transition-all duration-200 cursor-pointer border hover:border-blue-300" onClick={() => setDetailOpen(true)}>
        <CardHeader className="pb-2 px-3 pt-3">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              {isRenaming ? (
                <form onSubmit={handleRenameSubmit} onClick={(e) => e.stopPropagation()}>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full text-sm font-medium border rounded px-2 py-1"
                    autoFocus
                    onBlur={() => {
                      handleRenameSubmit({ preventDefault: () => {}, stopPropagation: () => {} } as any);
                    }}
                  />
                </form>
              ) : (
                <>
                  <h3 className="font-medium text-sm line-clamp-1 text-gray-900">{task.title}</h3>
                  {task.description && (
                    <p className="text-xs text-gray-600 mt-1 line-clamp-1">
                      {task.description}
                    </p>
                  )}
                </>
              )}
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:bg-gray-100">
                  <MoreHorizontal className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleOpenTask}>
                  Open Task
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleRename}>
                  Rename
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => handleStatusChange('pending', e)}>
                  Move to Pending
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => handleStatusChange('in_progress', e)}>
                  Move to In Progress
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => handleStatusChange('under_review', e)}>
                  Move to Under Review
                </DropdownMenuItem>
                {canCompleteTask && (
                  <DropdownMenuItem onClick={(e) => handleStatusChange('completed', e)}>
                    Move to Completed
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={handleDelete} className="text-red-600 hover:text-red-700">
                  Delete Task
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        
        <CardContent className="pt-0 px-3 pb-2 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <StatusIcon className="w-3 h-3" />
              <Badge className={`text-xs px-2 py-0 border ${statusColors[task.status]}`}>
                {getStatusLabel(task.status)}
              </Badge>
            </div>
            
            <Badge className={`text-xs px-2 py-0 border ${priorityColors[task.priority]}`}>
              <Flag className="w-2 h-2 mr-1" />
              {task.priority}
            </Badge>
          </div>

          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              {task.due_date && (
                <div className="flex items-center gap-1 text-gray-700">
                  <Calendar className="w-3 h-3" />
                  <span>{formatDueDate(task.due_date)}</span>
                </div>
              )}

              {task.project && (
                <div className="flex items-center gap-1">
                  <div 
                    className="w-2 h-2 rounded-full" 
                    style={{ backgroundColor: task.project.color }}
                  />
                  <span className="text-gray-700 truncate max-w-16">{task.project.name}</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              {task.assignees && task.assignees.length > 0 && (
                <div className="flex items-center gap-1">
                  <User className="w-3 h-3 text-gray-700" />
                  <div className="flex -space-x-1">
                    {task.assignees.slice(0, 2).map((assignee, index) => (
                      <div
                        key={assignee.id}
                        className="w-4 h-4 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-medium border-2 border-white"
                        title={assignee.username}
                      >
                        {assignee.username.charAt(0).toUpperCase()}
                      </div>
                    ))}
                    {task.assignees.length > 2 && (
                      <div className="w-4 h-4 rounded-full bg-gray-500 flex items-center justify-center text-white text-xs font-medium border-2 border-white">
                        +{task.assignees.length - 2}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-1">
                <MessageCircle className="w-3 h-3 text-gray-700" />
                <span className="text-gray-700">0</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <TaskDetailDialog 
        task={task}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
    </>
  );
};
