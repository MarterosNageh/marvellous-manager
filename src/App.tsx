import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { DataProvider } from "@/context/DataContext";
import { TaskProvider } from "@/context/TaskContext";
import { useNotifications } from "@/hooks/useNotifications";

// Page imports
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Projects from "./pages/Projects";
import ProjectDetail from "./pages/ProjectDetail";
import ProjectForm from "./pages/ProjectForm";
import HardDrives from "./pages/HardDrives";
import HardDriveDetail from "./pages/HardDriveDetail";
import HardDriveForm from "./pages/HardDriveForm";
import QRCodePage from "./pages/QRCodePage";
import PrintPage from "./pages/PrintPage";
import PublicHardDriveView from "./pages/PublicHardDriveView";
import UserManagement from "./pages/UserManagement";
import TaskManager from "./pages/TaskManager";
import NotFound from "./pages/NotFound";
import Settings from "./pages/Settings";
import ShiftsSchedule from "./pages/ShiftsSchedule";
import KnowledgeBase from "./pages/KnowledgeBase";
import FCMDebug from "./pages/FCMDebug";

const queryClient = new QueryClient();

const AppContent = () => {
  useNotifications(); // Initialize notifications
  
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/hard-drives/:id/view" element={<PublicHardDriveView />} />

        {/* Protected routes */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={
          <TaskProvider>
            <Dashboard />
          </TaskProvider>
        } />

        {/* Project routes */}
        <Route path="/projects" element={<Projects />} />
        <Route path="/projects/new" element={<ProjectForm />} />
        <Route path="/projects/:id" element={<ProjectDetail />} />
        <Route path="/projects/:id/edit" element={<ProjectForm />} />
        <Route path="/projects/:id/print" element={<PrintPage />} />

        {/* Hard drive routes */}
        <Route path="/hard-drives" element={<HardDrives />} />
        <Route path="/hard-drives/new" element={<HardDriveForm />} />
        <Route path="/hard-drives/:id" element={<HardDriveDetail />} />
        <Route path="/hard-drives/:id/edit" element={<HardDriveForm />} />
        <Route path="/hard-drives/:id/qr" element={<QRCodePage />} />
        <Route path="/hard-drives/:id/print" element={<PrintPage />} />

        {/* Admin routes */}
        <Route path="/settings" element={<Settings />} />

        {/* Coming soon */}
        <Route path="/users" element={<UserManagement />} />

        {/* Task Manager */}
        <Route path="/task-manager" element={<TaskManager />} />

        {/* Shifts schedule */}
        <Route path="/shifts-schedule" element={<ShiftsSchedule />} />
        
        {/* Knowledge Base */}
        <Route path="/knowledge-base" element={<KnowledgeBase />} />

        {/* Catch-all */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <DataProvider>
        <TooltipProvider>
          <AppContent />
          <Toaster />
          <Sonner />
        </TooltipProvider>
      </DataProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
