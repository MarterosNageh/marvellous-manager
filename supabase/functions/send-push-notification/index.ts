
// Follow this setup guide to integrate the Deno runtime into your project:
// https://deno.com/manual/getting_started/setup_your_environment

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import admin from "https://esm.sh/firebase-admin@11.0.1";
import { getFirestore } from "https://esm.sh/firebase-admin@11.0.1/firestore";
import { getMessaging } from "https://esm.sh/firebase-admin@11.0.1/messaging";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.8.0";

const REQUIRED_ENV_VARS = ["FIREBASE_SERVICE_ACCOUNT_JSON"];

// CORS headers for browser access
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Initialize Supabase client
const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const supabase = createClient(supabaseUrl, supabaseServiceRole);

// Initialize Firebase Admin SDK if not already initialized
const initializeFirebaseAdmin = () => {
  try {
    // Check if Firebase Admin SDK is already initialized
    if (admin.apps.length === 0) {
      const serviceAccountJson = Deno.env.get("FIREBASE_SERVICE_ACCOUNT_JSON");
      if (!serviceAccountJson) {
        throw new Error("Missing FIREBASE_SERVICE_ACCOUNT_JSON environment variable");
      }

      // Parse the service account JSON
      const serviceAccount = JSON.parse(serviceAccountJson);
      
      // Initialize the app
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });

      console.log("✅ Firebase Admin SDK initialized successfully");
    }
    return true;
  } catch (error) {
    console.error("❌ Error initializing Firebase Admin SDK:", error);
    return false;
  }
};

serve(async (req) => {
  console.log("📱 === FCM PUSH NOTIFICATION FUNCTION START (HTTP v1) ===");
  console.log("🔗 Request URL:", req.url);
  console.log("🔗 Request method:", req.method);
  
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  // Check environment variables
  const missingEnvVars = REQUIRED_ENV_VARS.filter(
    (envVar) => !Deno.env.get(envVar)
  );

  if (missingEnvVars.length > 0) {
    console.error(`❌ Missing required environment variables: [ "${missingEnvVars.join('", "')}" ]`);
    return new Response(
      JSON.stringify({
        success: false,
        error: `Missing required environment variables: ${missingEnvVars.join(", ")}`,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  try {
    // Parse request body
    const { userIds, title, body, data = {} } = await req.json();
    
    console.log("👥 Target user IDs:", userIds);
    console.log("📝 Notification title:", title);
    console.log("📝 Notification body:", body);
    console.log("📊 Additional data:", data);

    // Validate required parameters
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      console.error("❌ Invalid userIds provided");
      return new Response(
        JSON.stringify({
          success: false,
          error: "Invalid userIds parameter: Expected a non-empty array of user IDs",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!title || !body) {
      console.error("❌ Missing notification content (title or body)");
      return new Response(
        JSON.stringify({
          success: false,
          error: "Title and body are required for notifications",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Initialize Firebase Admin SDK
    const isFirebaseInitialized = initializeFirebaseAdmin();
    if (!isFirebaseInitialized) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Failed to initialize Firebase Admin SDK",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get FCM tokens for these users
    const { data: fcmTokens, error: fetchError } = await supabase
      .from('fcm_tokens')
      .select('fcm_token')
      .in('user_id', userIds)
      .eq('is_active', true);

    if (fetchError) {
      console.error("❌ Error fetching FCM tokens from database:", fetchError);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Failed to fetch FCM tokens: " + fetchError.message,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!fcmTokens || fcmTokens.length === 0) {
      console.warn("⚠️ No active FCM tokens found for the specified users");
      return new Response(
        JSON.stringify({
          success: false,
          error: "No active FCM tokens found for the specified users",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Extract tokens from the results
    const tokens = fcmTokens.map(record => record.fcm_token);
    console.log(`🔑 Found ${tokens.length} active FCM tokens`);

    // Create notification payload
    const message = {
      notification: {
        title,
        body,
      },
      data: {
        ...data,
        click_action: "FLUTTER_NOTIFICATION_CLICK",
      },
      tokens: tokens,
      webpush: {
        fcmOptions: {
          link: data?.url || '/'
        },
        notification: {
          icon: '/marvellous-logo-black.png'
        }
      }
    };

    // Send the notification
    console.log("🚀 Sending multicast notification to tokens:", tokens);
    const response = await getMessaging().sendMulticast(message);
    
    console.log(`✅ Successfully sent messages: ${response.successCount}/${tokens.length}`);
    
    if (response.failureCount > 0) {
      const failedTokens = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          console.error(`❌ Error sending to token at index ${idx}:`, resp.error);
          failedTokens.push({ token: tokens[idx], error: resp.error?.message });
        }
      });
      
      console.log("❌ Failed tokens:", failedTokens);
      
      // If we found tokens that are invalid, mark them as inactive in the database
      const invalidTokens = failedTokens
        .filter(item => item.error && 
          (item.error.includes("not-registered") || 
           item.error.includes("invalid-argument")))
        .map(item => item.token);
      
      if (invalidTokens.length > 0) {
        console.log("🗑️ Marking invalid tokens as inactive:", invalidTokens);
        const { error: updateError } = await supabase
          .from('fcm_tokens')
          .update({ is_active: false })
          .in('fcm_token', invalidTokens);
          
        if (updateError) {
          console.error("❌ Error updating invalid tokens:", updateError);
        }
      }
    }

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully sent ${response.successCount} messages`,
        failureCount: response.failureCount,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error) {
    console.error("❌ Error processing notification request:", error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Unknown error occurred while sending notification",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

// To invoke:
// curl -i --location --request POST 'https://<project>.supabase.co/functions/v1/send-push-notification' \
//   --header 'Authorization: Bearer <ANON_KEY>' \
//   --header 'Content-Type: application/json' \
//   --data '{"userIds":["user-id-1","user-id-2"], "title":"Test", "body":"Hello world"}'
