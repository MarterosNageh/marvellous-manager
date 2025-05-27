
import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Calendar, Flag, MoreHorizontal, User, MessageCircle, Paperclip } from "lucide-react";
import { format as formatDate } from "date-fns";
import { Task } from "@/types/taskTypes";
import { useTask } from "@/context/TaskContext";

interface TaskCardProps {
  task: Task;
}

const priorityColors = {
  low: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  urgent: 'bg-red-100 text-red-800',
};

const statusColors = {
  pending: 'bg-gray-100 text-gray-800',
  in_progress: 'bg-blue-100 text-blue-800',
  under_review: 'bg-purple-100 text-purple-800',
  completed: 'bg-green-100 text-green-800',
};

export const TaskCard: React.FC<TaskCardProps> = ({ task }) => {
  const { updateTask, deleteTask } = useTask();

  const handleStatusChange = async (newStatus: 'pending' | 'in_progress' | 'under_review' | 'completed') => {
    await updateTask({ ...task, status: newStatus });
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      await deleteTask(task.id);
    }
  };

  const formatDueDate = (dateString: string) => {
    const date = new Date(dateString);
    return formatDate(date, 'MMM d, yyyy');
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

  return (
    <Card className="w-full hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="font-semibold text-sm line-clamp-2">{task.title}</h3>
            {task.description && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {task.description}
              </p>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleStatusChange('pending')}>
                Move to Pending
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleStatusChange('in_progress')}>
                Move to In Progress
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleStatusChange('under_review')}>
                Move to Under Review
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleStatusChange('completed')}>
                Move to Completed
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDelete} className="text-red-600">
                Delete Task
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0 space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge className={`text-xs ${priorityColors[task.priority]}`}>
            <Flag className="w-3 h-3 mr-1" />
            {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
          </Badge>
          
          <Badge className={`text-xs ${statusColors[task.status]}`}>
            {getStatusLabel(task.status)}
          </Badge>
        </div>

        {task.due_date && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="w-3 h-3" />
            <span>Due {formatDueDate(task.due_date)}</span>
          </div>
        )}

        {task.project && (
          <div className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: task.project.color }}
            />
            <span className="text-xs text-muted-foreground">{task.project.name}</span>
          </div>
        )}

        {task.assignees && task.assignees.length > 0 && (
          <div className="flex items-center gap-1">
            <User className="w-3 h-3 text-muted-foreground" />
            <div className="flex -space-x-1">
              {task.assignees.slice(0, 3).map((assignee, index) => (
                <div
                  key={assignee.id}
                  className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-medium border-2 border-white"
                  title={assignee.username}
                >
                  {assignee.username.charAt(0).toUpperCase()}
                </div>
              ))}
              {task.assignees.length > 3 && (
                <div className="w-6 h-6 rounded-full bg-gray-400 flex items-center justify-center text-white text-xs font-medium border-2 border-white">
                  +{task.assignees.length - 3}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-3">
            {task.subtasks && task.subtasks.length > 0 && (
              <span>{task.subtasks.filter(st => st.completed).length}/{task.subtasks.length} subtasks</span>
            )}
            <div className="flex items-center gap-1">
              <MessageCircle className="w-3 h-3" />
              <span>0</span>
            </div>
            <div className="flex items-center gap-1">
              <Paperclip className="w-3 h-3" />
              <span>0</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
