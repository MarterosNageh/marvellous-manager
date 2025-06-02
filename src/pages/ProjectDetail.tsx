
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ArrowLeft, Edit, Trash2, Users, Clock, CheckCircle, AlertTriangle, HardDrive, Printer } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { format } from 'date-fns';
import { toast } from 'sonner';

const ProjectDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  // Fetch project data
  const { data: project, isLoading: projectLoading } = useQuery({
    queryKey: ['project', id],
    queryFn: async () => {
      if (!id) throw new Error('Project ID is required');
      
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!id
  });

  // Fetch associated hard drives
  const { data: hardDrives = [], isLoading: hardDrivesLoading } = useQuery({
    queryKey: ['project-hard-drives', id],
    queryFn: async () => {
      if (!id) return [];
      
      const { data, error } = await supabase
        .from('hard_drives')
        .select('*')
        .eq('project_id', id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!id
  });

  // Fetch project tasks
  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ['project-tasks', id],
    queryFn: async () => {
      if (!id) return [];
      
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          task_assignments (
            user_id,
            auth_users (
              id,
              username
            )
          )
        `)
        .eq('project_id', id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!id
  });

  // Parse storage size to compare
  const parseStorageSize = (sizeStr: string): number => {
    if (!sizeStr || sizeStr === 'N/A' || sizeStr === '') return 0;
    
    const cleanStr = sizeStr.replace(/[^0-9.]/g, '');
    const num = parseFloat(cleanStr);
    
    if (sizeStr.toUpperCase().includes('TB')) return num * 1000;
    if (sizeStr.toUpperCase().includes('GB')) return num;
    return num;
  };

  // Check if hard drive has low space
  const hasLowSpace = (drive: any) => {
    const capacity = parseStorageSize(drive.capacity || '');
    const freeSpace = parseStorageSize(drive.free_space || '');
    
    if (capacity > 0 && freeSpace > 0) {
      const usagePercent = ((capacity - freeSpace) / capacity) * 100;
      return usagePercent > 85; // More than 85% used
    }
    return false;
  };

  const handleEdit = () => {
    navigate(`/projects/${id}/edit`);
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this project?')) return;
    
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      toast.success('Project deleted successfully');
      navigate('/projects');
    } catch (error) {
      console.error('Error deleting project:', error);
      toast.error('Failed to delete project');
    }
  };

  const handlePrintAll = () => {
    navigate('/print', { 
      state: { 
        type: 'all_hards',
        projectId: id,
        projectName: project?.name 
      } 
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'todo':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const taskStats = {
    total: tasks.length,
    completed: tasks.filter(task => task.status === 'completed').length,
    inProgress: tasks.filter(task => task.status === 'in_progress').length,
    todo: tasks.filter(task => task.status === 'todo').length
  };

  const completionRate = taskStats.total > 0 ? Math.round((taskStats.completed / taskStats.total) * 100) : 0;

  if (projectLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-96">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
        </div>
      </MainLayout>
    );
  }

  if (!project) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900">Project not found</h2>
          <p className="text-gray-600 mt-2">The project you're looking for doesn't exist.</p>
          <Button onClick={() => navigate('/projects')} className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Projects
          </Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="sm" onClick={() => navigate('/projects')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
              <p className="text-muted-foreground">
                Created on {format(new Date(project.created_at), 'MMMM d, yyyy')}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={handlePrintAll}>
              <Printer className="h-4 w-4 mr-2" />
              Print All Hard Drives
            </Button>
            <Button variant="outline" onClick={handleEdit}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <Button variant="outline" onClick={handleDelete} className="text-red-600 hover:text-red-700">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>

        {/* Project Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Project Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Project Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900">Status</h4>
                <Badge variant="outline" className="mt-1">
                  {project.status || 'Active'}
                </Badge>
              </div>
              {project.type && (
                <div>
                  <h4 className="font-medium text-gray-900">Type</h4>
                  <p className="text-sm text-gray-600 mt-1">{project.type}</p>
                </div>
              )}
              {project.description && (
                <div>
                  <h4 className="font-medium text-gray-900">Description</h4>
                  <p className="text-sm text-gray-600 mt-1">{project.description}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Hard Drives Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HardDrive className="h-5 w-5" />
                Hard Drives ({hardDrives.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Storage</span>
                  <span className="text-sm font-medium">
                    {hardDrives.reduce((total, drive) => {
                      const capacity = parseStorageSize(drive.capacity || '');
                      return total + capacity;
                    }, 0).toFixed(1)} GB
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Low Space Alerts</span>
                  <span className="text-sm font-medium text-red-600">
                    {hardDrives.filter(hasLowSpace).length}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tasks Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Tasks ({taskStats.total})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Completed</span>
                  <span className="text-sm font-medium text-green-600">{taskStats.completed}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">In Progress</span>
                  <span className="text-sm font-medium text-blue-600">{taskStats.inProgress}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">To Do</span>
                  <span className="text-sm font-medium text-gray-600">{taskStats.todo}</span>
                </div>
                <div className="pt-2 border-t">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Completion Rate</span>
                    <span className="text-sm font-bold">{completionRate}%</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Associated Hard Drives */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HardDrive className="h-5 w-5" />
              Associated Hard Drives
            </CardTitle>
          </CardHeader>
          <CardContent>
            {hardDrivesLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              </div>
            ) : hardDrives.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <HardDrive className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No hard drives associated with this project</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 font-medium">Name</th>
                      <th className="text-left p-3 font-medium">Serial Number</th>
                      <th className="text-left p-3 font-medium">Capacity</th>
                      <th className="text-left p-3 font-medium">Free Space</th>
                      <th className="text-left p-3 font-medium">Data</th>
                      <th className="text-left p-3 font-medium">Date Added</th>
                      <th className="text-left p-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {hardDrives.map((drive) => (
                      <tr key={drive.id} className="border-b hover:bg-gray-50">
                        <td className="p-3">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">{drive.name}</span>
                            {hasLowSpace(drive) && (
                              <Badge variant="destructive" className="text-xs">
                                Low Space
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="p-3 text-gray-600">{drive.serial_number}</td>
                        <td className="p-3">{drive.capacity || 'N/A'}</td>
                        <td className="p-3">{drive.free_space || 'N/A'}</td>
                        <td className="p-3">{drive.data || 'N/A'}</td>
                        <td className="p-3 text-gray-600">
                          {format(new Date(drive.created_at), 'MMM d, yyyy')}
                        </td>
                        <td className="p-3">
                          <Badge variant="outline">
                            Available
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Project Tasks */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Project Tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            {tasksLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              </div>
            ) : tasks.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Clock className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No tasks found for this project</p>
              </div>
            ) : (
              <div className="space-y-4">
                {tasks.map((task) => (
                  <div key={task.id} className="p-4 rounded-lg border bg-white">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{task.title}</h4>
                        {task.description && (
                          <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                        )}
                        <div className="flex items-center space-x-4 mt-2">
                          <Badge className={getStatusColor(task.status)}>
                            {task.status.replace('_', ' ')}
                          </Badge>
                          <Badge variant="outline" className={getPriorityColor(task.priority)}>
                            {task.priority} priority
                          </Badge>
                          {task.due_date && (
                            <span className="text-xs text-gray-500">
                              Due: {format(new Date(task.due_date), 'MMM d, yyyy')}
                            </span>
                          )}
                        </div>
                      </div>
                      {task.task_assignments && task.task_assignments.length > 0 && (
                        <div className="flex items-center space-x-2">
                          {task.task_assignments.slice(0, 3).map((assignment: any, index: number) => (
                            <Avatar key={index} className="h-8 w-8">
                              <AvatarFallback className="text-xs">
                                {assignment.auth_users?.username?.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                          ))}
                          {task.task_assignments.length > 3 && (
                            <span className="text-xs text-gray-500">
                              +{task.task_assignments.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default ProjectDetail;
