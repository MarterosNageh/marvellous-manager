
import { HardDrive } from "@/types";
import LogoMarvellous from "@/components/LogoMarvellous";
import { QRCodeSVG } from "qrcode.react";

interface HardDriveLabelPrintProps {
  hardDrive: HardDrive;
}

export const HardDriveLabelPrint = ({ hardDrive }: HardDriveLabelPrintProps) => {
  const qrCodeUrl = `${window.location.origin}/hard-drives/${hardDrive.id}/view`;
  return (
    <div className="p-4 border max-w-[400px] bg-white rounded-md shadow-md text-center">
      {/* Logo at the top */}
      <div className="flex items-center justify-center mb-2">
        <LogoMarvellous className="h-10" />
      </div>
      {/* QR Code */}
      <div className="flex justify-center my-2">
        <QRCodeSVG value={qrCodeUrl} size={80} level="H" />
      </div>
      <h2 className="text-lg font-bold mb-2">{hardDrive.name}</h2>
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
};
