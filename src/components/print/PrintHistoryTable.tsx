import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format, formatDistanceToNow } from "date-fns";

interface PrintHistory {
  id: string;
  hard_drive_id: string;
  printed_at: string;
  printed_by: string;
}

interface PrintHistoryTableProps {
  history: PrintHistory[];
}

export const PrintHistoryTable: React.FC<PrintHistoryTableProps> = ({ history }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Print History</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Date</TableHead>
              <TableHead>User</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {history.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{format(new Date(item.printed_at), "MMM d, yyyy h:mm a")}</TableCell>
                <TableCell>{item.printed_by}</TableCell>
              </TableRow>
            ))}
            {history.length === 0 && (
              <TableRow>
                <TableCell colSpan={2} className="text-center py-4">No print history available</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
