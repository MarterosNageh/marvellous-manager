
import { useEffect } from "react";
import { FCMDebugger } from "@/components/FCMDebugger";
import { MainLayout } from "@/components/layout/MainLayout";
import { useAuth } from "@/context/AuthContext";

const FCMDebug = () => {
  const { isAuthenticated, currentUser } = useAuth();

  useEffect(() => {
    console.log('🔍 FCMDebug page loaded');
    console.log('🔍 Is authenticated:', isAuthenticated);
    console.log('🔍 Current user:', currentUser);
    console.log('🔍 Current path:', window.location.pathname);
  }, [isAuthenticated, currentUser]);

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">FCM Debug Center</h1>
          <p className="text-muted-foreground">
            Comprehensive testing and debugging tools for Firebase Cloud Messaging
          </p>
        </div>
        
        <FCMDebugger />
      </div>
    </MainLayout>
  );
};

export default FCMDebug;
