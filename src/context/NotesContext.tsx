import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';
import { NotificationService } from '@/services/notificationService';

export interface Note {
  id: string;
  title: string;
  content: string;
  user_id: string;
  note_type: 'note';
  is_shared: boolean;
  parent_id?: string;
  created_at: string;
  updated_at: string;
}

interface NotesContextType {
  notes: Note[];
  selectedNote: Note | null;
  loading: boolean;
  refreshNotes: () => Promise<void>;
  createNote: (title: string, content: string) => Promise<Note | null>;
  updateNote: (id: string, noteData: Partial<Note>) => Promise<boolean>;
  deleteNote: (id: string) => Promise<boolean>;
  selectNote: (note: Note | null) => void;
  shareNote: (noteId: string, userId: string, permission: string) => Promise<boolean>;
  unshareNote: (noteId: string, userId: string) => Promise<boolean>;
  getNoteShares: (noteId: string) => Promise<any[]>;
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
  const [loading, setLoading] = useState(true);

  const refreshNotes = async () => {
    if (!currentUser) {
      setNotes([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      // Convert the data to match our Note interface
      const typedNotes: Note[] = (data || []).map(note => ({
        ...note,
        note_type: 'note' as const
      }));

      setNotes(typedNotes);
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

      const newNote: Note = { ...data, note_type: 'note' };
      setNotes(prev => [newNote, ...prev]);
      toast.success('Note created successfully');
      return newNote;
    } catch (error) {
      console.error('Error creating note:', error);
      toast.error('Failed to create note');
      return null;
    }
  };

  const updateNote = async (id: string, noteData: Partial<Note>): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('notes')
        .update({
          ...noteData,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      // Update the note in state
      setNotes(prev => prev.map(note => 
        note.id === id ? { ...note, ...noteData, updated_at: new Date().toISOString() } : note
      ));
      
      // Update selected note if it's the one being updated
      if (selectedNote?.id === id) {
        setSelectedNote(prev => prev ? { ...prev, ...noteData, updated_at: new Date().toISOString() } : null);
      }
      
      toast.success('Note updated successfully');
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

      // Remove the note from state
      setNotes(prev => prev.filter(note => note.id !== id));
      
      // Clear selected note if it's the one being deleted
      if (selectedNote?.id === id) {
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

  const shareNote = async (noteId: string, userId: string, permission: string): Promise<boolean> => {
    if (!currentUser) return false;

    try {
      const { error } = await supabase
        .from('note_shares')
        .insert({
          note_id: noteId,
          shared_by_user_id: currentUser.id,
          shared_with_user_id: userId,
          permission_level: permission
        });

      if (error) throw error;

      // Update note to mark as shared
      await supabase
        .from('notes')
        .update({ is_shared: true })
        .eq('id', noteId);

      // Send notification to the user the note was shared with
      await NotificationService.sendNoteSharedNotification(
        [userId],
        selectedNote?.title || 'Note',
        currentUser.username || 'A user'
      );

      // Refresh the notes list to update UI
      await refreshNotes();
      
      // Update the selected note to show shared status immediately
      if (selectedNote?.id === noteId) {
        setSelectedNote(prev => prev ? { ...prev, is_shared: true } : null);
      }

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

      // Check if this was the last share for this note
      const { data: remainingShares } = await supabase
        .from('note_shares')
        .select('id')
        .eq('note_id', noteId);

      // If no more shares exist, update the note's is_shared status
      if (!remainingShares?.length) {
        await supabase
          .from('notes')
          .update({ is_shared: false })
          .eq('id', noteId);

        // Update the selected note to remove shared status immediately
        if (selectedNote?.id === noteId) {
          setSelectedNote(prev => prev ? { ...prev, is_shared: false } : null);
        }
      }

      // Refresh the notes list to update UI
      await refreshNotes();

      toast.success('Note unshared successfully');
      return true;
    } catch (error) {
      console.error('Error unsharing note:', error);
      toast.error('Failed to unshare note');
      return false;
    }
  };

  const getNoteShares = async (noteId: string): Promise<any[]> => {
    try {
      const { data, error } = await supabase
        .from('note_shares')
        .select('*')
        .eq('note_id', noteId);

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error fetching note shares:', error);
      return [];
    }
  };

  useEffect(() => {
    refreshNotes();
  }, [currentUser]);

  return (
    <NotesContext.Provider value={{
      notes,
      selectedNote,
      loading,
      refreshNotes,
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
