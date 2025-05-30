import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { PrintHistoryTable } from "@/components/print/PrintHistoryTable";
import { ArrowLeft, Edit, Trash2, HardDrive as HardDriveIcon, Printer, AlertTriangle } from "lucide-react";
import { useData } from "@/context/DataContext";
import type { Project, HardDrive, PrintHistory } from "@/types";
import { format } from 'date-fns';

const formatDate = (dateString: string) => {
  return format(new Date(dateString), 'PPpp');
};

const ProjectDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { projects, hardDrives, deleteProject, printHistory } = useData();
  
  const [project, setProject] = useState<Project | null>(null);
  const [projectHardDrives, setProjectHardDrives] = useState<HardDrive[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      navigate('/projects');
      return;
    }

    const foundProject = projects.find(p => p.id === id);
    if (!foundProject) {
      toast({
        title: "Project Not Found",
        description: "The requested project could not be found.",
        variant: "destructive"
      });
      navigate('/projects');
      return;
    }

    setProject(foundProject);
    
    // Find hard drives associated with this project
    const associatedHardDrives = hardDrives.filter(hd => hd.projectId === id);
    setProjectHardDrives(associatedHardDrives);
    
    setLoading(false);
  }, [id, projects, hardDrives, navigate, toast]);

  const handleDelete = async () => {
    if (!project) return;
    
    if (window.confirm('Are you sure you want to delete this project? This will not delete associated hard drives.')) {
      try {
        await deleteProject(project.id);
        toast({
          title: "Project Deleted",
          description: "The project has been successfully deleted."
        });
        navigate('/projects');
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete the project.",
          variant: "destructive"
        });
      }
    }
  };

  const handlePrint = () => {
    if (!project) return;
    
    // Navigate to project print page with all hard drives
    navigate(`/projects/${project.id}/print`, { 
      state: { 
        type: 'all-hards',
        project,
        hardDrives: projectHardDrives
      } 
    });
  };

  // Check for low space drives
  const getLowSpaceStatus = (hardDrive: HardDrive) => {
    if (!hardDrive.freeSpace || hardDrive.freeSpace === 'N/A' || hardDrive.freeSpace.trim() === '') {
      return null;
    }
    
    const getFreeSpacePercentage = (freeSpace: string, capacity: string) => {
      const free = parseFloat(freeSpace.replace(/[^\d.]/g, '')) || 0;
      const total = parseFloat(capacity?.replace(/[^\d.]/g, '') || '1') || 1;
      return (free / total) * 100;
    };

    const freeSpacePercent = getFreeSpacePercentage(hardDrive.freeSpace, hardDrive.capacity || '1TB');
    return freeSpacePercent < 20;
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="p-6">
          <div className="text-center">Loading...</div>
        </div>
      </MainLayout>
    );
  }

  if (!project) {
    return (
      <MainLayout>
        <div className="p-6">
          <div className="text-center">Project not found</div>
        </div>
      </MainLayout>
    );
  }

  // Filter and transform print history for this project
  const projectPrintHistory = printHistory
    .filter(history => history.projectId === project.id)
    .map(history => {
      const hardDrive = hardDrives.find(hd => hd.id === history.hardDriveId);
      return {
        id: history.id,
        type: history.type,
        hard_drive_id: history.hardDriveId,
        printed_at: history.timestamp,
        printed_by: history.operatorName,
        hardDriveName: hardDrive?.name || 'Unknown Hard Drive'
      };
    });

  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate('/projects')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Projects
            </Button>
            <h1 className="text-3xl font-bold">{project.name}</h1>
          </div>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={handlePrint}
            >
              <Printer className="h-4 w-4 mr-2" />
              Print All Hard Drives
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate(`/projects/${project.id}/edit`)}
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <Button 
              variant="destructive" 
              size="sm"
              onClick={handleDelete}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Project Information */}
          <Card>
            <CardHeader>
              <CardTitle>Project Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Name</label>
                <p className="text-lg">{project.name}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">Type</label>
                <Badge variant="secondary">{project.type || 'Not specified'}</Badge>
              </div>
              
              {project.description && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Description</label>
                  <p className="text-sm text-gray-700">{project.description}</p>
                </div>
              )}
              
              <div>
                <label className="text-sm font-medium text-gray-500">Created</label>
                <p className="text-sm">{formatDate(project.createdAt)}</p>
              </div>
            </CardContent>
          </Card>

          {/* Statistics */}
          <Card>
            <CardHeader>
              <CardTitle>Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <HardDriveIcon className="h-8 w-8 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium text-blue-900">Hard Drives</p>
                    <p className="text-2xl font-bold text-blue-600">{projectHardDrives.length}</p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Printer className="h-8 w-8 text-green-600" />
                  <div>
                    <p className="text-sm font-medium text-green-900">Print Operations</p>
                    <p className="text-2xl font-bold text-green-600">{projectPrintHistory.length}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Associated Hard Drives Table */}
        <Card>
          <CardHeader>
            <CardTitle>Associated Hard Drives ({projectHardDrives.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {projectHardDrives.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-4 font-medium">Name</th>
                      <th className="text-left py-2 px-4 font-medium">Serial Number</th>
                      <th className="text-center py-2 px-4 font-medium">Capacity</th>
                      <th className="text-center py-2 px-4 font-medium">Free Space</th>
                      <th className="text-center py-2 px-4 font-medium">Status</th>
                      <th className="text-center py-2 px-4 font-medium">Alerts</th>
                    </tr>
                  </thead>
                  <tbody>
                    {projectHardDrives.map((hardDrive) => {
                      const isLowSpace = getLowSpaceStatus(hardDrive);
                      return (
                        <tr 
                          key={hardDrive.id} 
                          className="border-b hover:bg-gray-50 cursor-pointer"
                          onClick={() => navigate(`/hard-drives/${hardDrive.id}`)}
                        >
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <HardDriveIcon className="h-4 w-4 text-gray-600" />
                              <span className="font-medium">{hardDrive.name}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-600">{hardDrive.serialNumber}</td>
                          <td className="text-center py-3 px-4 text-sm">{hardDrive.capacity || 'Unknown'}</td>
                          <td className="text-center py-3 px-4 text-sm">{hardDrive.freeSpace || 'Unknown'}</td>
                          <td className="text-center py-3 px-4">
                            <Badge variant={hardDrive.status === 'available' ? 'default' : 'secondary'}>
                              {hardDrive.status}
                            </Badge>
                          </td>
                          <td className="text-center py-3 px-4">
                            {isLowSpace && (
                              <Badge variant="destructive" className="flex items-center gap-1">
                                <AlertTriangle className="h-3 w-3" />
                                Low Space
                              </Badge>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8">
                <HardDriveIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500">No hard drives associated with this project</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-4"
                  onClick={() => navigate('/hard-drives/new', { state: { projectId: project.id } })}
                >
                  Add Hard Drive
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Separator />

        {/* Print History */}
        <Card>
          <CardHeader>
            <CardTitle>Print History</CardTitle>
          </CardHeader>
          <CardContent>
            <PrintHistoryTable data={projectPrintHistory} />
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default ProjectDetail;
