
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, XCircle, AlertCircle, TestTube } from 'lucide-react';

export const FCMDebugger = () => {
  const [results, setResults] = useState<any>({});
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const { toast } = useToast();

  const testResults = (key: string, success: boolean, message: string, data?: any) => {
    setResults(prev => ({
      ...prev,
      [key]: { success, message, data, timestamp: new Date().toISOString() }
    }));
  };

  // Test 1: Check Service Worker Registration
  const testServiceWorker = async () => {
    setIsLoading('sw');
    console.log('🧪 Testing Service Worker...');
    
    try {
      if (!('serviceWorker' in navigator)) {
        testResults('sw', false, 'Service Worker not supported in this browser');
        return;
      }

      const registration = await navigator.serviceWorker.getRegistration('/sw.js');
      if (!registration) {
        testResults('sw', false, 'Service Worker not registered at /sw.js');
        return;
      }

      const swDetails = {
        scope: registration.scope,
        state: registration.active?.state,
        scriptURL: registration.active?.scriptURL
      };

      testResults('sw', true, 'Service Worker is active and registered', swDetails);
    } catch (error) {
      testResults('sw', false, `Service Worker error: ${error.message}`);
    } finally {
      setIsLoading(null);
    }
  };

  // Test 2: Check Push Subscription
  const testPushSubscription = async () => {
    setIsLoading('push');
    console.log('🧪 Testing Push Subscription...');
    
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      if (!subscription) {
        testResults('push', false, 'No push subscription found in browser');
        return;
      }

      const subscriptionData = {
        endpoint: subscription.endpoint.substring(0, 50) + '...',
        hasKeys: !!(subscription.getKey('p256dh') && subscription.getKey('auth')),
        p256dhLength: subscription.getKey('p256dh')?.byteLength,
        authLength: subscription.getKey('auth')?.byteLength
      };

      testResults('push', true, 'Push subscription exists in browser', subscriptionData);
    } catch (error) {
      testResults('push', false, `Push subscription error: ${error.message}`);
    } finally {
      setIsLoading(null);
    }
  };

  // Test 3: Check Database Subscription
  const testDatabaseSubscription = async () => {
    setIsLoading('db');
    console.log('🧪 Testing Database Subscription...');
    
    try {
      const currentUser = localStorage.getItem('currentUser');
      if (!currentUser) {
        testResults('db', false, 'No current user found');
        return;
      }

      const user = JSON.parse(currentUser);
      const { data: subscriptions, error } = await supabase
        .from('push_subscriptions')
        .select('*')
        .eq('user_id', user.id);

      if (error) {
        testResults('db', false, `Database query error: ${error.message}`);
        return;
      }

      const dbData = {
        count: subscriptions?.length || 0,
        subscriptions: subscriptions?.map(sub => ({
          id: sub.id,
          endpoint: sub.endpoint.substring(0, 50) + '...',
          created: sub.created_at
        }))
      };

      testResults('db', subscriptions && subscriptions.length > 0, 
        `Found ${subscriptions?.length || 0} subscriptions in database`, dbData);
    } catch (error) {
      testResults('db', false, `Database test error: ${error.message}`);
    } finally {
      setIsLoading(null);
    }
  };

  // Test 4: Test FCM Token Extraction
  const testFCMTokenExtraction = async () => {
    setIsLoading('token');
    console.log('🧪 Testing FCM Token Extraction...');
    
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      if (!subscription) {
        testResults('token', false, 'No subscription to extract token from');
        return;
      }

      const endpoint = subscription.endpoint;
      console.log('📱 Full endpoint:', endpoint);
      
      // Check if it's a FCM endpoint
      if (!endpoint.includes('fcm.googleapis.com')) {
        testResults('token', false, `Not a FCM endpoint. Got: ${endpoint.substring(0, 100)}...`);
        return;
      }

      // Extract token from FCM endpoint
      const fcmToken = endpoint.split('/').pop();
      
      const tokenData = {
        fullEndpoint: endpoint.substring(0, 100) + '...',
        extractedToken: fcmToken ? fcmToken.substring(0, 30) + '...' : 'No token found',
        tokenLength: fcmToken?.length || 0,
        isValidFormat: fcmToken && fcmToken.length > 100
      };

      testResults('token', !!(fcmToken && fcmToken.length > 100), 
        fcmToken ? 'FCM token extracted successfully' : 'Failed to extract valid FCM token', tokenData);
    } catch (error) {
      testResults('token', false, `Token extraction error: ${error.message}`);
    } finally {
      setIsLoading(null);
    }
  };

  // Test 5: Test Edge Function Connectivity
  const testEdgeFunction = async () => {
    setIsLoading('edge');
    console.log('🧪 Testing Edge Function...');
    
    try {
      const currentUser = localStorage.getItem('currentUser');
      if (!currentUser) {
        testResults('edge', false, 'No current user for edge function test');
        return;
      }

      const user = JSON.parse(currentUser);
      console.log('📤 Calling edge function with test payload...');

      const { data, error } = await supabase.functions.invoke('send-push-notification', {
        body: {
          userIds: [user.id],
          title: '🧪 Edge Function Test',
          body: 'Testing edge function connectivity and authentication',
          data: { test: true, timestamp: Date.now() }
        }
      });

      if (error) {
        testResults('edge', false, `Edge function error: ${error.message}`, { error });
        return;
      }

      testResults('edge', true, 'Edge function responded successfully', data);
    } catch (error) {
      testResults('edge', false, `Edge function test error: ${error.message}`);
    } finally {
      setIsLoading(null);
    }
  };

  // Test 6: Test Firebase Service Account
  const testFirebaseAuth = async () => {
    setIsLoading('firebase');
    console.log('🧪 Testing Firebase Authentication...');
    
    try {
      // Call edge function to test just the authentication part
      const { data, error } = await supabase.functions.invoke('send-push-notification', {
        body: {
          userIds: ['test-user-for-auth-only'],
          title: 'Auth Test',
          body: 'Testing Firebase authentication only',
          data: { authTest: true }
        }
      });

      if (error) {
        if (error.message.includes('invalid_grant') || error.message.includes('JWT Signature')) {
          testResults('firebase', false, 'Firebase Service Account authentication failed - invalid JWT signature');
        } else if (error.message.includes('401')) {
          testResults('firebase', false, 'Firebase authentication failed - unauthorized');
        } else {
          testResults('firebase', false, `Firebase auth error: ${error.message}`);
        }
        return;
      }

      testResults('firebase', true, 'Firebase authentication successful', data);
    } catch (error) {
      testResults('firebase', false, `Firebase auth test error: ${error.message}`);
    } finally {
      setIsLoading(null);
    }
  };

  // Run all tests
  const runAllTests = async () => {
    setResults({});
    await testServiceWorker();
    await testPushSubscription();
    await testDatabaseSubscription();
    await testFCMTokenExtraction();
    await testEdgeFunction();
    await testFirebaseAuth();
    
    toast({
      title: "🧪 All Tests Completed",
      description: "Check the results below to identify issues",
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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="h-5 w-5" />
            FCM System Debugger
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 mb-4">
            <Button onClick={runAllTests} className="mb-2">
              Run All Tests
            </Button>
            <Button variant="outline" onClick={testServiceWorker} disabled={isLoading === 'sw'}>
              {isLoading === 'sw' ? 'Testing...' : 'Test Service Worker'}
            </Button>
            <Button variant="outline" onClick={testPushSubscription} disabled={isLoading === 'push'}>
              {isLoading === 'push' ? 'Testing...' : 'Test Push Subscription'}
            </Button>
            <Button variant="outline" onClick={testDatabaseSubscription} disabled={isLoading === 'db'}>
              {isLoading === 'db' ? 'Testing...' : 'Test Database'}
            </Button>
            <Button variant="outline" onClick={testFCMTokenExtraction} disabled={isLoading === 'token'}>
              {isLoading === 'token' ? 'Testing...' : 'Test FCM Token'}
            </Button>
            <Button variant="outline" onClick={testEdgeFunction} disabled={isLoading === 'edge'}>
              {isLoading === 'edge' ? 'Testing...' : 'Test Edge Function'}
            </Button>
            <Button variant="outline" onClick={testFirebaseAuth} disabled={isLoading === 'firebase'}>
              {isLoading === 'firebase' ? 'Testing...' : 'Test Firebase Auth'}
            </Button>
          </div>

          <div className="space-y-4">
            {[
              { key: 'sw', label: 'Service Worker Registration' },
              { key: 'push', label: 'Browser Push Subscription' },
              { key: 'db', label: 'Database Subscription Storage' },
              { key: 'token', label: 'FCM Token Extraction' },
              { key: 'edge', label: 'Edge Function Connectivity' },
              { key: 'firebase', label: 'Firebase Authentication' }
            ].map(({ key, label }) => (
              <div key={key} className="flex items-start gap-3 p-3 border rounded-lg">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  {getStatusIcon(results[key])}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{label}</span>
                      {getStatusBadge(results[key])}
                    </div>
                    {results[key] && (
                      <div className="text-sm text-gray-600">
                        <p>{results[key].message}</p>
                        {results[key].data && (
                          <details className="mt-1">
                            <summary className="cursor-pointer text-blue-600">View Details</summary>
                            <pre className="mt-1 p-2 bg-gray-50 rounded text-xs overflow-auto">
                              {JSON.stringify(results[key].data, null, 2)}
                            </pre>
                          </details>
                        )}
                        <span className="text-xs text-gray-400">
                          {new Date(results[key].timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
