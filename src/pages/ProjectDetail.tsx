import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ArrowLeft, Edit, Trash2, Users, Clock, CheckCircle, AlertTriangle, HardDrive, Printer, History, Boxes } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { PrintHistoryTable } from '@/components/print/PrintHistoryTable';
import { getProjectStatusColor } from "@/lib/utils";

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

  // Fetch print history for this project
  const { data: printHistory = [], isLoading: printHistoryLoading } = useQuery({
    queryKey: ['project-print-history', id],
    queryFn: async () => {
      if (!id) return [];
      
      const { data, error } = await supabase
        .from('print_history')
        .select('*')
        .eq('project_id', id)
        .order('timestamp', { ascending: false });
      
      if (error) throw error;
      return data.map(record => ({
        id: record.id,
        type: record.type,
        hard_drive_id: record.hard_drive_id,
        printed_at: record.timestamp,
        printed_by: record.operator_name,
        hardDriveName: hardDrives.find(hd => hd.id === record.hard_drive_id)?.name
      }));
    },
    enabled: !!id
  });

  // Parse storage size to compare
  const parseStorageSize = (sizeStr: string): number => {
    if (!sizeStr || sizeStr === 'N/A' || sizeStr === '') return 0;
    
    // Extract number and unit from string (e.g., "2TB" -> ["2", "TB"])
    const match = sizeStr.match(/^(\d+(?:\.\d+)?)\s*(TB|GB|MB)?$/i);
    if (!match) return 0;

    const value = parseFloat(match[1]);
    const unit = (match[2] || 'GB').toUpperCase();

    // Convert everything to GB for comparison
    switch (unit) {
      case 'TB':
        return value * 1024; // 1 TB = 1024 GB
      case 'MB':
        return value / 1024; // 1 GB = 1024 MB
      case 'GB':
      default:
        return value;
    }
  };

  // Format storage size to human readable format
  const formatStorageSize = (sizeInGB: number): string => {
    if (sizeInGB >= 1024) {
      return `${(sizeInGB / 1024).toFixed(2)} TB`;
    }
    return `${sizeInGB.toFixed(2)} GB`;
  };

  // Calculate total storage
  const calculateTotalStorage = () => {
    const totalGB = hardDrives.reduce((total, drive) => {
      return total + parseStorageSize(drive.capacity || '0');
    }, 0);
    
    return formatStorageSize(totalGB);
  };

  // Check if hard drive has low space
  const hasLowSpace = (drive: any) => {
    // Only check backup drives
    if (drive.drive_type !== 'backup') return false;

    const capacity = parseStorageSize(drive.capacity || '');
    const freeSpace = parseStorageSize(drive.free_space || '');
    
    if (capacity > 0 && freeSpace > 0) {
      const usagePercent = ((capacity - freeSpace) / capacity) * 100;
      return usagePercent > 80; // More than 80% used (less than 20% free)
    }
    return false;
  };

  // Check if this is the most recent backup drive that should show low space
  const shouldShowLowSpace = (drive: any) => {
    if (!hasLowSpace(drive)) return false;
    
    // Get all backup drives for this project, sorted by creation date (newest first)
    const backupDrives = hardDrives
      .filter(d => d.drive_type === 'backup')
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    
    // Only show low space on the most recent backup drive
    return backupDrives.length > 0 && backupDrives[0].id === drive.id;
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
      toast.error('Failed to delete project');
    }
  };

  const handlePrintAll = () => {
    navigate(`/print/${id}`, { 
      state: { 
        type: 'all-hards',
        projectId: id,
        projectName: project?.name 
      } 
    });
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'unavailable':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'completed':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'on_hold':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getHardDriveStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'unavailable':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'in_use':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'retired':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const taskStats = {
    total: tasks.length,
    completed: tasks.filter(task => task.status === 'completed').length,
    inProgress: tasks.filter(task => task.status === 'in_progress').length,
    pending: tasks.filter(task => task.status === 'pending').length
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
        <div className="space-y-4 sm:space-y-0">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm" onClick={() => navigate('/projects')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{project.name}</h1>
                <p className="text-sm sm:text-base text-muted-foreground">
                  Created on {format(new Date(project.created_at), 'MMMM d, yyyy')}
                </p>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <Button 
                variant="outline" 
                onClick={handlePrintAll}
                className="flex-1 sm:flex-none justify-center"
              >
                <Printer className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Print All Hard Drives</span>
                <span className="sm:hidden">Print All</span>
              </Button>
              <Button 
                variant="outline" 
                onClick={handleEdit}
                className="flex-1 sm:flex-none justify-center"
              >
                <Edit className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Edit Project</span>
                <span className="sm:hidden">Edit</span>
              </Button>
              <Button 
                variant="outline" 
                onClick={handleDelete} 
                className="flex-1 sm:flex-none justify-center text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Delete Project</span>
                <span className="sm:hidden">Delete</span>
              </Button>
            </div>
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
                <Badge 
                  className={`mt-1 capitalize text-sm ${getProjectStatusColor(project.status || 'active')}`}
                >
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
                    {calculateTotalStorage()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Backup</span>
                  <span className="text-sm font-medium">
                    {hardDrives.filter(drive => drive.drive_type === 'backup').length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Taxi</span>
                  <span className="text-sm font-medium">
                    {hardDrives.filter(drive => drive.drive_type === 'taxi').length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Passport</span>
                  <span className="text-sm font-medium">
                    {hardDrives.filter(drive => drive.drive_type === 'passport').length}
                  </span>
                </div>
                <div className="flex justify-between">

                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tasks Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Boxes className="h-5 w-5" />
                Tasks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Pending</span>
                  <span className="text-sm font-medium">
                    {tasks.filter(task => task.status === 'pending').length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">In Progress</span>
                  <span className="text-sm font-medium text-red-500">
                    {tasks.filter(task => task.status === 'in_progress').length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Under Review</span>
                  <span className="text-sm font-medium text-blue-500">
                    {tasks.filter(task => task.status === 'under_review').length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Completed</span>
                  <span className="text-sm font-medium text-green-500">
                    {tasks.filter(task => task.status === 'completed').length}
                  </span>
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
              <div className="space-y-8">
                {/* Backup Drives */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Backup Drives</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-3 font-medium">Name</th>
                          <th className="text-left p-3 font-medium">Serial Number</th>
                          <th className="text-left p-3 font-medium">Status</th>
                          <th className="text-left p-3 font-medium">Capacity</th>
                          <th className="text-left p-3 font-medium">Free Space</th>
                          <th className="text-left p-3 font-medium">Data</th>
                          <th className="text-left p-3 font-medium">Date Added</th>
                        </tr>
                      </thead>
                      <tbody>
                        {hardDrives
                          .filter(drive => drive.drive_type === 'backup')
                          .map((drive) => (
                            <tr key={drive.id} className="border-b hover:bg-gray-50">
                              <td className="p-3">
                                <div className="flex items-center space-x-2">
                                  <Link 
                                    to={`/hard-drives/${drive.id}`}
                                    className="font-medium text-primary hover:underline flex items-center gap-2"
                                  >
                                    <HardDrive className="h-4 w-4" />
                                    {drive.name}
                                  </Link>
                                  {shouldShowLowSpace(drive) && (
                                    <Badge variant="destructive" className="text-xs">
                                      Low Space
                                    </Badge>
                                  )}
                                </div>
                              </td>
                              <td className="p-3 text-gray-600">{drive.serial_number}</td>
                              <td className="p-3">
                                <Badge variant="outline" className={`capitalize ${getHardDriveStatusColor(drive.status || 'available')}`}>
                                  {drive.status || 'available'}
                                </Badge>
                              </td>
                              <td className="p-3">{drive.capacity || 'N/A'}</td>
                              <td className="p-3">{drive.free_space || 'N/A'}</td>
                              <td className="p-3">{drive.data || 'N/A'}</td>
                              <td className="p-3 text-gray-600">
                                {format(new Date(drive.created_at), 'MMM d, yyyy')}
                              </td>
                            </tr>
                          ))}
                        {hardDrives.filter(drive => drive.drive_type === 'backup').length === 0 && (
                          <tr>
                            <td colSpan={7} className="text-center p-4 text-gray-500">
                              No backup drives found
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Taxi Drives */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Taxi Drives</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-3 font-medium">Name</th>
                          <th className="text-left p-3 font-medium">Serial Number</th>
                          <th className="text-left p-3 font-medium">Status</th>
                          <th className="text-left p-3 font-medium">Capacity</th>
                          <th className="text-left p-3 font-medium">Free Space</th>
                          <th className="text-left p-3 font-medium">Data</th>
                          <th className="text-left p-3 font-medium">Date Added</th>
                        </tr>
                      </thead>
                      <tbody>
                        {hardDrives
                          .filter(drive => drive.drive_type === 'taxi')
                          .map((drive) => (
                            <tr key={drive.id} className="border-b hover:bg-gray-50">
                              <td className="p-3">
                                <div className="flex items-center space-x-2">
                                  <Link 
                                    to={`/hard-drives/${drive.id}`}
                                    className="font-medium text-primary hover:underline flex items-center gap-2"
                                  >
                                    <HardDrive className="h-4 w-4" />
                                    {drive.name}
                                  </Link>
                                </div>
                              </td>
                              <td className="p-3 text-gray-600">{drive.serial_number}</td>
                              <td className="p-3">
                                <Badge variant="outline" className={`capitalize ${getHardDriveStatusColor(drive.status || 'available')}`}>
                                  {drive.status || 'available'}
                                </Badge>
                              </td>
                              <td className="p-3">{drive.capacity || 'N/A'}</td>
                              <td className="p-3">{drive.free_space || 'N/A'}</td>
                              <td className="p-3">{drive.data || 'N/A'}</td>
                              <td className="p-3 text-gray-600">
                                {format(new Date(drive.created_at), 'MMM d, yyyy')}
                              </td>
                            </tr>
                          ))}
                        {hardDrives.filter(drive => drive.drive_type === 'taxi').length === 0 && (
                          <tr>
                            <td colSpan={7} className="text-center p-4 text-gray-500">
                              No taxi drives found
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Passport Drives */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Passport Drives</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-3 font-medium">Name</th>
                          <th className="text-left p-3 font-medium">Serial Number</th>
                          <th className="text-left p-3 font-medium">Status</th>
                          <th className="text-left p-3 font-medium">Capacity</th>
                          <th className="text-left p-3 font-medium">Free Space</th>
                          <th className="text-left p-3 font-medium">Data</th>
                          <th className="text-left p-3 font-medium">Date Added</th>
                        </tr>
                      </thead>
                      <tbody>
                        {hardDrives
                          .filter(drive => drive.drive_type === 'passport')
                          .map((drive) => (
                            <tr key={drive.id} className="border-b hover:bg-gray-50">
                              <td className="p-3">
                                <div className="flex items-center space-x-2">
                                  <Link 
                                    to={`/hard-drives/${drive.id}`}
                                    className="font-medium text-primary hover:underline flex items-center gap-2"
                                  >
                                    <HardDrive className="h-4 w-4" />
                                    {drive.name}
                                  </Link>
                                </div>
                              </td>
                              <td className="p-3 text-gray-600">{drive.serial_number}</td>
                              <td className="p-3">
                                <Badge variant="outline" className={`capitalize ${getHardDriveStatusColor(drive.status || 'available')}`}>
                                  {drive.status || 'available'}
                                </Badge>
                              </td>
                              <td className="p-3">{drive.capacity || 'N/A'}</td>
                              <td className="p-3">{drive.free_space || 'N/A'}</td>
                              <td className="p-3">{drive.data || 'N/A'}</td>
                              <td className="p-3 text-gray-600">
                                {format(new Date(drive.created_at), 'MMM d, yyyy')}
                              </td>
                            </tr>
                          ))}
                        {hardDrives.filter(drive => drive.drive_type === 'passport').length === 0 && (
                          <tr>
                            <td colSpan={7} className="text-center p-4 text-gray-500">
                              No passport drives found
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
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

        {/* Print History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Print History
            </CardTitle>
          </CardHeader>
          <CardContent>
            {printHistoryLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              </div>
            ) : (
              <PrintHistoryTable data={printHistory} />
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default ProjectDetail;
