
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { pushNotificationService } from '@/services/pushNotificationService';

interface TestResult {
  name: string;
  status: 'idle' | 'running' | 'pass' | 'fail';
  message: string;
  details?: any;
  timestamp?: string;
}

export const FirebaseConnectionTest = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<TestResult[]>([
    { name: 'Service Worker Registration', status: 'idle', message: 'Checks if service worker is properly registered and active' },
    { name: 'Browser Push Subscription', status: 'idle', message: 'Verifies if browser has a valid push subscription' },
    { name: 'Database Subscription Storage', status: 'idle', message: 'Checks if subscriptions are properly stored in Supabase' },
    { name: 'FCM Token Extraction', status: 'idle', message: 'Validates FCM token format and extraction' },
    { name: 'Edge Function Connectivity', status: 'idle', message: 'Tests communication with Supabase edge function' },
    { name: 'Firebase Authentication', status: 'idle', message: 'Verifies Firebase service account authentication' },
  ]);

  const updateResult = (index: number, updates: Partial<TestResult>) => {
    setResults(prev => prev.map((result, i) => 
      i === index ? { ...result, ...updates, timestamp: new Date().toLocaleTimeString() } : result
    ));
  };

  const getSystemInfo = () => {
    console.log('🔍 Gathering system information...');
    const info = {
      browser: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine,
      serviceWorkerSupport: 'serviceWorker' in navigator,
      pushManagerSupport: 'PushManager' in window,
      notificationSupport: 'Notification' in window,
      notificationPermission: Notification.permission,
    };
    console.log('🔍 System info gathered:', info);
    return info;
  };

  const runAllTests = async () => {
    setIsRunning(true);
    console.log('🧪 === STARTING COMPREHENSIVE FCM SYSTEM TEST ===');
    
    const systemInfo = getSystemInfo();

    // Test 1: Service Worker Registration
    updateResult(0, { status: 'running', message: 'Testing service worker registration...' });
    console.log('🧪 Testing Service Worker Registration...');
    
    try {
      if (!('serviceWorker' in navigator)) {
        updateResult(0, { 
          status: 'fail', 
          message: 'Service Worker not supported in this browser',
          details: { supported: false }
        });
      } else {
        const registrations = await navigator.serviceWorker.getRegistrations();
        console.log('🔍 All SW registrations:', registrations);
        
        const registration = await navigator.serviceWorker.ready;
        if (registration && registration.active) {
          updateResult(0, { 
            status: 'pass', 
            message: 'Service Worker is active and registered',
            details: { 
              scope: registration.scope,
              state: registration.active.state,
              registrationsCount: registrations.length
            }
          });
        } else {
          updateResult(0, { 
            status: 'fail', 
            message: 'Service Worker is not active',
            details: { registration }
          });
        }
      }
    } catch (error) {
      updateResult(0, { 
        status: 'fail', 
        message: `Service Worker error: ${error.message}`,
        details: { error }
      });
    }

    // Test 2: Browser Push Subscription
    updateResult(1, { status: 'running', message: 'Testing browser push subscription...' });
    console.log('🧪 Testing Push Subscription...');
    
    try {
      if (!('PushManager' in window)) {
        updateResult(1, { 
          status: 'fail', 
          message: 'Push Manager not supported',
          details: { supported: false }
        });
      } else {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        
        if (subscription) {
          updateResult(1, { 
            status: 'pass', 
            message: 'Push subscription exists in browser',
            details: { 
              endpoint: subscription.endpoint.substring(0, 50) + '...',
              hasP256dh: !!subscription.getKey('p256dh'),
              hasAuth: !!subscription.getKey('auth')
            }
          });
        } else {
          updateResult(1, { 
            status: 'fail', 
            message: 'No push subscription found in browser',
            details: { subscription: null }
          });
        }
      }
    } catch (error) {
      updateResult(1, { 
        status: 'fail', 
        message: `Push subscription error: ${error.message}`,
        details: { error }
      });
    }

    // Test 3: Database Subscription Storage
    updateResult(2, { status: 'running', message: 'Testing database subscription storage...' });
    console.log('🧪 Testing Database Subscription...');
    
    try {
      const currentUser = localStorage.getItem('currentUser');
      if (!currentUser) {
        updateResult(2, { 
          status: 'fail', 
          message: 'No current user found',
          details: { currentUser: null }
        });
      } else {
        const user = JSON.parse(currentUser);
        console.log('🔍 Current user:', user);
        
        const { data: subscriptions, error, count } = await supabase
          .from('push_subscriptions')
          .select('*', { count: 'exact' })
          .eq('user_id', user.id);

        if (error) {
          updateResult(2, { 
            status: 'fail', 
            message: `Database error: ${error.message}`,
            details: { error }
          });
        } else {
          const subscriptionCount = subscriptions?.length || 0;
          if (subscriptionCount > 0) {
            updateResult(2, { 
              status: 'pass', 
              message: `Found ${subscriptionCount} subscription(s) in database`,
              details: { 
                userIdQueried: user.id,
                totalCount: count,
                subscriptionsFound: subscriptionCount,
                subscriptions: subscriptions?.map(sub => ({
                  id: sub.id,
                  endpoint: sub.endpoint.substring(0, 50) + '...',
                  created_at: sub.created_at
                }))
              }
            });
          } else {
            updateResult(2, { 
              status: 'fail', 
              message: 'Found 0 subscriptions in database',
              details: { 
                userIdQueried: user.id,
                totalCount: count,
                subscriptionsFound: 0,
                subscriptions: []
              }
            });
          }
        }
      }
    } catch (error) {
      updateResult(2, { 
        status: 'fail', 
        message: `Database test error: ${error.message}`,
        details: { error }
      });
    }

    // Test 4: FCM Token Extraction
    updateResult(3, { status: 'running', message: 'Testing FCM token extraction...' });
    console.log('🧪 Testing FCM Token Extraction...');
    
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        const endpoint = subscription.endpoint;
        console.log('📱 Full endpoint for analysis:', endpoint);
        
        if (endpoint.includes('fcm.googleapis.com')) {
          const urlParts = endpoint.split('/');
          const token = urlParts[urlParts.length - 1];
          
          if (token && token.length > 10) {
            updateResult(3, { 
              status: 'pass', 
              message: 'FCM token extracted successfully',
              details: { 
                endpoint: endpoint.substring(0, 50) + '...',
                tokenLength: token.length,
                tokenPreview: token.substring(0, 20) + '...',
                isFCMEndpoint: true
              }
            });
          } else {
            updateResult(3, { 
              status: 'fail', 
              message: 'Invalid FCM token format',
              details: { token, endpoint }
            });
          }
        } else {
          updateResult(3, { 
            status: 'fail', 
            message: 'Not a Firebase endpoint',
            details: { endpoint }
          });
        }
      } else {
        updateResult(3, { 
          status: 'fail', 
          message: 'No subscription to extract token from',
          details: { subscription: null }
        });
      }
    } catch (error) {
      updateResult(3, { 
        status: 'fail', 
        message: `Token extraction error: ${error.message}`,
        details: { error }
      });
    }

    // Test 5: Edge Function Connectivity
    updateResult(4, { status: 'running', message: 'Testing edge function connectivity...' });
    console.log('🧪 Testing Edge Function Connectivity...');
    
    try {
      const currentUser = localStorage.getItem('currentUser');
      if (!currentUser) {
        updateResult(4, { 
          status: 'fail', 
          message: 'No current user for edge function test',
          details: { currentUser: null }
        });
      } else {
        const user = JSON.parse(currentUser);
        
        console.log('📤 Calling edge function with test payload for user:', user.id);
        const testPayload = {
          userIds: [user.id],
          title: '🧪 Edge Function Test',
          body: 'Testing edge function connectivity and authentication',
          data: { test: true, timestamp: Date.now(), source: 'fcm-debugger' }
        };
        console.log('📤 Test payload:', testPayload);
        
        const startTime = Date.now();
        const { data, error } = await supabase.functions.invoke('send-push-notification', {
          body: testPayload
        });
        const duration = Date.now() - startTime;
        
        console.log('📤 Edge function response:', { data, error, duration });
        
        if (error) {
          updateResult(4, { 
            status: 'fail', 
            message: `Edge function error: ${error.message}`,
            details: { error, duration }
          });
        } else {
          updateResult(4, { 
            status: 'pass', 
            message: 'Edge function responded successfully',
            details: { 
              responseData: data,
              duration: `${duration}ms`,
              testPayload
            }
          });
        }
      }
    } catch (error) {
      updateResult(4, { 
        status: 'fail', 
        message: `Edge function test error: ${error.message}`,
        details: { error }
      });
    }

    // Test 6: Firebase Authentication
    updateResult(5, { status: 'running', message: 'Testing Firebase authentication...' });
    console.log('🧪 Testing Firebase Authentication...');
    
    try {
      console.log('📤 Firebase auth test payload:');
      const authTestPayload = {
        userIds: ['test-user-for-auth-only'],
        title: '🔐 Firebase Auth Test',
        body: 'Testing Firebase service account authentication',
        data: { authTest: true, timestamp: Date.now() }
      };
      console.log('📤 Firebase auth test payload:', authTestPayload);
      
      const startTime = Date.now();
      const { data, error } = await supabase.functions.invoke('send-push-notification', {
        body: authTestPayload
      });
      const duration = Date.now() - startTime;
      
      console.log('📤 Firebase auth test response:', { data, error, duration });
      
      if (error) {
        updateResult(5, { 
          status: 'fail', 
          message: `Firebase auth error: ${error.message}`,
          details: { error, duration }
        });
      } else {
        updateResult(5, { 
          status: 'pass', 
          message: 'Firebase authentication successful',
          details: { 
            responseData: data,
            duration: `${duration}ms`,
            authTestPayload
          }
        });
      }
    } catch (error) {
      updateResult(5, { 
        status: 'fail', 
        message: `Firebase auth test error: ${error.message}`,
        details: { error }
      });
    }

    console.log('🧪 === ALL TESTS COMPLETED ===');
    setIsRunning(false);
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'pass':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'fail':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'running':
        return <Clock className="h-5 w-5 text-blue-500 animate-spin" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-400" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Firebase Connection Test Suite</h2>
          <p className="text-muted-foreground">
            Comprehensive testing of FCM setup, database connectivity, and Firebase authentication
          </p>
        </div>
        <Button 
          onClick={runAllTests} 
          disabled={isRunning}
          className="flex items-center gap-2"
        >
          {isRunning ? (
            <>
              <Clock className="h-4 w-4 animate-spin" />
              Running Tests...
            </>
          ) : (
            'Run All Tests'
          )}
        </Button>
      </div>

      {/* System Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">System Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><strong>Notification Permission:</strong> {Notification.permission}</div>
            <div><strong>Online Status:</strong> {navigator.onLine ? 'Online' : 'Offline'}</div>
            <div><strong>Service Worker Support:</strong> {'serviceWorker' in navigator ? 'Yes' : 'No'}</div>
            <div><strong>Push Manager Support:</strong> {'PushManager' in window ? 'Yes' : 'No'}</div>
          </div>
        </CardContent>
      </Card>

      {/* Test Results */}
      <div className="space-y-4">
        {results.map((result, index) => (
          <Card key={index} className={`border-l-4 ${
            result.status === 'pass' ? 'border-l-green-500' : 
            result.status === 'fail' ? 'border-l-red-500' : 
            result.status === 'running' ? 'border-l-blue-500' : 'border-l-gray-300'
          }`}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  {getStatusIcon(result.status)}
                  {result.name}
                </CardTitle>
                <span className="text-sm text-muted-foreground">
                  {result.status === 'pass' ? 'Pass' : 
                   result.status === 'fail' ? 'Fail' : 
                   result.status === 'running' ? 'Running' : 'Pending'}
                </span>
              </div>
              <CardDescription>
                {result.message}
              </CardDescription>
            </CardHeader>
            {result.details && (
              <CardContent className="pt-0">
                <details className="text-sm">
                  <summary className="cursor-pointer text-blue-600 hover:text-blue-800">
                    View Technical Details
                  </summary>
                  <pre className="mt-2 p-3 bg-gray-100 rounded overflow-auto text-xs">
                    {JSON.stringify(result.details, null, 2)}
                  </pre>
                </details>
                {result.timestamp && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Tested at {result.timestamp}
                  </p>
                )}
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
};
