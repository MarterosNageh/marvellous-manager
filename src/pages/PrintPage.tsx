
import { useRef, useState } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { useData } from "@/context/DataContext";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Printer, HardDrive } from "lucide-react";
import { PrintType } from "@/types";
import { HardDriveOutPrint } from "@/components/print/HardDriveOutPrint";
import { HardDriveInPrint } from "@/components/print/HardDriveInPrint";
import { AllHardsPrint } from "@/components/print/AllHardsPrint";
import { HardDriveLabelPrint } from "@/components/print/HardDriveLabelPrint";

type ExtendedPrintType = PrintType | "hard-label";

const PrintPage = () => {
  const {
    id
  } = useParams<{
    id: string;
  }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const {
    getHardDrive,
    getProject,
    getHardDrivesByProject,
    addPrintHistory,
  } = useData();
  const {
    currentUser
  } = useAuth();
  const defaultType = searchParams.get("type") as ExtendedPrintType || "hard-out";
  const [printType, setPrintType] = useState<ExtendedPrintType>(defaultType);
  const [operatorName, setOperatorName] = useState(currentUser?.username || "");
  const printRef = useRef<HTMLDivElement>(null);
  const isProjectPrint = window.location.pathname.includes("/projects/");
  const hardDrive = !isProjectPrint ? getHardDrive(id || "") : null;
  const project = isProjectPrint ? getProject(id || "") : hardDrive ? getProject(hardDrive.projectId) : null;
  const hardDrives = isProjectPrint && project ? getHardDrivesByProject(project.id) : hardDrive ? [hardDrive] : [];

  if (!hardDrive && !isProjectPrint || isProjectPrint && !project || !hardDrives.length) {
    return <MainLayout>
        <div className="text-center p-12">
          <h2 className="text-2xl font-bold mb-4">Hard Drive Not Found</h2>
          <p className="mb-6">The hard drive or project you're looking for doesn't exist or has been removed.</p>
          <Button onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
        </div>
      </MainLayout>;
  }

  const handlePrint = () => {
    if ((printType === "hard-out" || printType === "hard-in") && hardDrive) {
      addPrintHistory({
        type: printType as PrintType,
        hardDriveId: hardDrive.id,
        projectId: project?.id || null,
        operatorName,
      });
    } else if (printType === "hard-label" && hardDrive) {
      // Add print history for label prints too
      addPrintHistory({
        type: "all-hards", // Use this type for hard drive labels since it's not covered by the PrintType
        hardDriveId: hardDrive.id,
        projectId: project?.id || null,
        operatorName,
      });
    } else if (printType === "all-hards" && isProjectPrint && project) {
      // Add print history for project prints
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
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
            @media print {
              body { padding: 0; }
              button { display: none; }
            }
             #Container {
                width: 767px;
                height: 1087px;
                margin-top: 8px;
            }
            #label {
                height: 271.7;
                position: relative;
                left: 0px;
                width: 383.5px;
                text-align: center;
                padding: 5px;
                top: 0px;
            }
            #card{
            rotate:90deg;
            }
          </style>
        </head>
        <body>
          <div style="text-align: center; margin-top: 20px;position: absolute;left:363.5px;z-index:99;">
            <button id="1" >01</button>
            <button id="2" >02</button>
                          <br>
            <button id="3" >03</button>
            <button id="4" >04</button>
                          <br>
            <button id="5" >05</button>
            <button id="6" >06</button>
                          <br>
            <button id="7" >07</button>
            <button id="8" >08</button>

          </div>
          ${content.innerHTML}
<script>
var Container =document.getElementById("Container");
var label =document.getElementById("label");

let btn = [];
for(let x=0;x<=7;x++){
      btn[x] =document.getElementById(x+1);

      btn[x].addEventListener("click",()=>{
      // listner Left side
      if(x % 2== 0){
      label.style.left="0px";
      label.style.top=(x/2*271.7)+"px";
      window.print();
       // listner Right side
      }else{

      label.style.left="383.5px";
      label.style.top=(((x+1)/2-1)*271.7)+"px";
      window.print();
      }
            });
            
}
/*
var one =document.getElementById("1");
var two =document.getElementById("2");
var three =document.getElementById("3");
var four =document.getElementById("4");
var five =document.getElementById("5");
var six =document.getElementById("6");
var seven =document.getElementById("7");
var eight =document.getElementById("8");

// one 
one.addEventListener("click",()=>{
      label.style.left="0px";
      label.style.top="0px";
    window.print();
});
*/

</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return <MainLayout>
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
            {!isProjectPrint && <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                
                
                
              </div>}
            
            <div className="space-y-2">
              <Label htmlFor="printType">Print Type</Label>
              <select id="printType" className="w-full p-2 border rounded-md" value={printType} onChange={e => setPrintType(e.target.value as ExtendedPrintType)}>
                {!isProjectPrint && <>
                    <option value="hard-out">Hard Drive Out</option>
                    <option value="hard-in">Hard Drive In</option>
                    <option value="hard-label">Print Label</option>
                  </>}
                <option value="all-hards">All Hard Drives Info</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="operatorName">Operator Name</Label>
              <Input id="operatorName" value={operatorName} onChange={e => setOperatorName(e.target.value)} placeholder="Enter operator name" required />
            </div>
            
            <Button className="mt-4 w-full" disabled={!operatorName} onClick={handlePrint}>
              <Printer className="mr-2 h-4 w-4" />
              Print Document
            </Button>
          </CardContent>
        </Card>
        
        <div className="hidden">
          <div ref={printRef}>
            {printType === "hard-out" && hardDrive && <HardDriveOutPrint hardDrive={hardDrive} project={project} operatorName={operatorName} />}

            {printType === "hard-in" && hardDrive && <HardDriveInPrint hardDrive={hardDrive} project={project} operatorName={operatorName} />}

            {printType === "all-hards" && <AllHardsPrint hardDrives={hardDrives} project={project} operatorName={operatorName} />}

            {printType === "hard-label" && hardDrive && <HardDriveLabelPrint hardDrive={hardDrive} />}
          </div>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Preview</CardTitle>
          </CardHeader>
          <CardContent>
            {!operatorName ? <div className="text-center p-6 border border-dashed rounded-md">
                <p className="text-muted-foreground">
                  Please enter the operator name to see the preview
                </p>
              </div> : <div className="border rounded-md p-4 bg-white">
                {printType === "hard-out" && hardDrive && <HardDriveOutPrint hardDrive={hardDrive} project={project} operatorName={operatorName} isPreviewing={true} />}

                {printType === "hard-in" && hardDrive && <HardDriveInPrint hardDrive={hardDrive} project={project} operatorName={operatorName} isPreviewing={true} />}

                {printType === "all-hards" && <AllHardsPrint hardDrives={hardDrives} project={project} operatorName={operatorName} isPreviewing={true} />}

                {printType === "hard-label" && hardDrive && <HardDriveLabelPrint hardDrive={hardDrive} />}
              </div>}
          </CardContent>
        </Card>
      </div>
    </MainLayout>;
};

export default PrintPage;
