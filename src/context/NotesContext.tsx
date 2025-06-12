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
  is_owned?: boolean;
  permission_level?: string;
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
      
      // Fetch notes owned by the current user
      const { data: ownedNotes, error: ownedError } = await supabase
        .from('notes')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('updated_at', { ascending: false });

      if (ownedError) throw ownedError;

      // Fetch notes shared with the current user
      const { data: sharedNotes, error: sharedError } = await supabase
        .from('note_shares')
        .select(`
          note_id,
          permission_level,
          notes (*)
        `)
        .eq('shared_with_user_id', currentUser.id);

      if (sharedError) throw sharedError;

      // Combine owned and shared notes
      const ownedNotesArray = (ownedNotes || []).map(note => ({
        ...note,
        note_type: 'note' as const,
        is_owned: true,
        permission_level: 'owner'
      }));

      const sharedNotesArray = (sharedNotes || []).map(share => ({
        ...share.notes,
        note_type: 'note' as const,
        is_owned: false,
        permission_level: share.permission_level
      }));

      // Combine and sort by updated_at
      const allNotes = [...ownedNotesArray, ...sharedNotesArray]
        .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());

      setNotes(allNotes);
    } catch (error) {
      console.error('Error fetching notes:', error);
      toast.error('Failed to load notes');
    } finally {
      setLoading(false);
    }
  };

  const getSeniorUsers = async (): Promise<string[]> => {
    try {
      const { data, error } = await supabase
        .from('auth_users')
        .select('id')
        .or('is_admin.eq.true,role.eq.senior');

      if (error) {
        console.error('Error fetching senior users:', error);
        return [];
      }

      return data?.map(user => user.id) || [];
    } catch (error) {
      console.error('Error getting senior users:', error);
      return [];
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
      
      // Send notification to senior users about the new note
      const seniorUserIds = await getSeniorUsers();
      if (seniorUserIds.length > 0) {
        await NotificationService.sendNoteCreatedNotification(
          seniorUserIds,
          title,
          currentUser.username || 'A user'
        );
      }
      
      toast.success('Note created successfully');
      return newNote;
    } catch (error) {
      console.error('Error creating note:', error);
      toast.error('Failed to create note');
      return null;
    }
  };

  const updateNote = async (id: string, noteData: Partial<Note>): Promise<boolean> => {
    if (!currentUser) return false;

    // Find the note to check permissions
    const note = notes.find(n => n.id === id);
    if (!note) return false;

    // Check if user has permission to update
    const canUpdate = note.user_id === currentUser.id || 
                     note.permission_level === 'write' || 
                     note.permission_level === 'admin' ||
                     currentUser.role === 'admin' ||
                     currentUser.role === 'senior';
    
    if (!canUpdate) {
      toast.error('You do not have permission to update this note');
      return false;
    }

    try {
      // Detect what changes are being made
      const changes: string[] = [];
      if (noteData.title !== undefined && noteData.title !== note.title) {
        changes.push('title');
      }
      if (noteData.content !== undefined && noteData.content !== note.content) {
        changes.push('content');
      }

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

      // Send notification to senior users about the note modification
      if (changes.length > 0) {
        const seniorUserIds = await getSeniorUsers();
        if (seniorUserIds.length > 0) {
          await NotificationService.sendNoteModifiedNotification(
            seniorUserIds,
            noteData.title || note.title,
            currentUser.username || 'A user',
            changes
          );
        }
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
    if (!currentUser) return false;

    // Find the note to check permissions
    const note = notes.find(n => n.id === id);
    if (!note) return false;

    // Check if user has permission to delete
    const canDelete = note.user_id === currentUser.id || 
                     note.permission_level === 'admin' ||
                     currentUser.role === 'admin' ||
                     currentUser.role === 'senior';
    
    if (!canDelete) {
      toast.error('You do not have permission to delete this note');
      return false;
    }

    try {
      // Store note title before deletion for notification
      const noteTitle = note.title;

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

      // Send notification to senior users about the note deletion
      const seniorUserIds = await getSeniorUsers();
      if (seniorUserIds.length > 0) {
        await NotificationService.sendNoteDeletedNotification(
          seniorUserIds,
          noteTitle,
          currentUser.username || 'A user'
        );
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

    // Find the note to check permissions
    const note = notes.find(n => n.id === noteId);
    if (!note) return false;

    // Check if user has permission to share
    const canShare = note.user_id === currentUser.id || 
                    note.permission_level === 'admin' ||
                    currentUser.role === 'admin' ||
                    currentUser.role === 'senior';
    
    if (!canShare) {
      toast.error('You do not have permission to share this note');
      return false;
    }

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

      // Send notification to senior users about the note sharing
      const seniorUserIds = await getSeniorUsers();
      if (seniorUserIds.length > 0) {
        await NotificationService.sendNoteSharedNotification(
          seniorUserIds,
          selectedNote?.title || 'Note',
          currentUser.username || 'A user'
        );
      }

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
    if (!currentUser) return false;

    // Find the note to check permissions
    const note = notes.find(n => n.id === noteId);
    if (!note) return false;

    // Check if user has permission to unshare
    const canUnshare = note.user_id === currentUser.id || 
                      note.permission_level === 'admin' ||
                      currentUser.role === 'admin' ||
                      currentUser.role === 'senior';
    
    if (!canUnshare) {
      toast.error('You do not have permission to unshare this note');
      return false;
    }

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
