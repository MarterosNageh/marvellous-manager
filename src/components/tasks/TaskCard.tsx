
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Calendar, User, Trash2, Edit } from "lucide-react";
import { ClickUpTask } from "@/services/clickupService";
import { format } from "date-fns";

interface TaskCardProps {
  task: ClickUpTask;
  onEdit: (task: ClickUpTask) => void;
  onDelete: (taskId: string) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, onEdit, onDelete }) => {
  const getPriorityColor = (priority?: string) => {
    switch (priority?.toLowerCase()) {
      case 'urgent':
        return 'bg-red-500';
      case 'high':
        return 'bg-orange-500';
      case 'normal':
        return 'bg-yellow-500';
      case 'low':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg font-semibold line-clamp-2">
            {task.name}
          </CardTitle>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(task)}
              className="h-8 w-8"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(task.id)}
              className="h-8 w-8 text-red-500 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {task.description && (
          <p className="text-sm text-gray-600 line-clamp-3">
            {task.description}
          </p>
        )}
        
        <div className="flex flex-wrap gap-2">
          <Badge 
            variant="secondary"
            style={{ backgroundColor: task.status?.color || '#gray' }}
            className="text-white"
          >
            {task.status?.status || 'No Status'}
          </Badge>
          
          {task.priority && (
            <Badge 
              variant="secondary"
              className={`text-white ${getPriorityColor(task.priority.priority)}`}
            >
              {task.priority.priority}
            </Badge>
          )}
        </div>

        {task.assignees && task.assignees.length > 0 && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <User className="h-4 w-4" />
            <span>{task.assignees.map(a => a.username).join(', ')}</span>
          </div>
        )}

        {task.due_date && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="h-4 w-4" />
            <span>Due: {format(new Date(parseInt(task.due_date)), 'MMM dd, yyyy')}</span>
          </div>
        )}

        <div className="flex justify-between items-center pt-2">
          <span className="text-xs text-gray-500">
            Created: {format(new Date(parseInt(task.date_created)), 'MMM dd, yyyy')}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(task.url, '_blank')}
            className="gap-1"
          >
            <ExternalLink className="h-3 w-3" />
            View in ClickUp
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
