
import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import LogoMarvellous from "@/components/LogoMarvellous";

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
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col h-screen overflow-hidden">
          {/* TOP HEADER */}
          <header className="flex items-center justify-between px-6 py-4 bg-white shadow border-b border-gray-200">
            <h1 className="font-extrabold text-2xl tracking-tight flex items-center gap-2">
              <LogoMarvellous className="h-9 w-auto mr-2 hidden md:block" />
              Marvellous Manager
            </h1>
            <SidebarTrigger />
          </header>
          <main className="flex-1 overflow-y-auto bg-gray-50 p-6">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
};
