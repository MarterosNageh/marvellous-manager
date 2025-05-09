import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { useData } from "@/context/DataContext";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Edit, Trash, Printer, Clipboard, History } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useToast } from "@/components/ui/use-toast";
import { PrintHistoryTable } from "@/components/print/PrintHistoryTable";

const HardDriveDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getHardDrive, getProject, deleteHardDrive, printHistory: allPrintHistory } = useData();
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("details");
  
  const hardDrive = getHardDrive(id || "");
  const project = hardDrive ? getProject(hardDrive.projectId) : null;
  
  // Filter print history for this hard drive
  const hardDriveHistory = allPrintHistory
    .filter(item => item.hardDriveId === hardDrive?.id)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  
  useEffect(() => {
    if (id && !hardDrive) {
      navigate("/hard-drives", { replace: true });
    }
  }, [id, hardDrive, navigate]);
  
  if (!hardDrive) {
    return (
      <MainLayout>
        <div className="text-center p-12">
          <h2 className="text-2xl font-bold mb-4">Hard Drive Not Found</h2>
          <p className="mb-6">The hard drive you're looking for doesn't exist or has been removed.</p>
          <Button onClick={() => navigate("/hard-drives")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Hard Drives
          </Button>
        </div>
      </MainLayout>
    );
  }
  
  const generateLabelToPrint = () => {
    navigate(`/hard-drives/${hardDrive.id}/print?type=hard-label`);
  };
  
  const handleDeleteHardDrive = async () => {
    try {
      await deleteHardDrive(hardDrive.id);
      navigate("/hard-drives");
      toast({
        title: "Success",
        description: "Hard drive deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete hard drive",
        variant: "destructive",
      });
    }
  };
  
  const getCableList = () => {
    const cableItems = [];
    
    if (hardDrive.cables.thunderbolt3) cableItems.push("Thunderbolt 3");
    if (hardDrive.cables.typeC) cableItems.push("USB-C");
    if (hardDrive.cables.power) cableItems.push("Power");
    if (hardDrive.cables.usb3) cableItems.push("USB 3.0");
    if (hardDrive.cables.passport) cableItems.push("Passport Cable");
    if (hardDrive.cables.other) cableItems.push(hardDrive.cables.other);
    
    return cableItems.length > 0 ? cableItems.join(", ") : "None";
  };
  
  const copyQRUrl = () => {
    const url = `${window.location.origin}/hard-drives/${hardDrive.id}/view`;
    navigator.clipboard.writeText(url);
    toast({
      description: "QR code URL copied to clipboard",
    });
  };
  
  return (
    <MainLayout>
      <div className="space-y-6 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-xl sm:text-3xl font-bold truncate">{hardDrive.name}</h1>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Link to={`/hard-drives/${hardDrive.id}/print`}>
              <Button variant="outline" size={isMobile ? "sm" : "default"}>
                <Printer className="mr-2 h-4 w-4" />
                Print Forms
              </Button>
            </Link>
            <Button 
              variant="outline" 
              size={isMobile ? "sm" : "default"}
              onClick={generateLabelToPrint}
            >
              <Printer className="mr-2 h-4 w-4" />
              Print Label
            </Button>
            <Link to={`/hard-drives/${hardDrive.id}/edit`}>
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
                    hard drive.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteHardDrive}>
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="qrcode">QR Code</TabsTrigger>
            <TabsTrigger value="history">Print History</TabsTrigger>
          </TabsList>
          
          <TabsContent value="details" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Hard Drive Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Name</h3>
                    <p className="text-lg">{hardDrive.name}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Serial Number</h3>
                    <p className="text-lg">{hardDrive.serialNumber}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Capacity</h3>
                    <p className="text-lg">{hardDrive.capacity || "N/A"}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Free Space</h3>
                    <p className="text-lg">{hardDrive.freeSpace || "N/A"}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Project</h3>
                    <p className="text-lg">
                      {project ? (
                        <Link to={`/projects/${project.id}`} className="hover:underline text-primary">
                          {project.name}
                        </Link>
                      ) : (
                        "None"
                      )}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Created On</h3>
                    <p className="text-lg">{new Date(hardDrive.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Cables</h3>
                    <p className="text-lg">{getCableList()}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Last Updated</h3>
                    <p className="text-lg">{new Date(hardDrive.updatedAt).toLocaleDateString()}</p>
                  </div>
                  <div className="md:col-span-2">
                    <h3 className="text-sm font-medium text-muted-foreground">Data</h3>
                    <p className="text-lg whitespace-pre-wrap">{hardDrive.data || "No data"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="qrcode">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>QR Code</CardTitle>
                  <Button size="sm" variant="outline" onClick={copyQRUrl}>
                    <Clipboard className="h-4 w-4 mr-2" />
                    Copy URL
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col items-center">
                <div className="bg-white p-4 rounded-lg">
                  <QRCodeSVG
                    value={`${window.location.origin}/hard-drives/${hardDrive.id}/view`}
                    size={200}
                    level="H"
                    includeMargin
                  />
                </div>
                <p className="mt-4 text-center text-sm text-muted-foreground max-w-md">
                  This QR code links to a public page showing basic information about this hard drive.
                  Scan it to quickly access hard drive details without logging in.
                </p>
                <div className="mt-4">
                  <Link to={`/hard-drives/${hardDrive.id}/qrcode`}>
                    <Button variant="outline">
                      Generate Printable QR Code
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="history">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center">
                    <History className="h-5 w-5 mr-2" />
                    Print History
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <PrintHistoryTable history={hardDriveHistory} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default HardDriveDetail;
