
import { ReactNode, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Header } from "@/components/layout/Header";
import { useIsMobile } from "@/hooks/use-mobile";

interface MainLayoutProps {
  children: ReactNode;
}

export const MainLayout = ({
  children
}: MainLayoutProps) => {
  const { isAuthenticated, currentUser } = useAuth();
  const isMobile = useIsMobile();

  useEffect(() => {
    console.log('🏠 MainLayout rendered');
    console.log('🏠 Is authenticated:', isAuthenticated);
    console.log('🏠 Current user:', currentUser);
    console.log('🏠 Current path:', window.location.pathname);
  }, [isAuthenticated, currentUser]);
  
  if (!isAuthenticated) {
    console.log('🚨 Not authenticated, redirecting to login');
    return <Navigate to="/login" />;
  }
  
  return (
    <SidebarProvider defaultOpen={!isMobile}>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <main className="flex-1 flex flex-col h-screen overflow-hidden">
          <Header />
          <div className="flex-1 overflow-y-auto bg-gray-50 my-[20px] px-[23px]">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};
