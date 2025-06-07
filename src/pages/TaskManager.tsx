import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { TaskProvider } from "@/context/TaskContext";
import { TaskBoard } from "@/components/tasks/TaskBoard";
import { TaskList } from "@/components/tasks/TaskList";
import { CreateTaskDialog } from "@/components/tasks/CreateTaskDialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, List, Kanban } from "lucide-react";
import { NotificationExample } from '@/components/NotificationExample';

const TaskManager = () => {
  return (
    <TaskProvider>
      <MainLayout>
        <NotificationExample />
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold tracking-tight">Task Manager</h1>
            <div className="flex gap-2">
              <CreateTaskDialog>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  New Task
                </Button>
              </CreateTaskDialog>
            </div>
          </div>

          <Tabs defaultValue="board" className="w-full">
            <TabsList>
              <TabsTrigger value="board" className="flex items-center gap-2">
                <Kanban className="h-4 w-4" />
                Board
              </TabsTrigger>
              <TabsTrigger value="list" className="flex items-center gap-2">
                <List className="h-4 w-4" />
                List
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="board" className="mt-6">
              <TaskBoard />
            </TabsContent>
            
            <TabsContent value="list" className="mt-6">
              <TaskList />
            </TabsContent>
          </Tabs>
        </div>
      </MainLayout>
    </TaskProvider>
  );
};

export default TaskManager;
