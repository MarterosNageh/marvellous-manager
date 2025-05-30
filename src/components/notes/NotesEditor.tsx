import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Save,
  FileText,
  Share2
} from 'lucide-react';
import { useNotes } from '@/context/NotesContext';
import { useAuth } from '@/context/AuthContext';
import { ShareNoteDialog } from './ShareNoteDialog';

export const NotesEditor = () => {
  const { selectedNote, updateNote } = useNotes();
  const { currentUser } = useAuth();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isModified, setIsModified] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (selectedNote && currentUser) {
      setTitle(selectedNote.title);
      setContent(selectedNote.content);
      setIsModified(false);
    }
  }, [selectedNote, currentUser]);

  useEffect(() => {
    if (isModified && selectedNote && selectedNote.user_id === currentUser?.id) {
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
  }, [title, content, isModified, selectedNote]);

  const canEdit = selectedNote?.user_id === currentUser?.id;

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
              {canEdit && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowShareDialog(true)}
                  >
                    <Share2 className="h-4 w-4 mr-1" />
                    Share
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSave}
                    disabled={!isModified}
                  >
                    <Save className="h-4 w-4 mr-1" />
                    Save
                  </Button>
                </>
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

      {/* Share Dialog */}
      <ShareNoteDialog
        isOpen={showShareDialog}
        onClose={() => setShowShareDialog(false)}
        note={selectedNote}
      />
    </div>
  );
};
