
import { FCMDebugger } from "@/components/FCMDebugger";
import { MainLayout } from "@/components/layout/MainLayout";

const FCMDebug = () => {
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
