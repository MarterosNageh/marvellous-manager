
import { HardDrive, Project } from "@/types";
import LogoMarvellous from "@/components/LogoMarvellous";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";

interface HardDriveInPrintProps {
  hardDrive: HardDrive;
  project: Project | null;
  operatorName: string;
  isPreviewing?: boolean;
}

export const HardDriveInPrint = ({
  hardDrive,
  project,
  operatorName,
  isPreviewing = false
}: HardDriveInPrintProps) => {
  const now = new Date();
  const dateStr = now.toLocaleDateString();
  const timeStr = now.toLocaleTimeString();

  return (
    <div id="Container" className={`${isPreviewing ? 'p-4 text-sm' : 'p-6 text-base'} bg-white max-w-4xl mx-auto`}>
      <div id="label" className={`${isPreviewing ? 'print:text-sm' : 'print:text-base'} print:p-0`}>
        <div className="text-center mb-4">
          <LogoMarvellous className="h-12 mx-auto mb-2" />
          <h1 className="text-xl font-bold">Hard Drive Transfer In</h1>
          <p className="text-muted-foreground">Marvellous Manager</p>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <div className="mb-4">
              <h3 className="font-bold text-sm border-b pb-1 mb-2">Hard Drive Information</h3>
              <Table className="border-collapse">
                <TableBody>
                  <TableRow className="border-0">
                    <TableCell className="py-1 px-0 font-medium">Name:</TableCell>
                    <TableCell className="py-1 px-0">{hardDrive.name}</TableCell>
                  </TableRow>
                  <TableRow className="border-0">
                    <TableCell className="py-1 px-0 font-medium">Serial Number:</TableCell>
                    <TableCell className="py-1 px-0">{hardDrive.serialNumber}</TableCell>
                  </TableRow>
                  <TableRow className="border-0">
                    <TableCell className="py-1 px-0 font-medium">Capacity:</TableCell>
                    <TableCell className="py-1 px-0">{hardDrive.capacity}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
            
            <div>
              <h3 className="font-bold text-sm border-b pb-1 mb-2">Project Information</h3>
              <Table className="border-collapse">
                <TableBody>
                  <TableRow className="border-0">
                    <TableCell className="py-1 px-0 font-medium">Project:</TableCell>
                    <TableCell className="py-1 px-0">{project?.name || 'N/A'}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>
          
          <div>
            <div className="mb-4">
              <h3 className="font-bold text-sm border-b pb-1 mb-2">Date & Time</h3>
              <Table className="border-collapse">
                <TableBody>
                  <TableRow className="border-0">
                    <TableCell className="py-1 px-0 font-medium">Date:</TableCell>
                    <TableCell className="py-1 px-0">{dateStr}</TableCell>
                  </TableRow>
                  <TableRow className="border-0">
                    <TableCell className="py-1 px-0 font-medium">Time:</TableCell>
                    <TableCell className="py-1 px-0">{timeStr}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
            
            <div>
              <h3 className="font-bold text-sm border-b pb-1 mb-2">Operator</h3>
              <Table className="border-collapse">
                <TableBody>
                  <TableRow className="border-0">
                    <TableCell className="py-1 px-0 font-medium">Name:</TableCell>
                    <TableCell className="py-1 px-0">{operatorName}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
        
        <div className="mb-6">
          <h3 className="font-bold text-sm border-b pb-1 mb-2">Data Description</h3>
          <div className="border p-2 min-h-[60px] rounded-md">{hardDrive.data || 'N/A'}</div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div>
            <h3 className="font-bold text-sm border-b pb-1 mb-2">Cables Returned</h3>
            <ul className="list-disc ml-5">
              {hardDrive.cables.thunderbolt3 && <li>Thunderbolt 3</li>}
              {hardDrive.cables.typeC && <li>USB Type C</li>}
              {hardDrive.cables.power && <li>Power</li>}
              {hardDrive.cables.usb3 && <li>USB 3</li>}
              {hardDrive.cables.other && <li>{hardDrive.cables.other}</li>}
            </ul>
          </div>
          
          <div>
            <h3 className="font-bold text-sm border-b pb-1 mb-2">Condition Check</h3>
            <div className="mt-2 flex items-center gap-2">
              <div className="border border-black w-5 h-5"></div>
              <span>Good</span>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <div className="border border-black w-5 h-5"></div>
              <span>Needs attention</span>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-10 mt-10">
          <div>
            <h3 className="font-bold text-sm">Operator Signature</h3>
            <div className="border-b border-black h-8 mt-8"></div>
          </div>
          
          <div>
            <h3 className="font-bold text-sm">Returnee Signature</h3>
            <div className="border-b border-black h-8 mt-8"></div>
          </div>
        </div>
      </div>
    </div>
  );
};
