
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useTask } from "@/context/TaskContext";
import { useMemo } from "react";

export const TaskUtilizationTable = () => {
  const { tasks, users, loading } = useTask();

  const utilizationData = useMemo(() => {
    return users.map(user => {
      const userTasks = tasks.filter(task => 
        task.assignees?.some(assignee => assignee.id === user.id)
      );

      const tasksByStatus = {
        pending: userTasks.filter(task => task.status === 'pending').length,
        in_progress: userTasks.filter(task => task.status === 'in_progress').length,
        under_review: userTasks.filter(task => task.status === 'under_review').length,
        completed: userTasks.filter(task => task.status === 'completed').length,
      };

      const totalTasks = userTasks.length;
      const activeTasks = tasksByStatus.pending + tasksByStatus.in_progress + tasksByStatus.under_review;
      const completionRate = totalTasks > 0 ? Math.round((tasksByStatus.completed / totalTasks) * 100) : 0;

      return {
        user,
        totalTasks,
        activeTasks,
        completionRate,
        tasksByStatus
      };
    });
  }, [tasks, users]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Task Utilization by User</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Task Utilization by User</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Total Tasks</TableHead>
              <TableHead>Active Tasks</TableHead>
              <TableHead>Pending</TableHead>
              <TableHead>In Progress</TableHead>
              <TableHead>Under Review</TableHead>
              <TableHead>Completed</TableHead>
              <TableHead>Completion Rate</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {utilizationData.map(({ user, totalTasks, activeTasks, completionRate, tasksByStatus }) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.username}</TableCell>
                <TableCell>
                  <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                    {user.role}
                  </Badge>
                </TableCell>
                <TableCell>{totalTasks}</TableCell>
                <TableCell>
                  <Badge variant={activeTasks > 5 ? 'destructive' : activeTasks > 2 ? 'outline' : 'secondary'}>
                    {activeTasks}
                  </Badge>
                </TableCell>
                <TableCell>{tasksByStatus.pending}</TableCell>
                <TableCell>{tasksByStatus.in_progress}</TableCell>
                <TableCell>{tasksByStatus.under_review}</TableCell>
                <TableCell>{tasksByStatus.completed}</TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <div className="w-16 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full" 
                        style={{ width: `${completionRate}%` }}
                      />
                    </div>
                    <span className="text-sm">{completionRate}%</span>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {utilizationData.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-muted-foreground">
                  No users found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
