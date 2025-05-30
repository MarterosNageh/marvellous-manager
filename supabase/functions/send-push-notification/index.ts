
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

// Firebase Service Account configuration
const FIREBASE_CONFIG = {
  projectId: "marvellous-manager",
  clientEmail: "firebase-adminsdk-fbsvc@marvellous-manager.iam.gserviceaccount.com",
  privateKey: `-----BEGIN PRIVATE KEY-----
MIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQDFgsq5Jjfo+xXn
BEfr6Tt+EBMvfBxNNweXp73nHrLqWYl/kzf52gkLzGG4+jakS+7Bg4kTiIkAYZVs
bbocnLSVjp8GjZev13awmSv3ZOnRcXnHAuLgZEsw+m5JXpyH1iqUGusEWjGuQMWW
QIEXw4ZAndDV+ucN7ovjPIFfNhWARqyh51K2RLTj9rvoWWlViSKk2CgiPUpMtFnT
PLtKkMTmQMz850OXGZKiqoxOVRsSFk7xp428MOjTh3jDZtf2bRoc0NUgAJksnEao
B9fYZp+DTLEpNbYo7ib5KtqZCbNgqZnn/9OYH8Pin++pzGprHUILZLIMjIhMyZ6T
d/Lft2utAgMBAAECggEAAUejBKbIv0u74plWgKLW7dmGJk1JlFPXoBXy1xKN2j2Q
9IYBsNlxgZAQz2AKW++EsTWm/RIUwS82BqkssY7FD3WzIMRox+I/iflpctrxNkLj
+nQnADPmK3++mInHveGXY7T2R5BGDiOr+W3wPYqDeNu3mgtcKpecdHEp7XIDmvyB
/4LeVWGiliyvwK4ha40qUi2j6TpNcJuN98+PY9Web6Ou8879nJTPY0pRne/230QZ
XppH13AljZelA7v7spmS91wmP9nlwzLolarPys4hVfpxnHsYML33IUEooigTz4f+
Q7gKzRr/S93S7wb6+HUhZs/fgOW1d1omWK951c0GiQKBgQDwX+pLfJUzDKmmrosr
Cls/cUUOAsJQc1ygbaCLg+l7uSmuVRs8vob11TgK/9y7Y2MRTC8NydgyH/mAjY1t
N49t9OqeT/xyKbdtIiBxu/9pAdrKxtffpuLtP91lcLijH3+9lF5BrWz7Ca0ilaea
JZ0f+Dtpb+WIi/Zgrn97kXGdFwKBgQDSWZQ66u9tDswfQLVEHJwUoIIrSFgC8g/X
hNbxC5I5jEPGJTgUxKBLj7vnoemecDl9H3PPsHHWNKQb81a+yifhcfokU1f6JKZJ
TTNHZZFBFFX3G5yHb3abDFGLRaCoAC0y573KSt6/4x+7SNenN1+qWR/ZoSVfkNSh
Dt+jJSnf2wKBgCiIU+60rEf2a6kSp57zWR2ikP1i07dTLJxUwAymirl1KKUf7r7Y
ddOAR7n7GRJ0GOFy0kBl99HD+IOH2wA+rS3ibamSXUQ26po5dfUXuWLQkD8/Nmmd
L4jICyIu1sOS7Sxfl2FFyCmwoQRC7gcdLpiUeBg4aSEUUNBOvGpuxRSzAoGAJkjX
icGowhinXijQ1Qy/+6EbD/WizyZva7JpzIVmn8K/sxijFGSVKCuI76ewdX3HeNZ4
pZxfm7UJCW1IpID2sTmlZWcl5Ak3mq/KXXxIGpdqZQdJffzzgVTEoqyRiQI/N7yl
9mOaFyKna9beKTkS2FZQTbPesX4StR2X5oGlFXECgYBRnkYJp0wHZqAvbVE51J+H
0VDFv4mZj/sSaBJXCXFekrZt0oATLu0v/CRpnb4SIcE13fXxIwGNIBUv0xf92xE4
mUTPCbJ4gr2qG7Shm0hHaQPHoLgo1ZtkcJOESBXaFyTwAqapOEuur8meG2em6sQW
38K3vO5Jxhh7im8XwyxUXQ==
-----END PRIVATE KEY-----`,
  privateKeyId: "04547119cb75b54f20c37a9e5af5bef9d38f7ce3"
};

async function getAccessToken(): Promise<string> {
  console.log('🔐 Getting Firebase access token...');
  
  try {
    const now = Math.floor(Date.now() / 1000);
    const expiry = now + 3600;
    
    const header = {
      alg: 'RS256',
      typ: 'JWT',
      kid: FIREBASE_CONFIG.privateKeyId
    };

    const payload = {
      iss: FIREBASE_CONFIG.clientEmail,
      scope: 'https://www.googleapis.com/auth/firebase.messaging',
      aud: 'https://oauth2.googleapis.com/token',
      exp: expiry,
      iat: now
    };

    // Create JWT manually
    const encodedHeader = btoa(JSON.stringify(header))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
      
    const encodedPayload = btoa(JSON.stringify(payload))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');

    const signingInput = `${encodedHeader}.${encodedPayload}`;

    // Import the private key
    const privateKeyDer = FIREBASE_CONFIG.privateKey
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

    // Get access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/x-www-form-urlencoded',
      },
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

    // Get FCM tokens from database - check both tables
    const { data: fcmTokens, error: fcmError } = await supabase
      .from('push_tokens')
      .select('*')
      .in('user_id', userIds);

    const { data: pushTokens, error: pushError } = await supabase
      .from('push_subscriptions')
      .select('*')
      .in('user_id', userIds);

    if (fcmError && pushError) {
      console.error('❌ Error fetching tokens:', { fcmError, pushError });
      return new Response(
        JSON.stringify({ 
          error: `Database error: ${fcmError?.message || pushError?.message}`,
          success: false
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Combine all tokens
    const allTokens = [
      ...(fcmTokens || []).map(t => ({ token: t.token, user_id: t.user_id, source: 'fcm' })),
      ...(pushTokens || []).map(t => ({ token: t.endpoint, user_id: t.user_id, source: 'push' }))
    ];

    console.log('📱 Total tokens found:', allTokens.length);

    if (allTokens.length === 0) {
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
    const pushPromises = allTokens.map(async (tokenData) => {
      try {
        let token = tokenData.token;
        
        // Extract FCM token from endpoint if needed
        if (tokenData.source === 'push' && token.includes('fcm.googleapis.com')) {
          const urlParts = token.split('/');
          token = urlParts[urlParts.length - 1];
        }

        const result = await sendFCMNotification(token, {
          title,
          body,
          data: data || {},
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          tag: data?.tag || 'fcm-notification'
        }, accessToken);

        return {
          userId: tokenData.user_id,
          token: token.substring(0, 20) + '...',
          source: tokenData.source,
          ...result
        };
      } catch (sendError) {
        return {
          userId: tokenData.user_id,
          token: tokenData.token.substring(0, 20) + '...',
          source: tokenData.source,
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
