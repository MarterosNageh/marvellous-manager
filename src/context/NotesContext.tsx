import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';

export interface Note {
  id: string;
  title: string;
  content: string;
  user_id: string;
  note_type: 'note';
  is_shared: boolean;
  created_at: string;
  updated_at: string;
}

interface NoteShare {
  id: string;
  note_id: string;
  shared_with_user_id: string;
  permission_level: 'read' | 'write' | 'admin';
  created_at: string;
  updated_at: string;
}

interface NotesContextType {
  notes: Note[];
  selectedNote: Note | null;
  loading: boolean;
  createNote: (title: string, content?: string) => Promise<Note | null>;
  updateNote: (id: string, updates: Partial<Note>) => Promise<boolean>;
  deleteNote: (id: string) => Promise<void>;
  selectNote: (note: Note | null) => void;
  refreshNotes: () => Promise<void>;
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
  const { currentUser } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(false);

  const refreshNotes = async () => {
    if (!currentUser) return;
    
    setLoading(true);
    try {
      // Get notes owned by user
      const { data: ownedNotes, error: ownedError } = await supabase
        .from('notes')
        .select('*')
        .eq('user_id', currentUser.id)
        .eq('note_type', 'note')
        .order('updated_at', { ascending: false });

      if (ownedError) throw ownedError;

      // Get notes shared with user
      const { data: sharedNotes, error: sharedError } = await supabase
        .from('note_shares')
        .select(`
          notes (
            id,
            title,
            content,
            user_id,
            note_type,
            is_shared,
            created_at,
            updated_at
          )
        `)
        .eq('shared_with_user_id', currentUser.id);

      if (sharedError) throw sharedError;

      // Combine and deduplicate notes
      const allNotes = [
        ...(ownedNotes || []),
        ...(sharedNotes?.map(s => s.notes).filter(Boolean) || [])
      ];

      // Remove duplicates based on ID
      const uniqueNotes = allNotes.filter((note, index, self) => 
        index === self.findIndex(n => n.id === note.id)
      );

      setNotes(uniqueNotes);
    } catch (error) {
      console.error('Error fetching notes:', error);
      toast.error('Failed to load notes');
    } finally {
      setLoading(false);
    }
  };

  const createNote = async (title: string, content: string = ''): Promise<Note | null> => {
    if (!currentUser) return null;

    try {
      const { data, error } = await supabase
        .from('notes')
        .insert({
          title,
          content,
          user_id: currentUser.id,
          note_type: 'note'
        })
        .select()
        .single();

      if (error) throw error;

      setNotes(prev => [data, ...prev]);
      setSelectedNote(data);
      toast.success('Note created successfully');
      return data;
    } catch (error) {
      console.error('Error creating note:', error);
      toast.error('Failed to create note');
      return null;
    }
  };

  const updateNote = async (id: string, updates: Partial<Note>): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('notes')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setNotes(prev => prev.map(note => note.id === id ? data : note));
      
      if (selectedNote?.id === id) {
        setSelectedNote(data);
      }
      return true;
    } catch (error) {
      console.error('Error updating note:', error);
      toast.error('Failed to update note');
      return false;
    }
  };

  const deleteNote = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setNotes(prev => prev.filter(note => note.id !== id));
      
      if (selectedNote?.id === id) {
        setSelectedNote(null);
      }
      
      toast.success('Note deleted successfully');
    } catch (error) {
      console.error('Error deleting note:', error);
      toast.error('Failed to delete note');
    }
  };

  const selectNote = (note: Note | null) => {
    setSelectedNote(note);
  };

  const shareNote = async (noteId: string, userId: string, permissionLevel: 'read' | 'write' | 'admin'): Promise<boolean> => {
    try {
      // First update the note's is_shared status
      const { error: updateError } = await supabase
        .from('notes')
        .update({ is_shared: true })
        .eq('id', noteId);

      if (updateError) throw updateError;

      // Then create the share record
      const { error: shareError } = await supabase
        .from('note_shares')
        .insert({
          note_id: noteId,
          shared_with_user_id: userId,
          permission_level: permissionLevel
        });

      if (shareError) throw shareError;

      toast.success('Note shared successfully');
      await refreshNotes();
      return true;
    } catch (error) {
      console.error('Error sharing note:', error);
      toast.error('Failed to share note');
      return false;
    }
  };

  const unshareNote = async (noteId: string, userId: string): Promise<boolean> => {
    try {
      // Delete the share record
      const { error: deleteError } = await supabase
        .from('note_shares')
        .delete()
        .eq('note_id', noteId)
        .eq('shared_with_user_id', userId);

      if (deleteError) throw deleteError;

      // Check if there are any remaining shares
      const { data: remainingShares, error: checkError } = await supabase
        .from('note_shares')
        .select('id')
        .eq('note_id', noteId);

      if (checkError) throw checkError;

      // If no more shares, update is_shared to false
      if (!remainingShares?.length) {
        const { error: updateError } = await supabase
          .from('notes')
          .update({ is_shared: false })
          .eq('id', noteId);

        if (updateError) throw updateError;
      }

      toast.success('Note unshared successfully');
      await refreshNotes();
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
      return data || [];
    } catch (error) {
      console.error('Error fetching note shares:', error);
      toast.error('Failed to load note shares');
      return [];
    }
  };

  useEffect(() => {
    if (currentUser) {
      refreshNotes();
    }
  }, [currentUser]);

  return (
    <NotesContext.Provider value={{
      notes,
      selectedNote,
      loading,
      createNote,
      updateNote,
      deleteNote,
      selectNote,
      refreshNotes,
      shareNote,
      unshareNote,
      getNoteShares
    }}>
      {children}
    </NotesContext.Provider>
  );
};
