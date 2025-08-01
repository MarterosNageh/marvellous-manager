import { Routes, Route } from 'react-router-dom';

// Pages
import Index from '@/pages/Index';
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import HardDrives from '@/pages/HardDrives';
import HardDriveForm from '@/pages/HardDriveForm';
import HardDriveDetail from '@/pages/HardDriveDetail';
import PublicHardDriveView from '@/pages/PublicHardDriveView';
import Projects from '@/pages/Projects';
import ProjectForm from '@/pages/ProjectForm';
import ProjectDetail from '@/pages/ProjectDetail';
import TaskManager from '@/pages/TaskManager';
import ComingSoon from '@/pages/ComingSoon';
import UserManagement from '@/pages/UserManagement';
import PrintPage from '@/pages/PrintPage';
import QRCodePage from '@/pages/QRCodePage';
import Settings from '@/pages/Settings';
import KnowledgeBase from '@/pages/KnowledgeBase';
import Notes from '@/pages/Notes';
import NotFound from '@/pages/NotFound';
import Schedule from '@/pages/Schedule';

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/login" element={<Login />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/hard-drives" element={<HardDrives />} />
      <Route path="/hard-drives/new" element={<HardDriveForm />} />
      <Route path="/hard-drives/:id" element={<HardDriveDetail />} />
      <Route path="/hard-drives/:id/edit" element={<HardDriveForm />} />
      <Route path="/hard-drives/:id/print" element={<PrintPage />} />
      <Route path="/hard-drives/:id/qr" element={<QRCodePage />} />
      <Route path="/hard-drives/:id/view" element={<PublicHardDriveView />} />
      <Route path="/projects" element={<Projects />} />
      <Route path="/projects/new" element={<ProjectForm />} />
      <Route path="/projects/:id" element={<ProjectDetail />} />
      <Route path="/projects/:id/edit" element={<ProjectForm />} />
      <Route path="/print" element={<PrintPage />} />
      <Route path="/print/:id" element={<PrintPage />} />
      <Route path="/task-manager" element={<TaskManager />} />
      <Route path="/schedule" element={<Schedule />} />
      <Route path="/user-management" element={<UserManagement />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="/knowledge-base" element={<KnowledgeBase />} />
      <Route path="/notes" element={<Notes />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes; 