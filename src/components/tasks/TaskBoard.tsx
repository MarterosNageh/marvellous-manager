
import React from 'react';
import { useTask } from '@/context/TaskContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, Calendar, User } from 'lucide-react';

export const TaskBoard = () => {
  const { tasks, projects } = useTask();

  const getTasksByStatus = (status: string) => {
    const statusMap: { [key: string]: string } = {
      "To Do": "pending",
      "In Progress": "in_progress", 
      "Done": "completed"
    };
    return tasks.filter(task => task.status === statusMap[status]);
  };

  const todoTasks = getTasksByStatus("To Do");
  const inProgressTasks = getTasksByStatus("In Progress");
  const completedTasks = getTasksByStatus("Done");

  const columns = [
    { title: "To Do", tasks: todoTasks, color: "bg-gray-100" },
    { title: "In Progress", tasks: inProgressTasks, color: "bg-blue-100" },
    { title: "Done", tasks: completedTasks, color: "bg-green-100" }
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Task Board</h2>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Task
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {columns.map((column) => (
          <Card key={column.title} className={column.color}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                {column.title}
                <Badge variant="secondary">{column.tasks.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {column.tasks.map((task) => (
                <Card key={task.id} className="bg-white dark:bg-gray-800">
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <h4 className="font-medium">{task.title}</h4>
                      {task.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                          {task.description}
                        </p>
                      )}
                      <div className="flex items-center justify-between">
                        <Badge variant={
                          task.priority === 'high' ? 'destructive' :
                          task.priority === 'medium' ? 'default' : 'secondary'
                        }>
                          {task.priority}
                        </Badge>
                        {task.due_date && (
                          <div className="flex items-center text-xs text-gray-500">
                            <Calendar className="mr-1 h-3 w-3" />
                            {new Date(task.due_date).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {column.tasks.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p>No tasks in {column.title.toLowerCase()}</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
