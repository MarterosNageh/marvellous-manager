import { HardDrive, Project } from "@/types";
import LogoMarvellous from "@/components/LogoMarvellous";

interface HardDriveOutPrintProps {
  hardDrive: HardDrive;
  project: Project | null;
  operatorName: string;
  isPreviewing?: boolean;
}

export const HardDriveOutPrint = ({
  hardDrive,
  project,
  operatorName,
  isPreviewing = false
}: HardDriveOutPrintProps) => {
  const now = new Date();
  const dateStr = now.toLocaleDateString();
  const timeStr = now.toLocaleTimeString();

  return (
    <div className={`p-6 ${isPreviewing ? 'text-sm' : 'text-base'}`}>
      <div className="text-center mb-6">
        <LogoMarvellous className="h-12 mx-auto mb-2" />
        <h1 className="text-xl font-bold">Hard Drive Transfer Out</h1>
        <p className="text-muted-foreground">Marvellous Manager</p>
      </div>
      
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <div className="mb-4">
            <h3 className="font-bold text-sm">Hard Drive Information</h3>
            <p><span className="font-medium">Name:</span> {hardDrive.name}</p>
            <p><span className="font-medium">Serial Number:</span> {hardDrive.serialNumber}</p>
            <p><span className="font-medium">Capacity:</span> {hardDrive.capacity}</p>
          </div>
          
          <div>
            <h3 className="font-bold text-sm">Project Information</h3>
            <p><span className="font-medium">Project:</span> {project?.name || 'N/A'}</p>
          </div>
        </div>
        
        <div>
          <div className="mb-4">
            <h3 className="font-bold text-sm">Date & Time</h3>
            <p><span className="font-medium">Date:</span> {dateStr}</p>
            <p><span className="font-medium">Time:</span> {timeStr}</p>
          </div>
          
          <div>
            <h3 className="font-bold text-sm">Operator</h3>
            <p><span className="font-medium">Name:</span> {operatorName}</p>
          </div>
        </div>
      </div>
      
      <div className="mb-6">
        <h3 className="font-bold text-sm">Data Description</h3>
        <p className="border p-2 min-h-[60px] rounded-md">{hardDrive.data || 'N/A'}</p>
      </div>
      
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div>
          <h3 className="font-bold text-sm">Cables Included</h3>
          <ul className="list-disc ml-5">
            {hardDrive.cables.thunderbolt3 && <li>Thunderbolt 3</li>}
            {hardDrive.cables.typeC && <li>USB Type C</li>}
            {hardDrive.cables.power && <li>Power</li>}
            {hardDrive.cables.usb3 && <li>USB 3</li>}
            {hardDrive.cables.other && <li>{hardDrive.cables.other}</li>}
          </ul>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-10 mt-10">
        <div>
          <h3 className="font-bold text-sm">Operator Signature</h3>
          <div className="border-b border-black h-8 mt-8"></div>
        </div>
        
        <div>
          <h3 className="font-bold text-sm">Recipient Signature</h3>
          <div className="border-b border-black h-8 mt-8"></div>
        </div>
      </div>
    </div>
  );
};
