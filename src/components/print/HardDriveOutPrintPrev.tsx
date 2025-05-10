
import { HardDrive, Project } from "@/types";
import LogoMarvellous from "@/components/LogoMarvellous";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";

interface HardDriveOutPrintProps {
  hardDrive: HardDrive;
  project: Project | null;
  operatorName: string;
  isPreviewing?: boolean;
}

export const HardDriveOutPrintPrev = ({
  hardDrive,
  project,
  operatorName,
  isPreviewing = false
}: HardDriveOutPrintProps) => {
  const now = new Date();
  const dateStr = now.toLocaleDateString();
  const timeStr = now.toLocaleTimeString();

  // Use consistent styling between preview and print
  const containerClass = "bg-white max-w-4xl mx-auto";
  const contentClass = "print:p-0";
  const paddingClass = isPreviewing ? "p-4" : "p-6";
  const textSizeClass = isPreviewing ? "text-sm" : "text-base";

  return (
    <div id="Container" className={`${paddingClass} ${textSizeClass} ${containerClass}`}>
      <div id="label" className={`${contentClass}`}>
        <div className="text-center mb-4">
          <LogoMarvellous className="h-12 mx-auto mb-2" />
          <h1 className="text-xl font-bold">Hard Drive Transfer Out</h1>

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
        
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div>
            <h3 className="font-bold text-sm border-b pb-1 mb-2">Cables Included</h3>
            <ul className="list-disc ml-5">
              {hardDrive.cables.thunderbolt3 && <li>Thunderbolt 3</li>}
              {hardDrive.cables.typeC && <li>USB Type C</li>}
              {hardDrive.cables.power && <li>Power</li>}
              {hardDrive.cables.usb3 && <li>USB 3</li>}
              {hardDrive.cables.passport && <li>Passport Cable</li>}
              {hardDrive.cables.other && <li>{hardDrive.cables.other}</li>}
            </ul>
          </div>
        </div>
        
          <div>
            <h3 className="font-bold text-sm">Recipient Signature</h3>
            <div className="border-b border-black h-8 mt-8"></div>
          </div>
        </div>
      </div>
  );
};
