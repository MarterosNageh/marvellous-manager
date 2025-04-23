
import { HardDrive, Project } from "@/types";
import LogoMarvellous from "@/components/LogoMarvellous";
import { QRCodeSVG } from "qrcode.react";

interface HardDriveLabelPrintProps {
  hardDrive: HardDrive;
  project?: Project | null;
}

export const HardDriveLabelPrint = ({ hardDrive, project }: HardDriveLabelPrintProps) => {
  const qrCodeUrl = `${window.location.origin}/hard-drives/${hardDrive.id}/view`;
  return (
    <div className="p-4 border max-w-[400px] bg-white rounded-md shadow-md text-center">
      {/* Logo at the top */}
      <div className="flex items-center justify-center mb-3">
        <LogoMarvellous className="h-10" />
      </div>
      {/* Hard drive details */}
      <h2 className="text-lg font-bold mb-1">{hardDrive.name}</h2>
      <div className="text-sm mb-1">
        <span className="font-medium">Serial Number:</span> {hardDrive.serialNumber}
      </div>
      <div className="text-sm mb-1">
        <span className="font-medium">Project:</span> {project?.name || hardDrive.projectId || "N/A"}
      </div>
      <div className="text-sm mb-1">
        <span className="font-medium">Capacity:</span> {hardDrive.capacity}
      </div>
      <div className="text-sm mb-2">
        <span className="font-medium">Free Space:</span> {hardDrive.freeSpace}
      </div>
      {/* Optionally include any "Data" field */}
      {hardDrive.data && (
        <div className="text-xs mb-2 opacity-80">
          <span className="font-medium">Data:</span> {hardDrive.data}
        </div>
      )}
      {/* QR Code */}
      <div className="flex justify-center my-3">
        <QRCodeSVG value={qrCodeUrl} size={80} level="H" />
      </div>
    </div>
  );
};
