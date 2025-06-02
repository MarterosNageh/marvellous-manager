import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { 
  ArrowLeft, 
  Edit, 
  Save, 
  X, 
  HardDrive, 
  Calendar,
  AlertTriangle,
  Printer
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Project {
  id: string;
  name: string;
  description?: string;
  type?: string;
  status: string;
  created_at: string;
}

interface HardDrive {
  id: string;
  name: string;
  serial_number: string;
  capacity?: string;
  free_space?: string;
  data?: string;
  project_id?: string;
  created_at: string;
  updated_at: string;
}

const ProjectDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [hardDrives, setHardDrives] = useState<HardDrive[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [editedProject, setEditedProject] = useState<Partial<Project>>({});

  useEffect(() => {
    if (id) {
      fetchProject();
      fetchHardDrives();
    }
  }, [id]);

  const fetchProject = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setProject(data);
      setEditedProject(data);
    } catch (error) {
      console.error('Error fetching project:', error);
      toast.error('Failed to load project');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchHardDrives = async () => {
    try {
      const { data, error } = await supabase
        .from('hard_drives')
        .select('*')
        .eq('project_id', id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setHardDrives(data || []);
    } catch (error) {
      console.error('Error fetching hard drives:', error);
      toast.error('Failed to load hard drives');
    }
  };

  const handleSave = async () => {
    if (!project || !editedProject.name?.trim()) {
      toast.error('Project name is required');
      return;
    }

    try {
      const { error } = await supabase
        .from('projects')
        .update(editedProject)
        .eq('id', project.id);

      if (error) throw error;

      setProject({ ...project, ...editedProject });
      setIsEditing(false);
      toast.success('Project updated successfully');
    } catch (error) {
      console.error('Error updating project:', error);
      toast.error('Failed to update project');
    }
  };

  const handleCancel = () => {
    setEditedProject(project || {});
    setIsEditing(false);
  };

  // Parse storage capacity and free space
  const parseStorageSize = (sizeStr: string): number => {
    if (!sizeStr || sizeStr === 'N/A' || sizeStr === '' || sizeStr === '0') return 0;
    
    const cleanStr = sizeStr.replace(/[^0-9.]/g, '');
    const num = parseFloat(cleanStr);
    
    if (sizeStr.toUpperCase().includes('TB')) return num * 1000;
    if (sizeStr.toUpperCase().includes('GB')) return num;
    return num;
  };

  // Check if drive has low space
  const hasLowSpace = (drive: HardDrive): boolean => {
    const capacity = parseStorageSize(drive.capacity || '');
    const freeSpace = parseStorageSize(drive.free_space || '');
    
    if (capacity > 0 && freeSpace > 0) {
      const usedSpace = capacity - freeSpace;
      const usagePercent = (usedSpace / capacity) * 100;
      return usagePercent > 85; // More than 85% used = low space
    }
    
    return false;
  };

  const handlePrintProject = () => {
    navigate('/print', { 
      state: { 
        type: 'project_drives',
        projectId: id,
        projectName: project?.name
      }
    });
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading project...</div>
        </div>
      </MainLayout>
    );
  }

  if (!project) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-red-600">Project not found</div>
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
            <Button variant="ghost" onClick={() => navigate('/projects')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Projects
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
              <p className="text-muted-foreground">
                Created on {format(new Date(project.created_at), 'PPP')}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={handlePrintProject}>
              <Printer className="h-4 w-4 mr-2" />
              Print All Drives
            </Button>
            {isEditing ? (
              <>
                <Button onClick={handleSave}>
                  <Save className="h-4 w-4 mr-2" />
                  Save
                </Button>
                <Button variant="outline" onClick={handleCancel}>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </>
            ) : (
              <Button onClick={() => setIsEditing(true)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Project
              </Button>
            )}
          </div>
        </div>

        {/* Project Details */}
        <Card>
          <CardHeader>
            <CardTitle>Project Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Project Name</Label>
                {isEditing ? (
                  <Input
                    id="name"
                    value={editedProject.name || ''}
                    onChange={(e) => setEditedProject(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter project name"
                  />
                ) : (
                  <div className="p-3 bg-gray-50 rounded-md">{project.name}</div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Project Type</Label>
                {isEditing ? (
                  <Select
                    value={editedProject.type || ''}
                    onValueChange={(value) => setEditedProject(prev => ({ ...prev, type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select project type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="data_recovery">Data Recovery</SelectItem>
                      <SelectItem value="backup">Backup</SelectItem>
                      <SelectItem value="migration">Data Migration</SelectItem>
                      <SelectItem value="forensics">Digital Forensics</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="p-3 bg-gray-50 rounded-md">
                    {project.type || 'Not specified'}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                {isEditing ? (
                  <Select
                    value={editedProject.status || ''}
                    onValueChange={(value) => setEditedProject(prev => ({ ...prev, status: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="on_hold">On Hold</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="p-3 bg-gray-50 rounded-md">
                    <Badge 
                      variant={
                        project.status === 'active' ? 'default' :
                        project.status === 'completed' ? 'secondary' :
                        project.status === 'on_hold' ? 'outline' : 'destructive'
                      }
                    >
                      {project.status}
                    </Badge>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="created">Created Date</Label>
                <div className="p-3 bg-gray-50 rounded-md flex items-center">
                  <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                  {format(new Date(project.created_at), 'PPP')}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              {isEditing ? (
                <Textarea
                  id="description"
                  value={editedProject.description || ''}
                  onChange={(e) => setEditedProject(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter project description"
                  rows={4}
                />
              ) : (
                <div className="p-3 bg-gray-50 rounded-md min-h-[100px]">
                  {project.description || 'No description provided'}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Associated Hard Drives */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HardDrive className="h-5 w-5" />
              Associated Hard Drives ({hardDrives.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {hardDrives.length === 0 ? (
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
                      <th className="text-center p-3 font-medium">Capacity</th>
                      <th className="text-center p-3 font-medium">Free Space</th>
                      <th className="text-left p-3 font-medium">Data</th>
                      <th className="text-center p-3 font-medium">Status</th>
                      <th className="text-center p-3 font-medium">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {hardDrives.map((drive) => (
                      <tr key={drive.id} className="border-b hover:bg-gray-50">
                        <td className="p-3">
                          <div className="flex items-center space-x-2">
                            <HardDrive className="h-4 w-4 text-gray-500" />
                            <span className="font-medium">{drive.name}</span>
                            {hasLowSpace(drive) && (
                              <Badge variant="destructive" className="text-xs">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                Low Space
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="p-3 font-mono text-xs">{drive.serial_number}</td>
                        <td className="text-center p-3">{drive.capacity || 'N/A'}</td>
                        <td className="text-center p-3">{drive.free_space || 'N/A'}</td>
                        <td className="p-3">
                          <div className="max-w-xs truncate" title={drive.data || ''}>
                            {drive.data || 'No data specified'}
                          </div>
                        </td>
                        <td className="text-center p-3">
                          <Badge variant="outline">
                            Available
                          </Badge>
                        </td>
                        <td className="text-center p-3 text-gray-500">
                          {format(new Date(drive.created_at), 'MMM d, yyyy')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default ProjectDetail;
