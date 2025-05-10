import { HardDrive, Project } from "@/types";
import LogoMarvellous from "@/components/LogoMarvellous";

interface AllHardsPrintProps {
  hardDrives: HardDrive[];
  project: Project | null;
  operatorName: string;
  isPreviewing?: boolean;
}

export const AllHardsPrint = ({
  hardDrives,
  project,
  operatorName,
  isPreviewing = false
}: AllHardsPrintProps) => {
  const now = new Date();
  const dateStr = now.toLocaleDateString();
  const timeStr = now.toLocaleTimeString();

  return (
  <div id="ContainerHard">
    <div id="header">
        <LogoMarvellous  className="h-10" />
      <h1 id="text-xl font-bold">Hard Drives Report</h1>
    </div>

    <div id="grid mb-6">
      <div>
        <div id="mb-4">
          <h3 id="font-bold text-sm">Project Information</h3>
          <p><span id="font-medium">Project Name:</span>  {project?.name || 'All Projects'}</p>
        </div>
      </div>
      <div>
        <div id="mb-4">
          <h3 id="font-bold text-sm">Report Information</h3>
          <p><span id="font-medium">Date:</span> {dateStr}</p>
          <p><span id="font-medium">Time:</span> {timeStr}</p>
          <p><span id="font-medium">Operator:</span>  {operatorName}</p>
          <p><span id="font-medium">Total Hard Drives:</span> {hardDrives.length}</p>
        </div>
      </div>
    </div>

    <h3 id="font-bold text-sm mb-2">Hard Drives List</h3>
    <table>
      <thead>
        <tr>
          <th>Name</th>
          <th>Serial Number</th>
          <th>Capacity</th>
          <th>Data</th>
        </tr>
      </thead>
        <tbody>
          {hardDrives.map((hd) => (
            <tr key={hd.id}>
              <td className="border p-2">{hd.name}</td>
              <td className="border p-2">{hd.serialNumber}</td>
              <td className="border p-2">{hd.capacity}</td>
              <td className="border p-2">{hd.data}</td>
            </tr>
          ))}
          {hardDrives.length === 0 && (
            <tr>
              <td colSpan={4} className="border p-2 text-center">No hard drives found</td>
            </tr>
          )}
        </tbody>
    </table>
      {hardDrives.length > 0 && (
    <div id="mt-6">
      <h3 id="font-bold text-sm mb-2">Available Cables Summary</h3>
      <table>
        <thead>
          <tr>
            <th>Cable Type</th>
            <th>Count</th>
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

      <div id="signature">
        <h3 id="signTitle">Recipient Signature</h3>
        <div id="signature-line"></div>
      </div>
    </div>

  );
};
