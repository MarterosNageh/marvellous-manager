
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PushToken {
  token: string;
  user_id: string;
}

// Updated Firebase Service Account from the provided JSON
const SERVICE_ACCOUNT = {
  "type": "service_account",
  "project_id": "marvellous-manager",
  "private_key_id": "04547119cb75b54f20c37a9e5af5bef9d38f7ce3",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQDFgsq5Jjfo+xXn\nBEfr6Tt+EBMvfBxNNweXp73nHrLqWYl/kzf52gkLzGG4+jakS+7Bg4kTiIkAYZVs\nbbocnLSVjp8GjZev13awmSv3ZOnRcXnHAuLgZEsw+m5JXpyH1iqUGusEWjGuQMWW\nQIEXw4ZAndDV+ucN7ovjPIFfNhWARqyh51K2RLTj9rvoWWlViSKk2CgiPUpMtFnT\nPLtKkMTmQMz850OXGZKiqoxOVRsSFk7xp428MOjTh3jDZtf2bRoc0NUgAJksnEao\nB9fYZp+DTLEpNbYo7ib5KtqZCbNgqZnn/9OYH8Pin++pzGprHUILZLIMjIhMyZ6T\nd/Lft2utAgMBAAECggEAAUejBKbIv0u74plWgKLW7dmGJk1JlFPXoBXy1xKN2j2Q\n9IYBsNlxgZAQz2AKW++EsTWm/RIUwS82BqkssY7FD3WzIMRox+I/iflpctrxNkLj\n+nQnADPmK3++mInHveGXY7T2R5BGDiOr+W3wPYqDeNu3mgtcKpecdHEp7XIDmvyB\n/4LeVWGiliyvwK4ha40qUi2j6TpNcJuN98+PY9Web6Ou8879nJTPY0pRne/230QZ\nXppH13AljZelA7v7spmS91wmP9nlwzLolarPys4hVfpxnHsYML33IUEooigTz4f+\nQ7gKzRr/S93S7wb6+HUhZs/fgOW1d1omWK951c0GiQKBgQDwX+pLfJUzDKmmrosr\nCls/cUUOAsJQc1ygbaCLg+l7uSmuVRs8vob11TgK/9y7Y2ORTC8NydgyH/mAjY1t\nN49t9OqeT/xyKbdtIiBxu/9pAdrKxtffpuLtP91lcLijH3+9lF5BrWz7Ca0ilaea\nJZ0f+Dtpb+WIi/Zgrn97kXGdFwKBgQDSWZQ66u9tDswfQLVEHJwUoIIrSFgC8g/X\nhNbxC5I5jEPGJTgUxKBLj7vnoemecDl9H3PPsHHWNKQb81a+yifhcfokU1f6JKZJ\nTTNHZZfBffX3G5yHb3abDFGLRaCoAC0y573KSt6/4x+7SNenN1+qWR/ZoSVfkNSh\nDt+jJSnf2wKBgCiIU+60rEf2a6kSp57zWR2ikP1i07dTLJxUwAymirl1KKUf7r7Y\nddOAR7n7GRJ0GOFy0kBl99HD+IOH2wA+rS3ibamSXUQ26po5dfUXuWLQkD8/Nmmd\nL4jICyIu1sOS7Sxfl2FFyCmwoQRC7gcdLpiUeBg4aSEUUNBOvGpuxRSzAoGAJkjX\nicGowhinXijQ1Qy/+6EbD/WizyZva7JpzIVmn8K/sxijFGSVKCuI76ewdX3HeNZ4\npZxfm7UJCW1IpID2sTmlZWcl5Ak3mq/KXXxIGpdqZQdJffzzgVTEoqyRiQI/N7yl\n9mOaFyKna9beKTkS2FZQTbPesX4StR2X5oGlFXECgYBRnkYJp0wHZqAvbVE51J+H\n0VDFv4mZj/sSaBJXCXFekrZt0oATLu0v/CRpnb4SIcE13fXxIwGNIBUv0xf92xE4\nmUTPCbJ4gr2qG7Shm0hHaQPHoLgo1ZtkcJOESBXaFyTwAqapOEuur8meG2em6sQW\n38K3vO5Jxhh7im8XwyxUXQ==\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-fbsvc@marvellous-manager.iam.gserviceaccount.com",
  "client_id": "111912629734263281888",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40marvellous-manager.iam.gserviceaccount.com",
  "universe_domain": "googleapis.com"
};

// Firebase configuration
const FIREBASE_CONFIG = {
  projectId: "marvellous-manager",
  messagingSenderId: "368753443778"
}

// Enhanced JWT creation with correct private key
async function createJWT(payload: any): Promise<string> {
  console.log('🔧 Creating JWT with updated service account...');
  
  try {
    const header = {
      alg: 'RS256',
      typ: 'JWT',
      kid: SERVICE_ACCOUNT.private_key_id
    };

    const encodedHeader = btoa(JSON.stringify(header))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
      
    const encodedPayload = btoa(JSON.stringify(payload))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');

    const signingInput = `${encodedHeader}.${encodedPayload}`;

    const privateKeyPem = SERVICE_ACCOUNT.private_key;
    const privateKeyDer = privateKeyPem
      .replace(/-----BEGIN PRIVATE KEY-----/g, '')
      .replace(/-----END PRIVATE KEY-----/g, '')
      .replace(/\r?\n/g, '');

    const privateKeyBytes = Uint8Array.from(atob(privateKeyDer), c => c.charCodeAt(0));

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

    const signature = await crypto.subtle.sign(
      'RSASSA-PKCS1-v1_5',
      cryptoKey,
      new TextEncoder().encode(signingInput)
    );

    const signatureBytes = new Uint8Array(signature);
    const signatureB64 = btoa(String.fromCharCode(...signatureBytes))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');

    const jwt = `${signingInput}.${signatureB64}`;
    console.log('✅ JWT created successfully with updated credentials');
    
    return jwt;
  } catch (error) {
    console.error('❌ JWT creation failed:', error);
    throw new Error(`JWT creation failed: ${error.message}`);
  }
}

async function getAccessToken(): Promise<string> {
  console.log('🔐 Getting Firebase access token with updated service account...');
  
  try {
    const now = Math.floor(Date.now() / 1000);
    const expiry = now + 3600;
    
    const payload = {
      iss: SERVICE_ACCOUNT.client_email,
      scope: 'https://www.googleapis.com/auth/firebase.messaging',
      aud: 'https://oauth2.googleapis.com/token',
      exp: expiry,
      iat: now
    };

    const jwt = await createJWT(payload);

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
    
    const responseText = await tokenResponse.text();

    if (!tokenResponse.ok) {
      console.error('❌ Token request failed:', responseText);
      throw new Error(`Token request failed: ${tokenResponse.status} - ${responseText}`);
    }

    const tokenData = JSON.parse(responseText);
    console.log('✅ Firebase access token obtained successfully');
    
    return tokenData.access_token;
  } catch (error) {
    console.error('❌ Failed to get access token:', error);
    throw error;
  }
}

async function sendFCMNotification(token: string, payload: any, accessToken: string) {
  console.log('📱 Sending FCM notification to token:', token.substring(0, 20) + '...');
  
  try {
    const fcmUrl = `https://fcm.googleapis.com/v1/projects/${FIREBASE_CONFIG.projectId}/messages:send`;
    
    const message = {
      message: {
        token: token,
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
            tag: payload.tag || 'fcm-notification'
          },
          fcm_options: {
            link: payload.data?.url || '/task-manager'
          }
        }
      }
    };

    console.log('📤 Sending FCM message...');

    const response = await fetch(fcmUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message)
    });
    
    console.log('📤 FCM Response status:', response.status);
    
    const responseText = await response.text();
    
    if (!response.ok) {
      console.error('❌ FCM failed:', responseText);
      return { success: false, error: `FCM HTTP ${response.status}: ${responseText}` };
    }
    
    const result = JSON.parse(responseText);
    console.log('✅ FCM Response:', result);
    
    return { success: true, fcmResponse: result };
    
  } catch (error) {
    console.error('❌ Error sending FCM notification:', error);
    return { success: false, error: error.message };
  }
}

serve(async (req) => {
  console.log('📱 === FCM PUSH NOTIFICATION FUNCTION START ===');
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing required environment variables',
          success: false
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const requestBody = await req.text();
    const parsedBody = JSON.parse(requestBody);
    
    const { userIds, title, body, data } = parsedBody;
    console.log('📱 FCM Notification Request:', { userIds, title, body, data });

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return new Response(
        JSON.stringify({ 
          error: 'Invalid userIds - must be a non-empty array',
          success: false
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (!title || !body) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing required fields: title and body',
          success: false
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Get Firebase access token
    const accessToken = await getAccessToken();

    // Get FCM tokens from database
    const { data: tokens, error } = await supabase
      .from('push_tokens')
      .select('*')
      .in('user_id', userIds);

    if (error) {
      console.error('❌ Error fetching tokens:', error);
      return new Response(
        JSON.stringify({ 
          error: `Database error: ${error.message}`,
          success: false
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('📱 FCM tokens found:', tokens?.length || 0);

    if (!tokens || tokens.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No FCM tokens found',
          sentCount: 0,
          targetUsers: userIds.length
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Send notifications
    const pushPromises = tokens.map(async (tokenData: PushToken) => {
      try {
        const result = await sendFCMNotification(tokenData.token, {
          title,
          body,
          data: data || {},
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          tag: data?.tag || 'fcm-notification'
        }, accessToken);

        return {
          userId: tokenData.user_id,
          token: tokenData.token.substring(0, 20) + '...',
          ...result
        };
      } catch (sendError) {
        return {
          userId: tokenData.user_id,
          token: tokenData.token.substring(0, 20) + '...',
          success: false,
          error: sendError.message
        };
      }
    });

    const results = await Promise.all(pushPromises);
    const successCount = results.filter(r => r.success).length;

    console.log('📱 FCM Notification Summary:', {
      total: results.length,
      successful: successCount,
      failed: results.length - successCount
    });

    return new Response(
      JSON.stringify({
        success: true,
        sentCount: successCount,
        totalTokens: results.length,
        targetUsers: userIds.length,
        results: results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Function error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
