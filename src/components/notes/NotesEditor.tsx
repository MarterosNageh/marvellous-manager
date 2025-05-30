
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { ShareNoteDialog } from './ShareNoteDialog';

export const NotesEditor = () => {
  const { selectedNote, updateNote } = useNotes();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isModified, setIsModified] = useState(false);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (selectedNote) {
      setTitle(selectedNote.title);
      setContent(selectedNote.content);
      setIsModified(false);
    }
  }, [selectedNote]);

  useEffect(() => {
    if (isModified && selectedNote) {
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

  const handleSave = async () => {
    if (!selectedNote || !isModified) return;

    const success = await updateNote(selectedNote.id, {
      title,
      content
    });

    if (success) {
      setIsModified(false);
    }
  };

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    setIsModified(true);
  };

  const handleContentChange = () => {
    if (editorRef.current) {
      const newContent = editorRef.current.innerHTML;
      setContent(newContent);
      setIsModified(true);
    }
  };

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    handleContentChange();
  };

  const insertTable = () => {
    const tableHTML = `
      <table border="1" style="border-collapse: collapse; width: 100%; margin: 10px 0;">
        <tr>
          <td style="padding: 8px; border: 1px solid #ccc;">Cell 1</td>
          <td style="padding: 8px; border: 1px solid #ccc;">Cell 2</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ccc;">Cell 3</td>
          <td style="padding: 8px; border: 1px solid #ccc;">Cell 4</td>
        </tr>
      </table>
    `;
    execCommand('insertHTML', tableHTML);
  };

  const insertLink = () => {
    const url = prompt('Enter URL:');
    if (url) {
      execCommand('createLink', url);
    }
  };

  const insertImage = () => {
    const url = prompt('Enter image URL:');
    if (url) {
      execCommand('insertImage', url);
    }
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
              />
            </div>
            <div className="flex items-center space-x-2">
              {isModified && (
                <Badge variant="outline" className="text-xs">
                  Modified
                </Badge>
              )}
              {selectedNote.is_shared && (
                <Badge variant="secondary" className="text-xs">
                  Shared
                </Badge>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsShareDialogOpen(true)}
              >
                <Share className="h-4 w-4 mr-1" />
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
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col">
          {/* Toolbar */}
          <div className="border rounded-lg p-2 mb-4 bg-gray-50 dark:bg-gray-800">
            <div className="flex flex-wrap items-center gap-1">
              {/* Text Formatting */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => execCommand('bold')}
              >
                <Bold className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => execCommand('italic')}
              >
                <Italic className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => execCommand('underline')}
              >
                <Underline className="h-4 w-4" />
              </Button>

              <Separator orientation="vertical" className="h-6 mx-1" />

              {/* Alignment */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => execCommand('justifyLeft')}
              >
                <AlignLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => execCommand('justifyCenter')}
              >
                <AlignCenter className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => execCommand('justifyRight')}
              >
                <AlignRight className="h-4 w-4" />
              </Button>

              <Separator orientation="vertical" className="h-6 mx-1" />

              {/* Lists */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => execCommand('insertUnorderedList')}
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => execCommand('insertOrderedList')}
              >
                <ListOrdered className="h-4 w-4" />
              </Button>

              <Separator orientation="vertical" className="h-6 mx-1" />

              {/* Insert Elements */}
              <Button
                variant="ghost"
                size="sm"
                onClick={insertLink}
              >
                <Link className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={insertImage}
              >
                <Image className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={insertTable}
              >
                <Table className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Editor */}
          <div
            ref={editorRef}
            contentEditable
            className="flex-1 p-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[400px] prose prose-sm max-w-none dark:prose-invert"
            dangerouslySetInnerHTML={{ __html: content }}
            onInput={handleContentChange}
            onBlur={handleContentChange}
            style={{
              lineHeight: '1.6',
              fontSize: '14px'
            }}
          />
        </CardContent>
      </Card>

      <ShareNoteDialog
        isOpen={isShareDialogOpen}
        onClose={() => setIsShareDialogOpen(false)}
        note={selectedNote}
      />
    </div>
  );
};
