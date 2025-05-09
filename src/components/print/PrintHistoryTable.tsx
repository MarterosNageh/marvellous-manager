import { useState } from "react";
import { PrintType } from "@/types";
import { formatDistanceToNow } from "date-fns";
import { History, Printer, Search } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";

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
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");

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

  const filteredHistory = history.filter(item => {
    // Filter by type
    if (typeFilter !== "all" && item.type !== typeFilter) {
      return false;
    }
    
    // Search by operator name or hard drive name
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const operatorMatch = item.operatorName.toLowerCase().includes(searchLower);
      const hardDriveMatch = item.hardDriveName ? 
        item.hardDriveName.toLowerCase().includes(searchLower) : false;
        
      return operatorMatch || hardDriveMatch;
    }
    
    return true;
  });

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by operator or hard drive..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        <select
          className="border rounded bg-white h-10 text-sm px-2 w-full sm:w-auto"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          <option value="all">All Types</option>
          <option value="hard-out">Hard Drive Out</option>
          <option value="hard-in">Hard Drive In</option>
          <option value="all-hards">All Hard Drives</option>
          <option value="label">Hard Drive Label</option>
        </select>
      </div>
      
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              {showHardDriveName && <TableHead>Hard Drive</TableHead>}
              <TableHead>Operator</TableHead>
              <TableHead>Date & Time</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredHistory.length === 0 ? (
              <TableRow>
                <TableCell colSpan={showHardDriveName ? 4 : 3} className="text-center py-6">
                  <p className="text-muted-foreground">No results found</p>
                </TableCell>
              </TableRow>
            ) : (
              filteredHistory.map((item) => (
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
                  <TableCell>
                    <div className="flex flex-col">
                      <span>{new Date(item.timestamp).toLocaleDateString()}</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(item.timestamp).toLocaleTimeString()} 
                        <span className="ml-1">({formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })})</span>
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
