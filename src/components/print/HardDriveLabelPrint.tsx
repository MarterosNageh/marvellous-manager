
import { HardDrive, Project } from "@/types";
import LogoMarvellous from "@/components/LogoMarvellous";
import { QRCodeSVG } from "qrcode.react";

interface HardDriveLabelPrintProps {
  hardDrive: HardDrive;
  project?: Project | null;
}

export const HardDriveLabelPrint = ({ hardDrive, project }: HardDriveLabelPrintProps) => {
  const qrUrl = `${window.location.origin}/hard-drives/${hardDrive.id}/view`;

  return (
    <div className="p-4 border max-w-[350px] bg-white">
      <div className="flex items-center justify-between mb-2">
        <LogoMarvellous className="h-8" />
        <QRCodeSVG value={qrUrl} size={56} level="H" />
      </div>
      <h2 className="text-base font-bold text-center mb-2">{hardDrive.name}</h2>
      <div className="mb-1">
        <span className="font-medium">Serial Number:</span> {hardDrive.serialNumber}
      </div>
      <div className="mb-1">
        <span className="font-medium">Capacity:</span> {hardDrive.capacity}
      </div>
      <div className="mb-1">
        <span className="font-medium">Project:</span>{" "}
        {project?.name || hardDrive.projectId || "N/A"}
      </div>
      {hardDrive.taxiHard && (
        <div className="mb-1 text-red-600 font-semibold text-xs">
          TAXI HARD - Not counted in main inventory
        </div>
      )}
      <div className="mt-3 text-right text-xs text-gray-400">
        {hardDrive.createdAt ? new Date(hardDrive.createdAt).toLocaleString() : ""}
      </div>
    </div>
  );
};
