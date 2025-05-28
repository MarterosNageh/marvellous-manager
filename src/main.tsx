import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

import "./index.css";
import App from "./App";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import TaskManager from "./pages/TaskManager";
import Projects from "./pages/Projects";
import ProjectForm from "./pages/ProjectForm";
import ProjectDetail from "./pages/ProjectDetail";
import HardDrives from "./pages/HardDrives";
import HardDriveForm from "./pages/HardDriveForm";
import HardDriveDetail from "./pages/HardDriveDetail";
import PrintPage from "./pages/PrintPage";
import QRCodePage from "./pages/QRCodePage";
import PublicHardDriveView from "./pages/PublicHardDriveView";
import UserManagement from "./pages/UserManagement";
import Settings from "./pages/Settings";
import KnowledgeBase from "./pages/KnowledgeBase";
import ShiftsSchedule from "./pages/ShiftsSchedule";
import NotFound from "./pages/NotFound";
import Index from "./pages/Index";

import FCMDebug from "./pages/FCMDebug.tsx";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);

const router = createBrowserRouter([
  {
    path: "/",
    element: <Index />,
  },
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/dashboard",
    element: <Dashboard />,
  },
  {
    path: "/task-manager",
    element: <TaskManager />,
  },
  {
    path: "/projects",
    element: <Projects />,
  },
  {
    path: "/projects/new",
    element: <ProjectForm />,
  },
  {
    path: "/projects/:id",
    element: <ProjectDetail />,
  },
  {
    path: "/projects/:id/edit",
    element: <ProjectForm />,
  },
  {
    path: "/hard-drives",
    element: <HardDrives />,
  },
  {
    path: "/hard-drives/new",
    element: <HardDriveForm />,
  },
  {
    path: "/hard-drives/:id",
    element: <HardDriveDetail />,
  },
  {
    path: "/hard-drives/:id/edit",
    element: <HardDriveForm />,
  },
  {
    path: "/print",
    element: <PrintPage />,
  },
  {
    path: "/qr/:id",
    element: <QRCodePage />,
  },
  {
    path: "/public/hard-drive/:id",
    element: <PublicHardDriveView />,
  },
  {
    path: "/user-management",
    element: <UserManagement />,
  },
  {
    path: "/settings",
    element: <Settings />,
  },
  {
    path: "/knowledge-base",
    element: <KnowledgeBase />,
  },
  {
    path: "/shifts-schedule",
    element: <ShiftsSchedule />,
  },
  {
    path: "/fcm-debug",
    element: <FCMDebug />,
  },
  {
    path: "*",
    element: <NotFound />,
  },
]);
