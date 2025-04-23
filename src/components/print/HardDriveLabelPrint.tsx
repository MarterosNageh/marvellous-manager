
import { HardDrive } from "@/types";
import LogoMarvellous from "@/components/LogoMarvellous";

interface HardDriveLabelPrintProps {
  hardDrive: HardDrive;
}
export const HardDriveLabelPrint = ({ hardDrive }: HardDriveLabelPrintProps) => (
  <div className="p-4 border max-w-[400px]">
    <div className="flex items-center justify-center mb-2">
      <LogoMarvellous className="h-10" />
    </div>
    <h2 className="text-lg font-bold text-center mb-2">{hardDrive.name}</h2>
    <div className="mb-1">
      <span className="font-medium">Serial Number:</span> {hardDrive.serialNumber}
    </div>
    <div className="mb-1">
      <span className="font-medium">Capacity:</span> {hardDrive.capacity}
    </div>
    <div className="mb-1">
      <span className="font-medium">Project:</span> {hardDrive.projectId || "N/A"}
    </div>
  </div>
);
