import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";

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
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");

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

  const formatPrintType = (type: string = '') => {
    const typeMap: { [key: string]: string } = {
      'hard-in': 'Transfer In',
      'hard-out': 'Transfer Out',
      'label': 'Label Print',
      'all-hards': 'Project Print'
    };
    return typeMap[type] || type;
  };

  const printTypes = [
    { value: 'all', label: 'All Types' },
    { value: 'hard-in', label: 'Transfer In' },
    { value: 'hard-out', label: 'Transfer Out' },
    { value: 'label', label: 'Label Print' },
    { value: 'all-hards', label: 'Project Print' }
  ];

  const filteredData = data.filter(item => {
    const matchesSearch = item.printed_by.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (item.hardDriveName && item.hardDriveName.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesType = selectedType === 'all' || item.type === selectedType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by user or hard drive..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
        <Select
          value={selectedType}
          onValueChange={setSelectedType}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            {printTypes.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[200px]">Print Type</TableHead>
            <TableHead className="w-[200px]">User</TableHead>
            <TableHead>Date & Time</TableHead>
            {data.some(item => item.hardDriveName) && <TableHead className="w-[200px]">Hard Drive</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredData.map((item) => (
            <TableRow key={item.id}>
              <TableCell>
                <Badge variant="secondary" className="font-medium">
                  {formatPrintType(item.type)}
                </Badge>
              </TableCell>
              <TableCell>{item.printed_by}</TableCell>
              <TableCell>{formatDate(item.printed_at)}</TableCell>
              {data.some(item => item.hardDriveName) && (
                <TableCell>{item.hardDriveName || '-'}</TableCell>
              )}
            </TableRow>
          ))}
          {filteredData.length === 0 && (
            <TableRow>
              <TableCell colSpan={data.some(item => item.hardDriveName) ? 4 : 3} className="text-center py-4">
                {searchQuery || selectedType !== 'all' 
                  ? "No matching records found" 
                  : "No print history available"}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};
