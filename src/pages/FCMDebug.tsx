
import React from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { FCMDebugger } from '@/components/FCMDebugger';
import { FirebaseConnectionTest } from '@/components/FirebaseConnectionTest';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const FCMDebug = () => {
  return (
    <MainLayout>
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">FCM Debug & Testing</h1>
          <p className="text-muted-foreground">
            Comprehensive debugging and testing tools for Firebase Cloud Messaging
          </p>
        </div>

        <Tabs defaultValue="connection" className="w-full">
          <TabsList>
            <TabsTrigger value="connection">Connection Test</TabsTrigger>
            <TabsTrigger value="system">System Debugger</TabsTrigger>
          </TabsList>
          
          <TabsContent value="connection" className="mt-6">
            <FirebaseConnectionTest />
          </TabsContent>
          
          <TabsContent value="system" className="mt-6">
            <FCMDebugger />
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default FCMDebug;
