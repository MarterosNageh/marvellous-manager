
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
      <div id="ContainerHard">
    <div id="label">
      <div id="header">
        <LogoMarvellous className="h-12 mx-auto mb-2" />
        <h1>Hard Drive Transfer In</h1>
      </div>

      <div id="grid">
        <div id="info-box">
          <h3>Hard Drive Information</h3>
          <table>
            <tbody><tr>
              <td>Name:</td>
              <td>{hardDrive.name}</td>
            </tr>
            <tr>
              <td>Serial Number:</td>
              <td>{hardDrive.serialNumber}</td>
            </tr>
            <tr>
              <td>Capacity:</td>
              <td>{hardDrive.capacity}</td>
            </tr>
          </tbody></table>
        </div>

        <div id="info-box">
          <h3>Project Information</h3>
          <table>
            <tbody><tr>
              <td>Project:</td>
              <td>{project?.name || 'N/A'}</td>
            </tr>
          </tbody></table>
        </div>
      </div>

      <div id="grid">
        <div id="info-box">
          <h3>Date &amp; Time</h3>
          <table>
            <tbody><tr>
              <td>Date:</td>
              <td>{dateStr}</td>
            </tr>
            <tr>
              <td>Time:</td>
              <td>{timeStr}</td>
            </tr>
          </tbody></table>
        </div>

        <div id="info-box">
          <h3>Operator</h3>
          <table>
            <tbody><tr>
              <td>Name:</td>
              <td>{operatorName}</td>
            </tr>
          </tbody></table>
        </div>
      </div>

      <div id="cables">
        <h3>Cables Included</h3>
        <ul>
      {hardDrive.cables.thunderbolt3 && <li>Thunderbolt 3</li>}
              {hardDrive.cables.typeC && <li>USB Type C</li>}
              {hardDrive.cables.power && <li>Power</li>}
              {hardDrive.cables.usb3 && <li>USB 3</li>}
              {hardDrive.cables.passport && <li>Passport Cable</li>}
              {hardDrive.cables.other && <li>{hardDrive.cables.other}</li>}
        </ul>
      </div>

      <div id="signature">
        <h3 id="signTitle">Recipient Signature</h3>
        <div id="signature-line"></div>
      </div>
    </div>
  </div>
  );
};
