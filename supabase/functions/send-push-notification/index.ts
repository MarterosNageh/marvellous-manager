import { serve } from "https://deno.land/std@0.168.0/http/server.ts"; // Standard Deno serve
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { SignJWT, importPKCS8 } from 'https://deno.land/x/jose@v5.6.3/index.ts'; // For JWT signing
// Note: web-push is not used if directly calling FCM HTTP v1 API with a token.
// import webpush from 'https://deno.land/x/webpush@0.2.0/mod.ts';

const FCM_API_KEY = Deno.env.get('FCM_SERVER_KEY'); // Legacy Server Key, used if not using OAuth
const FIREBASE_PROJECT_ID = Deno.env.get('FIREBASE_PROJECT_ID') || 'YOUR_FIREBASE_PROJECT_ID_PLACEHOLDER'; // Ensure this is set in Supabase secrets

console.log('Function send-push-notification started');
console.log(`Using FIREBASE_PROJECT_ID: ${FIREBASE_PROJECT_ID}`);

// Interface for the result objects stored in the results array
interface NotificationResult {
  userId: string;
  endpoint: string;
  success: boolean;
  status?: number;
  body?: any; 
  error?: string;
}

// Helper to get Firebase Service Account from Supabase Vault or Env Var
// This is for generating OAuth 2.0 access tokens for FCM API v1
async function getFirebaseServiceAccount() {
  let serviceAccountJson = Deno.env.get('FIREBASE_SERVICE_ACCOUNT_JSON_VAULT');
  if (serviceAccountJson && serviceAccountJson.startsWith('VAULT:')) {
    const secretPath = serviceAccountJson.substring(6);
    // Assuming a Supabase utility or direct Vault access here if that's how secrets are stored.
    // For environment variables directly, this part might differ.
    // This is a placeholder for how you'd fetch from Vault if that's the setup.
    // If FIREBASE_SERVICE_ACCOUNT_JSON is the raw JSON in env, use that directly.
    console.warn('Vault access for FIREBASE_SERVICE_ACCOUNT_JSON_VAULT is not fully implemented in this example script. Ensure your environment provides the JSON directly or adjust secret retrieval.');
    // Fallback to direct env var if vault path seems like a placeholder or fails
    serviceAccountJson = Deno.env.get('FIREBASE_SERVICE_ACCOUNT_JSON'); 
  }
  if (!serviceAccountJson) {
    serviceAccountJson = Deno.env.get('FIREBASE_SERVICE_ACCOUNT_JSON');
  }

  if (!serviceAccountJson) {
    throw new Error('Firebase service account JSON is not configured. Set FIREBASE_SERVICE_ACCOUNT_JSON environment variable.');
  }
  try {
    return JSON.parse(serviceAccountJson);
  } catch (e) {
    console.error('Failed to parse Firebase service account JSON:', e.toString());
    throw new Error('Invalid Firebase service account JSON.');
  }
}

// Get OAuth 2.0 Access Token for FCM API v1
async function getAccessToken() {
  const serviceAccount = await getFirebaseServiceAccount();
  const iat = Math.floor(Date.now() / 1000);

  const claims = {
    iss: serviceAccount.client_email,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
    aud: 'https://oauth2.googleapis.com/token',
    exp: iat + 3600, // Token expires in 1 hour
    iat: iat,
  };

  const jwtPayload = JSON.stringify(claims);
  const privateKeyPem = serviceAccount.private_key;

  // Dynamically import the jose library for JWT signing
  // const { SignJWT, importPKCS8 } = await import('https://deno.land/x/jose@v5.6.3/index.ts');
  
  const privateKey = await importPKCS8(privateKeyPem, 'RS256');

  const signedJwt = await new SignJWT(claims)
    .setProtectedHeader({ alg: 'RS256', typ: 'JWT' })
    .setIssuedAt(iat)
    .setIssuer(serviceAccount.client_email)
    .setAudience('https://oauth2.googleapis.com/token')
    .setExpirationTime('1h')
    .setSubject(serviceAccount.client_email) // FCM also recommends subject to be client_email
    .sign(privateKey);

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

  if (!tokenResponse.ok) {
    const errorBody = await tokenResponse.text();
    console.error('Error fetching access token:', tokenResponse.status, errorBody);
    throw new Error(`Failed to get access token: ${tokenResponse.status} ${errorBody}`);
  }

  const tokenData = await tokenResponse.json();
  return tokenData.access_token;
}

// Helper to extract raw FCM token from endpoint URL
function extractFcmToken(endpoint: string): string | null {
  if (endpoint && endpoint.includes('fcm.googleapis.com/fcm/')) {
    const token = endpoint.substring(endpoint.lastIndexOf('/') + 1);
    // Basic validation: FCM tokens are typically long and don't contain certain characters like '?' or '#'
    // A more robust validation might be needed depending on observed endpoint variations.
    if (token && token.length > 50 && !token.includes('?') && !token.includes('#')) {
        return token;
    }
    console.warn(`Extracted token from "${endpoint}" seems invalid or short: "${token.substring(0,30)}...". Endpoint might not be a standard FCM device token URL.`);
    return null; // Return null if extracted token looks suspicious
  }
  // If it doesn't look like a standard FCM endpoint URL, assume it might already be a raw token
  // but log a warning. This path should ideally not be hit if clients store full endpoint URLs.
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

// Send notification using FCM HTTP v1 API
async function sendFCMNotificationV1(fcmToken: string, title: string, body: string, data: any, supabaseAdmin: any, userId: string, originalEndpoint: string): Promise<Omit<NotificationResult, 'userId' | 'endpoint'>> {
  if (!fcmToken) {
    console.error('FCM token is null or empty for sendFCMNotificationV1, cannot send notification.');
    return { success: false, error: 'FCM token was null or empty' };
  }
  try {
    const accessToken = await getAccessToken();
    const fcmV1Endpoint = `https://fcm.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/messages:send`;

    const messagePayload = {
      message: {
        token: fcmToken,
        notification: {
          title: title,
          body: body,
          // icon: data?.icon || '/favicon.ico', // Standard notification fields
        },
        data: data, // Custom data payload
        webpush: {
          // headers: { // Optional: TTL, Urgency, Topic
          //   TTL: '86400', // 1 day in seconds
          //   Urgency: 'high'
          // },
          notification: { // Webpush-specific notification fields (can override or extend general notification)
              // title: title, // Can be repeated here if needed
              // body: body,
              icon: data?.icon || '/marvellous-logo-black.png', // Recommended: provide an icon
              badge: data?.badge || '/marvellous-logo-black.png', // For Android
              tag: data?.tag, // Allows replacing an existing notification with the same tag
              // requireInteraction: data?.requireInteraction !== undefined ? data.requireInteraction : true,
              // actions: data?.actions // e.g., [{ action: 'explore', title: 'Explore'}]
          },
          fcm_options: {
            link: data?.url || `/` // The page to open when the notification is clicked
          }
        }
      }
    };

    console.log(`Sending FCM v1 to token: ${fcmToken.substring(0,30)}... for user ${userId}, title: ${title}`);

    const fcmResponse = await fetch(fcmV1Endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messagePayload),
    });

    const responseBodyText = await fcmResponse.text(); // Read body once

    if (!fcmResponse.ok) {
      console.error(
        `FCM v1 send error for user ${userId}, token ${fcmToken.substring(0,30)}...: `,
        fcmResponse.status, 
        fcmResponse.statusText, 
        responseBodyText
      );
      // Standard error codes for token issues: 'UNREGISTERED', 'INVALID_ARGUMENT' (if token is malformed)
      // Consider 404 or 400 for UNREGISTERED/INVALID_ARGUMENT for token cleanup
      if (fcmResponse.status === 404 || fcmResponse.status === 400) {
         try {
            const errorJson = JSON.parse(responseBodyText);
            if (errorJson.error && (errorJson.error.details || []).some((detail: any) => detail.errorCode === 'UNREGISTERED' || detail.errorCode === 'INVALID_ARGUMENT' || detail.errorCode === 'SENDER_ID_MISMATCH')) {
                console.log(`Token ${fcmToken.substring(0,30)}... for user ${userId} is ${errorJson.error.details[0].errorCode}. Scheduling cleanup.`);
                await cleanupInvalidToken(supabaseAdmin, originalEndpoint, userId);
            }
         } catch (e) {
            // If parsing fails, still log it, but might not be a structured FCM error
            console.warn('Could not parse FCM error response as JSON for cleanup decision:', e);
            if (responseBodyText.toLowerCase().includes('unregistered') || responseBodyText.toLowerCase().includes('invalid registration token') || responseBodyText.toLowerCase().includes('mismatched sender id')) {
                 console.log(`Token ${fcmToken.substring(0,30)}... for user ${userId} seems invalid (text match). Scheduling cleanup.`);
                 await cleanupInvalidToken(supabaseAdmin, originalEndpoint, userId);
            }
         }
      }
      return { success: false, status: fcmResponse.status, body: responseBodyText, error: `FCM HTTP Error: ${fcmResponse.status} - ${responseBodyText.substring(0,100)}` };
    } else {
      console.log(`Successfully sent FCM v1 notification to user ${userId}, token ${fcmToken.substring(0,30)}... Body: ${responseBodyText.substring(0,100)}`);
      try {
        return { success: true, status: fcmResponse.status, body: JSON.parse(responseBodyText) };
      } catch (parseError) {
        console.warn('FCM success response was not JSON:', parseError, responseBodyText);
        return { success: true, status: fcmResponse.status, body: responseBodyText }; // Return raw body if JSON parse fails
      }
    }
  } catch (error) {
    console.error(`Exception during FCM v1 send for user ${userId}, token ${fcmToken.substring(0,30)}...:`, error);
    return { success: false, error: error.message };
  }
}

// Main Supabase Edge Function handler
serve(async (req: Request) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  // Handle OPTIONS request for CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  console.log('📱 === FCM PUSH NOTIFICATION FUNCTION START (HTTP v1) ===');
  console.log('🔗 Request URL:', req.url);
  console.log('🔗 Request method:', req.method);

  let userIds: string[] = [];
  let title: string = 'Notification Title';
  let body: string = 'Notification Body';
  let data: any = {};

  try {
    const requestBody = await req.text();
    console.log('📱 Raw request body:', requestBody);
    
    const httpRequestPayload = JSON.parse(requestBody);
    console.log('📱 FCM v1 Notification Request:', JSON.stringify(httpRequestPayload, null, 2));
    
    userIds = httpRequestPayload.userIds || [];
    title = httpRequestPayload.title || title;
    body = httpRequestPayload.body || body;
    data = httpRequestPayload.data || {};

    console.log('🔍 Fetching push subscriptions for users:', JSON.stringify(userIds));
  } catch (e) {
    console.error('Error parsing request JSON:', e);
    return new Response(JSON.stringify({ error: 'Invalid JSON payload' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  if (!userIds || userIds.length === 0) {
    return new Response(JSON.stringify({ error: 'userIds array is required and cannot be empty' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  if (FIREBASE_PROJECT_ID === 'YOUR_FIREBASE_PROJECT_ID_PLACEHOLDER') {
    console.error('FIREBASE_PROJECT_ID is not set in environment variables. Push notifications will likely fail.');
    // Optionally, return an error if it's critical
    // return new Response(JSON.stringify({ error: 'Server configuration error: FIREBASE_PROJECT_ID not set' }), {
    //   status: 500,
    //   headers: { 'Content-Type': 'application/json' },
    // });
  }

  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  );

  const { data: subscriptions, error: fetchError } = await supabaseAdmin
    .from('push_subscriptions')
    .select('endpoint, p256dh_key, auth_key, user_id')
    .in('user_id', userIds);

  if (fetchError) {
    console.error('Error fetching subscriptions:', fetchError);
    return new Response(JSON.stringify({ error: 'Failed to fetch subscriptions', details: fetchError.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  if (!subscriptions || subscriptions.length === 0) {
    console.log('📱 Push subscriptions found: 0');
    return new Response(JSON.stringify({ message: 'No subscriptions found for users.', userIds }), {
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

  for (const sub of subscriptions) {
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
});

/* 
Example payload to this function:
{
  "userIds": ["user_uuid_1", "user_uuid_2"],
  "title": "New Message",
  "body": "You have a new message from John Doe.",
  "data": {
    "url": "/messages/123",
    "customKey": "customValue",
    "icon": "/my-custom-icon.png", // Optional: Override default icon
    "badge": "/my-custom-badge.png", // Optional: Override default badge
    "tag": "new-message-group" // Optional: Tag for replacing notifications
  }
}
*/

