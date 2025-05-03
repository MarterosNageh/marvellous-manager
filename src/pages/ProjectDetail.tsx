import { useParams, Link, useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { useData } from "@/context/DataContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Edit, Trash, ArrowLeft, Plus, Printer, HardDrive as HardDriveIcon, History } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useEffect } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { PrintHistoryTable } from "@/components/print/PrintHistoryTable";

const ProjectDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getProject, deleteProject, getHardDrivesByProject } = useData();
  const isMobile = useIsMobile();
  
  const project = getProject(id || "");
  
  // If project doesn't exist, redirect to projects page
  useEffect(() => {
    if (id && !project) {
      navigate("/projects", { replace: true });
    }
  }, [id, project, navigate]);
  
  if (!project) {
    return (
      <MainLayout>
        <div className="text-center p-12">
          <h2 className="text-2xl font-bold mb-4">Project Not Found</h2>
          <p className="mb-6">The project you're looking for doesn't exist or has been removed.</p>
          <Button onClick={() => navigate("/projects")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Projects
          </Button>
        </div>
      </MainLayout>
    );
  }
  
  const hardDrives = getHardDrivesByProject(project.id);
  
  // Get print history for this project (both project-specific and for all related hard drives)
  const { printHistory: allPrintHistory } = useData();
  const printHistory = allPrintHistory
    .filter(item => 
      item.projectId === project.id || 
      (item.hardDriveId && hardDrives.some(hd => hd.id === item.hardDriveId))
    )
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .map(item => {
      // Add hard drive name to the print history item if it's a hard drive print
      if (item.hardDriveId) {
        const hardDrive = hardDrives.find(hd => hd.id === item.hardDriveId);
        return {
          ...item,
          hardDriveName: hardDrive ? hardDrive.name : 'Unknown'
        };
      }
      return item;
    });
  
  const handleDelete = () => {
    deleteProject(project.id);
    navigate("/projects");
  };
  
  return (
    <MainLayout>
      <div className="space-y-6 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="icon" onClick={() => navigate("/projects")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-xl sm:text-3xl font-bold truncate">{project.name}</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to={`/projects/${project.id}/print`}>
              <Button variant="outline" size={isMobile ? "sm" : "default"} className="whitespace-nowrap">
                <Printer className="mr-2 h-4 w-4" />
                {isMobile ? "Print" : "Print All Hards"}
              </Button>
            </Link>
            <Link to={`/projects/${project.id}/edit`}>
              <Button variant="outline" size={isMobile ? "sm" : "default"}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
            </Link>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size={isMobile ? "sm" : "default"}>
                  <Trash className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the
                    project and all associated hard drives.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete}>
                    Confirm Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Project Details</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Name</dt>
                <dd className="text-lg">{project.name}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Created On</dt>
                <dd className="text-lg">{new Date(project.createdAt).toLocaleDateString()}</dd>
              </div>
              <div className="md:col-span-2">
                <dt className="text-sm font-medium text-muted-foreground">Description</dt>
                <dd className="text-lg whitespace-pre-wrap">
                  {project.description || "No description provided"}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>
        
        {/* Print History Card */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center">
            <History className="h-5 w-5 mr-2" />
            Print History
          </h2>
          <Card>
            <CardContent className="p-4 sm:p-6">
              <PrintHistoryTable history={printHistory} showHardDriveName={true} />
            </CardContent>
          </Card>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Hard Drives</h2>
            <Link to={`/hard-drives/new?project=${project.id}`}>
              <Button size={isMobile ? "sm" : "default"}>
                <Plus className="mr-2 h-4 w-4" />
                Add Hard Drive
              </Button>
            </Link>
          </div>
          
          {hardDrives.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <HardDriveIcon className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-medium">No hard drives</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  This project doesn't have any hard drives yet.
                </p>
                <Link to={`/hard-drives/new?project=${project.id}`} className="mt-6 inline-block">
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Hard Drive
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="overflow-x-auto">
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead className="hidden sm:table-cell">Serial Number</TableHead>
                        <TableHead className="hidden md:table-cell">Capacity</TableHead>
                        <TableHead className="hidden lg:table-cell">Free Space</TableHead>
                        <TableHead className="w-[100px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {hardDrives.map((hardDrive) => (
                        <TableRow key={hardDrive.id}>
                          <TableCell className="font-medium">
                            <Link
                              to={`/hard-drives/${hardDrive.id}`}
                              className="hover:underline"
                            >
                              {hardDrive.name}
                            </Link>
                            {isMobile && <div className="text-xs text-muted-foreground mt-1">{hardDrive.serialNumber}</div>}
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">{hardDrive.serialNumber}</TableCell>
                          <TableCell className="hidden md:table-cell">{hardDrive.capacity}</TableCell>
                          <TableCell className="hidden lg:table-cell">{hardDrive.freeSpace}</TableCell>
                          <TableCell>
                            <div className="flex space-x-1">
                              <Link to={`/hard-drives/${hardDrive.id}`}>
                                <Button variant="outline" size="sm">
                                  View
                                </Button>
                              </Link>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default ProjectDetail;
