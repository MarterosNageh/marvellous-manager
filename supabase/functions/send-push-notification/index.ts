
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

// Enhanced JWT creation with proper error handling
async function createJWT(payload: any): Promise<string> {
  console.log('🔧 Creating JWT for Firebase authentication...');
  
  try {
    // JWT header
    const header = {
      alg: 'RS256',
      typ: 'JWT',
      kid: SERVICE_ACCOUNT.private_key_id
    };

    // Base64url encode header and payload  
    const encodedHeader = btoa(JSON.stringify(header))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
      
    const encodedPayload = btoa(JSON.stringify(payload))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');

    const signingInput = `${encodedHeader}.${encodedPayload}`;
    console.log('🔧 Signing input created, length:', signingInput.length);

    // Extract and properly format private key
    const privateKeyPem = SERVICE_ACCOUNT.private_key;
    const privateKeyDer = privateKeyPem
      .replace(/-----BEGIN PRIVATE KEY-----/g, '')
      .replace(/-----END PRIVATE KEY-----/g, '')
      .replace(/\r?\n/g, '');

    // Convert to ArrayBuffer
    const privateKeyBytes = Uint8Array.from(atob(privateKeyDer), c => c.charCodeAt(0));
    console.log('🔧 Private key bytes length:', privateKeyBytes.length);

    // Import the private key for signing
    const cryptoKey = await crypto.subtle.importKey(
      'pkcs8',
      privateKeyBytes.buffer,
      {
        name: 'RSASSA-PKCS1-v1_5',
        hash: 'SHA-256',
      },
      false,
      ['sign']
    );

    console.log('✅ Private key imported successfully for signing');

    // Sign the JWT
    const signature = await crypto.subtle.sign(
      'RSASSA-PKCS1-v1_5',
      cryptoKey,
      new TextEncoder().encode(signingInput)
    );

    // Convert signature to base64url
    const signatureBytes = new Uint8Array(signature);
    const signatureB64 = btoa(String.fromCharCode(...signatureBytes))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');

    const jwt = `${signingInput}.${signatureB64}`;
    console.log('✅ JWT created successfully, total length:', jwt.length);
    
    return jwt;
  } catch (error) {
    console.error('❌ JWT creation failed with error:', error);
    console.error('❌ Error name:', error.name);
    console.error('❌ Error message:', error.message);
    throw new Error(`JWT creation failed: ${error.message}`);
  }
}

// Enhanced access token retrieval with better error handling
async function getAccessToken(): Promise<string> {
  console.log('🔐 Getting Firebase Admin SDK access token...');
  
  try {
    const now = Math.floor(Date.now() / 1000);
    const expiry = now + 3600; // 1 hour from now
    
    const payload = {
      iss: SERVICE_ACCOUNT.client_email,
      scope: 'https://www.googleapis.com/auth/firebase.messaging',
      aud: 'https://oauth2.googleapis.com/token',
      exp: expiry,
      iat: now
    };

    console.log('🔧 JWT payload prepared:', {
      iss: payload.iss,
      scope: payload.scope,
      aud: payload.aud,
      exp: payload.exp,
      iat: payload.iat
    });

    const jwt = await createJWT(payload);

    // Exchange JWT for access token
    console.log('🔄 Exchanging JWT for access token...');
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: jwt
      })
    });

    console.log('📡 Token response status:', tokenResponse.status);
    console.log('📡 Token response headers:', Object.fromEntries(tokenResponse.headers.entries()));
    
    const responseText = await tokenResponse.text();
    console.log('📡 Token response body:', responseText);

    if (!tokenResponse.ok) {
      console.error('❌ Token request failed:', responseText);
      throw new Error(`Token request failed: ${tokenResponse.status} - ${responseText}`);
    }

    const tokenData = JSON.parse(responseText);
    console.log('✅ Firebase Admin SDK access token obtained');
    console.log('✅ Token type:', tokenData.token_type);
    console.log('✅ Token expires in:', tokenData.expires_in, 'seconds');
    
    return tokenData.access_token;
  } catch (error) {
    console.error('❌ Failed to get access token:', error);
    console.error('❌ Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    throw error;
  }
}

// Enhanced FCM sending with better error handling
async function sendFirebaseAdminFCM(subscription: PushSubscription, payload: any, accessToken: string) {
  console.log('📱 Sending Firebase Admin FCM notification to:', subscription.endpoint.substring(0, 50) + '...');
  
  try {
    // Extract FCM token from endpoint
    const fcmToken = subscription.endpoint.split('/').pop();
    console.log('🔑 FCM Token extracted:', fcmToken?.substring(0, 20) + '...');
    
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
    
    console.log('📤 Firebase Admin FCM Response status:', response.status);
    console.log('📤 Firebase Admin FCM Response headers:', Object.fromEntries(response.headers.entries()));
    
    const responseText = await response.text();
    console.log('📤 Firebase Admin FCM Response body:', responseText);
    
    if (!response.ok) {
      console.error('❌ Firebase Admin FCM failed:', responseText);
      return { success: false, error: `Firebase Admin FCM HTTP ${response.status}: ${responseText}` };
    }
    
    const result = JSON.parse(responseText);
    console.log('✅ Firebase Admin FCM Response parsed:', result);
    
    return { success: true, fcmResponse: result, method: 'firebase-admin-sdk' };
    
  } catch (error) {
    console.error('❌ Error sending Firebase Admin FCM notification:', error);
    return { success: false, error: error.message };
  }
}

serve(async (req) => {
  console.log('📱 === FIREBASE ADMIN SDK FCM PUSH NOTIFICATION FUNCTION START ===');
  console.log('🔗 Request method:', req.method);
  console.log('🔗 Request URL:', req.url);
  console.log('🔗 Request headers:', Object.fromEntries(req.headers.entries()));
  console.log('🔥 Firebase Project:', FIREBASE_CONFIG.projectId);
  console.log('🔐 Using Firebase Admin SDK with service account');
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('✅ Handling CORS preflight request');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Enhanced environment validation
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    console.log('🔍 Environment validation:');
    console.log('  - SUPABASE_URL:', supabaseUrl ? `Present (${supabaseUrl.substring(0, 30)}...)` : 'Missing');
    console.log('  - SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? `Present (${supabaseServiceKey.substring(0, 20)}...)` : 'Missing');
    console.log('  - Deno.env.toObject() keys:', Object.keys(Deno.env.toObject()));
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ Missing required environment variables');
      return new Response(
        JSON.stringify({ 
          error: 'Missing required environment variables',
          success: false,
          details: 'SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not configured',
          available_env: Object.keys(Deno.env.toObject())
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Initialize Supabase client with enhanced configuration
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      },
      global: {
        headers: {
          'User-Agent': 'edge-function-push-notification/1.0'
        }
      }
    });

    console.log('✅ Supabase client initialized successfully');

    // Enhanced request body parsing
    let requestBody: string;
    let parsedBody: any;
    
    try {
      requestBody = await req.text();
      console.log('📨 Raw request body:', requestBody);
      console.log('📨 Request body length:', requestBody.length);
      
      if (!requestBody.trim()) {
        throw new Error('Request body is empty');
      }
      
      parsedBody = JSON.parse(requestBody);
      console.log('📨 Parsed request body:', parsedBody);
    } catch (parseError) {
      console.error('❌ Failed to parse request body:', parseError);
      return new Response(
        JSON.stringify({ 
          error: 'Invalid request body',
          success: false,
          details: parseError.message,
          receivedBody: requestBody || 'undefined'
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    
    const { userIds, title, body, data } = parsedBody;
    console.log('📱 === FIREBASE ADMIN FCM NOTIFICATION REQUEST ===');
    console.log('👥 Target users:', userIds);
    console.log('📢 Title:', title);
    console.log('💬 Body:', body);
    console.log('📦 Data:', data);

    // Validate required fields
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      console.error('❌ Invalid userIds provided');
      return new Response(
        JSON.stringify({ 
          error: 'Invalid userIds - must be a non-empty array',
          success: false,
          received: { userIds, type: typeof userIds }
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (!title || !body) {
      console.error('❌ Missing title or body');
      return new Response(
        JSON.stringify({ 
          error: 'Missing required fields: title and body',
          success: false,
          received: { title, body }
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Get Firebase Admin SDK access token with enhanced error handling
    let accessToken: string;
    try {
      console.log('🔐 Getting Firebase Admin SDK access token...');
      accessToken = await getAccessToken();
      console.log('✅ Access token obtained successfully');
    } catch (tokenError) {
      console.error('❌ Failed to get access token:', tokenError);
      return new Response(
        JSON.stringify({ 
          error: 'Firebase authentication failed',
          success: false,
          details: tokenError.message
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Enhanced database query with better error handling
    console.log('🔍 Querying push_subscriptions for users:', userIds);
    let subscriptions: any[] | null = null;
    let queryError: any = null;
    
    try {
      const query = supabase
        .from('push_subscriptions')
        .select('*')
        .in('user_id', userIds);
        
      console.log('🔍 Executing query...');
      const result = await query;
      subscriptions = result.data;
      queryError = result.error;
      
      console.log('🔍 Query result:', { 
        data: subscriptions?.length || 0, 
        error: queryError?.message || 'none' 
      });
      
    } catch (dbError) {
      console.error('❌ Database query failed:', dbError);
      queryError = dbError;
    }

    if (queryError) {
      console.error('❌ Error fetching subscriptions:', queryError);
      return new Response(
        JSON.stringify({ 
          error: `Database error: ${queryError.message}`,
          success: false,
          details: queryError,
          query: { userIds }
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('📱 Firebase Admin FCM subscriptions found:', subscriptions?.length || 0);
    
    // Enhanced subscription analysis
    if (subscriptions && subscriptions.length > 0) {
      console.log('📱 Detailed subscription analysis:');
      const devicesByUser = subscriptions.reduce((acc: Record<string, number>, sub) => {
        acc[sub.user_id] = (acc[sub.user_id] || 0) + 1;
        return acc;
      }, {});
      
      Object.entries(devicesByUser).forEach(([userId, count]) => {
        console.log(`  👤 User ${userId}: ${count} device(s)`);
      });
      
      subscriptions.forEach((sub, index) => {
        console.log(`  📱 Device ${index + 1}:`, {
          user_id: sub.user_id,
          endpoint: sub.endpoint.substring(0, 50) + '...',
          created_at: sub.created_at,
          id: sub.id
        });
      });
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log('⚠️ No Firebase Admin FCM subscriptions found for users:', userIds);
      
      // Enhanced database analysis
      try {
        const { data: allSubs, error: allSubsError } = await supabase
          .from('push_subscriptions')
          .select('user_id, endpoint, created_at')
          .limit(10);
          
        if (allSubsError) {
          console.error('❌ Error checking all subscriptions:', allSubsError);
        } else {
          console.log('📊 Total subscriptions in database:', allSubs?.length || 0);
          if (allSubs && allSubs.length > 0) {
            console.log('📋 Sample available subscriptions:');
            allSubs.forEach((sub, index) => {
              console.log(`  ${index + 1}. User: ${sub.user_id}, Endpoint: ${sub.endpoint.substring(0, 50)}..., Created: ${sub.created_at}`);
            });
          }
        }
      } catch (analysisError) {
        console.error('❌ Error during database analysis:', analysisError);
      }
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No Firebase Admin FCM subscriptions found',
          sentCount: 0,
          targetUsers: userIds.length,
          method: 'firebase-admin-sdk',
          analysis: {
            queriedUsers: userIds,
            foundSubscriptions: 0
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Enhanced notification sending with detailed tracking
    console.log('📤 Sending Firebase Admin FCM notifications to', subscriptions.length, 'device(s)...');
    const pushPromises = subscriptions.map(async (subscription: PushSubscription, index: number) => {
      console.log(`📤 [${index + 1}/${subscriptions.length}] Processing notification for user ${subscription.user_id}`);
      console.log(`📤 [${index + 1}/${subscriptions.length}] Device endpoint: ${subscription.endpoint.substring(0, 50)}...`);
      
      try {
        const result = await sendFirebaseAdminFCM(subscription, {
          title,
          body,
          data: data || {},
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          tag: data?.tag || 'firebase-admin-fcm'
        }, accessToken);

        console.log(`📤 [${index + 1}/${subscriptions.length}] Result:`, result.success ? '✅ Success' : `❌ Failed: ${result.error}`);
        
        return {
          userId: subscription.user_id,
          subscriptionId: subscription.id,
          endpoint: subscription.endpoint.substring(0, 50) + '...',
          ...result
        };
      } catch (sendError) {
        console.error(`📤 [${index + 1}/${subscriptions.length}] Send error:`, sendError);
        return {
          userId: subscription.user_id,
          subscriptionId: subscription.id,
          endpoint: subscription.endpoint.substring(0, 50) + '...',
          success: false,
          error: sendError.message
        };
      }
    });

    const results = await Promise.all(pushPromises);
    const successCount = results.filter(r => r.success).length;
    
    console.log('📱 === FIREBASE ADMIN FCM NOTIFICATION RESULTS ===');
    console.log(`✅ Successful deliveries: ${successCount}/${results.length}`);
    console.log(`❌ Failed deliveries: ${results.length - successCount}/${results.length}`);
    console.log('📊 Detailed results:', JSON.stringify(results, null, 2));

    // Enhanced response with comprehensive delivery insights
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
        recommendation: successCount === results.length ? 'All notifications delivered successfully!' : 'Some notifications failed - check device tokens',
        analysis: {
          queriedUsers: userIds,
          foundUsers: [...new Set(results.map(r => r.userId))],
          totalDevicesFound: results.length
        }
      }
    };

    console.log('📱 === FIREBASE ADMIN FCM DELIVERY COMPLETE ===');
    console.log('🔐 Authentication method: Firebase Admin SDK with Service Account');
    console.log('✅ Cross-device capability: Active');
    console.log('📊 Final response:', JSON.stringify(response, null, 2));

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Critical error in Firebase Admin FCM notification function:', error);
    console.error('❌ Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false,
        details: 'Firebase Admin FCM notification system encountered a critical error',
        method: 'firebase-admin-sdk',
        errorType: error.name,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
