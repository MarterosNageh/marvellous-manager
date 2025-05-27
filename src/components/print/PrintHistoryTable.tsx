
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface PrintHistoryProps {
  id: string;
  type?: string;
  hard_drive_id: string;
  printed_at: string;
  printed_by: string;
  hardDriveName?: string;
}

interface PrintHistoryTableProps {
  data: PrintHistoryProps[];
}

export const PrintHistoryTable: React.FC<PrintHistoryTableProps> = ({ data }) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    const displayMinutes = minutes.toString().padStart(2, '0');
    
    return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()} ${displayHours}:${displayMinutes} ${ampm}`;
  };

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
              {data.some(item => item.hardDriveName) && <TableHead>Hard Drive</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{formatDate(item.printed_at)}</TableCell>
                <TableCell>{item.printed_by}</TableCell>
                {data.some(item => item.hardDriveName) && (
                  <TableCell>{item.hardDriveName || '-'}</TableCell>
                )}
              </TableRow>
            ))}
            {data.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-4">No print history available</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
