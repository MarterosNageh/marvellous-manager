
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  Link,
  Image,
  Table,
  Save,
  Share,
  FileText
} from 'lucide-react';
import { useNotes } from '@/context/NotesContext';
import { useAuth } from '@/context/AuthContext';
import { ShareNoteDialog } from './ShareNoteDialog';

export const NotesEditor = () => {
  const { selectedNote, updateNote, getNoteShares } = useNotes();
  const { currentUser } = useAuth();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isModified, setIsModified] = useState(false);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [userPermission, setUserPermission] = useState<'read' | 'write' | 'admin' | 'owner'>('read');
  const saveTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (selectedNote && currentUser) {
      setTitle(selectedNote.title);
      setContent(selectedNote.content);
      setIsModified(false);
      
      // Check user permissions
      if (selectedNote.user_id === currentUser.id) {
        setUserPermission('owner');
      } else {
        // Check if user has shared access
        getNoteShares(selectedNote.id).then(shares => {
          const userShare = shares.find(share => share.shared_with_user_id === currentUser.id);
          if (userShare) {
            setUserPermission(userShare.permission_level);
          } else {
            setUserPermission('read');
          }
        });
      }
    }
  }, [selectedNote, currentUser]);

  useEffect(() => {
    if (isModified && selectedNote && (userPermission === 'write' || userPermission === 'admin' || userPermission === 'owner')) {
      // Auto-save after 2 seconds of inactivity
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      
      saveTimeoutRef.current = setTimeout(() => {
        handleSave();
      }, 2000);
    }

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [title, content, isModified, selectedNote, userPermission]);

  const canEdit = userPermission === 'write' || userPermission === 'admin' || userPermission === 'owner';
  const canShare = userPermission === 'admin' || userPermission === 'owner';

  const handleSave = async () => {
    if (!selectedNote || !isModified || !canEdit) return;

    const success = await updateNote(selectedNote.id, {
      title,
      content
    });

    if (success) {
      setIsModified(false);
    }
  };

  const handleTitleChange = (newTitle: string) => {
    if (!canEdit) return;
    setTitle(newTitle);
    setIsModified(true);
  };

  const handleContentChange = (newContent: string) => {
    if (!canEdit) return;
    setContent(newContent);
    setIsModified(true);
  };

  if (!selectedNote) {
    return (
      <Card className="h-full flex items-center justify-center">
        <CardContent className="text-center">
          <FileText className="h-16 w-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-600 mb-2">No Note Selected</h3>
          <p className="text-gray-500">Select a note from the sidebar to start editing</p>
        </CardContent>
      </Card>
    );
  }

  if (selectedNote.note_type === 'folder') {
    return (
      <Card className="h-full flex items-center justify-center">
        <CardContent className="text-center">
          <FileText className="h-16 w-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-600 mb-2">Folder Selected</h3>
          <p className="text-gray-500">Folders cannot be edited. Select a note to start editing.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <Card className="flex-1 flex flex-col">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <Input
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                className="text-xl font-bold border-none p-0 focus:ring-0 bg-transparent"
                placeholder="Note title..."
                disabled={!canEdit}
              />
            </div>
            <div className="flex items-center space-x-2">
              {!canEdit && (
                <Badge variant="outline" className="text-xs">
                  Read Only
                </Badge>
              )}
              {isModified && canEdit && (
                <Badge variant="outline" className="text-xs">
                  Modified
                </Badge>
              )}
              {selectedNote.is_shared && (
                <Badge variant="secondary" className="text-xs">
                  Shared
                </Badge>
              )}
              {canShare && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsShareDialogOpen(true)}
                >
                  <Share className="h-4 w-4 mr-1" />
                  Share
                </Button>
              )}
              {canEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSave}
                  disabled={!isModified}
                >
                  <Save className="h-4 w-4 mr-1" />
                  Save
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col">
          {/* Editor */}
          <Textarea
            value={content}
            onChange={(e) => handleContentChange(e.target.value)}
            className="flex-1 min-h-[400px] resize-none border-none focus:ring-0 p-4"
            placeholder="Start writing your note..."
            disabled={!canEdit}
          />
        </CardContent>
      </Card>

      {canShare && (
        <ShareNoteDialog
          isOpen={isShareDialogOpen}
          onClose={() => setIsShareDialogOpen(false)}
          note={selectedNote}
        />
      )}
    </div>
  );
};
