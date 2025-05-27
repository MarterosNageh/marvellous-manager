import React, { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, RefreshCw, FolderOpen, List, AlertCircle, CheckCircle2 } from "lucide-react";
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
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'error'>('checking');
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
      setConnectionStatus('checking');
      console.log('Attempting to load ClickUp spaces...');
      
      const fetchedSpaces = await clickupService.getSpaces();
      console.log('Fetched spaces:', fetchedSpaces);
      
      setSpaces(fetchedSpaces);
      setConnectionStatus('connected');
      
      if (fetchedSpaces.length > 0) {
        setSelectedSpace(fetchedSpaces[0].id);
      }
      
      toast({
        title: "Connected to ClickUp",
        description: `Found ${fetchedSpaces.length} workspace(s)`,
      });
    } catch (error) {
      console.error('Error loading spaces:', error);
      setConnectionStatus('error');
      toast({
        title: "Connection Error",
        description: "Failed to connect to ClickUp. Please check your API configuration.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadLists = async (spaceId: string) => {
    try {
      setLoading(true);
      console.log('Loading lists for space:', spaceId);
      
      const fetchedLists = await clickupService.getLists(spaceId);
      console.log('Fetched lists:', fetchedLists);
      
      setLists(fetchedLists);
      
      if (fetchedLists.length > 0) {
        setSelectedList(fetchedLists[0].id);
      }
    } catch (error) {
      console.error('Error loading lists:', error);
      toast({
        title: "Error",
        description: "Failed to load lists from the selected workspace.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadTasks = async (listId: string) => {
    try {
      setLoading(true);
      console.log('Loading tasks for list:', listId);
      
      const fetchedTasks = await clickupService.getTasks(listId);
      console.log('Fetched tasks:', fetchedTasks);
      
      setTasks(fetchedTasks);
    } catch (error) {
      console.error('Error loading tasks:', error);
      toast({
        title: "Error",
        description: "Failed to load tasks from the selected list.",
        variant: "destructive",
      });
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
      <div className="flex flex-col gap-6 bg-gray-50 min-h-screen">
        {/* Header */}
        <div className="bg-white shadow-sm border-b p-6">
          <div className="flex justify-between items-center max-w-7xl mx-auto">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
              <div className="flex items-center gap-2 mt-2">
                {connectionStatus === 'connected' && (
                  <div className="flex items-center gap-1 text-green-600 text-sm">
                    <CheckCircle2 className="h-4 w-4" />
                    Connected to ClickUp
                  </div>
                )}
                {connectionStatus === 'error' && (
                  <div className="flex items-center gap-1 text-red-600 text-sm">
                    <AlertCircle className="h-4 w-4" />
                    Connection Error
                  </div>
                )}
                {connectionStatus === 'checking' && (
                  <div className="flex items-center gap-1 text-gray-600 text-sm">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Connecting...
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => selectedList && loadTasks(selectedList)}
                disabled={loading || !selectedList}
                className="border-gray-300"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button
                onClick={() => setCreateDialogOpen(true)}
                disabled={!selectedList}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Task
              </Button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto w-full px-6">
          {/* Workspace Selection */}
          <Card className="bg-white shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg text-gray-900">
                <FolderOpen className="h-5 w-5 text-purple-600" />
                Workspace
              </CardTitle>
              <CardDescription className="text-gray-600">
                Select your ClickUp workspace and list to manage tasks
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Workspace</label>
                  <Select value={selectedSpace} onValueChange={setSelectedSpace}>
                    <SelectTrigger className="border-gray-300 focus:border-purple-500 focus:ring-purple-500">
                      <SelectValue placeholder="Select a workspace" />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
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
                  <label className="text-sm font-medium text-gray-700">List</label>
                  <Select value={selectedList} onValueChange={setSelectedList}>
                    <SelectTrigger className="border-gray-300 focus:border-purple-500 focus:ring-purple-500">
                      <SelectValue placeholder="Select a list" />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      {lists.map((list) => (
                        <SelectItem key={list.id} value={list.id}>
                          <div className="flex items-center gap-2">
                            <List className="h-4 w-4" />
                            {list.name}
                            <Badge variant="secondary" className="ml-auto bg-gray-100 text-gray-700">
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
                <div className="flex items-center gap-4 pt-3 border-t border-gray-200">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span>Active:</span>
                    <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                      {selectedSpaceData.name}
                    </Badge>
                    <span>→</span>
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      {selectedListData.name}
                    </Badge>
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
                  className="pl-10 border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                />
              </div>
              <div className="flex gap-4 text-sm text-gray-600">
                <span>Total: <span className="font-medium">{tasks.length}</span></span>
                <span>Filtered: <span className="font-medium">{filteredTasks.length}</span></span>
              </div>
            </div>
          )}

          {/* Tasks Grid */}
          {loading ? (
            <div className="flex justify-center items-center py-16">
              <div className="text-center">
                <RefreshCw className="h-8 w-8 animate-spin text-purple-600 mx-auto mb-4" />
                <p className="text-gray-600">Loading tasks...</p>
              </div>
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
              <Card className="bg-white">
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <List className="h-16 w-16 text-gray-300 mb-4" />
                  <h3 className="text-xl font-medium text-gray-900 mb-2">
                    {searchTerm ? 'No tasks found' : 'No tasks yet'}
                  </h3>
                  <p className="text-gray-500 text-center mb-6 max-w-md">
                    {searchTerm 
                      ? 'Try adjusting your search terms to find what you\'re looking for'
                      : 'Get started by creating your first task in this list'
                    }
                  </p>
                  {!searchTerm && (
                    <Button 
                      onClick={() => setCreateDialogOpen(true)}
                      className="bg-purple-600 hover:bg-purple-700 text-white"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create First Task
                    </Button>
                  )}
                </CardContent>
              </Card>
            )
          ) : (
            <Card className="bg-white">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <FolderOpen className="h-16 w-16 text-gray-300 mb-4" />
                <h3 className="text-xl font-medium text-gray-900 mb-2">Select a workspace</h3>
                <p className="text-gray-500 text-center max-w-md">
                  Choose a ClickUp workspace and list above to view and manage your tasks
                </p>
              </CardContent>
            </Card>
          )}
        </div>

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
