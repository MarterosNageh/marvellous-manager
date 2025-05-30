
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, XCircle, AlertCircle, TestTube, Info, Wifi, Database, Key, Cloud, Bell } from 'lucide-react';

export const FCMDebugger = () => {
  const [results, setResults] = useState<any>({});
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [systemInfo, setSystemInfo] = useState<any>({});
  const { toast } = useToast();

  const testResults = (key: string, success: boolean, message: string, data?: any) => {
    setResults(prev => ({
      ...prev,
      [key]: { success, message, data, timestamp: new Date().toISOString() }
    }));
  };

  // System Information Check
  const gatherSystemInfo = async () => {
    console.log('🔍 Gathering system information...');
    
    const info = {
      browser: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine,
      serviceWorkerSupported: 'serviceWorker' in navigator,
      pushManagerSupported: 'PushManager' in window,
      notificationSupported: 'Notification' in window,
      notificationPermission: Notification.permission,
      currentUrl: window.location.href,
      timestamp: new Date().toISOString()
    };
    
    setSystemInfo(info);
    console.log('🔍 System info gathered:', info);
    return info;
  };

  // Test 1: Check Service Worker Registration
  const testServiceWorker = async () => {
    setIsLoading('sw');
    console.log('🧪 Testing Service Worker Registration...');
    
    try {
      await gatherSystemInfo();
      
      if (!('serviceWorker' in navigator)) {
        testResults('sw', false, 'Service Worker not supported in this browser', { 
          supported: false,
          reason: 'Browser compatibility issue'
        });
        return;
      }

      // Check if SW is registered
      const registrations = await navigator.serviceWorker.getRegistrations();
      console.log('🔍 All SW registrations:', registrations);

      const registration = await navigator.serviceWorker.getRegistration('/sw.js');
      if (!registration) {
        testResults('sw', false, 'Service Worker not registered at /sw.js', {
          registrations: registrations.length,
          expectedPath: '/sw.js'
        });
        return;
      }

      const swDetails = {
        scope: registration.scope,
        state: registration.active?.state,
        scriptURL: registration.active?.scriptURL,
        updatefound: !!registration.updatefound,
        installing: !!registration.installing,
        waiting: !!registration.waiting,
        active: !!registration.active
      };

      testResults('sw', true, 'Service Worker is active and registered', swDetails);
    } catch (error) {
      console.error('❌ Service Worker test failed:', error);
      testResults('sw', false, `Service Worker error: ${error.message}`, { error: error.name });
    } finally {
      setIsLoading(null);
    }
  };

  // Test 2: Check Push Subscription
  const testPushSubscription = async () => {
    setIsLoading('push');
    console.log('🧪 Testing Push Subscription...');
    
    try {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        testResults('push', false, 'Push Manager not supported', {
          serviceWorker: 'serviceWorker' in navigator,
          pushManager: 'PushManager' in window
        });
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      if (!subscription) {
        testResults('push', false, 'No push subscription found in browser', {
          registration: !!registration,
          pushManager: !!registration.pushManager
        });
        return;
      }

      const subscriptionData = {
        endpoint: subscription.endpoint.substring(0, 50) + '...',
        fullEndpoint: subscription.endpoint,
        hasKeys: !!(subscription.getKey('p256dh') && subscription.getKey('auth')),
        p256dhLength: subscription.getKey('p256dh')?.byteLength,
        authLength: subscription.getKey('auth')?.byteLength,
        expirationTime: subscription.expirationTime,
        options: subscription.options
      };

      // Check if it's a FCM endpoint
      const isFCM = subscription.endpoint.includes('fcm.googleapis.com');
      const token = isFCM ? subscription.endpoint.split('/').pop() : null;

      testResults('push', true, 'Push subscription exists in browser', {
        ...subscriptionData,
        isFCM,
        fcmToken: token ? token.substring(0, 30) + '...' : null
      });
    } catch (error) {
      console.error('❌ Push subscription test failed:', error);
      testResults('push', false, `Push subscription error: ${error.message}`, { error: error.name });
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
        testResults('db', false, 'No current user found in localStorage', {
          localStorage: !!localStorage,
          currentUser: null
        });
        return;
      }

      const user = JSON.parse(currentUser);
      console.log('🔍 Current user:', user);

      const { data: subscriptions, error, count } = await supabase
        .from('push_subscriptions')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id);

      if (error) {
        testResults('db', false, `Database query error: ${error.message}`, { 
          error: error.code,
          details: error.details,
          hint: error.hint
        });
        return;
      }

      const dbData = {
        userIdQueried: user.id,
        totalCount: count,
        subscriptionsFound: subscriptions?.length || 0,
        subscriptions: subscriptions?.map(sub => ({
          id: sub.id,
          endpoint: sub.endpoint.substring(0, 50) + '...',
          created: sub.created_at,
          updated: sub.updated_at
        }))
      };

      testResults('db', subscriptions && subscriptions.length > 0, 
        `Found ${subscriptions?.length || 0} subscriptions in database`, dbData);
    } catch (error) {
      console.error('❌ Database test failed:', error);
      testResults('db', false, `Database test error: ${error.message}`, { error: error.name });
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
      console.log('📱 Full endpoint for analysis:', endpoint);
      
      // Check if it's a FCM endpoint
      const isFCM = endpoint.includes('fcm.googleapis.com');
      if (!isFCM) {
        testResults('token', false, `Not a FCM endpoint. Provider: ${endpoint.split('/')[2] || 'Unknown'}`, {
          fullEndpoint: endpoint,
          detectedProvider: endpoint.split('/')[2] || 'Unknown',
          isFCM: false
        });
        return;
      }

      // Extract token from FCM endpoint
      const urlParts = endpoint.split('/');
      const fcmToken = urlParts[urlParts.length - 1];
      
      const tokenData = {
        fullEndpoint: endpoint,
        urlParts: urlParts.length,
        extractedToken: fcmToken ? fcmToken.substring(0, 30) + '...' : 'No token found',
        fullTokenLength: fcmToken?.length || 0,
        isValidFormat: fcmToken && fcmToken.length > 100,
        tokenStartsWith: fcmToken ? fcmToken.substring(0, 10) : null
      };

      const isValid = fcmToken && fcmToken.length > 100;
      testResults('token', isValid, 
        isValid ? 'FCM token extracted successfully' : 'Failed to extract valid FCM token', 
        tokenData);
    } catch (error) {
      console.error('❌ Token extraction test failed:', error);
      testResults('token', false, `Token extraction error: ${error.message}`, { error: error.name });
    } finally {
      setIsLoading(null);
    }
  };

  // Test 5: Test Edge Function Connectivity
  const testEdgeFunction = async () => {
    setIsLoading('edge');
    console.log('🧪 Testing Edge Function Connectivity...');
    
    try {
      const currentUser = localStorage.getItem('currentUser');
      if (!currentUser) {
        testResults('edge', false, 'No current user for edge function test');
        return;
      }

      const user = JSON.parse(currentUser);
      console.log('📤 Calling edge function with test payload for user:', user.id);

      const testPayload = {
        userIds: [user.id],
        title: '🧪 Edge Function Test',
        body: 'Testing edge function connectivity and authentication',
        data: { 
          test: true, 
          timestamp: Date.now(),
          source: 'fcm-debugger'
        }
      };

      console.log('📤 Test payload:', testPayload);

      const startTime = Date.now();
      const { data, error } = await supabase.functions.invoke('send-push-notification', {
        body: testPayload
      });
      const duration = Date.now() - startTime;

      console.log('📤 Edge function response:', { data, error, duration });

      if (error) {
        testResults('edge', false, `Edge function error: ${error.message}`, { 
          error: error.name,
          context: error.context,
          duration,
          payload: testPayload
        });
        return;
      }

      testResults('edge', true, 'Edge function responded successfully', {
        duration,
        response: data,
        payload: testPayload
      });
    } catch (error) {
      console.error('❌ Edge function test failed:', error);
      testResults('edge', false, `Edge function test error: ${error.message}`, { error: error.name });
    } finally {
      setIsLoading(null);
    }
  };

  // Test 6: Test Firebase Service Account Authentication
  const testFirebaseAuth = async () => {
    setIsLoading('firebase');
    console.log('🧪 Testing Firebase Authentication...');
    
    try {
      // Call edge function to test just the authentication part
      const testPayload = {
        userIds: ['test-user-for-auth-only'],
        title: '🔐 Firebase Auth Test',
        body: 'Testing Firebase service account authentication',
        data: { authTest: true, timestamp: Date.now() }
      };

      console.log('📤 Firebase auth test payload:', testPayload);

      const startTime = Date.now();
      const { data, error } = await supabase.functions.invoke('send-push-notification', {
        body: testPayload
      });
      const duration = Date.now() - startTime;

      console.log('📤 Firebase auth test response:', { data, error, duration });

      if (error) {
        let failureReason = 'Unknown authentication error';
        
        if (error.message.includes('invalid_grant')) {
          failureReason = 'Firebase Service Account JWT signature is invalid';
        } else if (error.message.includes('401')) {
          failureReason = 'Firebase authentication failed - unauthorized';
        } else if (error.message.includes('403')) {
          failureReason = 'Firebase authentication failed - forbidden';
        }
        
        testResults('firebase', false, failureReason, {
          error: error.name,
          message: error.message,
          context: error.context,
          duration,
          payload: testPayload
        });
        return;
      }

      testResults('firebase', true, 'Firebase authentication successful', {
        duration,
        response: data,
        authMethod: 'service-account',
        payload: testPayload
      });
    } catch (error) {
      console.error('❌ Firebase auth test failed:', error);
      testResults('firebase', false, `Firebase auth test error: ${error.message}`, { error: error.name });
    } finally {
      setIsLoading(null);
    }
  };

  // Run all tests
  const runAllTests = async () => {
    setResults({});
    console.log('🧪 === STARTING COMPREHENSIVE FCM SYSTEM TEST ===');
    
    await gatherSystemInfo();
    await testServiceWorker();
    await testPushSubscription();
    await testDatabaseSubscription();
    await testFCMTokenExtraction();
    await testEdgeFunction();
    await testFirebaseAuth();
    
    console.log('🧪 === ALL TESTS COMPLETED ===');
    toast({
      title: "🧪 All Tests Completed",
      description: "Check the results below to identify issues. See console for detailed logs.",
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
      key: 'sw', 
      label: 'Service Worker Registration', 
      icon: <Wifi className="h-4 w-4" />,
      description: 'Checks if service worker is properly registered and active'
    },
    { 
      key: 'push', 
      label: 'Browser Push Subscription', 
      icon: <Bell className="h-4 w-4" />,
      description: 'Verifies if browser has a valid push subscription'
    },
    { 
      key: 'db', 
      label: 'Database Subscription Storage', 
      icon: <Database className="h-4 w-4" />,
      description: 'Checks if subscriptions are properly stored in Supabase'
    },
    { 
      key: 'token', 
      label: 'FCM Token Extraction', 
      icon: <Key className="h-4 w-4" />,
      description: 'Validates FCM token format and extraction'
    },
    { 
      key: 'edge', 
      label: 'Edge Function Connectivity', 
      icon: <Cloud className="h-4 w-4" />,
      description: 'Tests communication with Supabase edge function'
    },
    { 
      key: 'firebase', 
      label: 'Firebase Authentication', 
      icon: <Key className="h-4 w-4" />,
      description: 'Verifies Firebase service account authentication'
    }
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="h-5 w-5" />
            Enhanced FCM System Debugger
          </CardTitle>
          <div className="text-sm text-muted-foreground">
            Comprehensive testing and debugging for Firebase Cloud Messaging system.
            Check browser console for detailed logs during testing.
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 mb-6">
            <Button onClick={runAllTests} className="mb-2" disabled={isLoading !== null}>
              {isLoading ? 'Testing...' : 'Run All Tests'}
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

          {/* System Information */}
          {Object.keys(systemInfo).length > 0 && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
                <Info className="h-4 w-4" />
                System Information
              </h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>Notification Permission: <span className="font-mono">{systemInfo.notificationPermission}</span></div>
                <div>Online Status: <span className="font-mono">{systemInfo.onLine ? 'Online' : 'Offline'}</span></div>
                <div>Service Worker Support: <span className="font-mono">{systemInfo.serviceWorkerSupported ? 'Yes' : 'No'}</span></div>
                <div>Push Manager Support: <span className="font-mono">{systemInfo.pushManagerSupported ? 'Yes' : 'No'}</span></div>
              </div>
            </div>
          )}

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

          <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
            <h3 className="font-medium text-yellow-900 mb-2">Debugging Tips</h3>
            <ul className="text-sm text-yellow-800 space-y-1">
              <li>• Open browser console (F12) for detailed logs during testing</li>
              <li>• Check if notification permissions are granted in browser settings</li>
              <li>• Verify that service worker is registered at /sw.js</li>
              <li>• Database count mismatch: Check if multiple devices are registered per user</li>
              <li>• Edge function 500 errors: Check Supabase edge function logs</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
