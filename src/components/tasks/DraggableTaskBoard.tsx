
import { useState } from "react";
import { useTask } from "@/context/TaskContext";
import { TaskCard } from "@/components/tasks/TaskCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TaskStatus } from "@/types/taskTypes";

const statusColumns: { status: TaskStatus; title: string; color: string }[] = [
  { status: 'pending', title: 'Pending', color: 'bg-gray-100' },
  { status: 'in_progress', title: 'In Progress', color: 'bg-blue-100' },
  { status: 'under_review', title: 'Under Review', color: 'bg-purple-100' },
  { status: 'completed', title: 'Completed', color: 'bg-green-100' },
];

export const DraggableTaskBoard = () => {
  const { tasks, updateTask, loading, currentUser } = useTask();
  const [draggedTask, setDraggedTask] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggedTask(taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, newStatus: TaskStatus) => {
    e.preventDefault();
    
    if (!draggedTask) return;
    
    const task = tasks.find(t => t.id === draggedTask);
    if (!task || task.status === newStatus) {
      setDraggedTask(null);
      return;
    }

    // Check if trying to move to completed and user is not admin
    if (newStatus === 'completed' && currentUser && !currentUser.isAdmin) {
      setDraggedTask(null);
      return;
    }

    try {
      await updateTask(draggedTask, { ...task, status: newStatus });
    } catch (error) {
      console.error('Error updating task status:', error);
    } finally {
      setDraggedTask(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading tasks...</div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statusColumns.map((column) => {
        const columnTasks = tasks.filter(task => task.status === column.status);
        
        return (
          <Card 
            key={column.status} 
            className={`h-fit transition-all ${draggedTask ? 'border-dashed border-2 border-blue-300' : ''}`}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, column.status)}
          >
            <CardHeader className={`${column.color} rounded-t-lg`}>
              <CardTitle className="flex items-center justify-between text-sm font-medium">
                {column.title}
                <Badge variant="secondary" className="ml-2">
                  {columnTasks.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3 min-h-[200px]">
              {columnTasks.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  No tasks in {column.title.toLowerCase()}
                </div>
              ) : (
                columnTasks.map((task) => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, task.id)}
                    className="cursor-move"
                  >
                    <TaskCard task={task} />
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
