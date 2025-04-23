
import { useParams, useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { useData } from "@/context/DataContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { QRCodeSVG } from "qrcode.react";
import { ArrowLeft, Printer, Download } from "lucide-react";

const QRCodePage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getHardDrive, getProject } = useData();
  
  const hardDrive = getHardDrive(id || "");
  
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
  
  const project = getProject(hardDrive.projectId);
  const qrCodeUrl = `${window.location.origin}/hard-drives/${hardDrive.id}/view`;
  
  const handlePrint = () => {
    window.print();
  };
  
  const handleDownload = () => {
    const canvas = document.getElementById("qr-canvas") as HTMLCanvasElement;
    if (!canvas) return;
    
    const url = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.download = `qr-${hardDrive.name.replace(/\s+/g, "-")}.png`;
    link.href = url;
    link.click();
  };
  
  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="icon" onClick={() => navigate(`/hard-drives/${hardDrive.id}`)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold">QR Code: {hardDrive.name}</h1>
        </div>
        
        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Print QR Code
          </Button>
          <Button variant="outline" onClick={handleDownload}>
            <Download className="mr-2 h-4 w-4" />
            Download QR Code
          </Button>
        </div>
        
        <Card className="max-w-xl mx-auto">
          <CardContent className="flex flex-col items-center p-12">
            <div className="mb-6 text-center">
              <h2 className="text-2xl font-bold">{hardDrive.name}</h2>
              <p className="text-muted-foreground">S/N: {hardDrive.serialNumber}</p>
              {project && <p className="text-muted-foreground">Project: {project.name}</p>}
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm" id="qr-code">
              <QRCodeSVG 
                id="qr-canvas"
                value={qrCodeUrl} 
                size={300}
                level="H"
                includeMargin={true}
              />
            </div>
            
            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Scan to view detailed information about this hard drive
              </p>
              <p className="text-xs mt-2 break-all">
                {qrCodeUrl}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default QRCodePage;
