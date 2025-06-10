import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import type { ShiftTemplate } from '@/types/schedule';
import { useToast } from '@/hooks/use-toast';
import ShiftTemplateDialog from './ShiftTemplateDialog';

interface ManageTemplatesDialogProps {
  templates: ShiftTemplate[];
  onClose: () => void;
  onEdit: (template: ShiftTemplate) => void;
  onDelete: (templateId: string) => Promise<void>;
  onSave: (template: Partial<ShiftTemplate>) => Promise<void>;
}

export default function ManageTemplatesDialog({
  templates,
  onClose,
  onEdit,
  onDelete,
  onSave,
}: ManageTemplatesDialogProps) {
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const handleDelete = async (templateId: string) => {
    try {
      setIsDeleting(true);
      await onDelete(templateId);
      toast({
        title: "Success",
        description: "Template deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting template:', error);
      toast({
        title: "Error",
        description: "Failed to delete template. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Dialog open={true} onOpenChange={() => onClose()}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>Manage Templates</DialogTitle>
              <Button variant="outline" onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-1" />
                Add Template
              </Button>
            </div>
          </DialogHeader>
          <div className="mt-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Shift Type</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {templates.map((template) => (
                      <TableRow key={template.id}>
                        <TableCell>{template.name}</TableCell>
                        <TableCell className="capitalize">{template.shift_type}</TableCell>
                        <TableCell>
                          {template.start_time} - {template.end_time}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => onEdit(template)}
                              disabled={isDeleting}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(template.id)}
                              disabled={isDeleting}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>

      {showCreateDialog && (
        <ShiftTemplateDialog
          template={null}
          onClose={() => setShowCreateDialog(false)}
          onSave={async (template) => {
            await onSave(template);
            setShowCreateDialog(false);
          }}
        />
      )}
    </>
  );
} 