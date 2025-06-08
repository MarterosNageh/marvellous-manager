import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { Button } from '@/components/ui/button';

const TaskList = () => {
  const { canCompleteTask } = useAuth();
  const [tasks, setTasks] = useState([]);

  const handleCompleteTask = async (taskId: string) => {
    if (!canCompleteTask) {
      toast.error("You don't have permission to complete tasks");
      return;
    }
    // ... existing task completion logic ...
  };

  useEffect(() => {
    // Fetch tasks from the backend
    // This is a placeholder and should be replaced with actual data fetching logic
    setTasks([
      { id: '1', title: 'Task 1' },
      { id: '2', title: 'Task 2' },
      { id: '3', title: 'Task 3' },
    ]);
  }, []);

  return (
    <div>
      {tasks.map((task) => (
        <div key={task.id}>
          {/* ... other task details ... */}
          {canCompleteTask && (
            <Button onClick={() => handleCompleteTask(task.id)}>
              Complete Task
            </Button>
          )}
        </div>
      ))}
    </div>
  );
};

export default TaskList; 