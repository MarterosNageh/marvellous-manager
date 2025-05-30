
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertCircle, TestTube, Wifi, Database, Cloud } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export const FirebaseConnectionTest = () => {
  const [results, setResults] = useState<any>({});
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const { toast } = useToast();

  const testResults = (key: string, success: boolean, message: string, data?: any) => {
    setResults(prev => ({
      ...prev,
      [key]: { success, message, data, timestamp: new Date().toISOString() }
    }));
  };

  // Test 1: Check Firebase Configuration
  const testFirebaseConfig = async () => {
    setIsLoading('config');
    console.log('🧪 Testing Firebase Configuration...');
    
    try {
      // Import Firebase config dynamically
      const { messaging } = await import('../config/firebase');
      const firebaseApp = messaging.app;
      
      const configData = {
        apiKey: firebaseApp.options.apiKey?.substring(0, 20) + '...',
        authDomain: firebaseApp.options.authDomain,
        projectId: firebaseApp.options.projectId,
        messagingSenderId: firebaseApp.options.messagingSenderId,
        appId: firebaseApp.options.appId?.substring(0, 20) + '...',
        isValid: !!(firebaseApp.options.apiKey && firebaseApp.options.projectId)
      };

      testResults('config', configData.isValid, 
        configData.isValid ? 'Firebase configuration is valid' : 'Firebase configuration is missing key fields',
        configData);
    } catch (error) {
      console.error('❌ Firebase config test failed:', error);
      testResults('config', false, `Firebase config error: ${error.message}`);
    } finally {
      setIsLoading(null);
    }
  };

  // Test 2: Test FCM Token Generation
  const testFCMTokenGeneration = async () => {
    setIsLoading('token');
    console.log('🧪 Testing FCM Token Generation...');
    
    try {
      const { getToken, messaging } = await import('../config/firebase');
      const VAPID_KEY = 'BL7ELSlram2dAgx2Hm1BTEKD9EjvCcxkIqJaUNZjD1HNg_O2zzMiA5d9I5A5mPKZJVk7T2tLWS-4kzRv6fTuwS4';
      
      // Check notification permission
      const permission = Notification.permission;
      if (permission !== 'granted') {
        testResults('token', false, `Notification permission not granted: ${permission}`, {
          permission,
          needsPermission: true
        });
        return;
      }

      // Try to get FCM token
      const currentToken = await getToken(messaging, { vapidKey: VAPID_KEY });
      
      if (currentToken) {
        const tokenData = {
          tokenLength: currentToken.length,
          tokenPrefix: currentToken.substring(0, 30) + '...',
          isValidFormat: currentToken.includes(':'),
          timestamp: Date.now()
        };
        
        testResults('token', true, 'FCM token generated successfully', tokenData);
      } else {
        testResults('token', false, 'No FCM token available - registration may have failed');
      }
    } catch (error) {
      console.error('❌ FCM token test failed:', error);
      testResults('token', false, `FCM token error: ${error.message}`);
    } finally {
      setIsLoading(null);
    }
  };

  // Test 3: Test Database Connection
  const testDatabaseConnection = async () => {
    setIsLoading('database');
    console.log('🧪 Testing Database Connection...');
    
    try {
      const currentUser = localStorage.getItem('currentUser');
      if (!currentUser) {
        testResults('database', false, 'No current user found', { needsLogin: true });
        return;
      }

      const user = JSON.parse(currentUser);
      
      // Test database read
      const { data, error, count } = await supabase
        .from('push_subscriptions')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id);

      if (error) {
        testResults('database', false, `Database error: ${error.message}`, { 
          error: error.code,
          details: error.details 
        });
        return;
      }

      const dbData = {
        userId: user.id,
        totalSubscriptions: count,
        subscriptions: data?.map(sub => ({
          id: sub.id,
          endpoint: sub.endpoint.substring(0, 50) + '...',
          created: sub.created_at
        }))
      };

      testResults('database', true, `Database connection successful - found ${count} subscriptions`, dbData);
    } catch (error) {
      console.error('❌ Database test failed:', error);
      testResults('database', false, `Database test error: ${error.message}`);
    } finally {
      setIsLoading(null);
    }
  };

  // Test 4: Test Edge Function Connection
  const testEdgeFunctionConnection = async () => {
    setIsLoading('edge');
    console.log('🧪 Testing Edge Function Connection...');
    
    try {
      const startTime = Date.now();
      const { data, error } = await supabase.functions.invoke('send-push-notification', {
        body: {
          userIds: ['test-connection-check'],
          title: '🧪 Connection Test',
          body: 'Testing edge function connectivity',
          data: { test: true, timestamp: Date.now() }
        }
      });
      const duration = Date.now() - startTime;

      if (error) {
        testResults('edge', false, `Edge function error: ${error.message}`, { 
          error: error.name,
          duration 
        });
        return;
      }

      testResults('edge', true, 'Edge function responded successfully', {
        duration,
        response: data,
        apiVersion: data?.apiVersion || 'Unknown'
      });
    } catch (error) {
      console.error('❌ Edge function test failed:', error);
      testResults('edge', false, `Edge function test error: ${error.message}`);
    } finally {
      setIsLoading(null);
    }
  };

  // Run all tests
  const runAllTests = async () => {
    setResults({});
    console.log('🧪 === STARTING FIREBASE CONNECTION TESTS ===');
    
    await testFirebaseConfig();
    await testFCMTokenGeneration();
    await testDatabaseConnection();
    await testEdgeFunctionConnection();
    
    console.log('🧪 === ALL TESTS COMPLETED ===');
    toast({
      title: "🧪 All Tests Completed",
      description: "Check the results below. See console for detailed logs.",
    });
  };

  const getStatusIcon = (result: any) => {
    if (!result) return <AlertCircle className="h-4 w-4 text-gray-400" />;
    return result.success ? 
      <CheckCircle className="h-4 w-4 text-green-500" /> : 
      <XCircle className="h-4 w-4 text-red-500" />;
  };

  const getStatusBadge = (result: any) => {
    if (!result) return <Badge variant="secondary">Not Tested</Badge>;
    return result.success ? 
      <Badge className="bg-green-100 text-green-800">Pass</Badge> : 
      <Badge variant="destructive">Fail</Badge>;
  };

  const testCategories = [
    { 
      key: 'config', 
      label: 'Firebase Configuration', 
      icon: <Cloud className="h-4 w-4" />,
      description: 'Validates Firebase project settings and API keys'
    },
    { 
      key: 'token', 
      label: 'FCM Token Generation', 
      icon: <TestTube className="h-4 w-4" />,
      description: 'Tests ability to generate FCM tokens for push notifications'
    },
    { 
      key: 'database', 
      label: 'Database Connection', 
      icon: <Database className="h-4 w-4" />,
      description: 'Tests Supabase database connectivity and subscription storage'
    },
    { 
      key: 'edge', 
      label: 'Edge Function', 
      icon: <Wifi className="h-4 w-4" />,
      description: 'Tests push notification edge function connectivity'
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TestTube className="h-5 w-5" />
          Firebase Connection Test Suite
        </CardTitle>
        <div className="text-sm text-muted-foreground">
          Comprehensive testing of Firebase FCM setup and connections
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2 mb-6">
          <Button onClick={runAllTests} className="mb-2" disabled={isLoading !== null}>
            {isLoading ? 'Testing...' : 'Run All Tests'}
          </Button>
          <Button variant="outline" onClick={testFirebaseConfig} disabled={isLoading === 'config'}>
            {isLoading === 'config' ? 'Testing...' : 'Test Config'}
          </Button>
          <Button variant="outline" onClick={testFCMTokenGeneration} disabled={isLoading === 'token'}>
            {isLoading === 'token' ? 'Testing...' : 'Test FCM Token'}
          </Button>
          <Button variant="outline" onClick={testDatabaseConnection} disabled={isLoading === 'database'}>
            {isLoading === 'database' ? 'Testing...' : 'Test Database'}
          </Button>
          <Button variant="outline" onClick={testEdgeFunctionConnection} disabled={isLoading === 'edge'}>
            {isLoading === 'edge' ? 'Testing...' : 'Test Edge Function'}
          </Button>
        </div>

        <div className="space-y-4">
          {testCategories.map(({ key, label, icon, description }) => (
            <div key={key} className="flex items-start gap-3 p-4 border rounded-lg">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                {getStatusIcon(results[key])}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {icon}
                    <span className="font-medium">{label}</span>
                    {getStatusBadge(results[key])}
                    {isLoading === key && <Badge variant="outline">Testing...</Badge>}
                  </div>
                  <div className="text-sm text-gray-600 mb-1">{description}</div>
                  {results[key] && (
                    <div className="text-sm text-gray-600">
                      <p className={results[key].success ? 'text-green-700' : 'text-red-700'}>
                        {results[key].message}
                      </p>
                      {results[key].data && (
                        <details className="mt-2">
                          <summary className="cursor-pointer text-blue-600 hover:text-blue-800">
                            View Technical Details
                          </summary>
                          <pre className="mt-1 p-2 bg-gray-50 rounded text-xs overflow-auto max-h-32">
                            {JSON.stringify(results[key].data, null, 2)}
                          </pre>
                        </details>
                      )}
                      <span className="text-xs text-gray-400">
                        Tested at {new Date(results[key].timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-medium text-blue-900 mb-2">Debugging Tips</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• If Firebase config fails: Check environment variables and project settings</li>
            <li>• If FCM token fails: Ensure notification permissions are granted</li>
            <li>• If database fails: Check Supabase connection and table permissions</li>
            <li>• If edge function fails: Check function deployment and secrets</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
