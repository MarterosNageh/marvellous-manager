
import { HardDrive, Project } from "@/types";
import LogoMarvellous from "@/components/LogoMarvellous";
import { QRCodeSVG } from "qrcode.react";
import { Container, Filter } from "lucide-react";

interface HardDriveLabelPrintProps {
  hardDrive: HardDrive;
  project?: Project | null;
}

export const HardDriveLabelPrint = ({ hardDrive, project }: HardDriveLabelPrintProps) => {
  // Use the standard view URL for QR code to ensure consistency across the app
  const qrCodeUrl = `${window.location.origin}/hard-drives/${hardDrive.id}/view`;
  return (
    <div id="ContainerP" >
          <div id="labelP" >
    <div id="card" className="p-4 border max-w-[400px] bg-white rounded-md shadow-md text-center ">
      {/* Logo at the top */}
      <div className="flex items-center justify-center mb-3 ">
        <LogoMarvellous  className="h-10" />
      </div>
      {/* Hard drive details */}
      <h2 className="text-lg font-bold mb-1">{hardDrive.name}</h2>
      {/* QR Code */}
      <div className="flex justify-center my-3">
        <QRCodeSVG value={qrCodeUrl} size={80} level="H" />
      </div>

      {/* Optionally include any "Data" field */}
      <div className="text-sm mb-1">
        <span className="font-medium">Serial Number:</span> <br></br>{hardDrive.serialNumber}
      </div>
      {hardDrive.data && (
        <div className="text-xs mb-2 opacity-80">
          
        </div>
      )}
    </div>
    </div>
    </div>
  );
};
