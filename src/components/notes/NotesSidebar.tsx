
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Plus,
  Search,
  FileText,
  Folder,
  FolderOpen,
  Share,
  Trash2,
  MoreVertical
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useNotes } from '@/context/NotesContext';
import { useAuth } from '@/context/AuthContext';
import { format } from 'date-fns';

export const NotesSidebar = () => {
  const { notes, selectedNote, selectNote, createNote, deleteNote, loading } = useNotes();
  const { currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  const filteredNotes = notes.filter(note =>
    note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    note.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const folders = filteredNotes.filter(note => note.note_type === 'folder' && !note.parent_id);
  const rootNotes = filteredNotes.filter(note => note.note_type === 'note' && !note.parent_id);

  const getNotesInFolder = (folderId: string) => {
    return filteredNotes.filter(note => note.parent_id === folderId);
  };

  const toggleFolder = (folderId: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    setExpandedFolders(newExpanded);
  };

  const handleCreateNote = async () => {
    await createNote('New Note', '');
  };

  const handleCreateFolder = async () => {
    await createNote('New Folder', '', undefined, 'folder');
  };

  const handleDeleteNote = async (noteId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this note?')) {
      await deleteNote(noteId);
    }
  };

  const canEditNote = (note: any) => {
    return note.user_id === currentUser?.id;
  };

  const NoteItem = ({ note, isChild = false }: { note: any; isChild?: boolean }) => (
    <div
      className={`group cursor-pointer p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 ${
        selectedNote?.id === note.id ? 'bg-blue-100 dark:bg-blue-900' : ''
      } ${isChild ? 'ml-4' : ''}`}
      onClick={() => note.note_type === 'note' ? selectNote(note) : toggleFolder(note.id)}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 flex-1 min-w-0">
          {note.note_type === 'folder' ? (
            expandedFolders.has(note.id) ? (
              <FolderOpen className="h-4 w-4 text-blue-500 flex-shrink-0" />
            ) : (
              <Folder className="h-4 w-4 text-blue-500 flex-shrink-0" />
            )
          ) : (
            <FileText className="h-4 w-4 text-gray-500 flex-shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <div className="font-medium text-sm truncate">{note.title}</div>
            <div className="text-xs text-gray-500 flex items-center space-x-2">
              <span>{format(new Date(note.updated_at), 'MMM d')}</span>
              {note.is_shared && <Share className="h-3 w-3" />}
              {note.user_id !== currentUser?.id && (
                <Badge variant="outline" className="text-xs">
                  {note.user?.username}
                </Badge>
              )}
            </div>
          </div>
        </div>
        
        {canEditNote(note) && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={(e) => handleDeleteNote(note.id, e)}
                className="text-red-600"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Notes</CardTitle>
          <div className="flex space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCreateFolder}
              title="New Folder"
            >
              <Folder className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCreateNote}
              title="New Note"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </CardHeader>

      <CardContent className="flex-1 p-0">
        <ScrollArea className="h-full px-4">
          <div className="space-y-1">
            {loading ? (
              <div className="text-center py-8 text-gray-500">
                Loading notes...
              </div>
            ) : (
              <>
                {/* Folders */}
                {folders.map((folder) => (
                  <div key={folder.id}>
                    <NoteItem note={folder} />
                    {expandedFolders.has(folder.id) && (
                      <div className="ml-2">
                        {getNotesInFolder(folder.id).map((note) => (
                          <NoteItem key={note.id} note={note} isChild />
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                {/* Root Notes */}
                {rootNotes.map((note) => (
                  <NoteItem key={note.id} note={note} />
                ))}

                {filteredNotes.length === 0 && !loading && (
                  <div className="text-center py-8 text-gray-500">
                    {searchTerm ? 'No notes found' : 'No notes yet'}
                  </div>
                )}
              </>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
