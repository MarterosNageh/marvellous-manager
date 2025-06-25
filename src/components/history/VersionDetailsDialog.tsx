
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface VersionChange {
  field_name: string;
  old_value: string | null;
  new_value: string | null;
  change_type: 'create' | 'update' | 'delete';
}

interface VersionDetailsDialogProps {
  open: boolean;
  onClose: () => void;
  versionNumber: number;
  changes: VersionChange[];
  changedBy: string;
  changeDate: string;
}

export const VersionDetailsDialog: React.FC<VersionDetailsDialogProps> = ({
  open,
  onClose,
  versionNumber,
  changes,
  changedBy,
  changeDate
}) => {
  const formatFieldName = (fieldName: string) => {
    return fieldName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatChangeType = (type: string) => {
    const typeMap: { [key: string]: string } = {
      'create': 'Created',
      'update': 'Updated',
      'delete': 'Deleted'
    };
    return typeMap[type] || type;
  };

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
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Badge variant="outline">Version {versionNumber}</Badge>
            - All Changes
          </DialogTitle>
          <div className="text-sm text-muted-foreground">
            <p>Changed by: <span className="font-medium">{changedBy}</span></p>
            <p>Date: <span className="font-medium">{formatDate(changeDate)}</span></p>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[120px]">Change Type</TableHead>
                <TableHead className="w-[150px]">Field</TableHead>
                <TableHead>Old Value</TableHead>
                <TableHead>New Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {changes.map((change, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <Badge 
                      variant={
                        change.change_type === 'create' ? 'default' :
                        change.change_type === 'update' ? 'secondary' : 'destructive'
                      }
                    >
                      {formatChangeType(change.change_type)}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">
                    {formatFieldName(change.field_name)}
                  </TableCell>
                  <TableCell className="max-w-[200px] break-words text-muted-foreground">
                    {change.old_value || '-'}
                  </TableCell>
                  <TableCell className="max-w-[200px] break-words">
                    {change.new_value || '-'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  );
};
