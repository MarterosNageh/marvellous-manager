
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Trash2, Plus } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useNotes } from '@/context/NotesContext';

interface ShareNoteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  note: any;
}

export const ShareNoteDialog: React.FC<ShareNoteDialogProps> = ({
  isOpen,
  onClose,
  note
}) => {
  const { users } = useAuth();
  const { shareNote, unshareNote, getNoteShares } = useNotes();
  const [shares, setShares] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [selectedPermission, setSelectedPermission] = useState<'read' | 'write' | 'admin'>('read');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && note) {
      loadShares();
    }
  }, [isOpen, note]);

  const loadShares = async () => {
    if (!note) return;
    
    setLoading(true);
    try {
      const noteShares = await getNoteShares(note.id);
      setShares(noteShares);
    } catch (error) {
      console.error('Error loading shares:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    if (!selectedUserId || !note) return;

    const success = await shareNote(note.id, selectedUserId, selectedPermission);
    if (success) {
      setSelectedUserId('');
      setSelectedPermission('read');
      await loadShares();
    }
  };

  const handleUnshare = async (userId: string) => {
    if (!note) return;

    const success = await unshareNote(note.id, userId);
    if (success) {
      await loadShares();
    }
  };

  const getPermissionBadge = (level: string) => {
    const variants = {
      read: 'secondary',
      write: 'default',
      admin: 'destructive'
    } as const;

    return (
      <Badge variant={variants[level as keyof typeof variants] || 'secondary'}>
        {level}
      </Badge>
    );
  };

  const availableUsers = users.filter(user => 
    user.id !== note?.user_id && 
    !shares.some(share => share.shared_with_user_id === user.id)
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Share Note</DialogTitle>
          <DialogDescription>
            Share "{note?.title}" with other team members
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Add New Share */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Add People</h4>
            <div className="flex gap-2">
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select user..." />
                </SelectTrigger>
                <SelectContent>
                  {availableUsers.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.username}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={selectedPermission} onValueChange={setSelectedPermission}>
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="read">Read</SelectItem>
                  <SelectItem value="write">Write</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
              
              <Button
                onClick={handleShare}
                disabled={!selectedUserId}
                size="sm"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Current Shares */}
          {shares.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Shared With</h4>
              <div className="space-y-2">
                {shares.map((share) => {
                  const user = users.find(u => u.id === share.shared_with_user_id);
                  return (
                    <div key={share.id} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex items-center space-x-2">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-xs">
                            {user?.username?.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{user?.username}</span>
                        {getPermissionBadge(share.permission_level)}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleUnshare(share.shared_with_user_id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {shares.length === 0 && !loading && (
            <div className="text-center py-4 text-gray-500 text-sm">
              This note is not shared with anyone yet
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
