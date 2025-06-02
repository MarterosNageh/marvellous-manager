
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
  parent_id?: string;
  created_at: string;
  updated_at: string;
}

interface NotesContextType {
  notes: Note[];
  loading: boolean;
  refreshNotes: () => Promise<void>;
  createNote: (noteData: Omit<Note, 'id' | 'created_at' | 'updated_at'>) => Promise<boolean>;
  updateNote: (id: string, noteData: Partial<Note>) => Promise<boolean>;
  deleteNote: (id: string) => Promise<boolean>;
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

  const createNote = async (noteData: Omit<Note, 'id' | 'created_at' | 'updated_at'>): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('notes')
        .insert({
          ...noteData,
          note_type: 'note'
        })
        .select()
        .single();

      if (error) throw error;

      // Add the new note to state
      setNotes(prev => [{ ...data, note_type: 'note' }, ...prev]);
      toast.success('Note created successfully');
      return true;
    } catch (error) {
      console.error('Error creating note:', error);
      toast.error('Failed to create note');
      return false;
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
      toast.success('Note deleted successfully');
      return true;
    } catch (error) {
      console.error('Error deleting note:', error);
      toast.error('Failed to delete note');
      return false;
    }
  };

  useEffect(() => {
    refreshNotes();
  }, [currentUser]);

  return (
    <NotesContext.Provider value={{
      notes,
      loading,
      refreshNotes,
      createNote,
      updateNote,
      deleteNote
    }}>
      {children}
    </NotesContext.Provider>
  );
};
