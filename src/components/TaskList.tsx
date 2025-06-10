
import React from 'react';
import { useAuth } from '@/context/AuthContext';

const TaskList: React.FC = () => {
  const { currentUser } = useAuth();

  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-4">Task List</h2>
      {currentUser ? (
        <p>Welcome, {currentUser.username}!</p>
      ) : (
        <p>Please log in to view tasks.</p>
      )}
    </div>
  );
};

export default TaskList;
