
import React from "react";
import { format as dateFormat, formatDistanceToNow as distanceToNow } from "date-fns";  
import { 
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { capitalizeFirstLetter } from "@/lib/utils";

// Types for the print history
interface PrintHistoryItem {
  id: string;
  type: string;
  hardDriveId: string | null;
  projectId: string | null;
  operatorName: string;
  timestamp: string;
  hardDriveName?: string;
}

interface PrintHistoryTableProps {
  history: PrintHistoryItem[];
  showHardDriveName?: boolean;
}

// Function to get a friendly print type name
const getPrintTypeName = (type: string): string => {
  switch (type) {
    case "hard-out":
      return "Hard Drive Check-Out Form";
    case "hard-in":
      return "Hard Drive Check-In Form";
    case "all-hards":
      return "Project Hard Drives List";
    case "hard-label":
      return "Hard Drive Label";
    default:
      return capitalizeFirstLetter(type);
  }
};

export const PrintHistoryTable: React.FC<PrintHistoryTableProps> = ({ 
  history, 
  showHardDriveName = false 
}) => {
  if (!history || history.length === 0) {
    return (
      <div className="text-center p-4 text-muted-foreground">
        No print history available.
      </div>
    );
  }

  return (
    <Table>
      <TableCaption>Print history records</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Type</TableHead>
          {showHardDriveName && <TableHead>Hard Drive</TableHead>}
          <TableHead>Operator</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Time</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {history.map((item) => (
          <TableRow key={item.id}>
            <TableCell className="font-medium">{getPrintTypeName(item.type)}</TableCell>
            {showHardDriveName && <TableCell>{item.hardDriveName || "Unknown"}</TableCell>}
            <TableCell>{item.operatorName}</TableCell>
            <TableCell>{dateFormat(new Date(item.timestamp), "PPP")}</TableCell>
            <TableCell>
              {dateFormat(new Date(item.timestamp), "p")} 
              <span className="text-muted-foreground text-sm ml-2">
                ({distanceToNow(new Date(item.timestamp), { addSuffix: true })})
              </span>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
