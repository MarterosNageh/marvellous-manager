
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PushSubscription {
  endpoint: string;
  p256dh_key: string;
  auth_key: string;
  user_id: string;
}

// Firebase Admin SDK Service Account
const SERVICE_ACCOUNT = {
  "type": "service_account",
  "project_id": "marvellous-manager",
  "private_key_id": "f895afdec090175a1c2b87757c4debb2b5b6af5c",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQDyNlNcJmnCvnXn\n4sDGYmBf4XKq27MNwZZ2O2YxXtqMt7z5OlvJKGlhXcEcz2pO90b4d/XN8sYdLRYD\nRHBmc0k5nmwCM2o+6xtv+3IyQVq3P9B51d69nDnTT4idwKkuNn+/h7GhUs1gvFrS\ncoEyQVdPdQIOM2tI4HWNXGwtqF6CK6OsXv/2UHUCnmAo5hLhWZPwfpo7RVCggAdo\nQnSFfTUc16Xa/LCta7WqrihRHXkOEx7NMJvVl6cnWj6+krxDvQbcwR/fVThbpOnC\n6kQeEX/Dz8RVV71yEWcVgM3uR1DxvTraoHRIVMCnfy4F2HgeICDpTBd0H51ijN5e\n01gPmQFhAgMBAAECggEAJsAkRAjtQLfh+zBe8R5KFuzlwIoXsmq3XMESD3ICeyLm\nO+VnS96IRYiPXcGdW3baRuRCUim2InLVI76uUOW+4FYFJ7D8HYbVw+uxkHK+RbUS\n8HsUALfe1HzT+ZEaQAd+FrFp7Mpni0N3MFYbb2PeyRqKMqVtU6J9jBkuQXu/awmq\nnqsZYvjyjgv8ikV1QJmJXugtLndOVMk7/tWnIsmy+kmaG/d+YYW+Jx8D/CFXneqs\nMLy2LfnTzETFvT3MAECvw51/23cBWwQ9CWG1yfv6ClP6DqI0wcQ9apYPWb/e4LtW\nf0Z06LHrOmFbCaqlWPXFn+7wm4DVF0JAD3lkrGvj8QKBgQD7K86+QhCGH9gs9bPQ\nkEPnSlurCmCX103vIFdeiiaUV7A6bdRgipINkIXbProg+LGhfnqYYRPcI9DUMqjj\njnr2drAQfk5taEr9LqGHa/yuXJAQyu+gd979FfT2xej815Jx9KL5nIILY2Jrm9be\nlfgRNr1t3OGJjiGPIuu5i6xcFQKBgQD23mzBM6r1k28YKlVbMe9qX6J0wRsZz+uv\nVwpQfutZvqttJWJ2irZPed0GQym0WDlrpRJ6cOzu4No1PxaSBeMDR6/ZXz9eX3M3\nt014N3iB2V42MwQYrknGidmt/0uvFdcbKi9IcbF0oUsXKTCf0Pxqe5VdFc2tR/JS\nPm7UmdYHHQKBgFKcFvSGoA6tHJm0+j5HpL3GvB2mXRyzyMM0fOfwQj4aFTEyfF6A\nVQc3GH+Cww8jHLFD+yhxDWojMYUJYHjvnMvBP6k9Eah0W+2nz6LNxp7GfO+4/1Vk\n96d/+EDN2RKICHeIga3dZvw95NoFuIcfBicLPQSMWHW4lJsSXjt5j+f9AoGABzaq\noN6coT5koaUjB14nK8mNmrHF0/RCY8Y8U+vRfrbWlYLhJKua9imObs9pmY52ZxHU\nv2UrVzOUzLeCNlQbtQ3UMprY5C4P1NHzXo7oY4rxeM320a3OFBIVHUN3d69AsNeD\nuC8yS0EnS471j8XwikAANk8bynNuvj56yJWSLnUCgYB7iulqG8u7nKkYscgtqDW5\n5Ny6rjLqkdnSA3Vf0SmQqfGsguCcHAQcgA0YMxWROBfRATtvRqv60zU+UPlhAei9\nfcYHbBBKEwm/f++VopZ8+Xre18E0eRPryLfcDvxdWZCLvT0WmhVON27Hot58ywTE\npoR4ItAmeJ2XQa3wOLBk8A==\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-fbsvc@marvellous-manager.iam.gserviceaccount.com",
  "client_id": "111912629734263281888",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40marvellous-manager.iam.gserviceaccount.com",
  "universe_domain": "googleapis.com"
};

// Firebase configuration for FCM
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyBIw7y43dseUoKSeRjxZ3FC0JwqQvDkPdc",
  authDomain: "marvellous-manager.firebaseapp.com",
  projectId: "marvellous-manager",
  storageBucket: "marvellous-manager.firebasestorage.app",
  messagingSenderId: "368753443778",
  appId: "1:368753443778:web:2f5c47c984bee1f3184c5b",
  measurementId: "G-YBBC3CXLEF"
}

// Helper function to convert base64 to base64url
function base64ToBase64url(base64: string): string {
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

// Helper function to encode JWT payload
function encodeJWT(header: any, payload: any, privateKey: string): Promise<string> {
  const headerB64 = base64ToBase64url(btoa(JSON.stringify(header)));
  const payloadB64 = base64ToBase64url(btoa(JSON.stringify(payload)));
  const data = `${headerB64}.${payloadB64}`;
  
  // Convert private key to proper format for crypto.subtle
  const pemHeader = "-----BEGIN PRIVATE KEY-----";
  const pemFooter = "-----END PRIVATE KEY-----";
  const pemContents = privateKey.replace(pemHeader, "").replace(pemFooter, "").replace(/\s/g, "");
  
  // Decode base64 to binary
  const binaryDer = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0));
  
  return crypto.subtle.importKey(
    "pkcs8",
    binaryDer,
    {
      name: "RSASSA-PKCS1-v1_5",
      hash: "SHA-256",
    },
    false,
    ["sign"]
  ).then(key => {
    return crypto.subtle.sign(
      "RSASSA-PKCS1-v1_5",
      key,
      new TextEncoder().encode(data)
    );
  }).then(signature => {
    const signatureB64 = base64ToBase64url(btoa(String.fromCharCode(...new Uint8Array(signature))));
    return `${data}.${signatureB64}`;
  });
}

// Get OAuth 2.0 access token using service account
async function getAccessToken(): Promise<string> {
  console.log('🔐 Getting Firebase Admin SDK access token...');
  
  try {
    const now = Math.floor(Date.now() / 1000);
    const payload = {
      iss: SERVICE_ACCOUNT.client_email,
      scope: 'https://www.googleapis.com/auth/firebase.messaging',
      aud: 'https://oauth2.googleapis.com/token',
      exp: now + 3600,
      iat: now
    };

    const header = { alg: 'RS256', typ: 'JWT' };
    
    // Create JWT using our custom function
    const jwt = await encodeJWT(header, payload, SERVICE_ACCOUNT.private_key);

    // Exchange JWT for access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: jwt
      })
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      throw new Error(`Token request failed: ${tokenResponse.status} - ${errorText}`);
    }

    const tokenData = await tokenResponse.json();
    console.log('✅ Firebase Admin SDK access token obtained');
    return tokenData.access_token;
  } catch (error) {
    console.error('❌ Failed to get access token:', error);
    throw error;
  }
}

async function sendFirebaseAdminFCM(subscription: PushSubscription, payload: any, accessToken: string) {
  console.log('📱 Sending Firebase Admin FCM notification to:', subscription.endpoint.substring(0, 50) + '...')
  
  try {
    // Extract FCM token from endpoint
    const fcmToken = subscription.endpoint.split('/').pop();
    console.log('🔑 FCM Token extracted:', fcmToken?.substring(0, 20) + '...')
    
    if (!fcmToken) {
      return { success: false, error: 'Invalid FCM endpoint - no token found' };
    }

    // Use Firebase Admin SDK HTTP v1 API
    const fcmUrl = `https://fcm.googleapis.com/v1/projects/${FIREBASE_CONFIG.projectId}/messages:send`;
    
    const message = {
      message: {
        token: fcmToken,
        notification: {
          title: payload.title,
          body: payload.body,
          image: payload.icon || '/favicon.ico'
        },
        data: {
          ...payload.data,
          click_action: payload.data?.url || '/task-manager'
        },
        webpush: {
          headers: {
            'Urgency': 'high'
          },
          notification: {
            title: payload.title,
            body: payload.body,
            icon: payload.icon || '/favicon.ico',
            badge: payload.badge || '/favicon.ico',
            requireInteraction: true,
            vibrate: [200, 100, 200],
            tag: payload.tag || 'firebase-admin-fcm'
          },
          fcm_options: {
            link: payload.data?.url || '/task-manager'
          }
        }
      }
    };

    console.log('📤 Sending Firebase Admin FCM message:', JSON.stringify(message, null, 2));

    const response = await fetch(fcmUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message)
    });
    
    console.log('📤 Firebase Admin FCM Response status:', response.status)
    
    if (!response.ok) {
      const responseText = await response.text()
      console.error('❌ Firebase Admin FCM Response body:', responseText)
      return { success: false, error: `Firebase Admin FCM HTTP ${response.status}: ${responseText}` }
    }
    
    const result = await response.json()
    console.log('✅ Firebase Admin FCM Response:', result)
    
    return { success: true, fcmResponse: result, method: 'firebase-admin-sdk' }
    
  } catch (error) {
    console.error('❌ Error sending Firebase Admin FCM notification:', error)
    return { success: false, error: error.message }
  }
}

serve(async (req) => {
  console.log('📱 === FIREBASE ADMIN SDK FCM PUSH NOTIFICATION FUNCTION ===')
  console.log('🔗 Request method:', req.method)
  console.log('🔥 Firebase Project:', FIREBASE_CONFIG.projectId)
  console.log('🔐 Using Firebase Admin SDK with service account')
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const requestBody = await req.text()
    console.log('📨 Raw request body:', requestBody)
    
    const { userIds, title, body, data } = JSON.parse(requestBody)
    console.log('📱 === FIREBASE ADMIN FCM NOTIFICATION REQUEST ===')
    console.log('👥 Target users:', userIds)
    console.log('📢 Title:', title)
    console.log('💬 Body:', body)
    console.log('📦 Data:', data)

    // Get Firebase Admin SDK access token
    console.log('🔐 Getting Firebase Admin SDK access token...');
    const accessToken = await getAccessToken();

    // Get push subscriptions for the specified users
    console.log('🔍 Querying push_subscriptions for Firebase Admin FCM delivery...')
    const { data: subscriptions, error } = await supabase
      .from('push_subscriptions')
      .select('*')
      .in('user_id', userIds);

    if (error) {
      console.error('❌ Error fetching subscriptions:', error)
      throw error
    }

    console.log('📱 Firebase Admin FCM subscriptions found:', subscriptions?.length || 0)
    
    if (subscriptions && subscriptions.length > 0) {
      console.log('📱 Device breakdown:')
      const devicesByUser = subscriptions.reduce((acc, sub) => {
        acc[sub.user_id] = (acc[sub.user_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      Object.entries(devicesByUser).forEach(([userId, count]) => {
        console.log(`  👤 User ${userId}: ${count} device(s)`)
      });
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log('⚠️ No Firebase Admin FCM subscriptions found for users:', userIds)
      
      // Check total subscriptions in database
      const { data: allSubs, error: allSubsError } = await supabase
        .from('push_subscriptions')
        .select('user_id, endpoint')
        .limit(10);
        
      if (allSubsError) {
        console.error('❌ Error checking all subscriptions:', allSubsError)
      } else {
        console.log('📊 Total subscriptions in database:', allSubs?.length || 0)
        if (allSubs && allSubs.length > 0) {
          console.log('📋 Available subscriptions:')
          allSubs.forEach((sub, index) => {
            console.log(`  ${index + 1}. User: ${sub.user_id}, Endpoint: ${sub.endpoint.substring(0, 50)}...`)
          })
        }
      }
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No Firebase Admin FCM subscriptions found',
          sentCount: 0,
          targetUsers: userIds.length,
          totalSubscriptionsInDB: allSubs?.length || 0,
          method: 'firebase-admin-sdk'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Send Firebase Admin FCM notifications
    console.log('📤 Sending Firebase Admin FCM notifications to', subscriptions.length, 'device(s)...')
    const pushPromises = subscriptions.map(async (subscription: PushSubscription, index: number) => {
      console.log(`📤 [${index + 1}/${subscriptions.length}] Sending Firebase Admin FCM to user ${subscription.user_id}`)
      
      const result = await sendFirebaseAdminFCM(subscription, {
        title,
        body,
        data: data || {},
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: data?.tag || 'firebase-admin-fcm'
      }, accessToken)

      console.log(`📤 [${index + 1}/${subscriptions.length}] Result:`, result.success ? '✅ Success' : `❌ Failed: ${result.error}`)
      if (result.method) {
        console.log(`📤 [${index + 1}/${subscriptions.length}] Method:`, result.method)
      }

      return {
        userId: subscription.user_id,
        endpoint: subscription.endpoint.substring(0, 50) + '...',
        ...result
      }
    })

    const results = await Promise.all(pushPromises)
    const successCount = results.filter(r => r.success).length
    
    console.log('📱 === FIREBASE ADMIN FCM NOTIFICATION RESULTS ===')
    console.log(`✅ Successful deliveries: ${successCount}/${results.length}`)
    console.log(`❌ Failed deliveries: ${results.length - successCount}/${results.length}`)
    console.log('📊 Detailed results:', results)

    // Enhanced response with Firebase Admin FCM delivery insights
    const response = {
      success: true, 
      results,
      sentCount: successCount,
      totalSubscriptions: results.length,
      targetUsers: userIds.length,
      message: `Firebase Admin FCM notifications processed for ${successCount}/${results.length} devices`,
      deliveryInsights: {
        totalDevicesTargeted: results.length,
        successfulDeliveries: successCount,
        failedDeliveries: results.length - successCount,
        method: 'firebase-admin-sdk',
        authMethod: 'service-account-oauth2',
        firebaseProject: FIREBASE_CONFIG.projectId,
        recommendation: successCount === results.length ? 'All notifications delivered successfully!' : 'Some notifications failed - check device tokens'
      }
    };

    console.log('📱 === FIREBASE ADMIN FCM DELIVERY COMPLETE ===')
    console.log('🔐 Authentication method: Firebase Admin SDK with Service Account')
    console.log('✅ Cross-device capability: Active')

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ Error in Firebase Admin FCM notification function:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false,
        details: 'Firebase Admin FCM notification system encountered an error. Check function logs for details.',
        method: 'firebase-admin-sdk'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
