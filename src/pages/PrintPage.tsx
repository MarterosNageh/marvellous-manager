
import { useRef, useState } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { useData } from "@/context/DataContext";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Printer } from "lucide-react";
import { PrintType } from "@/types";
import { HardDriveOutPrint } from "@/components/print/HardDriveOutPrint";
import { HardDriveInPrint } from "@/components/print/HardDriveInPrint";
import { AllHardsPrint } from "@/components/print/AllHardsPrint";
import { HardDriveLabelPrint } from "@/components/print/HardDriveLabelPrint";

const PrintPage = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { getHardDrive, getProject, getHardDrivesByProject } = useData();
  const { currentUser } = useAuth();

  const defaultType = searchParams.get("type") as PrintType || "hard-out";
  const [printType, setPrintType] = useState<PrintType>(defaultType);
  const [operatorName, setOperatorName] = useState(currentUser?.username || "");

  const printRef = useRef<HTMLDivElement>(null);

  // Determine if we're printing for a hard drive or a project
  const isProjectPrint = window.location.pathname.includes("/projects/");

  const hardDrive = !isProjectPrint ? getHardDrive(id || "") : null;
  const project = isProjectPrint
    ? getProject(id || "")
    : hardDrive
      ? getProject(hardDrive.projectId)
      : null;

  const hardDrives = isProjectPrint && project
    ? getHardDrivesByProject(project.id)
    : hardDrive
      ? [hardDrive]
      : [];

  if ((!hardDrive && !isProjectPrint) || (isProjectPrint && !project) || !hardDrives.length) {
    return (
      <MainLayout>
        <div className="text-center p-12">
          <h2 className="text-2xl font-bold mb-4">Hard Drive Not Found</h2>
          <p className="mb-6">The hard drive or project you're looking for doesn't exist or has been removed.</p>
          <Button onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
        </div>
      </MainLayout>
    );
  }

  const handlePrint = () => {
    if (!printRef.current) return;

    const content = printRef.current;
    const printWindow = window.open('', '_blank');

    if (!printWindow) {
      alert("Please allow popups for this website");
      return;
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>Print Document - Marvellous Manager</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background:#fff; }
            @media print {
              body { padding: 0; background:#fff; }
              button { display: none; }
            }
          </style>
        </head>
        <body>
          ${content.innerHTML}
          <div style="text-align: center; margin-top: 20px;">
            <button onclick="window.print()">Print</button>
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold">Print Document</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Print Options</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="printType">Print Type</Label>
              <select
                id="printType"
                className="w-full p-2 border rounded-md"
                value={printType}
                onChange={(e) => setPrintType(e.target.value as PrintType)}
              >
                {!isProjectPrint && (
                  <>
                    <option value="hard-out">Hard Drive Out</option>
                    <option value="hard-in">Hard Drive In</option>
                    <option value="label">Print Label</option>
                  </>
                )}
                <option value="all-hards">All Hard Drives Info</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="operatorName">Operator Name</Label>
              <Input
                id="operatorName"
                value={operatorName}
                onChange={(e) => setOperatorName(e.target.value)}
                placeholder="Enter operator name"
                required
              />
            </div>

            <Button
              className="mt-4 w-full"
              disabled={!operatorName}
              onClick={handlePrint}
            >
              <Printer className="mr-2 h-4 w-4" />
              Print Document
            </Button>
          </CardContent>
        </Card>

        <div className="hidden">
          <div ref={printRef}>
            {printType === "hard-out" && hardDrive && (
              <HardDriveOutPrint
                hardDrive={hardDrive}
                project={project}
                operatorName={operatorName}
              />
            )}

            {printType === "hard-in" && hardDrive && (
              <HardDriveInPrint
                hardDrive={hardDrive}
                project={project}
                operatorName={operatorName}
              />
            )}

            {printType === "label" && hardDrive && (
              <HardDriveLabelPrint hardDrive={hardDrive} project={project} />
            )}

            {printType === "all-hards" && (
              <AllHardsPrint
                hardDrives={hardDrives}
                project={project}
                operatorName={operatorName}
              />
            )}
          </div>
        </div>

        {/* Preview of the print */}
        <Card>
          <CardHeader>
            <CardTitle>Preview</CardTitle>
          </CardHeader>
          <CardContent>
            {!operatorName && printType !== "label" ? (
              <div className="text-center p-6 border border-dashed rounded-md">
                <p className="text-muted-foreground">
                  Please enter the operator name to see the preview
                </p>
              </div>
            ) : (
              <div className="border rounded-md p-4 bg-white">
                {printType === "hard-out" && hardDrive && (
                  <HardDriveOutPrint
                    hardDrive={hardDrive}
                    project={project}
                    operatorName={operatorName}
                    isPreviewing={true}
                  />
                )}

                {printType === "hard-in" && hardDrive && (
                  <HardDriveInPrint
                    hardDrive={hardDrive}
                    project={project}
                    operatorName={operatorName}
                    isPreviewing={true}
                  />
                )}

                {printType === "label" && hardDrive && (
                  <HardDriveLabelPrint hardDrive={hardDrive} project={project} />
                )}

                {printType === "all-hards" && (
                  <AllHardsPrint
                    hardDrives={hardDrives}
                    project={project}
                    operatorName={operatorName}
                    isPreviewing={true}
                  />
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default PrintPage;
