import { ReactNode, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Header } from "@/components/layout/Header";
import { useIsMobile } from "@/hooks/use-mobile";
import { fetchToken } from "../../../notification";
import { NotificationService } from "@/services/notificationService";
import { InstallPWA } from "@/components/InstallPWA";

interface MainLayoutProps {
  children: ReactNode;
}

export const MainLayout = ({
  children
}: MainLayoutProps) => {
  const { isAuthenticated, currentUser } = useAuth();
  const isMobile = useIsMobile();

  useEffect(() => {
    const initializeNotifications = async () => {
      if (isAuthenticated && currentUser) {
        try {
          const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
          console.log(`📱 Initializing notifications for ${isMobile ? 'mobile' : 'desktop'} device`);
          
          const token = await fetchToken();
          if (token) {
            console.log(`FCM token obtained for ${isMobile ? 'mobile' : 'desktop'}:`, token.slice(0, 10) + '...');
            await NotificationService.saveTokenManually(currentUser.id, token);
          } else {
            console.warn('No FCM token obtained');
          }
        } catch (error) {
          console.error('Error initializing FCM:', error);
        }
      }
    };

    initializeNotifications();
  }, [isAuthenticated, currentUser]);

  // Redirect to login if not authenticated
  if (isAuthenticated === false) {
    return <Navigate to="/login" replace />;
  }

  // Show loading state while checking authentication
  if (isAuthenticated === null || isAuthenticated === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Authenticating...</p>
        </div>
      </div>
    );
  }

  // Additional security check - ensure user object exists
  if (!currentUser) {
    return <Navigate to="/login" replace />;
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
      <InstallPWA />
    </SidebarProvider>
  );
};
