
import React from 'react';
import { MainLayout } from "@/components/layout/MainLayout";
import { NotesProvider } from '@/context/NotesContext';
import { NotesSidebar } from '@/components/notes/NotesSidebar';
import { NotesEditor } from '@/components/notes/NotesEditor';
import { BookOpen } from 'lucide-react';

const NotesContent = () => {
  return (
    <MainLayout>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-3">
            <div className="bg-green-100 dark:bg-green-900 p-2 rounded-lg">
              <BookOpen className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Notes
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Create, organize, and share your notes with team members
              </p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex h-[calc(100vh-140px)]">
          {/* Sidebar */}
          <div className="w-80 border-r border-gray-200 dark:border-gray-700 p-4">
            <NotesSidebar />
          </div>

          {/* Editor */}
          <div className="flex-1 p-4">
            <NotesEditor />
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

const Notes = () => (
  <NotesProvider>
    <NotesContent />
  </NotesProvider>
);

export default Notes;
