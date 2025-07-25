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
import { toast } from 'sonner';

interface NotesSidebarProps {
  onNoteSelect?: () => void;
}

export const NotesSidebar = ({ onNoteSelect }: NotesSidebarProps) => {
  const { notes, selectedNote, selectNote, createNote, deleteNote, loading } = useNotes();
  const { currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredNotes = notes.filter(note =>
    note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    note.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateNote = async () => {
    const newNote = await createNote('New Note', '');
    if (newNote) {
      selectNote(newNote);
      onNoteSelect?.();
    }
  };

  const handleDeleteNote = async (noteId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const note = notes.find(n => n.id === noteId);
    
    // Only allow deletion if user owns the note, has admin permissions, or is admin/senior
    if (!note || (note.user_id !== currentUser?.id && 
                  note.permission_level !== 'admin' &&
                  currentUser?.role !== 'admin' &&
                  currentUser?.role !== 'senior')) {
      toast.error('You do not have permission to delete this note');
      return;
    }
    
    if (confirm('Are you sure you want to delete this note?')) {
      await deleteNote(noteId);
    }
  };

  const handleNoteSelect = (note: any) => {
    selectNote(note);
    onNoteSelect?.();
  };

  const canEditNote = (note: any) => {
    // User can edit if they own the note, have write/admin permissions, or are admin/senior
    return note.user_id === currentUser?.id || 
           note.permission_level === 'write' || 
           note.permission_level === 'admin' ||
           currentUser?.role === 'admin' ||
           currentUser?.role === 'senior';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const NoteItem = ({ note }: { note: any }) => (
    <div
      className={`group cursor-pointer p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${
        selectedNote?.id === note.id ? 'bg-blue-100 dark:bg-blue-900' : ''
      }`}
      onClick={() => handleNoteSelect(note)}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 flex-1 min-w-0">
          <FileText className="h-4 w-4 text-gray-500 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="font-medium text-sm truncate">{note.title}</div>
            <div className="text-xs text-gray-500 flex items-center space-x-2">
              <span>{formatDate(note.updated_at)}</span>
              {note.is_shared && <Share className="h-3 w-3" />}
              {note.user_id !== currentUser?.id && (
                <Badge variant="outline" className="text-xs">
                  {note.permission_level === 'read' ? 'Read Only' : 
                   note.permission_level === 'write' ? 'Can Edit' : 
                   note.permission_level === 'admin' ? 'Admin' : 'Shared'}
                </Badge>
              )}
            </div>
          </div>
        </div>
        
        {(note.user_id === currentUser?.id || 
          note.permission_level === 'admin' ||
          currentUser?.role === 'admin' ||
          currentUser?.role === 'senior') && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0 hover:bg-gray-200 dark:hover:bg-gray-700"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-32">
              <DropdownMenuItem
                onClick={(e) => handleDeleteNote(note.id, e)}
                className="text-red-600 dark:text-red-400"
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
    <Card className="h-full flex flex-col border-0 rounded-none">
      <CardHeader className="pb-4 space-y-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Notes</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCreateNote}
            title="New Note"
            className="hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            <Plus className="h-4 w-4" />
          </Button>
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
                {filteredNotes.map((note) => (
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
