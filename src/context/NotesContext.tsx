
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

interface Note {
  id: string;
  user_id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
  is_shared: boolean;
  parent_id?: string;
  note_type: 'note' | 'folder';
  user?: {
    username: string;
  };
}

interface NoteShare {
  id: string;
  note_id: string;
  shared_with_user_id: string;
  permission_level: 'read' | 'write' | 'admin';
  shared_by_user_id: string;
  created_at: string;
}

interface NotesContextType {
  notes: Note[];
  selectedNote: Note | null;
  loading: boolean;
  fetchNotes: () => Promise<void>;
  createNote: (title: string, content?: string, parentId?: string, noteType?: 'note' | 'folder') => Promise<Note | null>;
  updateNote: (id: string, updates: Partial<Note>) => Promise<boolean>;
  deleteNote: (id: string) => Promise<boolean>;
  selectNote: (note: Note | null) => void;
  shareNote: (noteId: string, userId: string, permissionLevel: 'read' | 'write' | 'admin') => Promise<boolean>;
  unshareNote: (noteId: string, userId: string) => Promise<boolean>;
  getNoteShares: (noteId: string) => Promise<NoteShare[]>;
}

const NotesContext = createContext<NotesContextType | undefined>(undefined);

export const useNotes = () => {
  const context = useContext(NotesContext);
  if (!context) {
    throw new Error('useNotes must be used within a NotesProvider');
  }
  return context;
};

export const NotesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(false);
  const { currentUser } = useAuth();

  const fetchNotes = async () => {
    if (!currentUser) return;
    
    setLoading(true);
    try {
      // Get notes owned by the user
      const { data: ownedNotes, error: ownedError } = await supabase
        .from('notes')
        .select(`
          *,
          user:auth_users(username)
        `)
        .eq('user_id', currentUser.id)
        .order('updated_at', { ascending: false });

      if (ownedError) throw ownedError;

      // Get notes shared with the user
      const { data: sharedNotes, error: sharedError } = await supabase
        .from('note_shares')
        .select(`
          notes (
            *,
            user:auth_users(username)
          )
        `)
        .eq('shared_with_user_id', currentUser.id);

      if (sharedError) throw sharedError;

      // Combine owned and shared notes
      const allNotes = [
        ...(ownedNotes || []),
        ...(sharedNotes || []).map(share => share.notes).filter(Boolean).flat()
      ];

      // Type cast the data to match our Note interface
      const typedNotes = allNotes.map(note => ({
        ...note,
        note_type: note.note_type as 'note' | 'folder'
      })) as Note[];

      // Remove duplicates based on id
      const uniqueNotes = typedNotes.filter((note, index, self) => 
        index === self.findIndex(n => n.id === note.id)
      );

      setNotes(uniqueNotes);
    } catch (error) {
      console.error('Error fetching notes:', error);
      toast.error('Failed to fetch notes');
    } finally {
      setLoading(false);
    }
  };

  const createNote = async (title: string, content = '', parentId?: string, noteType: 'note' | 'folder' = 'note'): Promise<Note | null> => {
    if (!currentUser) return null;

    try {
      const { data, error } = await supabase
        .from('notes')
        .insert({
          title,
          content,
          user_id: currentUser.id,
          parent_id: parentId,
          note_type: noteType
        })
        .select(`
          *,
          user:auth_users(username)
        `)
        .single();

      if (error) throw error;

      const newNote = {
        ...data,
        note_type: data.note_type as 'note' | 'folder'
      } as Note;
      setNotes(prev => [newNote, ...prev]);
      toast.success(`${noteType === 'folder' ? 'Folder' : 'Note'} created successfully`);
      return newNote;
    } catch (error) {
      console.error('Error creating note:', error);
      toast.error(`Failed to create ${noteType}`);
      return null;
    }
  };

  const updateNote = async (id: string, updates: Partial<Note>): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('notes')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      setNotes(prev => prev.map(note => 
        note.id === id ? { ...note, ...updates } : note
      ));

      if (selectedNote && selectedNote.id === id) {
        setSelectedNote(prev => prev ? { ...prev, ...updates } : null);
      }

      return true;
    } catch (error) {
      console.error('Error updating note:', error);
      toast.error('Failed to update note');
      return false;
    }
  };

  const deleteNote = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setNotes(prev => prev.filter(note => note.id !== id));
      
      if (selectedNote && selectedNote.id === id) {
        setSelectedNote(null);
      }

      toast.success('Note deleted successfully');
      return true;
    } catch (error) {
      console.error('Error deleting note:', error);
      toast.error('Failed to delete note');
      return false;
    }
  };

  const selectNote = (note: Note | null) => {
    setSelectedNote(note);
  };

  const shareNote = async (noteId: string, userId: string, permissionLevel: 'read' | 'write' | 'admin'): Promise<boolean> => {
    if (!currentUser) return false;

    try {
      const { error } = await supabase
        .from('note_shares')
        .insert({
          note_id: noteId,
          shared_with_user_id: userId,
          permission_level: permissionLevel,
          shared_by_user_id: currentUser.id
        });

      if (error) throw error;

      // Update the note to mark it as shared
      await updateNote(noteId, { is_shared: true });

      toast.success('Note shared successfully');
      return true;
    } catch (error) {
      console.error('Error sharing note:', error);
      toast.error('Failed to share note');
      return false;
    }
  };

  const unshareNote = async (noteId: string, userId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('note_shares')
        .delete()
        .eq('note_id', noteId)
        .eq('shared_with_user_id', userId);

      if (error) throw error;

      // Check if there are any remaining shares
      const { data: remainingShares } = await supabase
        .from('note_shares')
        .select('id')
        .eq('note_id', noteId);

      if (!remainingShares || remainingShares.length === 0) {
        await updateNote(noteId, { is_shared: false });
      }

      toast.success('Note unshared successfully');
      return true;
    } catch (error) {
      console.error('Error unsharing note:', error);
      toast.error('Failed to unshare note');
      return false;
    }
  };

  const getNoteShares = async (noteId: string): Promise<NoteShare[]> => {
    try {
      const { data, error } = await supabase
        .from('note_shares')
        .select('*')
        .eq('note_id', noteId);

      if (error) throw error;

      // Type cast the data to match our NoteShare interface
      return (data || []).map(share => ({
        ...share,
        permission_level: share.permission_level as 'read' | 'write' | 'admin'
      })) as NoteShare[];
    } catch (error) {
      console.error('Error fetching note shares:', error);
      return [];
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchNotes();
    }
  }, [currentUser]);

  return (
    <NotesContext.Provider value={{
      notes,
      selectedNote,
      loading,
      fetchNotes,
      createNote,
      updateNote,
      deleteNote,
      selectNote,
      shareNote,
      unshareNote,
      getNoteShares
    }}>
      {children}
    </NotesContext.Provider>
  );
};
