import { HardDrive, Project } from "@/types";
import LogoMarvellous from "@/components/LogoMarvellous";

interface AllHardsPrintProps {
  hardDrives: HardDrive[];
  project: Project | null;
  operatorName: string;
  isPreviewing?: boolean;
}

export const AllHardsPrintPrev = ({
  hardDrives,
  project,
  operatorName,
  isPreviewing = false
}: AllHardsPrintProps) => {
  const now = new Date();
  const dateStr = now.toLocaleDateString();
  const timeStr = now.toLocaleTimeString();

  // Group hard drives by type
  const backupDrives = hardDrives.filter(hd => hd.driveType === 'backup');
  const taxiDrives = hardDrives.filter(hd => hd.driveType === 'taxi');
  const passportDrives = hardDrives.filter(hd => hd.driveType === 'passport');

  const formatDriveType = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  const renderDriveTable = (drives: HardDrive[], type: string) => {
    if (drives.length === 0) return null;
    
    return (
      <div className="mb-6">
        <h3 className="font-bold text-sm mb-2">{formatDriveType(type)} Drives</h3>
        <table className="min-w-full border border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2 text-left">Name</th>
              <th className="border p-2 text-left">Serial Number</th>
              <th className="border p-2 text-left">Capacity</th>
              <th className="border p-2 text-left">Free Space</th>
            </tr>
          </thead>
          <tbody>
            {drives.map((hd) => (
              <tr key={hd.id}>
                <td className="border p-2">{hd.name}</td>
                <td className="border p-2">{hd.serialNumber}</td>
                <td className="border p-2">{hd.capacity}</td>
                <td className="border p-2">{hd.freeSpace}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className={`p-6 ${isPreviewing ? 'text-sm' : 'text-base'}`}>
      <div className="text-center mb-6">
        <LogoMarvellous className="h-12 mx-auto mb-2" />
        <h1 className="text-xl font-bold">Hard Drives Report</h1>
      </div>
      
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <div className="mb-4">
            <h3 className="font-bold text-sm">Project Information</h3>
            <p><span className="font-medium">Project Name:</span> {project?.name || 'All Projects'}</p>
          </div>
        </div>
        
        <div>
          <div className="mb-4">
            <h3 className="font-bold text-sm">Report Information</h3>
            <p><span className="font-medium">Date:</span> {dateStr}</p>
            <p><span className="font-medium">Time:</span> {timeStr}</p>
            <p><span className="font-medium">Operator:</span> {operatorName}</p>
            <p><span className="font-medium">Total Hard Drives:</span> {hardDrives.length}</p>
          </div>
        </div>
      </div>
      
      <div className="space-y-6">
        {renderDriveTable(backupDrives, 'backup')}
        {renderDriveTable(taxiDrives, 'taxi')}
        {renderDriveTable(passportDrives, 'passport')}
        
        {hardDrives.length === 0 && (
          <p className="text-center p-4 border">No hard drives found</p>
        )}
      </div>
      
      {hardDrives.length > 0 && (
        <div className="mt-6">
          <h3 className="font-bold text-sm mb-2">Available Cables Summary</h3>
          <table className="min-w-full border border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-2 text-left">Cable Type</th>
                <th className="border p-2 text-left">Count</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border p-2">Thunderbolt 3</td>
                <td className="border p-2">
                  {hardDrives.filter(hd => hd.cables.thunderbolt3).length}
                </td>
              </tr>
              <tr>
                <td className="border p-2">USB Type C</td>
                <td className="border p-2">
                  {hardDrives.filter(hd => hd.cables.typeC).length}
                </td>
              </tr>
              <tr>
                <td className="border p-2">Power</td>
                <td className="border p-2">
                  {hardDrives.filter(hd => hd.cables.power).length}
                </td>
              </tr>
              <tr>
                <td className="border p-2">USB 3</td>
                <td className="border p-2">
                  {hardDrives.filter(hd => hd.cables.usb3).length}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
      
      <div>
        <h3 className="font-bold text-sm">Recipient Signature</h3>
        <div className="border-b border-black h-8 mt-8"></div>
      </div>
    </div>
  );
};
