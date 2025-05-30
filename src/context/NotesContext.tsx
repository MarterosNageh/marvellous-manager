
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

interface NotesContextType {
  notes: Note[];
  selectedNote: Note | null;
  loading: boolean;
  createNote: (title: string, content?: string) => Promise<Note | null>;
  updateNote: (id: string, updates: Partial<Note>) => Promise<boolean>;
  deleteNote: (id: string) => Promise<void>;
  selectNote: (note: Note | null) => void;
  refreshNotes: () => Promise<void>;
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
      refreshNotes
    }}>
      {children}
    </NotesContext.Provider>
  );
};
