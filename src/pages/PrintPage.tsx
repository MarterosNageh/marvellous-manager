import { useRef, useState, useEffect } from "react";
import { useParams, useSearchParams, useNavigate, useLocation } from "react-router-dom";
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
import { HardDriveOutPrintPrev } from "@/components/print/HardDriveOutPrintPrev";
import { HardDriveInPrint } from "@/components/print/HardDriveInPrint";
import { HardDriveInPrintPrev } from "@/components/print/HardDriveInPrintPrev";
import { AllHardsPrint } from "@/components/print/AllHardsPrint";
import { AllHardsPrintPrev } from "@/components/print/AllHardsPrintPrev";
import { HardDriveLabelPrint } from "@/components/print/HardDriveLabelPrint";
import { useQueryClient } from "@tanstack/react-query";

type ExtendedPrintType = PrintType | "hard-label";

interface LocationState {
  type: ExtendedPrintType;
  projectId?: string;
  projectName?: string;
  hardDriveId?: string;
}

const PrintPage = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { getHardDrive, getProject, getHardDrivesByProject, addPrintHistory } = useData();
  const { currentUser } = useAuth();
  const queryClient = useQueryClient();
  
  const state = location.state as LocationState | null;
  const defaultType = state?.type || searchParams.get("type") as ExtendedPrintType || "hard-out";
  const [printType, setPrintType] = useState<ExtendedPrintType>(defaultType);
  const [operatorName, setOperatorName] = useState(currentUser?.username || "");
  const printRef = useRef<HTMLDivElement>(null);
  
  // Determine if this is a project print or hard drive print
  const isProjectPrint = state?.projectId || window.location.pathname.includes("/projects/");
  const projectId = state?.projectId || id;
  
  // Get the hard drive either from state or from URL parameter
  const hardDriveId = state?.hardDriveId || (!isProjectPrint ? id : null);
  const hardDrive = hardDriveId ? getHardDrive(hardDriveId) : null;
  
  // Get project and hard drives
  const project = isProjectPrint ? getProject(projectId) : (hardDrive ? getProject(hardDrive.projectId) : null);
  const hardDrives = isProjectPrint && project ? getHardDrivesByProject(project.id) : 
    (hardDrive && project ? getHardDrivesByProject(project.id) : // Get all drives from project when printing all-hards
    (hardDrive ? [hardDrive] : []));

  // Set default print type for project prints
  useEffect(() => {
    if (isProjectPrint) {
      setPrintType("all-hards");
    }
  }, [isProjectPrint]);

  // Check if we have the required data based on print type
  const hasRequiredData = printType === "all-hards" 
    ? (project !== null) // Only check if project exists for all-hards print type
    : (hardDrive !== null);

  if (!hasRequiredData) {
    return (
      <MainLayout>
        <div className="text-center p-12">
          <h2 className="text-2xl font-bold mb-4">
            {isProjectPrint ? "Project Not Found" : "Hard Drive Not Found"}
          </h2>
          <p className="mb-6">
            The {isProjectPrint ? "project" : "hard drive"} you're looking for doesn't exist or has been removed.
          </p>
          <Button onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
        </div>
      </MainLayout>
    );
  }

  const handlePrint = async () => {
    try {
      console.log('Starting print operation:', { printType, isProjectPrint, project });
      
      // Add print history for all print types
      if (printType === "hard-label" && hardDrive) {
        await addPrintHistory({
          type: "label" as PrintType,
          hardDriveId: hardDrive.id,
          projectId: project?.id || null,
          operatorName,
        });
      } else if ((printType === "hard-out" || printType === "hard-in") && hardDrive) {
        await addPrintHistory({
          type: printType as PrintType,
          hardDriveId: hardDrive.id,
          projectId: project?.id || null,
          operatorName,
        });
      } else if (printType === "all-hards" && project) {
        console.log('Adding all-hards print history:', { project, operatorName });
        
        // Record the project-level print
        await addPrintHistory({
          type: "all-hards" as PrintType,
          hardDriveId: null,
          projectId: project.id,
          operatorName,
        });

        // Also record individual entries for each hard drive with all-hards type
        for (const drive of hardDrives) {
          await addPrintHistory({
            type: "all-hards" as PrintType,
            hardDriveId: drive.id,
            projectId: project.id,
            operatorName,
          });
        }
      }

      // Invalidate print history queries to trigger a refresh
      await queryClient.invalidateQueries({ queryKey: ['project-print-history'] });

      // After database operations are complete, handle the print window
      if (!printRef.current) {
        console.log('Print ref not found');
        return;
      }
      
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
            <link rel="icon" type="image/x-icon" href="/favicon.ico">
            <style>
              @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
              
              body { 
                font-family: "Inter", "ui-sans-serif", sans-serif;
                margin: 0; 
                padding: 0; 
              }

              @media print {
                body { 
                  -webkit-print-color-adjust: exact;
                  print-color-adjust: exact;
                }
                
                @page {
                  margin: 0;
                  size: A4;
                }

                #Container {
                  padding: 20mm;
                }

                #ContainerHard {
                  padding: 10mm;
                }

                #labelP {
                  position: absolute;
                  width: 383.5px;
                  height: 271.7px;
                }

                #label {
                  padding: 20px;
                }

                #header {
                  text-align: center;
                  margin-bottom: 20px;
                }

                #header h1 {
                  margin: 10px 0;
                  font-size: 18px;
                }

                #grid {
                  display: grid;
                  grid-template-columns: 1fr 1fr;
                  gap: 20px;
                  margin-bottom: 20px;
                }

                #info-box {
                  border: 1px solid black;
                  padding: 10px;
                }

                #info-box h3 {
                  margin: 0 0 10px 0;
                  font-size: 14px;
                }

                #info-box table {
                  width: 100%;
                  border-collapse: collapse;
                }

                #info-box td {
                  padding: 5px 0;
                  font-size: 12px;
                }

                #info-box td:first-child {
                  font-weight: 500;
                  width: 40%;
                }

                #signature {
                  margin-top: 30px;
                }

                #signTitle {
                  font-size: 14px;
                  margin-bottom: 20px;
                }

                #signature-line {
                  border-bottom: 1px solid black;
                  height: 30px;
                }

                table {
                  width: 100%;
                  border-collapse: collapse;
                  margin: 10px 0;
                }

                th, td {
                  border: 1px solid black;
                  padding: 8px;
                  text-align: left;
                }

                th {
                  background-color: #f3f4f6;
                }
              }
            </style>
          </head>
          <body>
            ${content.innerHTML}
            <script>
              var label = document.getElementById("labelP");
              if (label) {
                let btn = [];
                for(let x = 0; x <= 7; x++){
                  btn[x] = document.getElementById(x + 1);
                  if (btn[x]) {
                    btn[x].addEventListener("click", () => {
                      // Left side
                      if(x % 2 === 0){
                        label.style.left = "0px";
                        label.style.top = (x/2*271.7) + "px";
                        window.print();
                      // Right side
                      } else {
                        label.style.left = "383.5px";
                        label.style.top = (((x+1)/2-1)*271.7) + "px";
                        window.print();
                      }
                    });
                  }
                }
              } else {
                // If not a label print, print immediately
                window.print();
              }
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    } catch (error) {
      console.error('Error in handlePrint:', error);
      alert('There was an error saving the print history. Please try again.');
    }
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
                onChange={e => setPrintType(e.target.value as ExtendedPrintType)}
              >
                {!isProjectPrint && (
                  <>
                    <option value="hard-out">Hard Drive Out</option>
                    <option value="hard-in">Hard Drive In</option>
                    <option value="hard-label">Print Label</option>
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
                onChange={e => setOperatorName(e.target.value)} 
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

            {printType === "all-hards" && (
              <AllHardsPrint 
                hardDrives={hardDrives} 
                project={project} 
                operatorName={operatorName} 
              />
            )}

            {printType === "hard-label" && hardDrive && (
              <HardDriveLabelPrint hardDrive={hardDrive} project={project} />
            )}
          </div>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Preview</CardTitle>
          </CardHeader>
          <CardContent>
            {!operatorName ? (
              <div className="text-center p-6 border border-dashed rounded-md">
                <p className="text-muted-foreground">
                  Please enter the operator name to see the preview
                </p>
              </div>
            ) : (
              <div className="border rounded-md p-4 bg-white">
                {printType === "hard-out" && hardDrive && (
                  <HardDriveOutPrintPrev 
                    hardDrive={hardDrive} 
                    project={project} 
                    operatorName={operatorName} 
                    isPreviewing={true} 
                  />
                )}

                {printType === "hard-in" && hardDrive && (
                  <HardDriveInPrintPrev 
                    hardDrive={hardDrive} 
                    project={project} 
                    operatorName={operatorName} 
                    isPreviewing={true} 
                  />
                )}

                {printType === "all-hards" && (
                  <AllHardsPrintPrev 
                    hardDrives={hardDrives} 
                    project={project} 
                    operatorName={operatorName} 
                    isPreviewing={true} 
                  />
                )}

                {printType === "hard-label" && hardDrive && (
                  <HardDriveLabelPrint hardDrive={hardDrive} project={project} />
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
