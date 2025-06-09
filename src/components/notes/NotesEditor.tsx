import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
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
      <Card className="h-full flex items-center justify-center bg-gray-50 dark:bg-gray-900 border-0">
        <CardContent className="text-center">
          <FileText className="h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-base sm:text-lg font-medium text-gray-600 dark:text-gray-400 mb-2">No Note Selected</h3>
          <p className="text-sm sm:text-base text-gray-500 dark:text-gray-500">Select a note from the sidebar to start editing</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <Card className="flex-1 flex flex-col border-0 rounded-none bg-gray-50 dark:bg-gray-900">
        <CardHeader className="pb-4 space-y-4 bg-white dark:bg-gray-800 border-b">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <Input
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                className="text-lg sm:text-xl font-bold border-none p-0 focus:ring-0 bg-transparent"
                placeholder="Note title..."
                disabled={!canEdit}
              />
            </div>
            <div className="flex items-center gap-2 self-end sm:self-auto">
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
                    className="flex items-center gap-1"
                  >
                    <Share2 className="h-4 w-4" />
                    <span className="hidden sm:inline-block">Share</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSave}
                    disabled={!isModified}
                    className="flex items-center gap-1"
                  >
                    <Save className="h-4 w-4" />
                    <span className="hidden sm:inline-block">Save</span>
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col p-0">
          {/* Editor */}
          <Textarea
            value={content}
            onChange={(e) => handleContentChange(e.target.value)}
            className="flex-1 min-h-[200px] sm:min-h-[400px] resize-none border-none focus:ring-0 p-4"
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
