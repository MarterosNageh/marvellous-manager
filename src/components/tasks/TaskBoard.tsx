
import React from 'react';
import { useTask } from '@/context/TaskContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, Calendar, User } from 'lucide-react';
import { DraggableTaskBoard } from './DraggableTaskBoard';

export const TaskBoard = () => {
  const { tasks, projects } = useTask();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Task Board</h2>
      </div>

      <DraggableTaskBoard />
    </div>
  );
};
