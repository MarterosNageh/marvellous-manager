
import { PrintType } from "@/types";
import { formatDistanceToNow } from "date-fns";
import { History, Printer } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export interface PrintHistoryItem {
  id: string;
  type: PrintType;
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

export const PrintHistoryTable = ({ 
  history, 
  showHardDriveName = false 
}: PrintHistoryTableProps) => {
  if (!history.length) {
    return (
      <div className="text-center p-6 border border-dashed rounded-md">
        <History className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
        <p className="text-muted-foreground">No print history found</p>
      </div>
    );
  }

  const getPrintTypeLabel = (type: PrintType) => {
    switch (type) {
      case "hard-out":
        return "Hard Drive Out";
      case "hard-in":
        return "Hard Drive In";
      case "all-hards":
        return "All Hard Drives";
      case "label":
        return "Hard Drive Label";
      default:
        return type;
    }
  };

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Type</TableHead>
            {showHardDriveName && <TableHead>Hard Drive</TableHead>}
            <TableHead>Operator</TableHead>
            <TableHead>Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {history.map((item) => (
            <TableRow key={item.id}>
              <TableCell>
                <div className="flex items-center">
                  <Printer className="h-4 w-4 mr-2 text-muted-foreground" />
                  {getPrintTypeLabel(item.type)}
                </div>
              </TableCell>
              {showHardDriveName && (
                <TableCell>{item.hardDriveName || "N/A"}</TableCell>
              )}
              <TableCell>{item.operatorName}</TableCell>
              <TableCell title={new Date(item.timestamp).toLocaleString()}>
                {formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
