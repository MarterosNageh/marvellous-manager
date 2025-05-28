
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
import { HardDriveOutPrintPrev } from "@/components/print/HardDriveOutPrintPrev";
import { HardDriveInPrint } from "@/components/print/HardDriveInPrint";
import { HardDriveInPrintPrev } from "@/components/print/HardDriveInPrintPrev";
import { AllHardsPrint } from "@/components/print/AllHardsPrint";
import { AllHardsPrintPrev } from "@/components/print/AllHardsPrintPrev";
import { HardDriveLabelPrint } from "@/components/print/HardDriveLabelPrint";

type ExtendedPrintType = PrintType | "hard-label";

const PrintPage = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { getHardDrive, getProject, getHardDrivesByProject, addPrintHistory } = useData();
  const { currentUser } = useAuth();
  
  const defaultType = searchParams.get("type") as ExtendedPrintType || "hard-out";
  const [printType, setPrintType] = useState<ExtendedPrintType>(defaultType);
  const [operatorName, setOperatorName] = useState(currentUser?.username || "");
  const printRef = useRef<HTMLDivElement>(null);
  
  // Determine if this is a project print or hard drive print
  const isProjectPrint = window.location.pathname.includes("/projects/");
  
  // Get the relevant data
  const hardDrive = !isProjectPrint && id ? getHardDrive(id) : null;
  const project = isProjectPrint && id ? getProject(id) : (hardDrive ? getProject(hardDrive.projectId) : null);
  const hardDrives = isProjectPrint && project ? getHardDrivesByProject(project.id) : (hardDrive ? [hardDrive] : []);

  // Check if we have the required data
  const hasRequiredData = isProjectPrint ? (project && hardDrives.length > 0) : hardDrive;

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

  const handlePrint = () => {
    // Add print history for all print types
    if (printType === "hard-label" && hardDrive) {
      addPrintHistory({
        type: "label" as PrintType,
        hardDriveId: hardDrive.id,
        projectId: project?.id || null,
        operatorName,
      });
    } else if ((printType === "hard-out" || printType === "hard-in") && hardDrive) {
      addPrintHistory({
        type: printType as PrintType,
        hardDriveId: hardDrive.id,
        projectId: project?.id || null,
        operatorName,
      });
    } else if (printType === "all-hards" && isProjectPrint && project) {
      addPrintHistory({
        type: printType,
        hardDriveId: null,
        projectId: project.id,
        operatorName,
      });
    }

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
          <link rel="icon" type="image/x-icon" href="/favicon.ico">
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
            
            body { 
              font-family: "Inter", "ui-sans-serif", sans-serif;
              margin: 0; 
              padding: 0; 
            }

            @media print {
              body { padding: 0; }
              button { display: none; }
              
              #header, #info-box, #signature {
                page-break-inside: avoid;
              }

              #ContainerHard {
                max-width: 100%;
                padding: 10mm;
              }

              #signature-text {
                display: block;
                text-align: center;
              }
            }

            #ContainerP {
              height: 1087px;
              margin: 0 auto;
              position: relative;
              background-color: white;
            }

            #labelP {
              height: 271.7px;
              position: relative;
              left: 0px;
              width: 383.5px;
              text-align: center;
              padding: 5px;
              top: 0px;
            }

            #BtnContainer {
              text-align: center;
              margin-top: 20px;
              position: absolute;
              left: 363.5px;
              z-index: 99;
            }

            #card {
              transform: rotate(90deg);
            }

            #ContainerHard {
              width: 100%;
              background-color: white;
              border-radius: 8px;
              max-height: 100%;
              overflow: hidden;
            }

            .content-wrapper {
              width: 90%;
              display: flex;
              justify-content: center;
              align-items: flex-start;
              min-height: 100vh;
              flex-direction: column;
            }

            #header {
              text-align: center;
              margin-bottom: 30px;
            }

            h1 {
              font-size: 26px;
              font-weight: bold;
              color: #333;
            }

            p {
              font-size: 16px;
              color: #6c757d;
            }

            #grid {
              display: grid;
              grid-template-columns: 1fr;
              gap: 20px;
            }

            @media (min-width: 768px) {
              #grid {
                grid-template-columns: 1fr 1fr;
              }
            }

            #info-box {
              background-color: #ffffff;
              padding: 15px;
              border-radius: 8px;
            }

            h3 {
              font-size: 18px;
              font-weight: bold;
              color: #333;
              margin-bottom: 12px;
              border-bottom: 2px solid #e0e0e0;
              padding-bottom: 8px;
            }

            table {
              width: 100%;
              border-collapse: collapse;
            }

            table td {
              padding: 6px 12px;
              border-bottom: 1px solid #f1f1f1;
              font-size: 14px;
              color: #555;
            }

            table td:first-child {
              font-weight: bold;
            }

            #cables {
              margin-top: 30px;
            }

            #cables ul {
              list-style-type: disc;
              margin-left: 25px;
              font-size: 14px;
              color: #555;
            }

            #cables li {
              margin-bottom: 6px;
            }

            #signature {
              margin-top: 30px;
              text-align: center;
            }

            #signature-line {
              height: 2px;
              width: 250px;
              margin-left: auto;
              margin-right: auto;
              border-bottom: 1px dashed black;
              margin-top: 50px;
            }

            #signature-text {
              font-size: 14px;
              color: #555;
              margin-top: 8px;
            }

            #signTitle {
              border-bottom: 0px solid white;
            }

            .print-controls {
              padding: 20px;
              background: #f5f5f5;
              border-bottom: 1px solid #ddd;
              text-align: center;
              display: flex;
              justify-content: center;
              flex-wrap: wrap;
              gap: 10px;
            }

            .print-controls button {
              background: #0070f3;
              color: white;
              border: none;
              padding: 8px 16px;
              border-radius: 4px;
              cursor: pointer;
              font-weight: 500;
              margin: 5px;
            }

            .print-controls button:hover {
              background: #0051a8;
            }
          </style>
        </head>
        <body>
          ${printType === "hard-label" ? `
            <div id="BtnContainer">
              <button id="1">01</button>
              <button id="2">02</button>
              <br>
              <button id="3">03</button>
              <button id="4">04</button>
              <br>
              <button id="5">05</button>
              <button id="6">06</button>
              <br>
              <button id="7">07</button>
              <button id="8">08</button>
            </div>
            <div class="ContainerP">
              ${content.innerHTML}
            </div>
          ` : `
            <div class="content-wrapper">
              ${content.innerHTML}
            </div>
          `}

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
            }
          </script>
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
