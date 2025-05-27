
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

export const TaskBoard = () => {
  const { tasks, loading } = useTask();

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
          <Card key={column.status} className="h-fit">
            <CardHeader className={`${column.color} rounded-t-lg`}>
              <CardTitle className="flex items-center justify-between text-sm font-medium">
                {column.title}
                <Badge variant="secondary" className="ml-2">
                  {columnTasks.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {columnTasks.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  No tasks in {column.title.toLowerCase()}
                </div>
              ) : (
                columnTasks.map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
