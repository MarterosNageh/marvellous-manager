import React, { useState } from 'react';
import { MainLayout } from "@/components/layout/MainLayout";
import { NotesProvider } from '@/context/NotesContext';
import { NotesSidebar } from '@/components/notes/NotesSidebar';
import { NotesEditor } from '@/components/notes/NotesEditor';
import { BookOpen, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const NotesContent = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <MainLayout>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="bg-green-100 dark:bg-green-900 p-2 rounded-lg">
                <BookOpen className="h-5 w-5 sm:h-6 sm:w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                  Notes
                </h1>
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                  Create, organize, and share your notes
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden"
            >
              {sidebarOpen ? (
                <PanelLeftClose className="h-5 w-5" />
              ) : (
                <PanelLeftOpen className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex h-[calc(100vh-140px)]">
          {/* Sidebar */}
          <div
            className={cn(
              "absolute md:relative w-full md:w-80 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 z-20 transition-all duration-300 ease-in-out",
              sidebarOpen ? "left-0" : "-left-full md:left-0",
              "h-[calc(100vh-140px)] md:h-auto"
            )}
          >
            <NotesSidebar onNoteSelect={() => setSidebarOpen(false)} />
          </div>

          {/* Editor */}
          <div className="flex-1 p-2 sm:p-4 overflow-hidden">
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
