
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { SignJWT, importPKCS8 } from 'https://deno.land/x/jose@v5.6.3/index.ts';

const FCM_API_KEY = Deno.env.get('FCM_SERVER_KEY');
const FIREBASE_PROJECT_ID = Deno.env.get('FIREBASE_PROJECT_ID') || 'marvellous-manager';

console.log('Function send-push-notification started');
console.log(`Using FIREBASE_PROJECT_ID: ${FIREBASE_PROJECT_ID}`);

interface NotificationResult {
  userId: string;
  endpoint: string;
  success: boolean;
  status?: number;
  body?: any; 
  error?: string;
}

async function getFirebaseServiceAccount() {
  try {
    console.log('🔐 Starting Firebase service account retrieval...');
    
    let serviceAccountJson = Deno.env.get('FIREBASE_SERVICE_ACCOUNT_JSON_VAULT');
    console.log('Checking vault path:', serviceAccountJson ? 'Found' : 'Not found');
    
    if (!serviceAccountJson || serviceAccountJson.startsWith('VAULT:')) {
      serviceAccountJson = Deno.env.get('FIREBASE_SERVICE_ACCOUNT_JSON');
      console.log('Checking direct environment variable:', serviceAccountJson ? 'Found' : 'Not found');
    }

    if (!serviceAccountJson) {
      throw new Error('Firebase service account JSON is not configured. Set FIREBASE_SERVICE_ACCOUNT_JSON environment variable.');
    }

    try {
      const parsedAccount = JSON.parse(serviceAccountJson);
      
      console.log('Service Account Details:');
      console.log('- type:', parsedAccount.type);
      console.log('- project_id:', parsedAccount.project_id);
      console.log('- client_email:', parsedAccount.client_email);
      console.log('- private_key_id:', parsedAccount.private_key_id ? '✓ Present' : '✗ Missing');
      console.log('- private_key:', parsedAccount.private_key ? '✓ Present' : '✗ Missing');
      
      if (parsedAccount.private_key) {
        const keyLines = parsedAccount.private_key.split('\n');
        console.log('Private key format check:');
        console.log('- Starts with BEGIN:', keyLines[0].includes('BEGIN PRIVATE KEY'));
        console.log('- Ends with END:', keyLines[keyLines.length - 1].includes('END PRIVATE KEY'));
        console.log('- Number of lines:', keyLines.length);
      }
      
      const requiredFields = ['type', 'project_id', 'private_key_id', 'private_key', 'client_email', 'client_id'];
      const missingFields = requiredFields.filter(field => !parsedAccount[field]);
      
      if (missingFields.length > 0) {
        throw new Error(`Service account JSON is missing required fields: ${missingFields.join(', ')}`);
      }

      const configuredProjectId = Deno.env.get('FIREBASE_PROJECT_ID');
      if (configuredProjectId && configuredProjectId !== parsedAccount.project_id) {
        console.warn('⚠️ Warning: FIREBASE_PROJECT_ID environment variable does not match service account project_id');
        console.warn(`- Environment: ${configuredProjectId}`);
        console.warn(`- Service Account: ${parsedAccount.project_id}`);
      }
      
      return parsedAccount;
    } catch (parseError) {
      console.error('Failed to parse Firebase service account JSON:', parseError.toString());
      if (serviceAccountJson.length > 50) {
        console.error('First 50 characters of service account JSON:', serviceAccountJson.substring(0, 50) + '...');
      } else {
        console.error('Service account JSON appears to be too short:', serviceAccountJson.length, 'characters');
      }
      throw new Error('Invalid Firebase service account JSON format. Please check the JSON structure.');
    }
  } catch (error) {
    console.error('Error in getFirebaseServiceAccount:', error);
    throw error;
  }
}

async function getAccessToken() {
  try {
    console.log('🔐 Getting Firebase service account...');
    const serviceAccount = await getFirebaseServiceAccount();
    
    console.log('🔐 Generating JWT claims...');
    const iat = Math.floor(Date.now() / 1000);
    const exp = iat + 3600;

    const claims = {
      iss: serviceAccount.client_email,
      scope: 'https://www.googleapis.com/auth/firebase.messaging',
      aud: 'https://oauth2.googleapis.com/token',
      exp: exp,
      iat: iat,
    };

    console.log('🔐 JWT claims generated for:', serviceAccount.client_email);
    const privateKeyPem = serviceAccount.private_key;
    
    if (!privateKeyPem) {
      throw new Error('Private key is missing from service account JSON');
    }

    if (!privateKeyPem.includes('BEGIN PRIVATE KEY') || !privateKeyPem.includes('END PRIVATE KEY')) {
      throw new Error('Private key format appears invalid. Should contain BEGIN/END PRIVATE KEY markers');
    }

    console.log('🔐 Importing private key...');
    const privateKey = await importPKCS8(privateKeyPem, 'RS256');
    
    console.log('🔐 Signing JWT...');
    const signedJwt = await new SignJWT(claims)
      .setProtectedHeader({ alg: 'RS256', typ: 'JWT' })
      .setIssuedAt(iat)
      .setIssuer(serviceAccount.client_email)
      .setAudience('https://oauth2.googleapis.com/token')
      .setExpirationTime(exp)
      .setSubject(serviceAccount.client_email)
      .sign(privateKey);

    console.log('🔐 JWT signed successfully, requesting access token...');
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: signedJwt,
      }).toString(),
    });

    const responseText = await tokenResponse.text();
    console.log('🔐 Token response status:', tokenResponse.status);
    
    if (!tokenResponse.ok) {
      console.error('❌ Error fetching access token:', tokenResponse.status, responseText);
      throw new Error(`Failed to get access token: ${tokenResponse.status} ${responseText}`);
    }

    try {
      const tokenData = JSON.parse(responseText);
      console.log('✅ Successfully obtained access token');
      return tokenData.access_token;
    } catch (e) {
      console.error('❌ Failed to parse token response:', e);
      throw new Error('Invalid token response format');
    }
  } catch (error) {
    console.error('❌ Error in getAccessToken:', error);
    throw error;
  }
}

function extractFcmToken(endpoint: string): string | null {
  if (endpoint && endpoint.includes('fcm.googleapis.com/fcm/')) {
    const token = endpoint.substring(endpoint.lastIndexOf('/') + 1);
    if (token && token.length > 50 && !token.includes('?') && !token.includes('#')) {
        return token;
    }
    console.warn(`Extracted token from "${endpoint}" seems invalid or short: "${token.substring(0,30)}...". Endpoint might not be a standard FCM device token URL.`);
    return null;
  }
  if (endpoint && endpoint.length > 50 && !endpoint.includes('/') && !endpoint.includes('?') && !endpoint.includes('#')) {
    console.warn(`Endpoint "${endpoint.substring(0,30)}..." does not look like an FCM URL but is treated as a raw token.`);
    return endpoint; 
  }
  console.error(`Cannot extract a valid FCM token from endpoint: "${endpoint}". It will be skipped.`);
  return null;
}

async function cleanupInvalidToken(supabaseAdmin: any, endpoint: string, userId: string) {
  console.log(`Cleaning up invalid token for user ${userId}, endpoint: ${endpoint.substring(0,50)}...`);
  try {
    const { error: deleteError } = await supabaseAdmin
      .from('push_subscriptions')
      .delete()
      .match({ user_id: userId, endpoint: endpoint });
    if (deleteError) {
      console.error(`Error deleting invalid token for user ${userId}:`, deleteError);
    } else {
      console.log(`Successfully deleted invalid token for user ${userId}, endpoint: ${endpoint.substring(0,50)}...`);
    }
  } catch (e) {
    console.error(`Exception during token cleanup for user ${userId}:`, e);
  }
}

async function sendFCMNotificationV1(fcmToken: string, title: string, body: string, data: any, supabaseAdmin: any, userId: string, originalEndpoint: string): Promise<Omit<NotificationResult, 'userId' | 'endpoint'>> {
  if (!fcmToken) {
    console.error('FCM token is null or empty for sendFCMNotificationV1, cannot send notification.');
    return { success: false, error: 'FCM token was null or empty' };
  }

  try {
    const accessToken = await getAccessToken();
    const fcmV1Endpoint = `https://fcm.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/messages:send`;

    // Fix the payload structure - this was the issue!
    const messagePayload = {
      message: {
        token: fcmToken,
        notification: {
          title: title || 'Notification',
          body: body || 'You have a new notification',
        },
        data: data ? Object.fromEntries(
          Object.entries(data).map(([key, value]) => [key, String(value)])
        ) : {},
        webpush: {
          notification: {
            icon: (data?.icon || '/marvellous-logo-black.png'),
            badge: (data?.badge || '/marvellous-logo-black.png'),
            tag: data?.tag,
            requireInteraction: data?.requireInteraction !== undefined ? data.requireInteraction : true,
          },
          fcm_options: {
            link: data?.url || '/'
          }
        }
      }
    };

    console.log(`Sending FCM v1 to token: ${fcmToken.substring(0,30)}... for user ${userId}, title: ${title}`);
    console.log('Message payload:', JSON.stringify(messagePayload, null, 2));

    const fcmResponse = await fetch(fcmV1Endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messagePayload),
    });

    const responseBodyText = await fcmResponse.text();

    if (!fcmResponse.ok) {
      console.error(
        `FCM v1 send error for user ${userId}, token ${fcmToken.substring(0,30)}...: `,
        fcmResponse.status, 
        fcmResponse.statusText, 
        responseBodyText
      );

      if (fcmResponse.status === 404 || fcmResponse.status === 400) {
        try {
          const errorJson = JSON.parse(responseBodyText);
          if (errorJson.error && (errorJson.error.details || []).some((detail: any) => 
            detail.errorCode === 'UNREGISTERED' || 
            detail.errorCode === 'INVALID_ARGUMENT' || 
            detail.errorCode === 'SENDER_ID_MISMATCH'
          )) {
            console.log(`Token ${fcmToken.substring(0,30)}... for user ${userId} is ${errorJson.error.details[0].errorCode}. Scheduling cleanup.`);
            await cleanupInvalidToken(supabaseAdmin, originalEndpoint, userId);
          }
        } catch (e) {
          console.warn('Could not parse FCM error response as JSON for cleanup decision:', e);
          if (responseBodyText.toLowerCase().includes('unregistered') || 
              responseBodyText.toLowerCase().includes('invalid registration token') || 
              responseBodyText.toLowerCase().includes('mismatched sender id')
          ) {
            console.log(`Token ${fcmToken.substring(0,30)}... for user ${userId} seems invalid (text match). Scheduling cleanup.`);
            await cleanupInvalidToken(supabaseAdmin, originalEndpoint, userId);
          }
        }
      }
      return { 
        success: false, 
        status: fcmResponse.status, 
        body: responseBodyText, 
        error: `FCM HTTP Error: ${fcmResponse.status} - ${responseBodyText.substring(0,100)}` 
      };
    }

    console.log(`Successfully sent FCM v1 notification to user ${userId}, token ${fcmToken.substring(0,30)}... Body: ${responseBodyText.substring(0,100)}`);
    try {
      return { 
        success: true, 
        status: fcmResponse.status, 
        body: JSON.parse(responseBodyText) 
      };
    } catch (parseError) {
      console.warn('FCM success response was not JSON:', parseError, responseBodyText);
      return { 
        success: true, 
        status: fcmResponse.status, 
        body: responseBodyText 
      };
    }
  } catch (error) {
    console.error(`Exception during FCM v1 send for user ${userId}, token ${fcmToken.substring(0,30)}...:`, error);
    return { 
      success: false, 
      error: error.message || 'Unknown error during FCM send' 
    };
  }
}

serve(async (req: Request) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  console.log('📱 === FCM PUSH NOTIFICATION FUNCTION START (HTTP v1) ===');
  console.log('🔗 Request URL:', req.url);
  console.log('🔗 Request method:', req.method);

  const requiredEnvVars = [
    'FIREBASE_SERVICE_ACCOUNT_JSON',
    'FIREBASE_PROJECT_ID',
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY'
  ];

  const missingEnvVars = requiredEnvVars.filter(varName => !Deno.env.get(varName));
  if (missingEnvVars.length > 0) {
    console.error('❌ Missing required environment variables:', missingEnvVars);
    return new Response(JSON.stringify({
      error: 'Configuration Error',
      message: `Missing required environment variables: ${missingEnvVars.join(', ')}`,
      status: 500
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  let userIds: string[] = [];
  let title: string = 'Notification Title';
  let body: string = 'Notification Body';
  let data: any = {};

  try {
    const requestBody = await req.text();
    console.log('📱 Raw request body:', requestBody);
    
    if (!requestBody) {
      throw new Error('Request body is empty');
    }

    const httpRequestData = JSON.parse(requestBody);
    console.log('📱 FCM v1 Notification Request:', JSON.stringify(httpRequestData, null, 2));
    
    if (!httpRequestData) {
      throw new Error('Failed to parse request body as JSON');
    }

    userIds = httpRequestData.userIds || [];
    title = httpRequestData.title || title;
    body = httpRequestData.body || body;
    data = httpRequestData.data || {};

    if (!Array.isArray(userIds)) {
      throw new Error('userIds must be an array');
    }

    console.log('🔍 Fetching push subscriptions for users:', JSON.stringify(userIds));
  } catch (e) {
    console.error('Error processing request:', e);
    return new Response(JSON.stringify({ 
      error: 'Invalid Request',
      message: e.message,
      details: 'The request body must be valid JSON with a userIds array'
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  if (!userIds || userIds.length === 0) {
    return new Response(JSON.stringify({ 
      error: 'Invalid Request',
      message: 'userIds array is required and cannot be empty'
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  if (FIREBASE_PROJECT_ID === 'YOUR_FIREBASE_PROJECT_ID_PLACEHOLDER') {
    console.error('FIREBASE_PROJECT_ID is not set in environment variables. Push notifications will likely fail.');
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase configuration is missing');
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

    try {
      console.log('🔐 Testing Firebase authentication...');
      await getAccessToken();
      console.log('✅ Firebase authentication successful');
    } catch (authError) {
      console.error('❌ Firebase authentication failed:', authError);
      return new Response(JSON.stringify({
        error: 'Authentication Error',
        message: 'Failed to authenticate with Firebase',
        details: authError.message
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { data: subscriptions, error: fetchError } = await supabaseAdmin
      .from('push_subscriptions')
      .select('endpoint, p256dh_key, auth_key, user_id')
      .in('user_id', userIds);

    if (fetchError) {
      console.error('Error fetching subscriptions:', fetchError);
      return new Response(JSON.stringify({ 
        error: 'Database Error',
        message: 'Failed to fetch subscriptions',
        details: fetchError.message 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log('📱 Push subscriptions found: 0');
      return new Response(JSON.stringify({ 
        message: 'No subscriptions found for users.',
        userIds,
        status: 'success',
        subscriptions_found: 0
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('📱 Push subscriptions found:', subscriptions.length);
    console.log('📱 Subscription details:');
    subscriptions.forEach((sub, index) => {
      console.log(`  ${index + 1}. User: ${sub.user_id}, Endpoint: ${sub.endpoint.substring(0, 50)}...`);
    });

    const results: NotificationResult[] = [];
    let successful = 0;
    let failed = 0;
    let cleanedUp = 0;

    try {
      for (const sub of subscriptions) {
        try {
          const rawFcmToken = extractFcmToken(sub.endpoint);
          if (rawFcmToken) {
            console.log('📱 Processing subscription endpoint:', sub.endpoint.substring(0, 50) + '...');
            console.log('📱 Extracted FCM token:', rawFcmToken.substring(0, 20) + '...');
            
            const result = await sendFCMNotificationV1(rawFcmToken, title, body, data, supabaseAdmin, sub.user_id, sub.endpoint);
            results.push({ userId: sub.user_id, endpoint: sub.endpoint.substring(0, 50) + '...', ...result });
            
            if (result.success) successful++;
            else {
              failed++;
              if (result.status === 404 || result.status === 400) cleanedUp++;
            }
          } else {
            console.warn(`Could not extract FCM token from endpoint: ${sub.endpoint} for user ${sub.user_id}. Skipping.`);
            results.push({ userId: sub.user_id, endpoint: sub.endpoint, success: false, error: 'Could not extract token' });
            failed++;
          }
        } catch (subError) {
          console.error('❌ Error processing subscription for user', sub.user_id, ':', subError);
          results.push({ userId: sub.user_id, endpoint: sub.endpoint, success: false, error: subError.message });
          failed++;
        }
      }

      console.log('📱 FCM v1 Notification Summary:', { total: subscriptions.length, successful, failed, cleanedUp });
      
      if (failed > 0) {
        console.log('❌ Failed notifications:');
        results.filter(r => !r.success).forEach((result, index) => {
          console.log(`  ${index + 1}. User: ${result.userId}, Error: ${result.error}`);
        });
      }

      return new Response(JSON.stringify({ 
        message: 'Notifications processed', 
        summary: { total: subscriptions.length, successful, failed, cleanedUp },
        results 
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (error) {
      console.error('❌ Fatal error processing notifications:', error);
      return new Response(JSON.stringify({ 
        error: 'Failed to process notifications',
        message: error.message,
        summary: { total: subscriptions.length, successful, failed, cleanedUp },
        results 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  } catch (error) {
    console.error('❌ Fatal error processing request:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to process request',
      message: error.message,
      details: 'An unexpected error occurred'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
