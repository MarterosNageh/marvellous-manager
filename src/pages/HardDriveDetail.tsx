import { useParams, Link, useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { useData } from "@/context/DataContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { QRCodeSVG } from "qrcode.react";
import { Check, XCircle, Edit, Trash, ArrowLeft, Printer, History } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useRef } from "react";
import { HardDriveLabelPrint } from "@/components/print/HardDriveLabelPrint";
import { PrintHistoryTable } from "@/components/print/PrintHistoryTable";

const HardDriveDetail = () => {
  const {
    id
  } = useParams<{
    id: string;
  }>();
  const navigate = useNavigate();
  const {
    getHardDrive,
    getProject,
    deleteHardDrive,
    printHistory,
    addPrintHistory
  } = useData();
  const hardDrive = getHardDrive(id || "");
  if (!hardDrive) {
    return <MainLayout>
        <div className="text-center p-12">
          <h2 className="text-2xl font-bold mb-4">Hard Drive Not Found</h2>
          <p className="mb-6">The hard drive you're looking for doesn't exist or has been removed.</p>
          <Button onClick={() => navigate("/hard-drives")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Hard Drives
          </Button>
        </div>
      </MainLayout>;
  }
  const project = getProject(hardDrive.projectId);
  const qrCodeUrl = `${window.location.origin}/hard-drives/${hardDrive.id}/view`;
  const labelRef = useRef<HTMLDivElement>(null);
  
  // Filter print history for this hard drive
  const hardDriveHistory = printHistory.filter(
    (item) => item.hardDriveId === hardDrive.id
  ).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  
  const handleDelete = () => {
    deleteHardDrive(hardDrive.id);
    navigate("/hard-drives");
  };
  
  const handlePrintLabel = () => {
    if (!labelRef.current) return;
    
    // Log the label print in print history
    addPrintHistory({
      type: "label",
      hardDriveId: hardDrive.id,
      projectId: hardDrive.projectId,
      operatorName: "Current User" // In a real app, this would use the current user's name
    });
    
    const content = labelRef.current;
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Please allow popups for this website");
      return;
    }
    printWindow.document.write(`
      <html>
        <head>
          <title>Print Hard Drive Label - Marvellous Manager</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f8f8ff; }
            @media print {
              body { padding: 0; }
              button { display: none; }
            }
          </style>
        </head>
        <body>
          ${content.innerHTML}
          <div style="text-align: center; margin-top: 20px;">
            <button onclick="window.print()">Print Label</button>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };
  
  return <MainLayout>
      <div className="space-y-6 px-[15px] mx-[5px] py-[7px]">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="icon" onClick={() => navigate("/hard-drives")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-3xl font-bold">{hardDrive.name}</h1>
          </div>
          <div className="flex gap-2">
            <Link to={`/hard-drives/${hardDrive.id}/print`}>
              <Button variant="outline">
                <Printer className="mr-2 h-4 w-4" />
                Print
              </Button>
            </Link>
            <Link to={`/hard-drives/${hardDrive.id}/edit`}>
              <Button variant="outline">
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
            </Link>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <Trash className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the
                    hard drive and all of its data.
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
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Hard Drive Details</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Name</dt>
                    <dd className="text-lg">{hardDrive.name}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Serial Number</dt>
                    <dd className="text-lg">{hardDrive.serialNumber}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Project</dt>
                    <dd className="text-lg">
                      {project ? <Link to={`/projects/${project.id}`} className="text-blue-600 hover:underline">
                          {project.name}
                        </Link> : "Unknown Project"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Capacity</dt>
                    <dd className="text-lg">{hardDrive.capacity}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Free Space</dt>
                    <dd className="text-lg">{hardDrive.freeSpace}</dd>
                  </div>
                  <div className="sm:col-span-2">
                    <dt className="text-sm font-medium text-muted-foreground">Data</dt>
                    <dd className="text-lg whitespace-pre-wrap">{hardDrive.data || "No data description provided"}</dd>
                  </div>
                </dl>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Available Cables</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="grid grid-cols-2 gap-2">
                  <li className="flex items-center">
                    {hardDrive.cables.thunderbolt3 ? <Check className="h-5 w-5 text-green-500 mr-2" /> : <XCircle className="h-5 w-5 text-red-500 mr-2" />}
                    <span>Thunderbolt 3</span>
                  </li>
                  <li className="flex items-center">
                    {hardDrive.cables.typeC ? <Check className="h-5 w-5 text-green-500 mr-2" /> : <XCircle className="h-5 w-5 text-red-500 mr-2" />}
                    <span>USB Type C</span>
                  </li>
                  <li className="flex items-center">
                    {hardDrive.cables.power ? <Check className="h-5 w-5 text-green-500 mr-2" /> : <XCircle className="h-5 w-5 text-red-500 mr-2" />}
                    <span>Power</span>
                  </li>
                  <li className="flex items-center">
                    {hardDrive.cables.usb3 ? <Check className="h-5 w-5 text-green-500 mr-2" /> : <XCircle className="h-5 w-5 text-red-500 mr-2" />}
                    <span>USB 3</span>
                  </li>
                </ul>
                {hardDrive.cables.other && <div className="mt-4">
                    <h4 className="text-sm font-medium text-muted-foreground">Other Files</h4>
                    <p>{hardDrive.cables.other}</p>
                  </div>}
              </CardContent>
            </Card>
          </div>
          
          <div>
            <Card>
              <CardHeader>
                <CardTitle>QR Code</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center">
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <QRCodeSVG value={qrCodeUrl} size={200} />
                </div>
                <p className="mt-4 text-sm text-center text-muted-foreground">
                  Scan to quickly access hard drive details
                </p>
                <div className="mt-4">
                  <Link to={`/hard-drives/${hardDrive.id}/qr`}>
                    <Button variant="outline" className="w-full">View Full QR</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
            
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Print Options</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link to={`/hard-drives/${hardDrive.id}/print?type=hard-out`}>
                  <Button variant="outline" className="w-full justify-start">
                    <Printer className="mr-2 h-4 w-4" />
                    Hard Drive Out
                  </Button>
                </Link>
                <Link to={`/hard-drives/${hardDrive.id}/print?type=hard-in`}>
                  <Button variant="outline" className="w-full justify-start">
                    <Printer className="mr-2 h-4 w-4" />
                    Hard Drive In
                  </Button>
                </Link>
                <Button variant="outline" className="w-full justify-start" onClick={handlePrintLabel}>
                  <Printer className="mr-2 h-4 w-4" />
                  Print Label
                </Button>
              </CardContent>
            </Card>
            <div className="hidden">
              <div ref={labelRef}>
                <HardDriveLabelPrint hardDrive={hardDrive} project={project} />
              </div>
            </div>
          </div>
        </div>
        
        {/* Print History Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center">
              <History className="h-5 w-5 mr-2" />
              Print History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <PrintHistoryTable history={hardDriveHistory} />
          </CardContent>
        </Card>
      </div>
    </MainLayout>;
};

export default HardDriveDetail;
