
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Calendar, User, Trash2, Edit, Clock, Flag } from "lucide-react";
import { ClickUpTask } from "@/services/clickupService";

interface TaskCardProps {
  task: ClickUpTask;
  onEdit: (task: ClickUpTask) => void;
  onDelete: (taskId: string) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, onEdit, onDelete }) => {
  const getPriorityColor = (priority?: string) => {
    switch (priority?.toLowerCase()) {
      case 'urgent':
        return 'bg-red-500 hover:bg-red-600';
      case 'high':
        return 'bg-orange-500 hover:bg-orange-600';
      case 'normal':
        return 'bg-yellow-500 hover:bg-yellow-600';
      case 'low':
        return 'bg-green-500 hover:bg-green-600';
      default:
        return 'bg-gray-500 hover:bg-gray-600';
    }
  };

  const formatDate = (timestamp: string) => {
    try {
      const date = new Date(parseInt(timestamp));
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      });
    } catch {
      return 'Invalid date';
    }
  };

  return (
    <Card className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-blue-500 bg-white">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-base font-medium text-gray-900 line-clamp-2 mb-2">
              {task.name}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge 
                variant="secondary"
                className="text-xs px-2 py-1 rounded-full"
                style={{ 
                  backgroundColor: task.status?.color || '#e5e7eb',
                  color: '#fff'
                }}
              >
                {task.status?.status || 'No Status'}
              </Badge>
              
              {task.priority && (
                <Badge 
                  variant="secondary"
                  className={`text-xs px-2 py-1 rounded-full text-white ${getPriorityColor(task.priority.priority)}`}
                >
                  <Flag className="h-3 w-3 mr-1" />
                  {task.priority.priority}
                </Badge>
              )}
            </div>
          </div>
          <div className="flex gap-1 ml-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(task)}
              className="h-7 w-7 text-gray-500 hover:text-gray-700"
            >
              <Edit className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(task.id)}
              className="h-7 w-7 text-gray-500 hover:text-red-600"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        {task.description && (
          <p className="text-sm text-gray-600 line-clamp-2">
            {task.description}
          </p>
        )}

        <div className="flex flex-col gap-2 text-xs text-gray-500">
          {task.assignees && task.assignees.length > 0 && (
            <div className="flex items-center gap-2">
              <User className="h-3 w-3" />
              <span>{task.assignees.map(a => a.username).join(', ')}</span>
            </div>
          )}

          {task.due_date && (
            <div className="flex items-center gap-2">
              <Calendar className="h-3 w-3" />
              <span>Due: {formatDate(task.due_date)}</span>
            </div>
          )}

          <div className="flex items-center gap-2">
            <Clock className="h-3 w-3" />
            <span>Created: {formatDate(task.date_created)}</span>
          </div>
        </div>

        <div className="flex justify-end pt-2 border-t">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.open(task.url, '_blank')}
            className="text-xs text-blue-600 hover:text-blue-800"
          >
            <ExternalLink className="h-3 w-3 mr-1" />
            Open in ClickUp
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
