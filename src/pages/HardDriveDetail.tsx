import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { PrintHistoryTable } from "@/components/print/PrintHistoryTable";
import { ArrowLeft, Edit, Trash2, Printer, Archive, QrCode } from "lucide-react";
import { useData } from "@/context/DataContext";
import type { HardDrive, PrintHistory } from "@/types";
import { getHardDriveStatusColor } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const HardDriveDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { hardDrives, projects, deleteHardDrive, printHistory } = useData();
  const { currentUser } = useAuth();
  
  const [hardDrive, setHardDrive] = useState<HardDrive | null>(null);
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Check if user is a producer (read-only access)
  const isProducer = currentUser?.role === 'producer';
  // Check if user can edit (admin, senior, or operator)
  const canEdit = currentUser?.role === 'admin' || currentUser?.role === 'senior' || currentUser?.role === 'operator';

  useEffect(() => {
    if (!id) {
      navigate('/hard-drives');
      return;
    }

    const foundHardDrive = hardDrives.find(hd => hd.id === id);
    if (!foundHardDrive) {
      toast({
        title: "Hard Drive Not Found",
        description: "The requested hard drive could not be found.",
        variant: "destructive"
      });
      navigate('/hard-drives');
      return;
    }

    setHardDrive(foundHardDrive);
    
    if (foundHardDrive.projectId) {
      const foundProject = projects.find(p => p.id === foundHardDrive.projectId);
      setProject(foundProject);
    }
    
    setLoading(false);
  }, [id, hardDrives, projects, navigate, toast]);

  const handleDelete = async () => {
    if (!hardDrive) return;
    
    if (window.confirm('Are you sure you want to delete this hard drive?')) {
      try {
        await deleteHardDrive(hardDrive.id);
        toast({
          title: "Hard Drive Deleted",
          description: "The hard drive has been successfully deleted."
        });
        navigate('/hard-drives');
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete the hard drive.",
          variant: "destructive"
        });
      }
    }
  };

  const handleEdit = () => {
    if (!hardDrive) return;
    navigate(`/hard-drives/${hardDrive.id}/edit`);
  };

  const handlePrint = () => {
    if (!hardDrive) return;
    navigate(`/hard-drives/${hardDrive.id}/print`);
  };

  const handleQRCode = () => {
    if (!hardDrive) return;
    navigate(`/hard-drives/${hardDrive.id}/qr`);
  };

  // Check if hard drive has low space
  const hasLowSpace = (hardDrive: HardDrive) => {
    if (hardDrive.driveType !== 'backup' || !hardDrive.freeSpace || !hardDrive.capacity) return false;
    
    // Extract numbers and convert to GB for comparison
    const parseSize = (size: string) => {
      const match = size.match(/^(\d+(?:\.\d+)?)\s*(TB|GB|MB)?$/i);
      if (!match) return 0;
      
      const value = parseFloat(match[1]);
      const unit = (match[2] || 'GB').toUpperCase();
      
      switch (unit) {
        case 'TB': return value * 1024;
        case 'MB': return value / 1024;
        default: return value;
      }
    };

    const freeSpaceGB = parseSize(hardDrive.freeSpace);
    const capacityGB = parseSize(hardDrive.capacity);
    
    // Calculate percentage of free space
    const freeSpacePercentage = (freeSpaceGB / capacityGB) * 100;
    return freeSpacePercentage < 20; // Less than 20% free space
  };

  // Check if this is the most recent backup drive that should show low space
  const shouldShowLowSpace = (hardDrive: HardDrive) => {
    if (!hasLowSpace(hardDrive)) return false;
    
    // Get all backup drives for this project, sorted by creation date (newest first)
    const backupDrives = hardDrives
      .filter(drive => drive.driveType === 'backup' && drive.projectId === hardDrive.projectId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    // Only show low space on the most recent backup drive
    return backupDrives.length > 0 && backupDrives[0].id === hardDrive.id;
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

  if (!hardDrive) {
    return (
      <MainLayout>
        <div className="p-6">
          <div className="text-center">Hard drive not found</div>
        </div>
      </MainLayout>
    );
  }

  // Filter print history for this hard drive
  const hardDrivePrintHistory = printHistory
    .filter(history => history.hardDriveId === hardDrive.id)
    .map(history => ({
      id: history.id,
      type: history.type,
      hard_drive_id: history.hardDriveId,
      printed_at: history.timestamp,
      printed_by: history.operatorName,
      hardDriveName: hardDrive.name
    }));

  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-2 sm:gap-4">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate('/hard-drives')}
              className="shrink-0"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Back to Hard Drives</span>
              <span className="sm:hidden">Back</span>
            </Button>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-3xl font-bold truncate">{hardDrive.name}</h1>
              {shouldShowLowSpace(hardDrive) && (
                <Badge variant="destructive" className="text-sm">
                  Low Space
                </Badge>
              )}
            </div>
          </div>
          
          {!isProducer && (
            <div className="flex items-center gap-2">
              <Button onClick={handlePrint} variant="outline">
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
              <Button onClick={handleQRCode} variant="outline">
                <QrCode className="h-4 w-4 mr-2" />
                QR Code
              </Button>
              {canEdit && (
                <Button onClick={handleEdit} variant="outline">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              )}
              <Button 
                onClick={handleDelete} 
                variant="destructive"
                className="hidden sm:flex"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Name</label>
                <p className="text-lg">{hardDrive.name}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">Serial Number</label>
                <p className="text-lg font-mono">{hardDrive.serialNumber}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">Drive Type</label>
                <p className="text-lg capitalize">{hardDrive.driveType}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">Status</label>
                <Badge variant="outline" className={`capitalize ${getHardDriveStatusColor(hardDrive.status)}`}>
                  {hardDrive.status}
                </Badge>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">Capacity</label>
                <p className="text-lg">{hardDrive.capacity || 'Not specified'}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">Free Space</label>
                <p className="text-lg">{hardDrive.freeSpace || 'Not specified'}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">Data</label>
                <p className="text-lg">{hardDrive.data || 'No data specified'}</p>
              </div>
            </CardContent>
          </Card>

          {/* Project Information */}
          <Card>
            <CardHeader>
              <CardTitle>Project Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {project ? (
                <>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Project Name</label>
                    <Link 
                      to={`/projects/${project.id}`} 
                      className="text-lg text-primary hover:underline hover:text-primary/80 transition-colors"
                    >
                      <br></br>
                      {project.name}
                    </Link>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-500">Project Type</label>
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
                </>
              ) : (
                <div className="text-center py-8">
                  <Archive className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500">No project assigned</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Cable Information */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Cable Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium">Power</span>
                  <Badge variant={hardDrive.cables.power ? "default" : "secondary"}>
                    {hardDrive.cables.power ? "Yes" : "No"}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium">USB 3.0</span>
                  <Badge variant={hardDrive.cables.usb3 ? "default" : "secondary"}>
                    {hardDrive.cables.usb3 ? "Yes" : "No"}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium">Type-C</span>
                  <Badge variant={hardDrive.cables.typeC ? "default" : "secondary"}>
                    {hardDrive.cables.typeC ? "Yes" : "No"}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium">Thunderbolt 3</span>
                  <Badge variant={hardDrive.cables.thunderbolt3 ? "default" : "secondary"}>
                    {hardDrive.cables.thunderbolt3 ? "Yes" : "No"}
                  </Badge>
                </div>
                
                <div className="flex flex-col p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium mb-1">Other</span>
                  <span className="text-xs text-gray-600">
                    {hardDrive.cables.other || "None"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Separator />

        {/* Print History */}
        <Card>
          <CardHeader>
            <CardTitle>Print History</CardTitle>
          </CardHeader>
          <CardContent>
            <PrintHistoryTable data={hardDrivePrintHistory} />
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default HardDriveDetail;
