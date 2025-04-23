
import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";

interface MainLayoutProps {
  children: ReactNode;
}

export const MainLayout = ({ children }: MainLayoutProps) => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-slate-100 dark:bg-slate-900">
        <AppSidebar />
        <div className="flex-1 flex flex-col h-screen overflow-hidden">
          <header className="flex items-center justify-between px-6 py-4 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-gray-700">
            <h1 className="font-extrabold text-2xl tracking-tight flex items-center gap-2 text-slate-900 dark:text-white">
              Marvellous Manager
            </h1>
            <SidebarTrigger />
          </header>
          <main className="flex-1 overflow-y-auto p-6">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
};
