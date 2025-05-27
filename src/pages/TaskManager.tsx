
import React, { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, RefreshCw, FolderOpen, List } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { TaskCard } from "@/components/tasks/TaskCard";
import { CreateTaskDialog } from "@/components/tasks/CreateTaskDialog";
import { 
  clickupService, 
  ClickUpTask, 
  ClickUpList, 
  ClickUpSpace 
} from "@/services/clickupService";

const TaskManager = () => {
  const [spaces, setSpaces] = useState<ClickUpSpace[]>([]);
  const [lists, setLists] = useState<ClickUpList[]>([]);
  const [tasks, setTasks] = useState<ClickUpTask[]>([]);
  const [selectedSpace, setSelectedSpace] = useState<string>('');
  const [selectedList, setSelectedList] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<ClickUpTask | null>(null);
  const { toast } = useToast();

  // Load spaces on component mount
  useEffect(() => {
    loadSpaces();
  }, []);

  // Load lists when space changes
  useEffect(() => {
    if (selectedSpace) {
      loadLists(selectedSpace);
    } else {
      setLists([]);
      setSelectedList('');
    }
  }, [selectedSpace]);

  // Load tasks when list changes
  useEffect(() => {
    if (selectedList) {
      loadTasks(selectedList);
    } else {
      setTasks([]);
    }
  }, [selectedList]);

  const loadSpaces = async () => {
    try {
      setLoading(true);
      const fetchedSpaces = await clickupService.getSpaces();
      setSpaces(fetchedSpaces);
      
      if (fetchedSpaces.length > 0) {
        setSelectedSpace(fetchedSpaces[0].id);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load ClickUp spaces. Please check your API configuration.",
        variant: "destructive",
      });
      console.error('Error loading spaces:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadLists = async (spaceId: string) => {
    try {
      setLoading(true);
      const fetchedLists = await clickupService.getLists(spaceId);
      setLists(fetchedLists);
      
      if (fetchedLists.length > 0) {
        setSelectedList(fetchedLists[0].id);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load lists from the selected space.",
        variant: "destructive",
      });
      console.error('Error loading lists:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTasks = async (listId: string) => {
    try {
      setLoading(true);
      const fetchedTasks = await clickupService.getTasks(listId);
      setTasks(fetchedTasks);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load tasks from the selected list.",
        variant: "destructive",
      });
      console.error('Error loading tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (taskData: {
    name: string;
    description?: string;
    priority?: number;
    due_date?: number;
  }) => {
    if (!selectedList) {
      toast({
        title: "Error",
        description: "Please select a list first.",
        variant: "destructive",
      });
      return;
    }

    try {
      await clickupService.createTask(selectedList, taskData);
      toast({
        title: "Success",
        description: "Task created successfully!",
      });
      setCreateDialogOpen(false);
      loadTasks(selectedList); // Refresh tasks
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create task.",
        variant: "destructive",
      });
      console.error('Error creating task:', error);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;

    try {
      await clickupService.deleteTask(taskId);
      toast({
        title: "Success",
        description: "Task deleted successfully!",
      });
      setTasks(tasks.filter(task => task.id !== taskId));
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete task.",
        variant: "destructive",
      });
      console.error('Error deleting task:', error);
    }
  };

  const handleEditTask = (task: ClickUpTask) => {
    setEditingTask(task);
    // You can implement an edit dialog similar to create dialog
    toast({
      title: "Edit Feature",
      description: "Edit functionality coming soon. For now, please use ClickUp directly.",
    });
  };

  const filteredTasks = tasks.filter(task =>
    task.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    task.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedSpaceData = spaces.find(space => space.id === selectedSpace);
  const selectedListData = lists.find(list => list.id === selectedList);

  return (
    <MainLayout>
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Task Manager</h1>
            <p className="text-gray-600 mt-1">Manage your ClickUp tasks</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => selectedList && loadTasks(selectedList)}
              disabled={loading || !selectedList}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button
              onClick={() => setCreateDialogOpen(true)}
              disabled={!selectedList}
            >
              <Plus className="h-4 w-4 mr-2" />
              New Task
            </Button>
          </div>
        </div>

        {/* Filters and Controls */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderOpen className="h-5 w-5" />
              Workspace Selection
            </CardTitle>
            <CardDescription>
              Select your ClickUp space and list to manage tasks
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Space</label>
                <Select value={selectedSpace} onValueChange={setSelectedSpace}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a space" />
                  </SelectTrigger>
                  <SelectContent>
                    {spaces.map((space) => (
                      <SelectItem key={space.id} value={space.id}>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: space.color }}
                          />
                          {space.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">List</label>
                <Select value={selectedList} onValueChange={setSelectedList}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a list" />
                  </SelectTrigger>
                  <SelectContent>
                    {lists.map((list) => (
                      <SelectItem key={list.id} value={list.id}>
                        <div className="flex items-center gap-2">
                          <List className="h-4 w-4" />
                          {list.name}
                          <Badge variant="secondary" className="ml-auto">
                            {list.task_count}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {selectedSpaceData && selectedListData && (
              <div className="flex items-center gap-4 pt-2 border-t">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span>Selected:</span>
                  <Badge variant="outline">{selectedSpaceData.name}</Badge>
                  <span>→</span>
                  <Badge variant="outline">{selectedListData.name}</Badge>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Search and Stats */}
        {selectedList && (
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search tasks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-4 text-sm text-gray-600">
              <span>Total: {tasks.length}</span>
              <span>Filtered: {filteredTasks.length}</span>
            </div>
          </div>
        )}

        {/* Tasks Grid */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : selectedList ? (
          filteredTasks.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onEdit={handleEditTask}
                  onDelete={handleDeleteTask}
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <List className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  {searchTerm ? 'No tasks found' : 'No tasks yet'}
                </h3>
                <p className="text-gray-600 text-center mb-4">
                  {searchTerm 
                    ? 'Try adjusting your search terms'
                    : 'Create your first task to get started'
                  }
                </p>
                {!searchTerm && (
                  <Button onClick={() => setCreateDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Task
                  </Button>
                )}
              </CardContent>
            </Card>
          )
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FolderOpen className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Select a workspace</h3>
              <p className="text-gray-600 text-center">
                Choose a ClickUp space and list to view and manage your tasks
              </p>
            </CardContent>
          </Card>
        )}

        {/* Create Task Dialog */}
        <CreateTaskDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          onSubmit={handleCreateTask}
          loading={loading}
        />
      </div>
    </MainLayout>
  );
};

export default TaskManager;
